'use client';

interface Props {
  updatedAt: string | null;
  onRefresh: () => void;
  loading: boolean;
}

function formatBRTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export default function RefreshBar({ updatedAt, onRefresh, loading }: Props) {
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-500">
      {updatedAt && (
        <span>Atualizado: {formatBRTime(updatedAt)}</span>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition disabled:opacity-50"
      >
        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Atualizar
      </button>
    </div>
  );
}
