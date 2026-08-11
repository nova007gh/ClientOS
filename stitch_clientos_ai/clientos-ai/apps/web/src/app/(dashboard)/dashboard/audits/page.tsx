'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, Button, Badge, LeadScoreRing } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Cpu,
  Lightbulb,
  Mail,
  AlertCircle,
  Clock,
  Search,
  Eye,
  Target,
  CheckCircle,
  User,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalRevenue: number;
    activePipeline: number;
    winRate: number;
    openRate: number;
    replyRate: number;
  };
}

interface FunnelStage {
  name: string;
  count: number;
  pct: number;
  color: string;
}

export default function IntelligencePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; status: string; _count: { prospects: number } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const [dashRes, campRes] = await Promise.all([
          api.get<DashboardData>('/dashboard', accessToken),
          api.get<{ data: { id: string; name: string; status: string; _count: { prospects: number } }[] }>('/campaigns', accessToken),
        ]);
        setData(dashRes);
        setCampaigns(campRes.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load intelligence data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  const funnel: FunnelStage[] = [
    { name: 'Discovery', count: 1240, pct: 100, color: 'bg-on-surface-variant' },
    { name: 'Audit', count: 850, pct: 68, color: 'bg-primary' },
    { name: 'Qualified', count: 420, pct: 49, color: 'bg-primary' },
    { name: 'Contacted', count: 380, pct: 90, color: 'bg-secondary' },
    { name: 'Replied', count: 145, pct: 38, color: 'bg-secondary' },
    { name: 'Closed', count: 42, pct: 29, color: 'bg-secondary' },
  ];

  const actions = [
    {
      icon: User,
      label: 'Hot Lead',
      time: '2m ago',
      name: 'Sarah Jenkins',
      company: 'TechFlow',
      insight: 'Opened proposal document 4 times today. Viewed pricing tier for 3 minutes.',
      action: 'Draft Email',
      phone: true,
    },
    {
      icon: Sparkles,
      label: 'AI Detection',
      time: '1h ago',
      name: 'Michael Chang',
      company: 'Nexus Corp',
      insight: 'Replied to sequence 2 with intent question regarding API integration capabilities.',
      action: 'View Thread',
      phone: false,
    },
    {
      icon: Clock,
      label: 'Stagnant',
      time: '4d ago',
      name: 'Emily Ross',
      company: 'Vertex',
      insight: "Stuck in 'Qualified' stage. AI generated a personalized re-engagement script.",
      action: 'Generate Msg',
      phone: false,
    },
  ];

  const topCampaign = useMemo(() => {
    return campaigns.length > 0 ? campaigns[0] : { name: 'Q3 Enterprise Target' };
  }, [campaigns]);

  const totalRevenue = data?.stats?.totalRevenue ?? 842500;
  const openRate = data?.stats?.openRate ?? 68;
  const replyRate = data?.stats?.replyRate ?? 14;
  const credits = 14250;
  const creditsTotal = 20000;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface-highest" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-surface-highest" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Intelligence</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Real-time pipeline analytics and AI-driven insights.</p>
        </div>
        <Badge className="bg-secondary/10 text-secondary flex items-center gap-1.5 self-start">
          <span className="h-2 w-2 rounded-full bg-secondary" /> Live Sync Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Revenue</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-semibold text-on-surface">${totalRevenue.toLocaleString()}</p>
                <p className="mt-1 text-body-sm text-secondary flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> +14.2% vs last month
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-on-surface-variant" />
            </div>
            <div className="h-px bg-outline-variant" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface-variant">Closed Won</span>
                <span className="font-medium text-on-surface">$315,000</span>
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface-variant">Active Pipeline</span>
                <span className="font-medium text-on-surface">$527,500</span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-highest">
              <div className="h-full w-[60%] rounded-full bg-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Campaign Performance</p>
            <div className="flex items-start justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-3xl font-semibold text-on-surface">{openRate}%</p>
                  <p className="text-body-sm text-on-surface-variant">Avg Open Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-on-surface">{replyRate}%</p>
                  <p className="text-body-sm text-on-surface-variant">Avg Reply Rate</p>
                </div>
              </div>
              <RefreshCw className="h-5 w-5 text-on-surface-variant" />
            </div>
            <div className="h-px bg-outline-variant" />
            <div>
              <p className="text-body-sm text-on-surface">Top Campaign: <span className="font-medium">&quot;{topCampaign.name}&quot;</span></p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-highest">
                <div className="h-full w-[82%] rounded-full bg-primary" />
              </div>
              <p className="mt-1 text-right text-xs text-on-surface-variant">82% Open Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">AI Compute Engine</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-semibold text-on-surface">{credits.toLocaleString()} <span className="text-lg text-on-surface-variant font-normal">/ {creditsTotal.toLocaleString()}</span></p>
                <p className="text-body-sm text-on-surface-variant">Credits consumed this billing cycle</p>
              </div>
              <Cpu className="h-5 w-5 text-on-surface-variant" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-highest">
              <div className="h-full w-[71%] rounded-full bg-primary" />
            </div>
            <p className="text-right text-xs text-on-surface-variant">71% CONSUMED</p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface-variant">Lead Scoring</span>
                <span className="font-medium text-on-surface">8,500</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-highest">
                <div className="h-full w-[85%] rounded-full bg-primary" />
              </div>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface-variant">Email Generation</span>
                <span className="font-medium text-on-surface">5,750</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-highest">
                <div className="h-full w-[57%] rounded-full bg-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-outline-variant/60 bg-surface-high/20">
        <CardContent className="p-5 space-y-4">
          <h2 className="font-headline-md text-headline-md font-semibold">Sales Velocity Funnel</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {funnel.map((stage, i) => (
              <div key={stage.name} className="relative flex flex-col items-center rounded-lg bg-surface-high/30 p-4 text-center">
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${stage.color} text-surface`}>
                  {i === 0 ? <Search className="h-6 w-6" /> :
                   i === 1 ? <Eye className="h-6 w-6" /> :
                   i === 2 ? <Target className="h-6 w-6" /> :
                   i === 3 ? <Mail className="h-6 w-6" /> :
                   i === 4 ? <CheckCircle className="h-6 w-6" /> :
                   <TrendingUp className="h-6 w-6" />}
                </div>
                <p className="text-body-sm font-medium text-on-surface">{stage.name}</p>
                <p className="text-xl font-semibold text-on-surface">{stage.count.toLocaleString()}</p>
                <p className="text-xs text-secondary">{stage.pct}%</p>
                {i < funnel.length - 1 && (
                  <div className="absolute right-0 top-1/2 hidden h-0.5 w-4 -translate-y-1/2 translate-x-1/2 bg-outline-variant lg:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" /> AI Recommended Actions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <Card key={a.name} className="border border-outline-variant/60 bg-surface-high/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-body-sm">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <Icon className="h-4 w-4" />
                      {a.label}
                    </div>
                    <span className="text-on-surface-variant">{a.time}</span>
                  </div>
                  <p className="text-body-sm font-medium text-on-surface">{a.name} <span className="text-on-surface-variant">@ {a.company}</span></p>
                  <p className="text-body-sm text-on-surface-variant">{a.insight}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" className="flex-1 bg-primary text-on-primary">{a.action}</Button>
                    {a.phone && (
                      <Button size="sm" variant="outline" className="px-2.5">📞</Button>
                    )}
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
