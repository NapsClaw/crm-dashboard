'use client';

import { useState, useEffect, useCallback } from 'react';
import AgentSelector from '@/components/AgentSelector';
import RefreshBar from '@/components/RefreshBar';
import KPICards from '@/components/KPICards';
import FunnelChart from '@/components/FunnelChart';
import LeadsChart from '@/components/LeadsChart';
import type { Agent, KPIData, FunnelStage, DailyLeads } from '@/lib/types';

interface DashboardData {
  kpis: KPIData;
  funnel: FunnelStage[];
  leadsPerDay: DailyLeads[];
  updatedAt: string;
}

export default function HomePage() {
  const [agent, setAgent] = useState<Agent>('all');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?agent=${agent}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [agent]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Visão geral dos agentes</p>
        </div>
        <div className="flex items-center gap-4">
          <AgentSelector value={agent} onChange={setAgent} />
          <RefreshBar updatedAt={data?.updatedAt || null} onRefresh={fetchData} loading={loading} />
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards data={data?.kpis || null} agent={agent} />

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LeadsChart data={data?.leadsPerDay || null} />
        <FunnelChart data={data?.funnel || null} />
      </div>
    </div>
  );
}
