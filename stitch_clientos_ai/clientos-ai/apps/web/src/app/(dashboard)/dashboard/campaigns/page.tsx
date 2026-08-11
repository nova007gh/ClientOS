'use client';

import { useState } from 'react';
import { Badge, Button, Input, Label } from '@clientos/ui';
import { Plus, Users, Layers, Gauge, X } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  ErrorBanner,
  StateCard,
  Th,
  Tr,
  formatDate,
} from '@/components/page-shell';

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyLimit: number;
  createdAt: string;
  _count?: { prospects: number; steps: number };
}

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
  DRAFT: 'neutral',
  ACTIVE: 'secondary',
  RUNNING: 'secondary',
  PAUSED: 'warning',
  COMPLETED: 'default',
  STOPPED: 'error',
};

export default function CampaignsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { data: campaigns, loading, error } = useResource<Campaign>('/campaigns');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', objective: '', dailyLimit: '50' });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = await api.post<Campaign>('/campaigns', {
        name: form.name,
        objective: form.objective,
        dailyLimit: parseInt(form.dailyLimit) || 50,
      }, accessToken);
      setShowModal(false);
      router.push(`/dashboard/campaigns/${data.id}`);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to create campaign');
    } finally {
      setSaving(false);
    }
  }

  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE' || c.status === 'RUNNING').length;
  const totalProspects = campaigns.reduce((sum, c) => sum + (c._count?.prospects ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Campaigns</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {campaigns.length} campaigns — {activeCount} active, {totalProspects} prospects enrolled
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New campaign
        </Button>
      </div>

      <ErrorBanner message={error} />

      <StateCard
        title="All Campaigns"
        loading={loading}
        isEmpty={campaigns.length === 0}
        emptyMessage="No campaigns yet. Create a campaign to start automated outreach sequences."
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Objective</Th>
                <Th>Created</Th>
                <Th align="right">Steps</Th>
                <Th align="right">Prospects</Th>
                <Th align="right">Daily cap</Th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <Tr key={campaign.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                  <td className="py-3">
                    <span className="font-medium text-on-surface">{campaign.name}</span>
                  </td>
                  <td className="py-3">
                    <Badge variant={statusVariants[campaign.status] ?? 'neutral'}>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="max-w-xs truncate py-3 text-body-sm text-on-surface-variant">
                    {campaign.objective || '—'}
                  </td>
                  <td className="py-3 text-body-sm text-on-surface-variant">
                    {formatDate(campaign.createdAt)}
                  </td>
                  <td className="py-3 text-right text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {campaign._count?.steps ?? 0}
                    </span>
                  </td>
                  <td className="py-3 text-right text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {campaign._count?.prospects ?? 0}
                    </span>
                  </td>
                  <td className="py-3 text-right text-body-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="h-3 w-3" />
                      {campaign.dailyLimit}
                    </span>
                  </td>
                </Tr>
              ))}
            </tbody>
          </table>
        </div>
      </StateCard>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">New Campaign</h2>
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
                <Label>Campaign name *</Label>
                <Input
                  required
                  className="mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Q1 Outreach — Dental Clinics"
                />
              </div>
              <div>
                <Label>Objective</Label>
                <Input
                  className="mt-1"
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  placeholder="Book 10 discovery calls with dental clinics in Accra"
                />
              </div>
              <div>
                <Label>Daily send limit</Label>
                <Input
                  className="mt-1"
                  type="number"
                  value={form.dailyLimit}
                  onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !form.name}>
                  {saving ? 'Creating...' : 'Create campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
