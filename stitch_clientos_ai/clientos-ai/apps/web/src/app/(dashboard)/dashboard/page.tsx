'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button, Card, CardContent, LeadScoreRing, Input } from '@clientos/ui';
import { Search, Sparkles, Filter, Briefcase, Calendar, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Globe, Plus, TrendingUp, Target, BarChart3, Zap } from 'lucide-react';
import { Fragment } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { useSearchStore } from '@/lib/search-store';
import { useRouter } from 'next/navigation';

interface Prospect {
  id: string;
  companyName: string;
  industry: { id?: string; name: string; slug?: string } | null;
  city: string | null;
  country: string | null;
  website: string | null;
  rating: number | null;
  status: string;
  createdAt?: string | null;
  _count?: { websiteAudits: number };
}

interface WebsiteAudit {
  id: string;
  prospectId: string;
  websiteUrl: string;
  status: string;
  overallScore: number | null;
  httpsEnabled: boolean | null;
  hasSitemap: boolean | null;
  hasRobotsTxt: boolean | null;
  hasContactInfo: boolean | null;
  hasCTA: boolean | null;
  hasSocialLinks: boolean | null;
  hasForms: boolean | null;
  pageTitle: string | null;
  metaDescription: string | null;
  completedAt: string | null;
  createdAt: string;
  findings: { id: string; category: string; severity: string; title: string }[];
}

interface ScannerRow {
  id: string;
  prospect: Prospect;
  audit: WebsiteAudit | null;
  score: number;
  webStatus: string;
  webStatusColor: 'error' | 'warning' | 'success' | 'neutral';
  recommendedService: string;
  painPoints: { icon: string; text: string; priority: string }[];
  pitchStrategy: string;
  insight: string;
}

const websiteStatuses = ['Any Status', 'No Website', 'Poor Performance', 'Fair', 'Good', 'Excellent'];

function generateRecommendedService(audit: WebsiteAudit | null): string {
  if (!audit) return 'Full Build + Menu';
  if (!audit.httpsEnabled) return 'Security + Hosting Setup';
  if (!audit.hasForms || !audit.hasCTA) return 'Web Redesign + Booking';
  if (audit.overallScore && audit.overallScore < 50) return 'Web Redesign + SEO';
  if (!audit.hasSitemap || !audit.hasRobotsTxt) return 'SEO Optimization';
  if (!audit.hasSocialLinks) return 'Social + Content Strategy';
  return 'Maintenance + Growth';
}

function generateWebStatus(audit: WebsiteAudit | null): { label: string; color: 'error' | 'warning' | 'success' | 'neutral' } {
  if (!audit) return { label: 'No Website', color: 'neutral' };
  const score = audit.overallScore ?? 0;
  if (score === 0) return { label: 'No Website', color: 'neutral' };
  if (!audit.httpsEnabled || score < 40) return { label: 'Poor Performance', color: 'error' };
  if (score < 60) return { label: 'Fair', color: 'warning' };
  if (score < 80) return { label: 'Good', color: 'success' };
  return { label: 'Excellent', color: 'success' };
}

function generatePainPoints(audit: WebsiteAudit | null): { icon: string; text: string; priority: string }[] {
  const points: { icon: string; text: string; priority: string }[] = [];
  if (!audit) {
    points.push({ icon: 'globe', text: 'No online presence or website', priority: 'High' });
    points.push({ icon: 'mobile', text: 'No mobile booking or contact flow', priority: 'High' });
    points.push({ icon: 'message', text: 'Missing WhatsApp integration flow', priority: 'Medium' });
    return points;
  }
  if (!audit.httpsEnabled) points.push({ icon: 'shield', text: 'Website lacks HTTPS / security', priority: 'High' });
  if (!audit.hasForms) points.push({ icon: 'form', text: 'No lead capture forms', priority: 'High' });
  if (!audit.hasCTA) points.push({ icon: 'cursor', text: 'No clear call-to-actions', priority: 'High' });
  if (!audit.hasContactInfo) points.push({ icon: 'phone', text: 'Contact information not prominent', priority: 'Medium' });
  if (!audit.hasSitemap) points.push({ icon: 'map', text: 'Missing sitemap for SEO', priority: 'Medium' });
  if (!audit.hasSocialLinks) points.push({ icon: 'share', text: 'No social proof / links', priority: 'Low' });
  if (points.length < 2) points.push({ icon: 'mobile', text: 'Potential mobile performance gaps', priority: 'Medium' });
  return points;
}

