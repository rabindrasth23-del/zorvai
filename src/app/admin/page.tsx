"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Activity, Zap, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "motion/react";

interface LogEntry {
  provider: string;
  call_type: string;
  latency_ms: number | null;
  success: boolean;
  created_at: string;
}

interface MetricsData {
  totalCalls: number;
  successRate: number;
  providerStats: Record<string, { calls: number; success: number; avgLatency: number }>;
  typeStats: Record<string, { calls: number; success: number }>;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/admin/metrics");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch metrics");
        }

        const logs: LogEntry[] = data.logs;
        
        // Calculate aggregations
        const providerStats: MetricsData["providerStats"] = {};
        const typeStats: MetricsData["typeStats"] = {};
        let successCount = 0;

        logs.forEach(log => {
          if (log.success) successCount++;

          // Provider Stats
          if (!providerStats[log.provider]) {
            providerStats[log.provider] = { calls: 0, success: 0, avgLatency: 0 };
          }
          providerStats[log.provider].calls++;
          if (log.success) providerStats[log.provider].success++;
          if (log.latency_ms) {
            // Running average trick
            const prevAvg = providerStats[log.provider].avgLatency;
            const n = providerStats[log.provider].calls;
            providerStats[log.provider].avgLatency = prevAvg + (log.latency_ms - prevAvg) / n;
          }

          // Type Stats
          if (!typeStats[log.call_type]) {
            typeStats[log.call_type] = { calls: 0, success: 0 };
          }
          typeStats[log.call_type].calls++;
          if (log.success) typeStats[log.call_type].success++;
        });

        setMetrics({
          totalCalls: logs.length,
          successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 0,
          providerStats,
          typeStats
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--color-primary)]">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-sans font-medium text-sm">Loading API metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 p-6 rounded-[var(--radius-lg)] text-[var(--color-destructive)] max-w-2xl">
        <h3 className="font-display font-medium text-lg mb-2 flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          Error Loading Metrics
        </h3>
        <p className="font-sans text-sm">{error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-3xl font-display font-medium tracking-tight text-[var(--color-text)]">API Usage & Spend</h2>
          <p className="font-sans text-[var(--color-text-muted)] mt-1">Live metrics from ai_provider_logs (Last 30 days)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)] shadow-sm">
          <div className="flex items-center gap-3 text-[var(--color-text-muted)] mb-2">
            <Activity className="w-5 h-5" />
            <span className="font-sans text-sm font-medium uppercase tracking-wider">Total Calls</span>
          </div>
          <p className="text-4xl font-display font-medium text-[var(--color-text)]">
            {metrics.totalCalls.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-[var(--radius-xl)] shadow-sm">
          <div className="flex items-center gap-3 text-[var(--color-text-muted)] mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-sans text-sm font-medium uppercase tracking-wider">Success Rate</span>
          </div>
          <p className="text-4xl font-display font-medium text-[var(--color-text)]">
            {metrics.successRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Provider Breakdown */}
        <div className="space-y-4">
          <h3 className="font-display font-medium text-xl text-[var(--color-text)] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[var(--color-primary)]" />
            Spend by Model (Provider)
          </h3>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)] border-b border-[var(--color-border)] uppercase text-[11px] tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-medium">Provider</th>
                  <th className="px-6 py-4 font-medium text-right">Total Calls</th>
                  <th className="px-6 py-4 font-medium text-right">Success</th>
                  <th className="px-6 py-4 font-medium text-right">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {Object.entries(metrics.providerStats).map(([provider, stats]) => (
                  <tr key={provider} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-text)]">{provider}</td>
                    <td className="px-6 py-4 text-right text-[var(--color-text-muted)]">{stats.calls.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        stats.success / stats.calls > 0.9 ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                      }`}>
                        {((stats.success / stats.calls) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[var(--color-text-muted)]">{Math.round(stats.avgLatency)}ms</td>
                  </tr>
                ))}
                {Object.keys(metrics.providerStats).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No provider data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase Breakdown */}
        <div className="space-y-4">
          <h3 className="font-display font-medium text-xl text-[var(--color-text)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--color-primary)]" />
            Calls by Phase (Call Type)
          </h3>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-sm">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)] border-b border-[var(--color-border)] uppercase text-[11px] tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-medium">Phase</th>
                  <th className="px-6 py-4 font-medium text-right">Total Calls</th>
                  <th className="px-6 py-4 font-medium text-right">Success</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {Object.entries(metrics.typeStats).map(([type, stats]) => (
                  <tr key={type} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--color-text)]">{type}</td>
                    <td className="px-6 py-4 text-right text-[var(--color-text-muted)]">{stats.calls.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        stats.success / stats.calls > 0.9 ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                      }`}>
                        {((stats.success / stats.calls) * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {Object.keys(metrics.typeStats).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No phase data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
