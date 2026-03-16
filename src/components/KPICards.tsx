'use client';

import type { KPIData, Agent } from '@/lib/types';

interface Props {
  data: KPIData | null;
  agent: Agent;
}

export default function KPICards({ data, agent }: Props) {
  if (!data) return <KPISkeleton />;

  const cards = [
    { label: 'Leads Hoje', value: data.leadsToday.toString(), icon: '📥', color: 'from-blue-500/20 to-blue-600/5' },
    { label: 'Total de Leads', value: data.totalLeads.toLocaleString('pt-BR'), icon: '👥', color: 'from-indigo-500/20 to-indigo-600/5' },
    { label: 'Taxa de Resposta', value: `${data.replyRate.toFixed(1)}%`, icon: '💬', color: 'from-green-500/20 to-green-600/5' },
    { label: 'Conversões', value: data.conversions.toString(), icon: '🎯', color: 'from-amber-500/20 to-amber-600/5' },
  ];

  if (agent !== 'sdr') {
    cards.push({
      label: 'Receita',
      value: `R$ ${data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'from-emerald-500/20 to-emerald-600/5',
    });
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.color} border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700/50 transition`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{card.label}</span>
            <span className="text-lg">{card.icon}</span>
          </div>
          <p className="text-2xl font-bold text-white">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-20 mb-3" />
          <div className="h-8 bg-zinc-800 rounded w-16" />
        </div>
      ))}
    </div>
  );
}
