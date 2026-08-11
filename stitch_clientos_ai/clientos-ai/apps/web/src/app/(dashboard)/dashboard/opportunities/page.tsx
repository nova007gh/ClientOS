'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, Input, Label, LeadScoreRing } from '@clientos/ui';
import { Plus, X, DollarSign, Trophy, Target, BarChart3 } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { ErrorBanner, formatCurrency } from '@/components/page-shell';

interface Opportunity {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  prospect?: { id: string; companyName: string } | null;
}

interface Prospect {
  id: string;
  companyName: string;
}

const STAGES: { key: string; label: string; color: string }[] = [
  { key: 'NEW', label: 'New', color: 'bg-on-surface-variant' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-primary' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-primary' },
  { key: 'REPLIED', label: 'Replied', color: 'bg-tertiary' },
  { key: 'MEETING', label: 'Meeting', color: 'bg-tertiary' },
  { key: 'PROPOSAL', label: 'Proposal', color: 'bg-secondary' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-secondary' },
  { key: 'WON', label: 'Won', color: 'bg-secondary' },
  { key: 'LOST', label: 'Lost', color: 'bg-error' },
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { data: opportunities, loading, error, refetch } = useResource<Opportunity>('/opportunities');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ title: '', value: '', probability: '0', expectedCloseDate: '', prospectId: '' });
  const [prospects, setProspects] = useState<Prospect[]>([]);

  useEffect(() => {
    if (showModal && accessToken) {
      api.get<{ data: Prospect[] }>('/prospects', accessToken).then((res) => {
        setProspects(res.data);
      }).catch(() => {});
    }
  }, [showModal, accessToken]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = await api.post<Opportunity>('/opportunities', {
        title: form.title,
        prospectId: form.prospectId,
        value: form.value ? parseFloat(form.value) : null,
        probability: form.probability ? parseInt(form.probability) : 0,
        expectedCloseDate: form.expectedCloseDate || undefined,
      }, accessToken);
      setShowModal(false);
      router.push(`/dashboard/opportunities/${data.id}`);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to create opportunity');
    } finally {
      setSaving(false);
    }
  }

  async function handleStageChange(opportunityId: string, newStage: string) {
    try {
      await api.patch<Opportunity>(`/opportunities/${opportunityId}`, { stage: newStage }, accessToken);
      refetch();
    } catch (err) {
      // silently fail — user can retry
    }
  }

  const openStages = ['NEW', 'QUALIFIED', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION'];
  const pipelineValue = useMemo(() =>
    opportunities.filter((o) => openStages.includes(o.stage)).reduce((sum, o) => sum + (o.value ?? 0), 0),
    [opportunities],
  );
  const wonCount = opportunities.filter((o) => o.stage === 'WON').length;
  const wonValue = opportunities.filter((o) => o.stage === 'WON').reduce((sum, o) => sum + (o.value ?? 0), 0);
  const activeDeals = opportunities.filter((o) => openStages.includes(o.stage)).length;
  const avgDealSize = activeDeals > 0 ? pipelineValue / activeDeals : 0;

  const opportunitiesByStage = useMemo(() => {
    const map: Record<string, Opportunity[]> = {};
    for (const s of STAGES) map[s.key] = [];
    for (const o of opportunities) {
      if (!map[o.stage]) map[o.stage] = [];
      map[o.stage].push(o);
    }
    return map;
  }, [opportunities]);

  const summaryStats = [
    { label: 'Total Pipeline', value: formatCurrency(pipelineValue), icon: DollarSign, color: 'text-primary' },
    { label: 'Won This Month', value: formatCurrency(wonValue), icon: Trophy, color: 'text-secondary' },
    { label: 'Active Deals', value: String(activeDeals), icon: Target, color: 'text-tertiary' },
    { label: 'Avg Deal Size', value: formatCurrency(avgDealSize), icon: BarChart3, color: 'text-on-surface-variant' },
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Sales Pipeline</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {opportunities.length} opportunities — {formatCurrency(pipelineValue)} open pipeline, {wonCount} won
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New opportunity
        </Button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex gap-card-gap overflow-hidden">
          {STAGES.map((s) => (
            <div key={s.key} className="min-w-[240px] flex-1 space-y-3 lg:min-w-[280px]">
              <div className="h-8 animate-pulse rounded bg-surface-highest" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-surface-highest" />
              ))}
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-outline-variant/60 bg-surface-high/20 py-20">
          <p className="text-on-surface-variant">No opportunities yet. Qualify a prospect to create one.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:gap-card-gap lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {summaryStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="shrink-0 w-[140px] rounded-xl border border-outline-variant/60 bg-surface-high/20 p-4 lg:w-auto">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps text-on-surface-variant">{stat.label}</span>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <p className="mt-2 font-headline-md text-headline-md font-semibold text-on-surface">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-1 gap-card-gap overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] lg:[&::-webkit-scrollbar]:block">
            {STAGES.map((stage) => {
              const stageOps = opportunitiesByStage[stage.key] ?? [];
              const stageValue = stageOps.reduce((sum, o) => sum + (o.value ?? 0), 0);
              return (
                <div key={stage.key} className="flex min-w-[240px] max-w-[240px] flex-col rounded-xl border border-outline-variant/50 bg-surface-container-low/50 p-3 lg:min-w-[280px] lg:max-w-[280px]">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                      <span className="font-label-caps text-label-caps text-on-surface">{stage.label}</span>
                      <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] text-on-surface-variant">{stageOps.length}</span>
                    </div>
                    {stageValue > 0 && (
                      <span className="text-[10px] text-on-surface-variant">{formatCurrency(stageValue)}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                    {stageOps.map((op) => (
                      <div
                        key={op.id}
                        className="group cursor-pointer rounded-lg border border-outline-variant bg-surface p-3 transition-all hover:border-outline hover:shadow-lg"
                        onClick={() => router.push(`/dashboard/opportunities/${op.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-body-sm font-semibold text-on-surface">{op.title}</span>
                          <LeadScoreRing score={op.probability} />
                        </div>
                        {op.prospect?.companyName && (
                          <p className="mt-1 text-xs text-on-surface-variant">{op.prospect.companyName}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-body-sm font-medium text-on-surface">
                            {formatCurrency(op.value, op.currency)}
                          </span>
                          <div className="flex items-center gap-1">
                            <select
                              className="rounded border border-outline-variant bg-surface-container px-1 py-0.5 text-[10px] text-on-surface-variant focus:border-primary focus:outline-none opacity-0 group-hover:opacity-100"
                              value={op.stage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStageChange(op.id, e.target.value);
                              }}
                            >
                              {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    {stageOps.length === 0 && (
                      <div className="flex flex-1 items-center justify-center py-8">
                        <span className="text-xs text-on-surface-variant/50">Empty</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-4 sm:p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">New Opportunity</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="h-5 w-5" />
              </button>
            </div>
            {formError && (
              <div className="mt-4 rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <Label>Prospect *</Label>
                <select
                  required
                  className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 text-body-sm text-on-surface"
                  value={form.prospectId}
                  onChange={(e) => setForm({ ...form, prospectId: e.target.value })}
                >
                  <option value="">Select a prospect...</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>{p.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  required
                  className="mt-1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Website redesign for Acme Corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Value</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label>Probability (%)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={form.probability}
                    onChange={(e) => setForm({ ...form, probability: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>
              <div>
                <Label>Expected close date</Label>
                <Input
                  className="mt-1"
                  type="date"
                  value={form.expectedCloseDate}
                  onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !form.title || !form.prospectId}>
                  {saving ? 'Creating...' : 'Create opportunity'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
