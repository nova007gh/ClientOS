'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  ArrowLeft, Save, Play, Sparkles, Mail, Plus, BarChart3, Database,
  Linkedin, Phone, MessageSquare, Clock, Users, Send, TrendingUp,
} from 'lucide-react';

interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyLimit: number;
  timezone: string;
  createdAt: string;
  steps: {
    id: string;
    stepNumber: number;
    delayDays: number;
    type: string;
    instructions: string;
  }[];
  prospects: { id: string; prospect: { id: string; companyName: string } }[];
}

interface Step {
  id: string;
  stepNumber: number;
  delayDays: number;
  type: string;
  instructions: string;
  condition?: string;
}

export default function CampaignBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const id = params.id as string;

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const data = await api.get<CampaignDetail>(`/campaigns/${id}`, accessToken);
        setCampaign(data);
        setSteps(data.steps.map((s, i) => ({
          ...s,
          condition: i === 1 ? 'If no reply' : undefined,
        })));
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load campaign');
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
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/campaigns')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      </div>
    );
  }

  if (!campaign) return null;

  const stepTypeIcons: Record<string, typeof Mail> = {
    EMAIL: Mail,
    LINKEDIN: Linkedin,
    CALL: Phone,
    SMS: MessageSquare,
    TASK: Sparkles,
  };

  const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'neutral'> = {
    DRAFT: 'neutral',
    ACTIVE: 'secondary',
    PAUSED: 'warning',
    COMPLETED: 'default',
    STOPPED: 'error',
  };

  const projectionData = [
    { label: 'Sent', value: 1200, max: 1500, color: 'bg-primary' },
    { label: 'Opened', value: 816, max: 1500, color: 'bg-tertiary' },
    { label: 'Replied', value: 144, max: 1500, color: 'bg-secondary' },
    { label: 'Meetings', value: 28, max: 1500, color: 'bg-secondary' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline-lg text-headline-lg font-semibold">{campaign.name}</h1>
              <Badge variant={statusVariants[campaign.status] ?? 'neutral'}>{campaign.status}</Badge>
            </div>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {campaign.steps.length} steps · {campaign.prospects.length} prospects · {campaign.dailyLimit} daily limit
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {}}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => {}}>
            <Play className="mr-2 h-4 w-4" /> Launch Sequence
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Sequence Builder (spans 2) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold">Sequence Builder</h2>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Add Step
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => {
                const StepIcon = stepTypeIcons[step.type] ?? Mail;
                return (
                  <div key={step.id} className="relative pl-10">
                    {idx < steps.length - 1 && (
                      <div className="absolute left-[15px] top-12 bottom-0 w-0.5 bg-outline-variant" />
                    )}
                    <div className="absolute left-0 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <div className="rounded-lg border border-outline-variant/60 bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-semibold text-on-surface">
                            {step.type === 'EMAIL' ? 'Email' : step.type === 'LINKEDIN' ? 'LinkedIn' : step.type === 'CALL' ? 'Call' : step.type === 'SMS' ? 'SMS' : 'Task'}
                          </span>
                          {step.delayDays > 0 && (
                            <span className="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant">
                              <Clock className="h-3 w-3" /> +{step.delayDays}d
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-on-surface-variant">Step {step.stepNumber}</span>
                      </div>
                      {step.condition && (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-secondary/10 px-2 py-0.5 text-[10px] text-secondary">
                          <Sparkles className="h-3 w-3" /> {step.condition}
                        </div>
                      )}
                      <div className="mt-3 rounded border border-dashed border-outline-variant bg-surface-container-lowest p-3 text-body-sm text-on-surface-variant">
                        {step.instructions ? (
                          <p className="whitespace-pre-wrap">{step.instructions}</p>
                        ) : idx === 0 ? (
                          <div className="space-y-1.5">
                            <p>Subject: <span className="rounded bg-primary/15 px-1 text-primary">{'{{AI_Subject}}'}</span></p>
                            <p>Hi <span className="rounded bg-primary/15 px-1 text-primary">{'{{FirstName}}'}</span>,</p>
                            <p>Noticed your team at <span className="rounded bg-primary/15 px-1 text-primary">{'{{CompanyName}}'}</span> recently...</p>
                          </div>
                        ) : (
                          <p className="italic">Add instructions for this step...</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pl-10">
                <button className="flex items-center gap-2 rounded-lg border border-dashed border-outline-variant px-4 py-3 text-body-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
                  <Plus className="h-4 w-4" /> Add Step
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI Personalization & Performance */}
        <div className="space-y-5">
          <div className="rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Preview
              </h2>
              <Badge className="bg-surface-highest text-on-surface-variant text-[10px]">Sample</Badge>
            </div>

            <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-surface-highest px-2 py-1 text-[10px] text-on-surface-variant">
                <Database className="h-3 w-3" /> LinkedIn Post
              </span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-surface-highest px-2 py-1 text-[10px] text-on-surface-variant">
                <Database className="h-3 w-3" /> Tech Stack
              </span>
            </div>

            <div className="rounded-lg bg-surface p-4 space-y-2 text-body-sm">
              <p className="font-medium text-on-surface">Subject: Thoughts on your recent post about scalable UI architectures</p>
              <p className="text-on-surface-variant">Hi Sarah,</p>
              <p className="text-on-surface-variant">
                I saw your post from Tuesday regarding the challenges of migrating legacy React apps.
                It resonated because our team recently helped a similar FinTech client reduce their
                tech debt by 40% using automated refactoring tools.
              </p>
              <p className="rounded border-l-2 border-primary bg-primary/5 p-2 text-on-surface-variant">
                Since you&apos;re leading the frontend transition at Acme Corp, I thought you might find our approach relevant.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/60 bg-surface-high/20 p-5">
            <h2 className="mb-4 font-headline-md text-headline-md font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Projected Performance
            </h2>
            <div className="space-y-3">
              {projectionData.map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">{d.label}</span>
                    <span className="font-medium text-on-surface">{d.value.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-highest">
                    <div className={`h-full rounded-full ${d.color}`} style={{ width: `${(d.value / d.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-outline-variant pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant">Est. Open Rate</p>
                  <p className="font-headline-md text-headline-md font-semibold text-on-surface">68%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-tertiary" />
                <div>
                  <p className="text-[10px] text-on-surface-variant">Est. Reply Rate</p>
                  <p className="font-headline-md text-headline-md font-semibold text-on-surface">14%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
