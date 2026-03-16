'use client';

import { useEffect, useState } from 'react';
import type { LeadDetail } from '@/lib/types';

interface Props {
  leadId: number | null;
  agent: 'sdr' | 'smm' | null;
  onClose: () => void;
}

function formatBR(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export default function LeadSlideOver({ leadId, agent, onClose }: Props) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leadId || !agent) { setLead(null); return; }
    setLoading(true);
    fetch(`/api/lead?id=${leadId}&agent=${agent}`)
      .then(r => r.json())
      .then(setLead)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [leadId, agent]);

  if (!leadId) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[#0f0f17] border-l border-zinc-800 z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{loading ? 'Carregando...' : lead?.fullName || 'Lead'}</h2>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading && <div className="text-zinc-500">Carregando detalhes...</div>}

          {lead && (
            <div className="space-y-6">
              {/* Agent Badge */}
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  lead.agent === 'sdr' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {lead.agent === 'sdr' ? 'SDR B2B' : 'SMM'}
                </span>
                <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300">
                  {lead.status}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Telefone', value: lead.phone },
                  { label: 'Email', value: lead.email },
                  { label: 'Empresa', value: lead.company },
                  { label: 'Cargo', value: lead.jobTitle },
                  { label: 'Localização', value: lead.location },
                  { label: 'Score', value: lead.score?.toString() },
                  { label: 'Keyword', value: lead.sourceKeyword },
                  { label: 'Criado em', value: formatBR(lead.createdAt) },
                ].filter(f => f.value).map(field => (
                  <div key={field.label}>
                    <p className="text-xs text-zinc-500 uppercase">{field.label}</p>
                    <p className="text-sm text-white mt-0.5">{field.value}</p>
                  </div>
                ))}
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-2">
                {lead.linkedinUrl && (
                  <a href={lead.linkedinUrl} target="_blank" rel="noopener" className="px-3 py-1.5 bg-blue-900/30 text-blue-300 text-xs rounded-lg hover:bg-blue-900/50 transition">LinkedIn</a>
                )}
                {lead.instagram && (
                  <a href={`https://instagram.com/${lead.instagram}`} target="_blank" rel="noopener" className="px-3 py-1.5 bg-pink-900/30 text-pink-300 text-xs rounded-lg hover:bg-pink-900/50 transition">Instagram</a>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener" className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-xs rounded-lg hover:bg-zinc-700 transition">Website</a>
                )}
              </div>

              {/* Notes */}
              {lead.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Notas</h3>
                  <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded-xl p-3 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}

              {/* Messages */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Mensagens ({lead.messages.length})</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {lead.messages.length === 0 && <p className="text-sm text-zinc-600">Nenhuma mensagem</p>}
                  {lead.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-sm ${
                        msg.direction === 'outbound'
                          ? 'bg-indigo-900/20 border border-indigo-800/30 ml-4'
                          : 'bg-zinc-800/50 border border-zinc-700/30 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${
                          msg.direction === 'outbound' ? 'text-indigo-400' : 'text-green-400'
                        }`}>
                          {msg.direction === 'outbound' ? '→ Enviado' : '← Recebido'}
                          <span className="text-zinc-600 ml-2">{msg.messageType}</span>
                        </span>
                        <span className="text-xs text-zinc-600">{formatBR(msg.sentAt)}</span>
                      </div>
                      <p className="text-zinc-300 whitespace-pre-wrap">{msg.messageText}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Followups */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Follow-ups ({lead.followups.length})</h3>
                <div className="space-y-2">
                  {lead.followups.length === 0 && <p className="text-sm text-zinc-600">Nenhum follow-up</p>}
                  {lead.followups.map(fu => (
                    <div key={fu.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl text-sm">
                      <div>
                        <span className="text-zinc-300">Follow-up #{fu.followupNumber}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          fu.status === 'pending' ? 'bg-amber-900/30 text-amber-300' :
                          fu.status === 'sent' ? 'bg-green-900/30 text-green-300' :
                          'bg-zinc-700 text-zinc-400'
                        }`}>
                          {fu.status}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">{formatBR(fu.scheduledAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
