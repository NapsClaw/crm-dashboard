'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DailyLeads } from '@/lib/types';

interface Props {
  data: DailyLeads[] | null;
}

export default function LeadsChart({ data }: Props) {
  if (!data) {
    return (
      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-48 mb-4" />
        <div className="h-64 bg-zinc-800/50 rounded" />
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Leads Prospectados (30 dias)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="sdrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="smmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '13px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
          <Area type="monotone" dataKey="sdr" name="SDR B2B" stroke="#6366f1" fill="url(#sdrGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="smm" name="SMM" stroke="#22c55e" fill="url(#smmGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
