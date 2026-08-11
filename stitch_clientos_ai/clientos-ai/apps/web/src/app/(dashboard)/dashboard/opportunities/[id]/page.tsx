'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { PageHeader, ErrorBanner, Th, Tr, formatDate, formatCurrency } from '@/components/page-shell';
import { ArrowLeft, TrendingUp, FileText, FileSignature } from 'lucide-react';

interface OpportunityDetail {
  id: string;
  title: string;
  stage: string;
  value: number | null;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
  prospectId: string;
  proposals: { id: string; title: string; status: string; total: number | null; currency: string; publicToken: string; createdAt: string }[];
  contracts: { id: string; title: string; status: string; value: number | null; currency: string; publicToken: string; createdAt: string }[];
}

const stageVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
  NEW: 'neutral',
  QUALIFIED: 'default',
  CONTACTED: 'default',
  REPLIED: 'default',
  MEETING: 'warning',
  PROPOSAL: 'warning',
  NEGOTIATION: 'warning',
  WON: 'secondary',
  LOST: 'error',
};

const proposalStatusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
  DRAFT: 'neutral',
  SENT: 'default',
  VIEWED: 'warning',
  ACCEPTED: 'secondary',
  REJECTED: 'error',
  EXPIRED: 'error',
};

const contractStatusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
  DRAFT: 'neutral',
  SENT: 'default',
  VIEWED: 'warning',
  SIGNED: 'secondary',
  EXPIRED: 'error',
};

const stages = ['NEW', 'QUALIFIED', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [opportunity, setOpportunity] = useState<OpportunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<OpportunityDetail>(`/opportunities/${id}`, accessToken);
        setOpportunity(data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load opportunity');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, accessToken]);

  async function updateStage(stage: string) {
    setUpdating(true);
    try {
      const updated = await api.patch<OpportunityDetail>(`/opportunities/${id}`, { stage }, accessToken);
      setOpportunity(updated);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-highest" />
        <div className="h-64 animate-pulse rounded-lg bg-surface-highest" />
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!opportunity) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/opportunities')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <PageHeader
        title={opportunity.title}
        subtitle={`Stage: ${opportunity.stage} · ${formatCurrency(opportunity.value, opportunity.currency)}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={stageVariants[opportunity.stage] ?? 'neutral'}>{opportunity.stage}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-card-gap lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface-variant">Value</span>
              <span className="font-medium text-on-surface">{formatCurrency(opportunity.value, opportunity.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface-variant">Probability</span>
              <span className="inline-flex items-center gap-1 text-body-sm text-on-surface">
                <TrendingUp className="h-3 w-3" />
                {opportunity.probability}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface-variant">Expected close</span>
              <span className="text-body-sm text-on-surface">{formatDate(opportunity.expectedCloseDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-on-surface-variant">Created</span>
              <span className="text-body-sm text-on-surface">{formatDate(opportunity.createdAt)}</span>
            </div>
            {opportunity.wonAt && (
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-on-surface-variant">Won at</span>
                <span className="text-body-sm text-secondary">{formatDate(opportunity.wonAt)}</span>
              </div>
            )}
            {opportunity.lostAt && (
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-on-surface-variant">Lost at</span>
                <span className="text-body-sm text-error">{formatDate(opportunity.lostAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Update Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stages.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStage(s)}
                    disabled={updating || s === opportunity.stage}
                    className={`rounded-lg px-3 py-1.5 text-body-sm transition-colors ${
                      s === opportunity.stage
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-highest text-on-surface hover:bg-surface-high'
                    } ${updating ? 'opacity-50' : ''}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Proposals ({opportunity.proposals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {opportunity.proposals.length === 0 ? (
                <p className="py-6 text-center text-on-surface-variant">No proposals yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <Th>Title</Th>
                        <Th>Status</Th>
                        <Th>Created</Th>
                        <Th align="right">Total</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunity.proposals.map((p) => (
                        <Tr key={p.id}>
                          <td className="py-3 font-medium text-on-surface">{p.title}</td>
                          <td className="py-3">
                            <Badge variant={proposalStatusVariants[p.status] ?? 'neutral'}>{p.status}</Badge>
                          </td>
                          <td className="py-3 text-body-sm text-on-surface-variant">{formatDate(p.createdAt)}</td>
                          <td className="py-3 text-right font-medium text-on-surface">{formatCurrency(p.total, p.currency)}</td>
                        </Tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Contracts ({opportunity.contracts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {opportunity.contracts.length === 0 ? (
                <p className="py-6 text-center text-on-surface-variant">No contracts yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <Th>Title</Th>
                        <Th>Status</Th>
                        <Th>Created</Th>
                        <Th align="right">Value</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunity.contracts.map((c) => (
                        <Tr key={c.id}>
                          <td className="py-3 font-medium text-on-surface">{c.title}</td>
                          <td className="py-3">
                            <Badge variant={contractStatusVariants[c.status] ?? 'neutral'}>{c.status}</Badge>
                          </td>
                          <td className="py-3 text-body-sm text-on-surface-variant">{formatDate(c.createdAt)}</td>
                          <td className="py-3 text-right font-medium text-on-surface">{formatCurrency(c.value, c.currency)}</td>
                        </Tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
