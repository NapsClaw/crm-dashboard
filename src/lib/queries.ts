import { query } from './db';
import type { KPIData, FunnelStage, LeadCard, LeadDetail, FollowupRow, DailyLeads, AnalyticsData, UnifiedStage, Agent } from './types';
import { STAGES_ORDER, STAGE_LABELS } from './types';

function mapStatus(status: string): UnifiedStage {
  switch (status) {
    case 'new': return 'prospectado';
    case 'contacted': return 'contatado';
    case 'replied': return 'respondeu';
    case 'qualified':
    case 'call_scheduled':
    case 'proposal_sent': return 'qualificado';
    case 'converted':
    case 'paid':
    case 'delivered': return 'converteu';
    case 'not_interested':
    case 'cold': return 'perdido';
    default: return 'prospectado';
  }
}

export async function getKPIs(agent: Agent): Promise<KPIData> {
  let leadsToday = 0, totalLeads = 0, totalContacted = 0, totalReplied = 0, conversions = 0, revenue = 0;

  if (agent === 'all' || agent === 'sdr') {
    const todayRes = await query(`SELECT COUNT(*) as c FROM sdr_leads WHERE created_at::date = CURRENT_DATE`);
    const totalRes = await query(`SELECT COUNT(*) as c FROM sdr_leads`);
    const contactedRes = await query(`SELECT COUNT(*) as c FROM sdr_leads WHERE status != 'new'`);
    const repliedRes = await query(`SELECT COUNT(*) as c FROM sdr_leads WHERE status IN ('replied','qualified','call_scheduled','converted')`);
    const convRes = await query(`SELECT COUNT(*) as c FROM sdr_leads WHERE status = 'converted'`);
    leadsToday += parseInt(todayRes.rows[0].c);
    totalLeads += parseInt(totalRes.rows[0].c);
    totalContacted += parseInt(contactedRes.rows[0].c);
    totalReplied += parseInt(repliedRes.rows[0].c);
    conversions += parseInt(convRes.rows[0].c);
  }

  if (agent === 'all' || agent === 'smm') {
    const todayRes = await query(`SELECT COUNT(*) as c FROM smm_leads WHERE created_at::date = CURRENT_DATE`);
    const totalRes = await query(`SELECT COUNT(*) as c FROM smm_leads`);
    const contactedRes = await query(`SELECT COUNT(*) as c FROM smm_leads WHERE status != 'new'`);
    const repliedRes = await query(`SELECT COUNT(*) as c FROM smm_leads WHERE status IN ('replied','qualified','proposal_sent','paid','delivered')`);
    const convRes = await query(`SELECT COUNT(*) as c FROM smm_leads WHERE status IN ('paid','delivered','converted')`);
    const revRes = await query(`SELECT COALESCE(SUM(sell_price), 0) as r FROM smm_orders WHERE payment_status = 'paid' OR api_status = 'completed'`);
    leadsToday += parseInt(todayRes.rows[0].c);
    totalLeads += parseInt(totalRes.rows[0].c);
    totalContacted += parseInt(contactedRes.rows[0].c);
    totalReplied += parseInt(repliedRes.rows[0].c);
    conversions += parseInt(convRes.rows[0].c);
    revenue += parseFloat(revRes.rows[0].r);
  }

  const replyRate = totalContacted > 0 ? (totalReplied / totalContacted) * 100 : 0;

  return { leadsToday, totalLeads, replyRate, conversions, revenue };
}

export async function getFunnel(agent: Agent): Promise<FunnelStage[]> {
  const counts: Record<UnifiedStage, number> = {
    prospectado: 0, contatado: 0, respondeu: 0, qualificado: 0, converteu: 0, perdido: 0,
  };

  if (agent === 'all' || agent === 'sdr') {
    const res = await query(`SELECT status, COUNT(*) as c FROM sdr_leads GROUP BY status`);
    for (const row of res.rows) {
      const stage = mapStatus(row.status);
      counts[stage] += parseInt(row.c);
    }
  }

  if (agent === 'all' || agent === 'smm') {
    const res = await query(`SELECT status, COUNT(*) as c FROM smm_leads GROUP BY status`);
    for (const row of res.rows) {
      const stage = mapStatus(row.status);
      counts[stage] += parseInt(row.c);
    }
  }

  return STAGES_ORDER.map((stage, i) => {
    const prev = i > 0 ? counts[STAGES_ORDER[i - 1]] : counts[stage];
    const conversionPct = prev > 0 ? (counts[stage] / prev) * 100 : 0;
    return { stage, label: STAGE_LABELS[stage], count: counts[stage], conversionPct: i === 0 ? 100 : conversionPct };
  });
}

