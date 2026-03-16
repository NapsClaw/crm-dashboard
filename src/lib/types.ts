export type Agent = 'all' | 'sdr' | 'smm';

export type UnifiedStage = 'prospectado' | 'contatado' | 'respondeu' | 'qualificado' | 'converteu' | 'perdido';

export const STAGE_LABELS: Record<UnifiedStage, string> = {
  prospectado: 'Prospectado',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  qualificado: 'Qualificado',
  converteu: 'Converteu',
  perdido: 'Perdido',
};

export const STAGE_COLORS: Record<UnifiedStage, string> = {
  prospectado: '#6366f1',
  contatado: '#3b82f6',
  respondeu: '#22c55e',
  qualificado: '#f59e0b',
  converteu: '#10b981',
  perdido: '#ef4444',
};

export const STAGES_ORDER: UnifiedStage[] = ['prospectado', 'contatado', 'respondeu', 'qualificado', 'converteu', 'perdido'];

export interface KPIData {
  leadsToday: number;
  totalLeads: number;
  replyRate: number;
  conversions: number;
  revenue: number;
}

export interface FunnelStage {
  stage: UnifiedStage;
  label: string;
  count: number;
  conversionPct: number;
}

export interface LeadCard {
  id: number;
  fullName: string;
  phone: string;
  company: string;
  agent: 'sdr' | 'smm';
  stage: UnifiedStage;
  lastContact: string | null;
  touches: number;
  status: string;
}

export interface LeadDetail {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  company: string;
  jobTitle: string | null;
  location: string | null;
  linkedinUrl: string | null;
  instagram: string | null;
  website: string | null;
  score: number | null;
  status: string;
  sourceKeyword: string | null;
  notes: string | null;
  createdAt: string;
  agent: 'sdr' | 'smm';
  messages: MessageItem[];
  followups: FollowupItem[];
}

export interface MessageItem {
  id: number;
  direction: string;
  messageText: string;
  messageType: string;
  sentAt: string;
}

export interface FollowupItem {
  id: number;
  scheduledAt: string;
  followupNumber: number;
  status: string;
  sentAt: string | null;
}

export interface FollowupRow {
  id: number;
  leadName: string;
  agent: 'sdr' | 'smm';
  followupNumber: number;
  scheduledAt: string;
  status: string;
  daysOverdue: number;
  totalTouches: number;
  leadId: number;
}

export interface DailyLeads {
  date: string;
  sdr: number;
  smm: number;
}

export interface AnalyticsData {
  replyRateByAgent: { agent: string; rate: number }[];
  replyRateByDow: { day: string; rate: number }[];
  replyRateByHour: { hour: number; rate: number }[];
  avgTimeToConversion: { agent: string; avgDays: number }[];
  leadsPerDay: DailyLeads[];
  followupCompliance: { agent: string; onTime: number; total: number; rate: number }[];
  topKeywords: { keyword: string; count: number; agent: string }[];
}
