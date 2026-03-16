'use client';

import type { FunnelStage } from '@/lib/types';
import { STAGE_COLORS } from '@/lib/types';

interface Props {
  data: FunnelStage[] | null;
}

export default function FunnelChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-zinc-800 rounded w-40 mb-4" />
        <div className="h-48 bg-zinc-800/50 rounded" />
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Funil de Conversão</h3>
      <div className="space-y-3">
        {data.map((stage, i) => {
          const widthPct = (stage.count / maxCount) * 100;
          const color = STAGE_COLORS[stage.stage];
          return (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-28 text-right">
                <span className="text-sm text-zinc-400">{stage.label}</span>
              </div>
              <div className="flex-1 relative">
                <div className="h-10 bg-zinc-800/50 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-700 flex items-center px-3"
                    style={{ width: `${Math.max(widthPct, 5)}%`, backgroundColor: color + '33', borderLeft: `3px solid ${color}` }}
                  >
                    <span className="text-sm font-bold text-white">{stage.count}</span>
                  </div>
                </div>
              </div>
              <div className="w-16 text-right">
                {i > 0 && (
                  <span className="text-xs text-zinc-500">{stage.conversionPct.toFixed(0)}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