export async function getLeadsPerDay(agent: Agent): Promise<DailyLeads[]> {
  const days: Record<string, { sdr: number; smm: number }> = {};

  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days[key] = { sdr: 0, smm: 0 };
  }

  if (agent === 'all' || agent === 'sdr') {
    const res = await query(`SELECT created_at::date as d, COUNT(*) as c FROM sdr_leads WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' GROUP BY created_at::date ORDER BY d`);
    for (const row of res.rows) {
      const key = new Date(row.d).toISOString().split('T')[0];
      if (days[key]) days[key].sdr = parseInt(row.c);
    }
  }

  if (agent === 'all' || agent === 'smm') {
    const res = await query(`SELECT created_at::date as d, COUNT(*) as c FROM smm_leads WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' GROUP BY created_at::date ORDER BY d`);
    for (const row of res.rows) {
      const key = new Date(row.d).toISOString().split('T')[0];
      if (days[key]) days[key].smm = parseInt(row.c);
    }
  }

  return Object.entries(days).sort().map(([date, v]) => ({ date, ...v }));
}

export async function getKanbanLeads(agent: Agent): Promise<LeadCard[]> {
  const leads: LeadCard[] = [];

  if (agent === 'all' || agent === 'sdr') {
    const res = await query(`
      SELECT l.id, l.full_name, l.phone, l.company_name, l.status,
        GREATEST(l.contacted_at, l.last_reply_at, l.updated_at) as last_contact,
        (SELECT COUNT(*) FROM sdr_messages m WHERE m.lead_id = l.id) as touches
      FROM sdr_leads l
      ORDER BY l.updated_at DESC NULLS LAST
    `);
    for (const row of res.rows) {
      leads.push({
        id: row.id,
        fullName: row.full_name || 'Sem nome',
        phone: row.phone || '',
        company: row.company_name || '',
        agent: 'sdr',
        stage: mapStatus(row.status),
        lastContact: row.last_contact,
        touches: parseInt(row.touches) || 0,
        status: row.status,
      });
    }
  }

  if (agent === 'all' || agent === 'smm') {
    const res = await query(`
      SELECT l.id, l.full_name, l.phone, l.business_name, l.status,
        GREATEST(l.contacted_at, l.last_reply_at, l.updated_at) as last_contact,
        (SELECT COUNT(*) FROM smm_messages m WHERE m.lead_id = l.id) as touches
      FROM smm_leads l
      ORDER BY l.updated_at DESC NULLS LAST
    `);
    for (const row of res.rows) {
      leads.push({
        id: row.id,
        fullName: row.full_name || 'Sem nome',
        phone: row.phone || '',
        company: row.business_name || '',
        agent: 'smm',
        stage: mapStatus(row.status),
        lastContact: row.last_contact,
        touches: parseInt(row.touches) || 0,
        status: row.status,
      });
    }
  }

  return leads;
}