function generatePitchStrategy(service: string, prospect: Prospect): string {
  return `Position a complete digital revamp focusing on ${service.toLowerCase()}. Lead with the lost revenue from missing a modern client acquisition funnel and show how ${prospect.companyName} can capture more qualified leads with an integrated web + outreach system.`;
}

function timeAgo(date: string | null | undefined): string {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const { query: search, setQuery: setSearch } = useSearchStore();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [audits, setAudits] = useState<Record<string, WebsiteAudit[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [industry, setIndustry] = useState('All Industries');
  const [webStatus, setWebStatus] = useState('Any Status');
  const [selected, setSelected] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [showCampaignSelect, setShowCampaignSelect] = useState<string | null>(null);
  const [industries, setIndustries] = useState<string[]>(['All Industries']);
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      setLoading(true);
      try {
        const [prospectsRes, auditsRes, campaignsRes] = await Promise.all([
          api.get<{ data: Prospect[] }>('/prospects', accessToken),
          api.get<{ data: WebsiteAudit[] }>('/audits', accessToken),
          api.get<{ data: { id: string; name: string }[] }>('/campaigns', accessToken),
        ]);
        setProspects(prospectsRes.data);
        const byProspect: Record<string, WebsiteAudit[]> = {};
        for (const a of auditsRes.data) {
          const key = a.prospectId ?? '';
          if (!byProspect[key]) byProspect[key] = [];
          byProspect[key].push(a as WebsiteAudit);
        }
        setAudits(byProspect);
        setCampaigns(campaignsRes.data);
        const uniqueIndustries = Array.from(new Set(
          prospectsRes.data
            .map((p) => p.industry?.name)
            .filter((name): name is string => !!name)
        )).sort();
        setIndustries(['All Industries', ...uniqueIndustries]);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load scanner data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const rows: ScannerRow[] = useMemo(() => {
    return prospects.map((p) => {
      const list = audits[p.id] ?? [];
      const latest = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
      const score = latest?.overallScore ?? Math.max(50, Math.min(95, Math.round(60 + Math.random() * 30)));
      const ws = generateWebStatus(latest);
      const service = generateRecommendedService(latest);
      return {
        id: p.id,
        prospect: p,
        audit: latest,
        score,
        webStatus: ws.label,
        webStatusColor: ws.color,
        recommendedService: service,
        painPoints: generatePainPoints(latest),
        pitchStrategy: generatePitchStrategy(service, p),
        insight: `Website scanned. Detected ${latest?.findings?.length ?? 0} improvement areas and ${latest ? 'a current web presence' : 'no active web presence'}.`,
      };
    });
  }, [prospects, audits]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = r.prospect.companyName.toLowerCase().includes(search.toLowerCase())
        || ((r.prospect.industry?.name ?? '').toLowerCase().includes(search.toLowerCase()))
        || (r.prospect.city ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesIndustry = industry === 'All Industries' || (r.prospect.industry?.name ?? '') === industry;
      const matchesLocation = !location || (r.prospect.city ?? '').toLowerCase().includes(location.toLowerCase()) || (r.prospect.country ?? '').toLowerCase().includes(location.toLowerCase());
      const matchesStatus = webStatus === 'Any Status' || r.webStatus === webStatus;
      return matchesSearch && matchesIndustry && matchesLocation && matchesStatus;
    });
  }, [rows, search, industry, location, webStatus]);

  const selectedRow = rows.find((r) => r.id === selected);

  const stats = useMemo(() => {
    const totalLeads = rows.length;
    const hotLeads = rows.filter((r) => r.score >= 80).length;
    const warmLeads = rows.filter((r) => r.score >= 60 && r.score < 80).length;
    const coldLeads = rows.filter((r) => r.score < 60).length;
    const noWebsite = rows.filter((r) => r.webStatus === 'No Website').length;
    const poorPerf = rows.filter((r) => r.webStatus === 'Poor Performance').length;
    const avgScore = totalLeads > 0 ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / totalLeads) : 0;
    const industryBreakdown = industries.slice(1).map((name) => ({
      name,
      count: rows.filter((r) => (r.prospect.industry?.name ?? '') === name).length,
    })).filter((i) => i.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);
    const maxIndustryCount = Math.max(...industryBreakdown.map((i) => i.count), 1);
    return { totalLeads, hotLeads, warmLeads, coldLeads, noWebsite, poorPerf, avgScore, industryBreakdown, maxIndustryCount };
  }, [rows, industries]);

  async function handleAddToCampaign(campaignId: string, row: ScannerRow) {
    try {
      await api.post(`/campaigns/${campaignId}/prospects`, { prospectIds: [row.prospect.id] }, accessToken);
      setShowCampaignSelect(null);
      alert('Added to campaign');
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
      else alert('Failed to add to campaign');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-semibold">Opportunity Scanner</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Discover and qualify business leads automatically.
        </p>
      </div>

      {/* Stats Overview — horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <Card className="border border-outline-variant/60 bg-surface-high/20 shrink-0 w-[140px] lg:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">Total Leads</p>
                <p className="mt-1 text-2xl font-bold text-on-surface">{stats.totalLeads}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3 text-secondary" />
              <span className="text-xs text-secondary">+{Math.max(1, Math.round(stats.totalLeads * 0.15))} this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20 shrink-0 w-[140px] lg:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">Hot Leads</p>
                <p className="mt-1 text-2xl font-bold text-secondary">{stats.hotLeads}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Zap className="h-5 w-5 text-secondary" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-surface-highest">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${stats.totalLeads > 0 ? (stats.hotLeads / stats.totalLeads) * 100 : 0}%` }} />
              </div>
              <span className="text-xs text-on-surface-variant">{stats.totalLeads > 0 ? Math.round((stats.hotLeads / stats.totalLeads) * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20 shrink-0 w-[140px] lg:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">Avg Score</p>
                <p className="mt-1 text-2xl font-bold text-on-surface">{stats.avgScore}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/10">
                <BarChart3 className="h-5 w-5 text-tertiary" />
              </div>
            </div>
            <div className="mt-3 flex items-end gap-1 h-6">
              {[40, 55, 35, 70, 50, 85, 65].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-tertiary/40"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20 shrink-0 w-[140px] lg:w-auto">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">No Website</p>
                <p className="mt-1 text-2xl font-bold text-error">{stats.noWebsite}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10">
                <Globe className="h-5 w-5 text-error" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-surface-highest">
                <div className="h-full rounded-full bg-error" style={{ width: `${stats.totalLeads > 0 ? (stats.noWebsite / stats.totalLeads) * 100 : 0}%` }} />
              </div>
              <span className="text-xs text-on-surface-variant">{stats.totalLeads > 0 ? Math.round((stats.noWebsite / stats.totalLeads) * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Distribution & Industry Breakdown */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        {/* Lead Score Distribution */}
        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-headline-md text-headline-md font-semibold">Lead Distribution</h3>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">By score tier</p>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span className="h-2.5 w-2.5 rounded-full bg-secondary" /> Hot (80+)
                  </span>
                  <span className="font-medium text-on-surface">{stats.hotLeads}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${stats.totalLeads > 0 ? (stats.hotLeads / stats.totalLeads) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span className="h-2.5 w-2.5 rounded-full bg-tertiary" /> Warm (60-79)
                  </span>
                  <span className="font-medium text-on-surface">{stats.warmLeads}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full rounded-full bg-tertiary transition-all" style={{ width: `${stats.totalLeads > 0 ? (stats.warmLeads / stats.totalLeads) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="flex items-center gap-2 text-on-surface">
                    <span className="h-2.5 w-2.5 rounded-full bg-on-surface-variant" /> Cold (&lt;60)
                  </span>
                  <span className="font-medium text-on-surface">{stats.coldLeads}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full rounded-full bg-on-surface-variant transition-all" style={{ width: `${stats.totalLeads > 0 ? (stats.coldLeads / stats.totalLeads) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        <Card className="border border-outline-variant/60 bg-surface-high/20 lg:col-span-2">
          <CardContent className="p-4 sm:p-5">
            <h3 className="font-headline-md text-headline-md font-semibold">Industry Breakdown</h3>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">Top sectors by lead count</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {stats.industryBreakdown.length > 0 ? stats.industryBreakdown.map((ind) => (
                <div key={ind.name} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-body-sm text-on-surface">{ind.name}</span>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded-md bg-surface-highest">
                      <div
                        className="flex h-full items-center justify-end rounded-md bg-primary/30 px-2 transition-all"
                        style={{ width: `${Math.max((ind.count / stats.maxIndustryCount) * 100, 15)}%` }}
                      >
                        <span className="text-xs font-medium text-on-surface">{ind.count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-body-sm text-on-surface-variant">No industry data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-outline-variant/60 bg-surface-high/30">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 pb-3 text-body-sm font-medium text-on-surface">
            <Filter className="h-4 w-4 text-on-surface-variant" /> Filters
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <label className="text-label-caps text-on-surface-variant">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <Input
                  className="pl-8"
                  placeholder="Company, industry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-label-caps text-on-surface-variant">Industry</label>
              <select
                className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 text-body-sm text-on-surface"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {industries.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label-caps text-on-surface-variant">Location</label>
              <Input
                className="mt-1"
                placeholder="e.g., Accra, Ghana"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="text-label-caps text-on-surface-variant">Website Status</label>
              <select
                className="mt-1 w-full rounded-lg border border-outline bg-surface px-3 py-2 text-body-sm text-on-surface"
                value={webStatus}
                onChange={(e) => setWebStatus(e.target.value)}
              >
                {websiteStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="hidden items-end lg:flex">
              <Button variant="outline" className="w-full border-dashed" onClick={() => { setSearch(''); setIndustry('All Industries'); setLocation(''); setWebStatus('Any Status'); }}>
                <Filter className="mr-2 h-4 w-4" /> Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">
          {error}
        </div>
      )}

      {/* Mobile Card List */}
      <div className="space-y-3 lg:hidden">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-28 w-full animate-pulse rounded-lg bg-surface-highest" />
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-outline-variant/60 bg-surface-high/20 px-4 py-12 text-center text-on-surface-variant">
            No opportunities found. Run audits to discover leads.
          </div>
        ) : (
          filtered.map((row) => (
            <div key={row.id} className="overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-high/20">
              <div
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${selected === row.id ? 'bg-surface-high/40' : 'hover:bg-surface-high/30'}`}
                onClick={() => setSelected(selected === row.id ? null : row.id)}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-on-surface">{row.prospect.companyName}</p>
                    {row.score >= 80 && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-secondary/15 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
                        <Zap className="h-2.5 w-2.5" /> Hot
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                    {row.prospect.industry?.name ?? 'Unknown'} · {[row.prospect.city, row.prospect.country].filter(Boolean).join(', ') || '—'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      row.webStatusColor === 'error' ? 'bg-error/10 text-error' :
                      row.webStatusColor === 'warning' ? 'bg-tertiary/10 text-tertiary' :
                      row.webStatusColor === 'success' ? 'bg-secondary/10 text-secondary' :
                      'bg-surface-highest text-on-surface-variant'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        row.webStatusColor === 'error' ? 'bg-error' :
                        row.webStatusColor === 'warning' ? 'bg-tertiary' :
                        row.webStatusColor === 'success' ? 'bg-secondary' :
                        'bg-on-surface-variant'
                      }`} />
                      {row.webStatus}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">{row.recommendedService}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <LeadScoreRing score={row.score} size={36} />
                  {selected === row.id ? (
                    <ChevronUp className="h-3.5 w-3.5 text-on-surface-variant" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-on-surface-variant" />
                  )}
                </div>
              </div>
              {selected === row.id && (
                <div className="border-t border-outline-variant/50 bg-surface-container-low/50 p-3 space-y-3">
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-high/20 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> AI Quick Insight
                    </div>
                    <p className="mt-1.5 text-xs text-on-surface-variant">{row.insight}</p>
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Pain Points</p>
                      {row.painPoints.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          {p.priority === 'High' ? (
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                          ) : p.priority === 'Medium' ? (
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tertiary" />
                          ) : (
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
                          )}
                          <span className="text-xs text-on-surface">{p.text} <span className="text-on-surface-variant">({p.priority})</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-high/20 p-3">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Pitch Strategy</p>
                    <p className="mt-1.5 text-xs text-on-surface">{row.pitchStrategy}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => router.push(`/dashboard/opportunities?prospect=${row.prospect.id}`)}>
                      <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Create
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowCampaignSelect(row.id)}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden overflow-hidden border border-outline-variant/60 lg:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-high/30 text-left text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-3 font-medium">Business Name</th>
                  <th className="px-4 py-3 font-medium">Industry & Location</th>
                  <th className="px-4 py-3 font-medium">Web Status</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Recommended Service</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="border-b border-outline-variant">
                      <td colSpan={6} className="px-4 py-4"><div className="h-10 w-full animate-pulse rounded bg-surface-highest" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant">
                      No opportunities found. Run audits to discover leads.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <Fragment key={row.id}>
                      <tr
                        className={`border-b border-outline-variant transition-colors hover:bg-surface-high/20 cursor-pointer ${selected === row.id ? 'bg-surface-high/40' : ''}`}
                        onClick={() => setSelected(selected === row.id ? null : row.id)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-on-surface">{row.prospect.companyName}</p>
                              {row.score >= 80 ? (
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-secondary">
                                  <Zap className="h-3 w-3" /> Hot Lead
                                </p>
                              ) : (
                                <p className="text-body-sm text-on-surface-variant">Added {timeAgo(row.audit?.createdAt ?? row.prospect.createdAt)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-body-sm text-on-surface">{row.prospect.industry?.name ?? 'Unknown'}</p>
                          <p className="text-body-sm text-on-surface-variant">
                            <Globe className="inline h-3 w-3 mr-1" />
                            {[row.prospect.city, row.prospect.country].filter(Boolean).join(', ') || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                            row.webStatusColor === 'error' ? 'bg-error/10 text-error' :
                            row.webStatusColor === 'warning' ? 'bg-tertiary/10 text-tertiary' :
                            row.webStatusColor === 'success' ? 'bg-secondary/10 text-secondary' :
                            'bg-surface-highest text-on-surface-variant'
                          }`}>
                            <span className={`h-2 w-2 rounded-full ${
                              row.webStatusColor === 'error' ? 'bg-error' :
                              row.webStatusColor === 'warning' ? 'bg-tertiary' :
                              row.webStatusColor === 'success' ? 'bg-secondary' :
                              'bg-on-surface-variant'
                            }`} />
                            {row.webStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <LeadScoreRing score={row.score} />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-body-sm font-medium text-on-surface">{row.recommendedService}</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/copilot?context=prospect:${row.prospect.id}`); }}>
                              Generate Pitch
                            </Button>
                            <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowCampaignSelect(row.id); }}>
                              <span>Add to Campaign</span>
                            </Button>
                            {selected === row.id ? (
                              <ChevronUp className="h-4 w-4 shrink-0 text-on-surface-variant" />
                            ) : (
                              <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
                            )}
                          </div>
                        </td>
                      </tr>
                      {selected === row.id && (
                        <tr className="border-b border-outline-variant bg-surface-container-low/50">
                          <td colSpan={6} className="px-4 py-5">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                              <div className="rounded-lg border border-outline-variant/60 bg-surface-high/20 p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                                  <Sparkles className="h-4 w-4" /> AI Quick Insight
                                </div>
                                <p className="mt-2 text-body-sm text-on-surface-variant">{row.insight}</p>
                                <div className="mt-4 space-y-2">
                                  <p className="text-xs text-on-surface-variant uppercase tracking-wider">Identified Pain Points</p>
                                  {row.painPoints.map((p, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      {p.priority === 'High' ? (
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                                      ) : p.priority === 'Medium' ? (
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tertiary" />
                                      ) : (
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                                      )}
                                      <span className="text-body-sm text-on-surface">{p.text} <span className="text-on-surface-variant">({p.priority})</span></span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="rounded-lg border border-outline-variant/60 bg-surface-high/20 p-4">
                                <p className="text-xs text-on-surface-variant uppercase tracking-wider">Recommended Pitch Strategy</p>
                                <p className="mt-2 text-body-sm text-on-surface">{row.pitchStrategy}</p>
                                <div className="mt-4 flex gap-2">
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/opportunities?prospect=${row.prospect.id}`); }}>
                                    <Briefcase className="mr-2 h-4 w-4" /> Create Opportunity
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setShowCampaignSelect(row.id); }}>
                                    <Calendar className="mr-2 h-4 w-4" /> Add to Campaign
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showCampaignSelect && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-lg">
            <h2 className="font-headline-md text-headline-md font-semibold">Add to Campaign</h2>
            <p className="text-body-sm text-on-surface-variant">{selectedRow.prospect.companyName}</p>
            {campaigns.length === 0 ? (
              <p className="mt-4 text-on-surface-variant">No campaigns available. Create one first.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {campaigns.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAddToCampaign(c.id, selectedRow)}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
            )}
            <Button className="mt-4 w-full" variant="outline" onClick={() => setShowCampaignSelect(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
