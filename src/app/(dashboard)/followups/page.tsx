'use client';

import { useState, useEffect, useCallback } from 'react';
import AgentSelector from '@/components/AgentSelector';
import RefreshBar from '@/components/RefreshBar';
import type { Agent, FollowupRow } from '@/lib/types';

function formatBR(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
}

export default function FollowupsPage() {
  const [agent, setAgent] = useState<Agent>('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [followups, setFollowups] = useState<FollowupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/followups?agent=${agent}&status=${statusFilter}`);
      const json = await res.json();
      setFollowups(json.followups || []);
      setUpdatedAt(json.updatedAt);
    } catch (err) {
      console.error('Failed to fetch followups:', err);
    } finally {
      setLoading(false);
    }
  }, [agent, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusOptions = [
    { value: 'pending', label: 'Pendentes' },
    { value: 'sent', label: 'Enviados' },
    { value: 'all', label: 'Todos' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Follow-ups</h1>
          <p className="text-sm text-zinc-500 mt-1">Acompanhamento de follow-ups agendados</p>
        </div>
        <div className="flex items-center gap-4">
          <AgentSelector value={agent} onChange={setAgent} />
          <RefreshBar updatedAt={updatedAt} onRefresh={fetchData} loading={loading} />
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {statusOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              statusFilter === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Agente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Follow-up #</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Agendado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Atraso</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Toques</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((fu) => (
                <tr
                  key={`${fu.agent}-${fu.id}`}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition ${
                    fu.daysOverdue > 0 ? 'bg-red-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-white font-medium">{fu.leadName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      fu.agent === 'sdr' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {fu.agent === 'sdr' ? 'SDR' : 'SMM'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">#{fu.followupNumber}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatBR(fu.scheduledAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      fu.status === 'pending' ? 'bg-amber-900/30 text-amber-300' :
                      fu.status === 'sent' ? 'bg-green-900/30 text-green-300' :
                      'bg-zinc-700 text-zinc-400'
                    }`}>
                      {fu.status === 'pending' ? 'Pendente' : fu.status === 'sent' ? 'Enviado' : fu.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {fu.daysOverdue > 0 ? (
                      <span className="text-red-400 font-medium">{fu.daysOverdue}d atrasado</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{fu.totalTouches}</td>
                </tr>
              ))}
              {followups.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-600">
                    {loading ? 'Carregando...' : 'Nenhum follow-up encontrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-zinc-500">Total: </span>
          <span className="text-white font-medium">{followups.length}</span>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl px-4 py-3">
          <span className="text-zinc-500">Atrasados: </span>
          <span className="text-red-400 font-medium">{followups.filter(f => f.daysOverdue > 0).length}</span>
        </div>
      </div>
    </div>
  );
}