export async function getLeadDetail(id: number, agent: 'sdr' | 'smm'): Promise<LeadDetail | null> {
  if (agent === 'sdr') {
    const res = await query(`SELECT * FROM sdr_leads WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const msgRes = await query(`SELECT id, direction, message_text, message_type, sent_at FROM sdr_messages WHERE lead_id = $1 ORDER BY sent_at ASC`, [id]);
    const fuRes = await query(`SELECT id, scheduled_at, followup_number, status, sent_at FROM sdr_followups WHERE lead_id = $1 ORDER BY scheduled_at ASC`, [id]);
    return {
      id: row.id, fullName: row.full_name, phone: row.phone, email: row.email,
      company: row.company_name || '', jobTitle: row.job_title, location: row.location,
      linkedinUrl: row.linkedin_url, instagram: row.instagram, website: row.website,
      score: row.score, status: row.status, sourceKeyword: row.source_keyword, notes: row.notes,
      createdAt: row.created_at, agent: 'sdr',
      messages: msgRes.rows.map((m: Record<string, unknown>) => ({
        id: m.id as number, direction: m.direction as string, messageText: m.message_text as string,
        messageType: m.message_type as string, sentAt: m.sent_at as string,
      })),
      followups: fuRes.rows.map((f: Record<string, unknown>) => ({
        id: f.id as number, scheduledAt: f.scheduled_at as string, followupNumber: f.followup_number as number,
        status: f.status as string, sentAt: f.sent_at as string | null,
      })),
    };
  } else {
    const res = await query(`SELECT * FROM smm_leads WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const msgRes = await query(`SELECT id, direction, message_text, message_type, sent_at FROM smm_messages WHERE lead_id = $1 ORDER BY sent_at ASC`, [id]);
    const fuRes = await query(`SELECT id, scheduled_at, followup_number, status, sent_at FROM smm_followups WHERE lead_id = $1 ORDER BY scheduled_at ASC`, [id]);
    return {
      id: row.id, fullName: row.full_name, phone: row.phone, email: null,
      company: row.business_name || '', jobTitle: row.business_type, location: row.location,
      linkedinUrl: null, instagram: row.instagram, website: row.website,
      score: row.score, status: row.status, sourceKeyword: row.source_keyword, notes: row.notes,
      createdAt: row.created_at, agent: 'smm',
      messages: msgRes.rows.map((m: Record<string, unknown>) => ({
        id: m.id as number, direction: m.direction as string, messageText: m.message_text as string,
        messageType: m.message_type as string, sentAt: m.sent_at as string,
      })),
      followups: fuRes.rows.map((f: Record<string, unknown>) => ({
        id: f.id as number, scheduledAt: f.scheduled_at as string, followupNumber: f.followup_number as number,
        status: f.status as string, sentAt: f.sent_at as string | null,
      })),
    };
  }
}

export async function getFollowups(agent: Agent, statusFilter: string): Promise<FollowupRow[]> {
  const rows: FollowupRow[] = [];
  const statusClause = statusFilter === 'all' ? '' : statusFilter === 'pending' ? `AND f.status = 'pending'` : `AND f.status = 'sent'`;

  if (agent === 'all' || agent === 'sdr') {
    const res = await query(`
      SELECT f.id, f.lead_id, f.scheduled_at, f.followup_number, f.status, f.sent_at,
        l.full_name as lead_name,
        (SELECT COUNT(*) FROM sdr_messages m WHERE m.lead_id = f.lead_id) as touches,
        CASE WHEN f.status = 'pending' AND f.scheduled_at < NOW() 
          THEN EXTRACT(DAY FROM NOW() - f.scheduled_at)::int ELSE 0 END as days_overdue
      FROM sdr_followups f
      JOIN sdr_leads l ON l.id = f.lead_id
      WHERE 1=1 ${statusClause}
      ORDER BY f.scheduled_at DESC
    `);
    for (const row of res.rows) {
      rows.push({
        id: row.id, leadName: row.lead_name || 'Sem nome', agent: 'sdr',
        followupNumber: row.followup_number, scheduledAt: row.scheduled_at,
        status: row.status, daysOverdue: parseInt(row.days_overdue) || 0,
        totalTouches: parseInt(row.touches) || 0, leadId: row.lead_id,
      });
    }
  }

  if (agent === 'all' || agent === 'smm') {
    const res = await query(`
      SELECT f.id, f.lead_id, f.scheduled_at, f.followup_number, f.status, f.sent_at,
        l.full_name as lead_name,
        (SELECT COUNT(*) FROM smm_messages m WHERE m.lead_id = f.lead_id) as touches,
        CASE WHEN f.status = 'pending' AND f.scheduled_at < NOW()
          THEN EXTRACT(DAY FROM NOW() - f.scheduled_at)::int ELSE 0 END as days_overdue
      FROM smm_followups f
      JOIN smm_leads l ON l.id = f.lead_id
      WHERE 1=1 ${statusClause}
      ORDER BY f.scheduled_at DESC
    `);
    for (const row of res.rows) {
      rows.push({
        id: row.id, leadName: row.lead_name || 'Sem nome', agent: 'smm',
        followupNumber: row.followup_number, scheduledAt: row.scheduled_at,
        status: row.status, daysOverdue: parseInt(row.days_overdue) || 0,
        totalTouches: parseInt(row.touches) || 0, leadId: row.lead_id,
      });
    }
  }

  return rows.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
}

export async function getAnalytics(agent: Agent): Promise<AnalyticsData> {
  const replyRateByAgent: AnalyticsData['replyRateByAgent'] = [];
  const replyRateByDow: Record<string, { contacted: number; replied: number }> = {};
  const replyRateByHour: Record<number, { contacted: number; replied: number }> = {};
  const avgTimeToConversion: AnalyticsData['avgTimeToConversion'] = [];
  const followupCompliance: AnalyticsData['followupCompliance'] = [];
  const topKeywords: AnalyticsData['topKeywords'] = [];

  const dowNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  for (const d of dowNames) replyRateByDow[d] = { contacted: 0, replied: 0 };
  for (let h = 0; h < 24; h++) replyRateByHour[h] = { contacted: 0, replied: 0 };

  if (agent === 'all' || agent === 'sdr') {
    // Reply rate
    const contacted = await query(`SELECT COUNT(*) as c FROM sdr_leads WHERE status != 'new'`);
    const replied = await query(`SELECT COUNT(*) as c FROM sdr_leads WHERE status IN ('replied','qualified','call_scheduled','converted')`);
    const cNum = parseInt(contacted.rows[0].c);
    const rNum = parseInt(replied.rows[0].c);
    replyRateByAgent.push({ agent: 'SDR B2B', rate: cNum > 0 ? (rNum / cNum) * 100 : 0 });

    // Reply rate by DOW (based on when outbound messages were sent)
    const dowRes = await query(`
      SELECT EXTRACT(DOW FROM m.sent_at) as dow, COUNT(DISTINCT m.lead_id) as contacted,
        COUNT(DISTINCT CASE WHEN l.status IN ('replied','qualified','call_scheduled','converted') THEN m.lead_id END) as replied
      FROM sdr_messages m JOIN sdr_leads l ON l.id = m.lead_id
      WHERE m.direction = 'outbound' AND m.message_type = 'first_contact'
      GROUP BY EXTRACT(DOW FROM m.sent_at)
    `);
    for (const row of dowRes.rows) {
      const d = dowNames[parseInt(row.dow)];
      replyRateByDow[d].contacted += parseInt(row.contacted);
      replyRateByDow[d].replied += parseInt(row.replied);
    }

    // Reply rate by hour
    const hourRes = await query(`
      SELECT EXTRACT(HOUR FROM m.sent_at) as hr, COUNT(DISTINCT m.lead_id) as contacted,
        COUNT(DISTINCT CASE WHEN l.status IN ('replied','qualified','call_scheduled','converted') THEN m.lead_id END) as replied
      FROM sdr_messages m JOIN sdr_leads l ON l.id = m.lead_id
      WHERE m.direction = 'outbound' AND m.message_type = 'first_contact'
      GROUP BY EXTRACT(HOUR FROM m.sent_at)
    `);
    for (const row of hourRes.rows) {
      const h = parseInt(row.hr);
      replyRateByHour[h].contacted += parseInt(row.contacted);
      replyRateByHour[h].replied += parseInt(row.replied);
    }

    // Avg time to conversion
    const convRes = await query(`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric(10,1) as avg_days
      FROM sdr_leads WHERE status = 'converted' AND updated_at IS NOT NULL AND created_at IS NOT NULL
    `);
    if (convRes.rows[0].avg_days) {
      avgTimeToConversion.push({ agent: 'SDR B2B', avgDays: parseFloat(convRes.rows[0].avg_days) });
    }

    // Followup compliance
    const fuRes = await query(`
      SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' AND sent_at <= scheduled_at + INTERVAL '1 day' THEN 1 END) as on_time
      FROM sdr_followups WHERE status IN ('sent', 'pending')
    `);
    const fuTotal = parseInt(fuRes.rows[0].total);
    const fuOnTime = parseInt(fuRes.rows[0].on_time);
    followupCompliance.push({ agent: 'SDR B2B', onTime: fuOnTime, total: fuTotal, rate: fuTotal > 0 ? (fuOnTime / fuTotal) * 100 : 0 });

    // Top keywords
    const kwRes = await query(`SELECT source_keyword, COUNT(*) as c FROM sdr_leads WHERE source_keyword IS NOT NULL AND source_keyword != '' GROUP BY source_keyword ORDER BY c DESC LIMIT 10`);
    for (const row of kwRes.rows) {
      topKeywords.push({ keyword: row.source_keyword, count: parseInt(row.c), agent: 'SDR B2B' });
    }
  }

  if (agent === 'all' || agent === 'smm') {
    const contacted = await query(`SELECT COUNT(*) as c FROM smm_leads WHERE status != 'new'`);
    const replied = await query(`SELECT COUNT(*) as c FROM smm_leads WHERE status IN ('replied','qualified','proposal_sent','paid','delivered')`);
    const cNum = parseInt(contacted.rows[0].c);
    const rNum = parseInt(replied.rows[0].c);
    replyRateByAgent.push({ agent: 'SMM', rate: cNum > 0 ? (rNum / cNum) * 100 : 0 });

    const dowRes = await query(`
      SELECT EXTRACT(DOW FROM m.sent_at) as dow, COUNT(DISTINCT m.lead_id) as contacted,
        COUNT(DISTINCT CASE WHEN l.status IN ('replied','qualified','proposal_sent','paid','delivered') THEN m.lead_id END) as replied
      FROM smm_messages m JOIN smm_leads l ON l.id = m.lead_id
      WHERE m.direction = 'outbound' AND m.message_type = 'first_contact'
      GROUP BY EXTRACT(DOW FROM m.sent_at)
    `);
    for (const row of dowRes.rows) {
      const d = dowNames[parseInt(row.dow)];
      replyRateByDow[d].contacted += parseInt(row.contacted);
      replyRateByDow[d].replied += parseInt(row.replied);
    }

    const hourRes = await query(`
      SELECT EXTRACT(HOUR FROM m.sent_at) as hr, COUNT(DISTINCT m.lead_id) as contacted,
        COUNT(DISTINCT CASE WHEN l.status IN ('replied','qualified','proposal_sent','paid','delivered') THEN m.lead_id END) as replied
      FROM smm_messages m JOIN smm_leads l ON l.id = m.lead_id
      WHERE m.direction = 'outbound' AND m.message_type = 'first_contact'
      GROUP BY EXTRACT(HOUR FROM m.sent_at)
    `);
    for (const row of hourRes.rows) {
      const h = parseInt(row.hr);
      replyRateByHour[h].contacted += parseInt(row.contacted);
      replyRateByHour[h].replied += parseInt(row.replied);
    }

    const convRes = await query(`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)::numeric(10,1) as avg_days
      FROM smm_leads WHERE status IN ('paid','delivered','converted') AND updated_at IS NOT NULL AND created_at IS NOT NULL
    `);
    if (convRes.rows[0].avg_days) {
      avgTimeToConversion.push({ agent: 'SMM', avgDays: parseFloat(convRes.rows[0].avg_days) });
    }

    const fuRes = await query(`
      SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' AND sent_at <= scheduled_at + INTERVAL '1 day' THEN 1 END) as on_time
      FROM smm_followups WHERE status IN ('sent', 'pending')
    `);
    const fuTotal = parseInt(fuRes.rows[0].total);
    const fuOnTime = parseInt(fuRes.rows[0].on_time);
    followupCompliance.push({ agent: 'SMM', onTime: fuOnTime, total: fuTotal, rate: fuTotal > 0 ? (fuOnTime / fuTotal) * 100 : 0 });

    const kwRes = await query(`SELECT source_keyword, COUNT(*) as c FROM smm_leads WHERE source_keyword IS NOT NULL AND source_keyword != '' GROUP BY source_keyword ORDER BY c DESC LIMIT 10`);
    for (const row of kwRes.rows) {
      topKeywords.push({ keyword: row.source_keyword, count: parseInt(row.c), agent: 'SMM' });
    }
  }

  const leadsPerDay = await getLeadsPerDay(agent);

  return {
    replyRateByAgent,
    replyRateByDow: dowNames.map(d => ({
      day: d,
      rate: replyRateByDow[d].contacted > 0 ? (replyRateByDow[d].replied / replyRateByDow[d].contacted) * 100 : 0,
    })),
    replyRateByHour: Object.entries(replyRateByHour).map(([h, v]) => ({
      hour: parseInt(h),
      rate: v.contacted > 0 ? (v.replied / v.contacted) * 100 : 0,
    })),
    avgTimeToConversion,
    leadsPerDay,
    followupCompliance,
    topKeywords: topKeywords.sort((a, b) => b.count - a.count).slice(0, 10),
  };
}
