'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { ArrowLeft, FileText, Save, Send, Sparkles, CheckCircle, Lightbulb, AlertTriangle, MessageSquare, ArrowRight, ChevronRight, Grid, File, Plus } from 'lucide-react';

interface ProposalDetail {
  id: string;
  title: string;
  status: string;
  total: number | null;
  currency: string;
  publicToken: string;
  expiresAt: string | null;
  createdAt: string;
  opportunity: { id: string; title: string } | null;
  sections: {
    id: string;
    sectionType: string;
    title: string;
    content: string;
    sortOrder: number;
  }[];
}

const navItems = [
  { id: 'executive', label: 'Executive Summary', icon: FileText },
  { id: 'scope', label: 'Scope of Work', icon: Grid },
  { id: 'timeline', label: 'Timeline', icon: ChevronRight },
  { id: 'investment', label: 'Investment', icon: File },
];

const suggestions = [
  {
    title: 'Strengthen ROI Claim',
    icon: Lightbulb,
    desc: 'Based on industry data, you can likely claim a 30% reduction in overhead instead of 22%.',
    action: 'Apply Change',
    secondary: 'Dismiss',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    title: 'Add Risk Mitigation Section',
    icon: Sparkles,
    desc: 'Enterprise clients usually expect a dedicated risk matrix. AI can generate one based on the scope.',
    action: 'Generate Section',
    secondary: null,
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Tone Check',
    icon: MessageSquare,
    desc: "The Executive Summary tone is currently 'Formal'. Would you like to adjust it to 'Persuasive'?",
    action: 'Apply Change',
    secondary: null,
    color: 'bg-warning/10 text-warning',
  },
];

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [activeSection, setActiveSection] = useState('executive');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const id = params.id as string;

  useEffect(() => {
    if (!accessToken) return;
    async function load() {
      try {
        const data = await api.get<ProposalDetail>(`/proposals/${id}`, accessToken);
        setProposal(data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError('Failed to load proposal');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, accessToken]);

  function copyLink() {
    const url = `${window.location.origin}/p/${proposal?.publicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/proposals')}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      </div>
    );
  }

  if (!proposal) return null;

  const total = proposal.total ?? 150000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/proposals')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <h1 className="font-headline-lg text-headline-lg font-semibold">{proposal.title}</h1>
            <p className="text-body-sm text-on-surface-variant">Prepared for: {proposal.opportunity?.title ?? 'Acme Corp'} • {new Date(proposal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {}}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={copyLink}>
            {copied ? 'Copied!' : 'Send to Client'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Proposal Structure</p>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm ${
                        activeSection === item.id
                          ? 'bg-surface-highest text-on-surface'
                          : 'text-on-surface-variant hover:bg-surface-high/30'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">AI Context</p>
              <div className="space-y-2 text-body-sm">
                <p><span className="text-on-surface-variant">Client:</span> <span className="text-on-surface">Acme Corp</span></p>
                <p><span className="text-on-surface-variant">Intent:</span> <span className="text-on-surface">Enterprise Q3 Migration</span></p>
                <p className="inline-flex items-center gap-1 text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Pre-filled from audit
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-xl border border-outline-variant/60 bg-surface-high/20 overflow-hidden">
            <div className="border-b border-outline-variant bg-surface-container-lowest px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <FileText className="h-4 w-4" />
                <span>Document Canvas</span>
              </div>
              <Badge className="bg-secondary/10 text-secondary text-[10px]">
                <CheckCircle className="mr-1 h-3 w-3" /> Auto-saved
              </Badge>
            </div>
            <div className="p-8 space-y-6">
              <div className="border-b border-outline-variant pb-4">
                <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
                  {proposal.title}
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Prepared for: {proposal.opportunity?.title ?? 'Acme Corp'} • {new Date(proposal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {activeSection === 'executive' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-md text-headline-md font-semibold">Executive Summary</h3>
                    <Button size="sm" variant="outline" className="text-[10px]">
                      <Sparkles className="mr-1 h-3 w-3 text-primary" /> Regenerate
                    </Button>
                  </div>
                  <div
                    className="rounded-lg bg-surface p-4 text-body-sm text-on-surface-variant leading-relaxed space-y-4 outline-none focus:ring-1 focus:ring-primary focus:rounded-lg"
                    contentEditable
                    suppressContentEditableWarning
                  >
                    {proposal.sections.find((s) => s.sectionType === 'EXECUTIVE')?.content ? (
                      <p className="whitespace-pre-wrap">{proposal.sections.find((s) => s.sectionType === 'EXECUTIVE')?.content}</p>
                    ) : (
                      <>
                        <p>Based on our recent audit of <span className="rounded bg-primary/15 px-1 text-primary">Acme Corp</span>&apos;s legacy infrastructure, there is a critical need to transition to a scalable, cloud-native architecture before Q4 to avoid projected bottleneck failures. This proposal outlines a comprehensive migration strategy designed to ensure zero downtime while reducing operational overhead by an estimated <span className="rounded bg-tertiary/15 px-1 text-tertiary cursor-pointer">22%</span>.</p>
                        <p>Our AI-driven approach will map all existing dependencies and automate the deployment pipeline, significantly reducing risk compared to manual migration methods.</p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-md text-headline-md font-semibold">Scope of Work</h3>
                    <Button size="sm" variant="outline" className="text-[10px]">
                      <Plus className="mr-1 h-3 w-3" /> Add Phase
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-outline-variant/60 bg-surface p-4 space-y-2">
                      <div className="flex items-center gap-2 text-secondary">
                        <CheckCircle className="h-4 w-4" />
                        <h4 className="font-medium text-on-surface text-body-sm">Phase 1: Discovery & Mapping</h4>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">Automated dependency mapping using ClientOS Agent. Expected duration: 2 weeks.</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="rounded bg-surface-highest px-1.5 py-0.5 text-[10px] text-on-surface-variant">2 weeks</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">$15,000</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-outline-variant/60 bg-surface p-4 space-y-2">
                      <div className="flex items-center gap-2 text-secondary">
                        <CheckCircle className="h-4 w-4" />
                        <h4 className="font-medium text-on-surface text-body-sm">Phase 2: Pilot Migration</h4>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">Migration of non-critical workloads to establish baseline performance metrics.</p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="rounded bg-surface-highest px-1.5 py-0.5 text-[10px] text-on-surface-variant">3 weeks</span>
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">$35,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'scope' && (
                <div className="space-y-4">
                  <h3 className="font-headline-md text-headline-md font-semibold">Scope of Work</h3>
                  <div className="rounded-lg bg-surface p-4 text-body-sm text-on-surface-variant leading-relaxed" contentEditable suppressContentEditableWarning>
                    <p>Detailed scope of work would appear here. Edit this section to define deliverables, exclusions, and assumptions.</p>
                  </div>
                </div>
              )}
              {activeSection === 'timeline' && (
                <div className="space-y-4">
                  <h3 className="font-headline-md text-headline-md font-semibold">Timeline & Milestones</h3>
                  <div className="space-y-3">
                    {['Discovery & Mapping', 'Pilot Migration', 'Full Migration', 'QA & Handoff'].map((phase, i) => (
                      <div key={phase} className="flex items-center gap-4 rounded-lg bg-surface p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold">{i + 1}</div>
                        <div className="flex-1">
                          <p className="text-body-sm font-medium text-on-surface">{phase}</p>
                          <p className="text-xs text-on-surface-variant">Week {i * 2 + 1} — Week {i * 2 + 2}</p>
                        </div>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-highest">
                          <div className={`h-full rounded-full ${i < 2 ? 'bg-secondary' : 'bg-outline-variant'}`} style={{ width: i < 2 ? '100%' : '0%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeSection === 'investment' && (
                <div className="space-y-4">
                  <h3 className="font-headline-md text-headline-md font-semibold">Investment</h3>
                  <div className="rounded-lg bg-surface p-6 text-center">
                    <p className="text-body-sm text-on-surface-variant">Total Investment</p>
                    <p className="mt-2 text-4xl font-semibold text-on-surface">${total.toLocaleString()}</p>
                    <p className="mt-2 text-body-sm text-on-surface-variant">Net 30 · 50% upfront, 50% on completion</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-surface p-4">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider">One-time Setup</p>
                      <p className="mt-1 text-xl font-semibold text-on-surface">${Math.round(total * 0.5).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-4">
                      <p className="text-xs text-on-surface-variant uppercase tracking-wider">On Completion</p>
                      <p className="mt-1 text-xl font-semibold text-on-surface">${Math.round(total * 0.5).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-outline-variant pt-4 text-body-sm text-on-surface-variant">
                <span>ClientOS • Confidential</span>
                <span>Page 1 of {Math.max(4, proposal.sections.length)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-4">
              <div className="flex border-b border-outline-variant">
                <button className="px-3 pb-2 text-body-sm font-medium text-on-surface border-b-2 border-primary">AI Suggestions</button>
                <button className="px-3 pb-2 text-body-sm text-on-surface-variant">Settings</button>
              </div>
              <div className="mt-4 space-y-4">
                {suggestions.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.title} className="rounded-lg border border-outline-variant/60 bg-surface p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${s.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <h4 className="text-body-sm font-semibold text-on-surface">{s.title}</h4>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">{s.desc}</p>
                      <Button size="sm" className="w-full bg-surface-highest text-on-surface hover:bg-surface-high border border-outline-variant">
                        {s.action}
                      </Button>
                      {s.secondary && (
                        <Button size="sm" variant="ghost" className="w-full text-on-surface-variant">
                          {s.secondary}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
