'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from 'recharts';
import AgentSelector from '@/components/AgentSelector';
import RefreshBar from '@/components/RefreshBar';
import type { Agent, AnalyticsData } from '@/lib/types';

export default function AnalyticsPage() {
  const [agent, setAgent] = useState<Agent>('all');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?agent=${agent}`);
      const json = await res.json();
      setData(json);
      setUpdatedAt(json.updatedAt);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [agent]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tooltipStyle = {
    backgroundColor: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '13px',
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Métricas detalhadas de performance</p>
        </div>
        <div className="flex items-center gap-4">
          <AgentSelector value={agent} onChange={setAgent} />
          <RefreshBar updatedAt={updatedAt} onRefresh={fetchData} loading={loading} />
        </div>
      </div>

      {/* Reply Rate by Agent */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Reply Rate by Agent */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Taxa de Resposta por Agente</h3>
          {data?.replyRateByAgent && data.replyRateByAgent.length > 0 ? (
            <div className="space-y-4">
              {data.replyRateByAgent.map(item => (
                <div key={item.agent} className="flex items-center gap-4">
                  <span className="text-sm text-zinc-400 w-20">{item.agent}</span>
                  <div className="flex-1 h-8 bg-zinc-800/50 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                      style={{
                        width: `${Math.max(item.rate, 3)}%`,
                        backgroundColor: item.agent === 'SDR B2B' ? '#6366f1' : '#22c55e',
                      }}
                    >
                      <span className="text-xs font-bold text-white">{item.rate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Sem dados</p>
          )}
        </div>

        {/* Avg Time to Conversion */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Tempo Médio de Conversão</h3>
          {data?.avgTimeToConversion && data.avgTimeToConversion.length > 0 ? (
            <div className="flex gap-6">
              {data.avgTimeToConversion.map(item => (
                <div key={item.agent} className="text-center">
                  <div className="text-4xl font-bold text-white">{item.avgDays}</div>
                  <div className="text-sm text-zinc-500 mt-1">dias ({item.agent})</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Sem dados de conversão</p>
          )}
        </div>
      </div>

      {/* Reply Rate by DOW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Taxa de Resposta por Dia da Semana</h3>
          {data?.replyRateByDow ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.replyRateByDow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, 'Taxa']} />
                <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                  {data.replyRateByDow.map((entry, i) => (
                    <Cell key={i} fill={entry.rate > 0 ? '#6366f1' : '#27272a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 bg-zinc-800/30 rounded animate-pulse" />
          )}
        </div>

        {/* Reply Rate by Hour */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Taxa de Resposta por Hora</h3>
          {data?.replyRateByHour ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.replyRateByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="hour" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}h`} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, 'Taxa']} labelFormatter={(h: unknown) => `${h}:00`} />
                <Bar dataKey="rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 bg-zinc-800/30 rounded animate-pulse" />
          )}
        </div>
      </div>

      {/* Leads per Day + Followup Compliance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Leads per Day */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Leads por Dia (30 dias)</h3>
          {data?.leadsPerDay ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.leadsPerDay.map(d => ({
                ...d,
                date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                total: d.sdr + d.smm,
              }))}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#8b5cf6" fill="url(#totalGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 bg-zinc-800/30 rounded animate-pulse" />
          )}
        </div>

        {/* Followup Compliance */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Compliance de Follow-ups</h3>
          {data?.followupCompliance && data.followupCompliance.length > 0 ? (
            <div className="space-y-6">
              {data.followupCompliance.map(item => (
                <div key={item.agent}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">{item.agent}</span>
                    <span className="text-sm font-bold text-white">{item.rate.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.rate}%`,
                        backgroundColor: item.rate >= 70 ? '#22c55e' : item.rate >= 40 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{item.onTime} de {item.total} no prazo</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm">Sem dados de follow-up</p>
          )}
        </div>
      </div>

      {/* Top Keywords */}
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Top Keywords de Origem</h3>
        {data?.topKeywords && data.topKeywords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.topKeywords.map((kw, i) => (
              <div key={`${kw.keyword}-${kw.agent}`} className="flex items-center gap-3 px-4 py-3 bg-zinc-800/30 rounded-xl">
                <span className="text-xs font-bold text-zinc-500 w-6">{i + 1}.</span>
                <span className="text-sm text-white flex-1 truncate">{kw.keyword}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  kw.agent === 'SDR B2B' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>{kw.agent}</span>
                <span className="text-sm font-bold text-zinc-300">{kw.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 text-sm">Sem dados de keywords</p>
        )}
      </div>
    </div>
  );
}
