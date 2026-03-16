'use client';

import type { Agent } from '@/lib/types';

interface Props {
  value: Agent;
  onChange: (agent: Agent) => void;
}

const options: { value: Agent; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'sdr', label: 'SDR B2B' },
  { value: 'smm', label: 'SMM' },
];

export default function AgentSelector({ value, onChange }: Props) {
  return (
    <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
