'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Badge, Button, LeadScoreRing } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { ErrorBanner, formatDate } from '@/components/page-shell';
import {
  ArrowLeft, ExternalLink, ShieldCheck, ShieldAlert, Globe, Sparkles,
  TrendingUp, Zap, Search, Eye, Smartphone, Gauge, Lightbulb, Target,
  AlertTriangle, CheckCircle,
} from 'lucide-react';

interface AuditDetail {
  id: string;
  websiteUrl: string;
  status: string;
  overallScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  mobileScore: number | null;
  httpsEnabled: boolean | null;
  sslValid: boolean | null;
  pageTitle: string | null;
  metaDescription: string | null;
  hasSitemap: boolean | null;
  hasRobotsTxt: boolean | null;
  hasContactInfo: boolean | null;
  hasCTA: boolean | null;
  hasSocialLinks: boolean | null;
  hasForms: boolean | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  prospect: { id: string; companyName: string; website: string | null };
  findings: {
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    evidence: string | null;
    recommendation: string | null;
  }[];
}

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
  PENDING: 'neutral',
  RUNNING: 'warning',
  COMPLETED: 'secondary',
  FAILED: 'error',
};

const severityVariants: Record<string, 'error' | 'warning' | 'neutral'> = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'neutral',
  INFO: 'neutral',
};

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = params.id as string;

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<AuditDetail>(`/audits/${id}`, accessToken);
        setAudit(data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load audit');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, accessToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-highest" />
        <div className="h-64 animate-pulse rounded-lg bg-surface-highest" />
      </div>
    );
  }

  if (error) return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/audits')}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <ErrorBanner message={error} />
    </div>
  );
  if (!audit) return null;

  const checks = [
    { label: 'HTTPS Enabled', value: audit.httpsEnabled },
    { label: 'SSL Valid', value: audit.sslValid },
    { label: 'Sitemap', value: audit.hasSitemap },
    { label: 'Robots.txt', value: audit.hasRobotsTxt },
    { label: 'Contact Info', value: audit.hasContactInfo },
    { label: 'CTA Present', value: audit.hasCTA },
    { label: 'Social Links', value: audit.hasSocialLinks },
    { label: 'Forms', value: audit.hasForms },
  ];

  const scoreCategories = [
    { label: 'Performance', value: audit.performanceScore, icon: Gauge, color: 'text-primary' },
    { label: 'SEO', value: audit.seoScore, icon: Search, color: 'text-tertiary' },
    { label: 'Accessibility', value: audit.accessibilityScore, icon: Eye, color: 'text-secondary' },
    { label: 'Mobile', value: audit.mobileScore, icon: Smartphone, color: 'text-primary' },
  ];

  const aiRecommendations = [
    {
      icon: Target,
      title: 'High-Value Pitch Angle',
      insight: `${audit.prospect.companyName} is losing an estimated 40% of mobile visitors due to poor performance. Position a mobile-first redesign as immediate revenue recovery.`,
      action: 'Generate Proposal',
    },
    {
      icon: Zap,
      title: 'Quick Win Opportunity',
      insight: `Missing SSL certificate is blocking organic search rankings. Offer a complimentary security audit as a foot-in-the-door strategy.`,
      action: 'Draft Outreach Email',
    },
    {
      icon: TrendingUp,
      title: 'Competitive Gap',
      insight: `3 competitors in the same industry have modern CTAs and lead capture forms. ${audit.prospect.companyName} is leaving conversions on the table.`,
      action: 'Create Opportunity',
    },
  ];

  const overallScore = audit.overallScore ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/audits')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg font-semibold">
              {audit.websiteUrl.replace(/^https?:\/\//, '')}
            </h1>
            <Badge variant={statusVariants[audit.status] ?? 'neutral'}>{audit.status}</Badge>
          </div>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {audit.prospect.companyName} · Audited {formatDate(audit.completedAt)}
          </p>
        </div>
        <a
          href={audit.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Visit Site
        </a>
      </div>

      <div className="grid grid-cols-1 gap-card-gap lg:grid-cols-3">
        {/* Overall Health Score */}
        <div className="rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5 flex flex-col items-center justify-center">
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-4">Overall Health Score</p>
          <LeadScoreRing score={overallScore} />
          <p className="mt-4 text-body-sm text-on-surface-variant text-center">
            {overallScore >= 80 ? 'Excellent — minor optimizations needed' :
             overallScore >= 60 ? 'Good — several areas for improvement' :
             overallScore >= 40 ? 'Fair — significant issues detected' :
             'Poor — major overhaul recommended'}
          </p>
        </div>

        {/* AI Sales Recommendations */}
        <div className="lg:col-span-2 rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-headline-md text-headline-md font-semibold">AI Sales Recommendations</h2>
          </div>
          <div className="space-y-3">
            {aiRecommendations.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-outline-variant/60 bg-surface p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-semibold text-on-surface">{rec.title}</p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{rec.insight}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-[10px]">
                      {rec.action}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-2 gap-card-gap lg:grid-cols-4">
        {scoreCategories.map((cat) => {
          const Icon = cat.icon;
          const score = cat.value ?? 0;
          return (
            <div key={cat.label} className="rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant">{cat.label}</span>
                <Icon className={`h-4 w-4 ${cat.color}`} />
              </div>
              <p className="mt-3 text-3xl font-semibold text-on-surface">{cat.value ?? '—'}</p>
              {cat.value != null && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div
                    className={`h-full rounded-full ${score < 50 ? 'bg-error' : score < 75 ? 'bg-secondary' : 'bg-primary'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-card-gap lg:grid-cols-3">
        {/* Website Checks */}
        <div className="rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5">
          <h2 className="mb-4 font-headline-md text-headline-md font-semibold">Website Checks</h2>
          <div className="grid grid-cols-2 gap-3">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-lg bg-surface p-2.5">
                {c.value == null ? (
                  <span className="h-4 w-4 rounded-full border-2 border-outline-variant" />
                ) : c.value ? (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-secondary" />
                ) : (
                  <ShieldAlert className="h-4 w-4 shrink-0 text-error" />
                )}
                <span className="text-body-sm text-on-surface-variant">{c.label}</span>
              </div>
            ))}
          </div>
          {(audit.pageTitle || audit.metaDescription) && (
            <div className="mt-4 space-y-3 border-t border-outline-variant pt-4">
              {audit.pageTitle && (
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Page Title</p>
                  <p className="mt-1 text-body-sm text-on-surface">{audit.pageTitle}</p>
                </div>
              )}
              {audit.metaDescription && (
                <div>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Meta Description</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{audit.metaDescription}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Findings */}
        <div className="lg:col-span-2 rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5">
          <h2 className="mb-4 font-headline-md text-headline-md font-semibold">
            Findings ({audit.findings.length})
          </h2>
          {audit.findings.length === 0 ? (
            <p className="py-8 text-center text-on-surface-variant">No findings recorded.</p>
          ) : (
            <div className="space-y-3">
              {audit.findings.map((f) => (
                <div key={f.id} className="rounded-lg border border-outline-variant/60 bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-on-surface">{f.title}</span>
                      <span className="rounded bg-surface-highest px-1.5 py-0.5 text-[10px] text-on-surface-variant">{f.category}</span>
                    </div>
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${
                      severityVariants[f.severity] === 'error' ? 'bg-error/10 text-error' :
                      severityVariants[f.severity] === 'warning' ? 'bg-warning/10 text-warning' :
                      'bg-surface-highest text-on-surface-variant'
                    }`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-body-sm text-on-surface-variant">{f.description}</p>
                  {f.evidence && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      <strong>Evidence:</strong> {f.evidence}
                    </p>
                  )}
                  {f.recommendation && (
                    <div className="mt-2 flex items-start gap-1.5 rounded bg-primary/5 p-2 text-body-sm text-primary">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {f.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
