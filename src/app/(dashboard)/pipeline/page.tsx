'use client';

import { useState, useEffect, useCallback } from 'react';
import AgentSelector from '@/components/AgentSelector';
import RefreshBar from '@/components/RefreshBar';
import LeadSlideOver from '@/components/LeadSlideOver';
import type { Agent, LeadCard, UnifiedStage } from '@/lib/types';
import { STAGES_ORDER, STAGE_LABELS, STAGE_COLORS } from '@/lib/types';

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export default function PipelinePage() {
  const [agent, setAgent] = useState<Agent>('all');
  const [leads, setLeads] = useState<LeadCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<{ id: number; agent: 'sdr' | 'smm' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kanban?agent=${agent}`);
      const json = await res.json();
      setLeads(json.leads || []);
      setUpdatedAt(json.updatedAt);
    } catch (err) {
      console.error('Failed to fetch kanban:', err);
    } finally {
      setLoading(false);
    }
  }, [agent]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const grouped: Record<UnifiedStage, LeadCard[]> = {
    prospectado: [], contatado: [], respondeu: [], qualificado: [], converteu: [], perdido: [],
  };
  leads.forEach(l => grouped[l.stage].push(l));

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">Kanban de leads por estágio</p>
        </div>
        <div className="flex items-center gap-4">
          <AgentSelector value={agent} onChange={setAgent} />
          <RefreshBar updatedAt={updatedAt} onRefresh={fetchData} loading={loading} />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {STAGES_ORDER.map((stage) => (
          <div key={stage} className="flex-shrink-0 w-72">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
              <h3 className="text-sm font-semibold text-zinc-300">{STAGE_LABELS[stage]}</h3>
              <span className="text-xs text-zinc-600 ml-auto bg-zinc-800 px-2 py-0.5 rounded-full">
                {grouped[stage].length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {grouped[stage].map((lead) => (
                <div
                  key={`${lead.agent}-${lead.id}`}
                  onClick={() => setSelectedLead({ id: lead.id, agent: lead.agent })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
                    lead.agent === 'sdr'
                      ? 'bg-[#12121f] border-indigo-900/30 hover:border-indigo-700/50'
                      : 'bg-[#0f1a14] border-emerald-900/30 hover:border-emerald-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-white truncate flex-1">{lead.fullName}</h4>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                      lead.agent === 'sdr' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {lead.agent === 'sdr' ? 'SDR' : 'SMM'}
                    </span>
                  </div>
                  
                  {lead.phone && (
                    <p className="text-xs text-zinc-500 mb-1">{lead.phone}</p>
                  )}
                  {lead.company && (
                    <p className="text-xs text-zinc-400 mb-2 truncate">{lead.company}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span>{relativeTime(lead.lastContact)}</span>
                    <span>{lead.touches} {lead.touches === 1 ? 'toque' : 'toques'}</span>
                  </div>
                </div>
              ))}

              {grouped[stage].length === 0 && (
                <div className="p-8 text-center text-zinc-700 text-sm border border-dashed border-zinc-800 rounded-xl">
                  Nenhum lead
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lead Detail Slide-over */}
      <LeadSlideOver
        leadId={selectedLead?.id || null}
        agent={selectedLead?.agent || null}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
