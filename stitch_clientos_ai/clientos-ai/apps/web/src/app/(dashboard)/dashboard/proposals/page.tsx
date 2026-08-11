'use client';

import { useState } from 'react';
import { Badge, Button, Input, Label } from '@clientos/ui';
import { Plus, FileText, Clock, X } from 'lucide-react';
import { useResource } from '@/lib/use-resource';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  ErrorBanner,
  StateCard,
  Th,
  Tr,
  formatCurrency,
  formatDate,
} from '@/components/page-shell';

interface Proposal {
  id: string;
  title: string;
  status: string;
  total: number | null;
  currency: string;
  expiresAt: string | null;
  createdAt: string;
  opportunity?: { title: string } | null;
  _count?: { sections: number };
}

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
  DRAFT: 'neutral',
  SENT: 'default',
  VIEWED: 'warning',
  ACCEPTED: 'secondary',
  REJECTED: 'error',
  EXPIRED: 'error',
};

export default function ProposalsPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { data: proposals, loading, error } = useResource<Proposal>('/proposals');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ title: '', total: '', expiresAt: '' });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = await api.post<Proposal>('/proposals', {
        title: form.title,
        total: form.total ? parseFloat(form.total) : null,
        expiresAt: form.expiresAt || undefined,
      }, accessToken);
      setShowModal(false);
      router.push(`/dashboard/proposals/${data.id}`);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to create proposal');
    } finally {
      setSaving(false);
    }
  }

  const acceptedValue = proposals
    .filter((p) => p.status === 'ACCEPTED')
    .reduce((sum, p) => sum + (p.total ?? 0), 0);
  const outstanding = proposals.filter((p) => ['SENT', 'VIEWED'].includes(p.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Proposals</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {proposals.length} proposals — {outstanding} awaiting response, {formatCurrency(acceptedValue)} accepted
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New proposal
        </Button>
      </div>

      <ErrorBanner message={error} />

      <StateCard
        title="All Proposals"
        loading={loading}
        isEmpty={proposals.length === 0}
        emptyMessage="No proposals yet. Generate one from an opportunity to send to a client."
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <Th>Title</Th>
                <Th>Opportunity</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th align="right">Sections</Th>
                <Th align="right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <Tr key={proposal.id} className="cursor-pointer" onClick={() => router.push(`/dashboard/proposals/${proposal.id}`)}>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-on-surface">
                      <FileText className="h-3.5 w-3.5 text-on-surface-variant" />
                      {proposal.title}
                    </span>
                  </td>
                  <td className="py-3 text-body-sm text-on-surface-variant">
                    {proposal.opportunity?.title ?? '—'}
                  </td>
                  <td className="py-3">
                    <Badge variant={statusVariants[proposal.status] ?? 'neutral'}>
                      {proposal.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-body-sm text-on-surface-variant">
                    {formatDate(proposal.createdAt)}
                  </td>
                  <td className="py-3 text-body-sm text-on-surface-variant">
                    {proposal.expiresAt ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(proposal.expiresAt)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 text-right text-body-sm text-on-surface-variant">
                    {proposal._count?.sections ?? '—'}
                  </td>
                  <td className="py-3 text-right font-medium text-on-surface">
                    {formatCurrency(proposal.total, proposal.currency)}
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
              <h2 className="font-headline-md text-headline-md font-semibold">New Proposal</h2>
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
                <Label>Title *</Label>
                <Input
                  required
                  className="mt-1"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Website Redesign Proposal — Acme Corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total value</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    value={form.total}
                    onChange={(e) => setForm({ ...form, total: e.target.value })}
                    placeholder="7500"
                  />
                </div>
                <div>
                  <Label>Expires at</Label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !form.title}>
                  {saving ? 'Creating...' : 'Create proposal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
