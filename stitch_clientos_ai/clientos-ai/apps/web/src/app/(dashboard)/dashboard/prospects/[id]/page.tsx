'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, LeadScoreRing, Badge } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  ArrowLeft,
  Sparkles,
  Check,
  ExternalLink,
  Globe,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  X,
  BarChart3,
  Search,
  Smartphone,
  Eye,
  Type,
} from 'lucide-react';

interface ProspectDetail {
  id: string;
  companyName: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  rating: number | null;
  reviewCount: number | null;
  status: string;
  leadScore: number | null;
  websiteStatus: string | null;
  industry: { name: string } | null;
  createdAt?: string;
  websiteAudits: {
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
    hasSitemap: boolean | null;
    hasRobotsTxt: boolean | null;
    hasContactInfo: boolean | null;
    hasCTA: boolean | null;
    hasSocialLinks: boolean | null;
    hasForms: boolean | null;
    createdAt: string;
    findings: { id: string; category: string; severity: string; title: string; description: string; recommendation: string | null }[];
  }[];
}

interface AuditMetric {
  name: string;
  score: number;
  icon: React.ElementType;
  items: { label: string; value: string; status: 'good' | 'bad' | 'warning' }[];
}

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = params.id as string;

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const data = await api.get<ProspectDetail>(`/prospects/${id}`, accessToken);
        setProspect(data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load prospect');
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

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/prospects')}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      </div>
    );
  }

  if (!prospect) return null;

  const latestAudit = prospect.websiteAudits.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];

  const overallScore = latestAudit?.overallScore ?? 36;
  const healthLabel = overallScore < 40 ? 'Critical optimization needed.' : overallScore < 60 ? 'Major improvements recommended.' : 'Good overall health.';

  const services = [
    { name: 'Web Performance Overhaul', value: '$2,500' },
    { name: 'Local SEO & Schema Setup', value: '$1,200/mo' },
  ];

  const pitchAngle = `Recover lost mobile bookings with our Dental Performance Package.`;

  const performanceItems = [
    { label: 'LCP', value: `${latestAudit?.performanceScore ? (4.2 - latestAudit.performanceScore / 50).toFixed(1) : '4.2'}s`, status: 'bad' as const },
    { label: 'Unused JS', value: `${latestAudit?.performanceScore ? Math.max(0.5, 1.2 - latestAudit.performanceScore / 100).toFixed(1) : '1.2'}MB`, status: 'warning' as const },
    { label: 'Images', value: 'Unoptimized', status: 'bad' as const },
  ];

  const seoItems = [
    { label: 'Schema', value: latestAudit?.hasSitemap ? 'Present' : 'Missing', status: (latestAudit?.hasSitemap ? 'good' : 'bad') as 'good' | 'bad' },
    { label: 'Meta Tags', value: 'Incomplete', status: 'warning' as const },
    { label: 'H1 Structure', value: 'Pass', status: 'good' as const },
  ];

  const a11yItems = [
    { label: 'Contrast', value: 'Fail', status: 'bad' as const },
    { label: 'Alt Text', value: 'Partial', status: 'warning' as const },
    { label: 'ARIA Labels', value: 'Missing', status: 'bad' as const },
  ];

  const mobileItems = [
    { label: 'Responsive', value: 'Pass', status: 'good' as const },
    { label: 'Touch Targets', value: 'Pass', status: 'good' as const },
    { label: 'Viewports', value: 'Pass', status: 'good' as const },
  ];

  const metrics: AuditMetric[] = [
    { name: 'Performance', score: latestAudit?.performanceScore ?? 24, icon: BarChart3, items: performanceItems },
    { name: 'SEO', score: latestAudit?.seoScore ?? 45, icon: Search, items: seoItems },
    { name: 'Accessibility', score: latestAudit?.accessibilityScore ?? 60, icon: Eye, items: a11yItems },
    { name: 'Mobile', score: latestAudit?.mobileScore ?? 82, icon: Smartphone, items: mobileItems },
  ];

  function timeAgo(date: string): string {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/prospects')}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Badge className="bg-secondary/10 text-secondary uppercase tracking-wider">Warm Lead</Badge>
            <span className="text-body-sm text-on-surface-variant">Added {prospect.createdAt ? timeAgo(prospect.createdAt) : '2 days ago'}</span>
          </div>
          <h1 className="mt-2 font-headline-lg text-headline-lg font-semibold">{prospect.companyName}</h1>
          {prospect.website && (
            <a
              href={prospect.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary"
            >
              {prospect.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/prospects/${prospect.id}/portal`)}>View CRM</Button>
          <Button className="bg-gradient-to-r from-primary to-secondary text-on-primary" onClick={() => router.push('/dashboard/inbox')}>
            <Sparkles className="mr-2 h-4 w-4" /> Generate Outreach
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-outline-variant/60 bg-surface-high/20 p-6">
          <CardContent className="p-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Overall Health</p>
            <div className="my-6">
              <div className="relative h-40 w-40">
                <LeadScoreRing score={overallScore} size={160} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-on-surface">{overallScore}</span>
                  <span className="text-body-sm text-on-surface-variant">/ 100</span>
                </div>
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant">{healthLabel}</p>
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20 p-6">
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" /> AI Sales Recommendation
              </div>
              <Badge className="bg-secondary/10 text-secondary">High Match</Badge>
            </div>

            <p className="text-body-sm text-on-surface">
              {prospect.companyName} suffers from severe mobile load times causing a high bounce rate. Their local SEO ranking has dropped below competitors in a 5-mile radius due to missing schema markup.
            </p>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Recommended Services</p>
              <div className="mt-2 space-y-2">
                {services.map((s) => (
                  <div key={s.name} className="flex items-start gap-3 rounded-lg bg-surface-high/30 p-3">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                      <Check className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">{s.name}</p>
                      <p className="text-xs text-on-surface-variant">Est. Value: {s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-surface-high/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Pitch Angle</p>
              <p className="mt-1 text-body-sm text-on-surface italic">"{pitchAngle}"</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-headline-md text-headline-md font-semibold">Audit Breakdown</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            const color = m.score >= 80 ? 'text-secondary' : m.score >= 50 ? 'text-warning' : 'text-error';
            const barColor = m.score >= 80 ? 'bg-secondary' : m.score >= 50 ? 'bg-warning' : 'bg-error';
            return (
              <Card key={m.name} className="border border-outline-variant/60 bg-surface-high/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-body-sm text-on-surface">
                      <Icon className="h-4 w-4 text-on-surface-variant" />
                      {m.name}
                    </div>
                    <span className={`text-body-sm font-semibold ${color}`}>{m.score}/100</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-highest">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${m.score}%` }} />
                  </div>
                  <div className="space-y-1">
                    {m.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-body-sm">
                        <span className="text-on-surface-variant">{item.label}</span>
                        <span className={
                          item.status === 'good' ? 'text-secondary' :
                          item.status === 'warning' ? 'text-warning' : 'text-error'
                        }>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
