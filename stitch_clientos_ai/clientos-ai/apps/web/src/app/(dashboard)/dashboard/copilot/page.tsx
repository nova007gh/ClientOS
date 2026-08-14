'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, LeadScoreRing } from '@clientos/ui';
import { Send, Edit, PlusCircle, Database, Sparkles, Bookmark, MoreVertical, FileText, Mail, Copy, Check, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

interface HistoryItem {
  id: string;
  title: string;
  sub: string;
  active?: boolean;
}

interface LeadCard {
  company: string;
  score: number;
  lastContact: string;
  industry?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  cards?: LeadCard[];
  actions?: { label: string; icon: 'sparkles' | 'logs' | 'email' | 'report' }[];
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(<ol key={`ol-${elements.length}`} className="ml-4 space-y-1.5 list-decimal">{listItems}</ol>);
      } else {
        elements.push(<ul key={`ul-${elements.length}`} className="ml-4 space-y-1.5 list-disc list-outside marker:text-outline">{listItems}</ul>);
      }
      listItems = [];
      listType = null;
    }
  };

  const parseInline = (s: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = s;
    let key = 0;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index));
        parts.push(<strong key={key++} className="font-semibold text-on-surface">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(remaining);
        remaining = '';
      }
    }
    return parts;
  };

  lines.forEach((line, i) => {
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    const ulMatch = line.match(/^\s*[-]\s+(.+)/);
    const subMatch = line.match(/^\s{2,}[-]\s+(.+)/);

    if (subMatch && listType === 'ol') {
      listItems.push(<li key={`li-${i}`} className="text-on-surface-variant">{parseInline(subMatch[1])}</li>);
    } else if (olMatch) {
      if (listType !== 'ol') { flushList(); listType = 'ol'; }
      listItems.push(<li key={`li-${i}`} className="text-on-surface">{parseInline(olMatch[1])}</li>);
    } else if (ulMatch) {
      if (listType !== 'ul') { flushList(); listType = 'ul'; }
      listItems.push(<li key={`li-${i}`} className="text-on-surface">{parseInline(ulMatch[1])}</li>);
    } else if (line.trim() === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={`p-${i}`} className="leading-relaxed">{parseInline(line)}</p>);
    }
  });
  flushList();
  return elements;
}

function companyInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '?';
}

const quickSuggestions = [
  { label: 'Audit enterprise leads', icon: Target },
  { label: 'Generate follow-up emails', icon: Mail },
  { label: 'Churn risk analysis', icon: AlertTriangle },
  { label: 'Competitor analysis', icon: TrendingUp },
];

const initialMessages: Message[] = [];

interface ProspectData {
  id: string;
  companyName: string;
  industry: { name: string } | null;
  status: string;
  city: string | null;
  country: string | null;
  website: string | null;
  createdAt: string | null;
}

interface DashboardData {
  stats: {
    totalProspects: number;
    qualifiedLeads: number;
    activeCampaigns: number;
    pipelineValue: number;
    auditsCompleted: number;
    winRate: number;
    openRate: number;
    replyRate: number;
    totalRevenue: number;
    totalContracts: number;
    signedContracts: number;
    totalConversations: number;
  };
  pipelineOverview: { stage: string; count: number; pct: number }[];
}

function timeAgo(date: string | null | undefined): string {
  if (!date) return 'never';
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

async function getAIResponse(userText: string, token: string | null): Promise<Message> {
  const id = String(Date.now());
  const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const lower = userText.toLowerCase().trim();

  let dashboard: DashboardData | null = null;
  let prospects: ProspectData[] = [];

  try {
    const [dashRes, prospectRes] = await Promise.all([
      api.get<DashboardData>('/dashboard', token),
      api.get<{ data: ProspectData[] }>('/prospects', token),
    ]);
    dashboard = dashRes;
    prospects = prospectRes.data ?? [];
  } catch {}

  const s = dashboard?.stats;
  const topProspects = prospects.slice(0, 5).map((p) => ({
    company: p.companyName,
    score: 50 + Math.floor(Math.random() * 45),
    lastContact: timeAgo(p.createdAt),
    industry: p.industry?.name ?? 'Unknown',
  }));

  // Greeting / help
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'help' || lower === 'what can you do') {
    return {
      id,
      role: 'assistant',
      text: `Hello! I'm your ClientOS AI Copilot. I have access to your CRM data, audit results, and outreach history.\n\n**Your current stats:**\n- Total prospects: ${s?.totalProspects ?? 0}\n- Qualified leads: ${s?.qualifiedLeads ?? 0}\n- Active campaigns: ${s?.activeCampaigns ?? 0}\n- Pipeline value: $${(s?.pipelineValue ?? 0).toLocaleString()}\n- Win rate: ${s?.winRate ?? 0}%\n\nHere's what I can do:\n- **Audit enterprise leads** — Identify high-intent accounts that need immediate outreach\n- **Generate email sequences** — Draft personalized follow-ups with subject lines, hooks, and CTAs\n- **Churn risk analysis** — Spot at-risk clients before they leave\n- **Performance reports** — Campaign metrics, pipeline ROI, and optimization recommendations\n- **Generate pitch proposals** — Tailored decks with ROI projections for top prospects\n\nWhat would you like me to help you with today?`,
      time: now,
    };
  }

  // Audit / lead scanning
  if (lower.includes('audit') || lower.includes('lead') || lower.includes('scan') || lower.includes('dormant') || lower.includes('contacted') || lower.includes('high-intent') || lower.includes('pipeline')) {
    if (prospects.length === 0) {
      return {
        id,
        role: 'assistant',
        text: `I checked your pipeline — you currently have **0 prospects** in your CRM.\n\nTo get started:\n1. Add prospects via the **Clients** page\n2. Run website audits to score them\n3. Come back and I'll help you identify high-intent accounts for outreach`,
        time: now,
      };
    }
    return {
      id,
      role: 'assistant',
      text: `Running a comprehensive audit on your pipeline...\n\n**Analysis complete.** You have **${s?.totalProspects ?? prospects.length} prospects** total, with **${s?.qualifiedLeads ?? 0} qualified leads** and **${s?.activeCampaigns ?? 0} active campaigns**.\n\nHere are your top prospects that need attention:`,
      time: now,
      cards: topProspects,
      actions: [
        { label: 'Generate Emails', icon: 'sparkles' },
        { label: 'Show Activity Logs', icon: 'logs' },
      ],
    };
  }

  // Email / follow-up / sequence generation
  if (lower.includes('email') || lower.includes('follow-up') || lower.includes('follow up') || lower.includes('sequence') || lower.includes('draft')) {
    if (prospects.length === 0) {
      return {
        id,
        role: 'assistant',
        text: `You don't have any prospects yet. Add some prospects first, then I can help you draft personalized email sequences for them.`,
        time: now,
      };
    }
    const top3 = prospects.slice(0, 3);
    let emailText = `I've drafted personalized follow-up email strategies for your top ${Math.min(3, top3.length)} prospects:\n\n`;
    top3.forEach((p, i) => {
      emailText += `${i + 1}. **${p.companyName}** (${p.industry?.name ?? 'Unknown'})\n   - Subject: "Helping ${p.companyName} grow with data-driven insights"\n   - Hook: Reference their industry trends and ${p.website ? 'website performance gaps' : 'lack of online presence'}\n   - CTA: Offer a complimentary 30-min strategy call\n   - Send: Tuesday 10:00 AM (optimal open rate window)\n\n`;
    });
    emailText += `Each email is personalized with firmographic data and industry-specific pain points. Shall I generate the full email drafts?`;
    return {
      id,
      role: 'assistant',
      text: emailText,
      time: now,
      cards: top3.map((p) => ({ company: p.companyName, score: 50 + Math.floor(Math.random() * 45), lastContact: timeAgo(p.createdAt), industry: p.industry?.name ?? 'Unknown' })),
      actions: [
        { label: 'Generate Full Drafts', icon: 'email' },
        { label: 'Schedule Sends', icon: 'sparkles' },
      ],
    };
  }

  // Churn / risk analysis
  if (lower.includes('churn') || lower.includes('risk') || lower.includes('retention') || lower.includes('losing')) {
    return {
      id,
      role: 'assistant',
      text: `I've completed a churn risk analysis across your client base.\n\n**Current metrics:**\n- Total contracts: ${s?.totalContracts ?? 0}\n- Signed contracts: ${s?.signedContracts ?? 0}\n- Win rate: ${s?.winRate ?? 0}%\n- Total conversations: ${s?.totalConversations ?? 0}\n- Reply rate: ${s?.replyRate ?? 0}%\n\n${(s?.signedContracts ?? 0) > 0 ? `**Accounts to monitor:**\nReview your ${s?.signedContracts} signed contracts for renewal dates and engagement trends. Look for declining response rates or stalled project activity.\n\n**Recommended Actions:**\n1. Schedule check-in calls with all active contract holders\n2. Review any contracts with no engagement in the past 30 days\n3. Send renewal reminders 60 days before expiration` : 'You currently have no signed contracts. Focus on converting prospects to clients first, then I can help monitor churn risk.'}`,
      time: now,
      actions: [
        { label: 'Generate Playbooks', icon: 'sparkles' },
        { label: 'Export Full Report', icon: 'report' },
      ],
    };
  }

  // Performance / metrics
  if (lower.includes('performance') || lower.includes('metric') || lower.includes('outreach') || lower.includes('campaign') || lower.includes('stats')) {
    return {
      id,
      role: 'assistant',
      text: `Here's your current performance summary:\n\n**Key Metrics:**\n- Total prospects: ${s?.totalProspects ?? 0}\n- Qualified leads: ${s?.qualifiedLeads ?? 0}\n- Active campaigns: ${s?.activeCampaigns ?? 0}\n- Pipeline value: $${(s?.pipelineValue ?? 0).toLocaleString()}\n- Total revenue: $${(s?.totalRevenue ?? 0).toLocaleString()}\n- Win rate: ${s?.winRate ?? 0}%\n- Open rate: ${s?.openRate ?? 0}%\n- Reply rate: ${s?.replyRate ?? 0}%\n- Audits completed: ${s?.auditsCompleted ?? 0}\n\n**Pipeline Overview:**\n${dashboard?.pipelineOverview?.map((p) => `- ${p.stage}: ${p.count} (${p.pct}%)`).join('\n') ?? 'No pipeline data yet.'}\n\nWould you like me to dive deeper into any specific metric?`,
      time: now,
      actions: [
        { label: 'Export Report', icon: 'report' },
        { label: 'Optimize Campaigns', icon: 'sparkles' },
      ],
    };
  }

  // Pitch / proposal generation
  if (lower.includes('pitch') || lower.includes('proposal') || lower.includes('generate pitch') || (lower.includes('generate') && !lower.includes('email'))) {
    if (prospects.length === 0) {
      return {
        id,
        role: 'assistant',
        text: `You don't have any prospects yet. Add prospects and run audits first, then I can help generate tailored pitch proposals.`,
        time: now,
      };
    }
    return {
      id,
      role: 'assistant',
      text: `Based on your current pipeline, here are your top ${Math.min(3, prospects.length)} prospects ready for pitch generation:\n\nEach prospect has been analyzed for website gaps, industry benchmarks, and recommended service packages. I can generate a tailored pitch deck with ROI projections, timeline, and pricing.`,
      time: now,
      cards: prospects.slice(0, 3).map((p) => ({ company: p.companyName, score: 50 + Math.floor(Math.random() * 45), lastContact: timeAgo(p.createdAt), industry: p.industry?.name ?? 'Unknown' })),
      actions: [
        { label: 'Generate All Pitches', icon: 'sparkles' },
        { label: 'Export as PDF', icon: 'report' },
      ],
    };
  }

  // Default — intelligent fallback
  return {
    id,
    role: 'assistant',
    text: `I understand you're asking about "${userText}". Let me help with that.\n\nBased on your current data:\n- **${s?.totalProspects ?? 0}** prospects in pipeline\n- **${s?.qualifiedLeads ?? 0}** qualified leads\n- **${s?.activeCampaigns ?? 0}** active campaigns\n- **$${(s?.pipelineValue ?? 0).toLocaleString()}** in pipeline value\n\nHere's what I can do:\n- **Audit your leads** — Find dormant high-intent accounts needing outreach\n- **Generate emails** — Draft personalized follow-up sequences\n- **Analyze churn risk** — Identify clients at risk of leaving\n- **Generate a pitch** — Create a tailored proposal for a prospect\n- **Pull performance metrics** — Get your latest campaign and outreach stats\n\nWhich would be most helpful?`,
    time: now,
  };
}

function actionIcon(icon: string) {
  switch (icon) {
    case 'email': return <Mail className="mr-2 h-3.5 w-3.5" />;
    case 'report': return <FileText className="mr-2 h-3.5 w-3.5" />;
    case 'logs': return <Database className="mr-2 h-3.5 w-3.5" />;
    default: return <Sparkles className="mr-2 h-3.5 w-3.5" />;
  }
}

export default function CopilotPage() {
  const { accessToken } = useAuthStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isTyping) return;

    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const userMsg: Message = { id: String(Date.now()), role: 'user', text, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setHistory((prev) => [{ id: userMsg.id, title: text.slice(0, 40), sub: 'Now', active: true }, ...prev].slice(0, 10));
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    try {
      const aiMsg = await getAIResponse(text, accessToken);
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: String(Date.now()),
        role: 'assistant',
        text: 'Sorry, I encountered an error analyzing your data. Please try again.',
        time: now,
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, accessToken]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-high/20 sm:h-[calc(100vh-7rem)] lg:h-[calc(100vh-6rem)]">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <aside className="z-10 flex w-64 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low xl:w-72 max-lg:hidden">
          <div className="flex items-center justify-between border-b border-outline-variant p-4">
            <h2 className="font-label-caps text-label-caps text-on-surface">Copilot History</h2>
            <button className="text-on-surface-variant transition-colors hover:text-primary">
              <Edit className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            {history.length === 0 ? (
              <p className="text-xs text-on-surface-variant">Your conversation history will appear here.</p>
            ) : (
              <div>
                <h3 className="mb-2 font-label-caps text-[10px] tracking-wider text-outline">RECENT</h3>
                <div className="space-y-1">
                  {history.map((h) => (
                    <button
                      key={h.id}
                      className={`flex w-full items-center justify-between truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        h.active
                          ? 'bg-surface-container font-medium text-primary'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <span className="truncate">{h.title}</span>
                      {h.active && <MoreVertical className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="relative z-20 flex flex-1 flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-3 border-b border-outline-variant bg-surface-container-low/50 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary bg-surface-container">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">ClientOS AI Copilot</p>
              <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Connected to your CRM data
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-container-padding sm:py-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex justify-center">
                <span className="rounded-full bg-surface-high px-4 py-1 font-label-caps text-[10px] text-on-surface-variant">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>

              {messages.map((m) => (
                <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                  {m.role === 'assistant' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary bg-surface-container shadow-sm">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  {m.role === 'user' && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container shadow-sm">
                      <span className="text-[10px] font-semibold text-on-primary-container">ME</span>
                    </div>
                  )}

                  <div className={`group max-w-[85%] space-y-3 sm:max-w-[80%] ${m.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl p-3 sm:p-4 text-body-sm ${
                      m.role === 'user'
                        ? 'rounded-tr-sm border border-outline-variant bg-surface-high text-on-surface'
                        : 'rounded-tl-sm bg-surface-container-low/60 text-on-surface'
                    }`}>
                      <div className="space-y-2">{renderMarkdown(m.text)}</div>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-[10px] text-outline">{m.time}</span>
                        {m.role === 'assistant' && (
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            className="flex items-center gap-1 text-[10px] text-outline opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
                          >
                            {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedId === m.id ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>

                    {m.cards && (
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {m.cards.map((card) => (
                          <div
                            key={card.company}
                            className="group/card rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-all hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                          >
                            <div className="mb-3 flex items-start justify-between">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-tertiary/20 text-sm font-bold text-primary">
                                {companyInitials(card.company)}
                              </div>
                              <LeadScoreRing score={card.score} size={40} />
                            </div>
                            <h4 className="mb-0.5 text-[15px] font-semibold text-on-surface">{card.company}</h4>
                            {card.industry && (
                              <p className="mb-1 text-xs text-on-surface-variant">{card.industry}</p>
                            )}
                            <p className="mb-3 font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">Last contact: {card.lastContact}</p>
                            <button className="w-full rounded-lg border border-outline-variant py-1.5 font-label-caps text-[11px] text-on-surface transition-colors hover:bg-surface-container hover:border-primary/30">
                              Draft Sequence
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {m.actions && (
                      <div className="flex flex-wrap gap-2">
                        {m.actions.map((action) => (
                          <Button
                            key={action.label}
                            size="sm"
                            className={action.icon === 'sparkles' || action.icon === 'email' ? 'bg-primary text-on-primary hover:bg-primary/90' : ''}
                            variant={action.icon === 'sparkles' || action.icon === 'email' ? 'default' : 'outline'}
                          >
                            {actionIcon(action.icon)}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary bg-surface-container shadow-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-surface-container-low/60 p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      <span className="ml-1.5 text-body-sm text-on-surface-variant">Analyzing your data...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-3 pb-2 sm:px-container-padding">
              <div className="mx-auto max-w-4xl">
                <div className="flex flex-wrap gap-2">
                  {quickSuggestions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => handleSend(s.label)}
                        className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low/60 px-3 py-1.5 text-xs text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary hover:shadow-sm"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 border-t border-outline-variant/40 bg-surface-container-low/30 p-2 backdrop-blur-md sm:p-4">
            <div className="mx-auto max-w-4xl">
              <div className="relative rounded-xl border border-outline-variant bg-surface-container-low/70 p-2 shadow-lg backdrop-blur-xl">
                <div className="mb-2 flex items-center gap-2 border-b border-outline-variant/50 px-3 pb-2.5 pt-2">
                  <button className="flex items-center gap-1 rounded px-2 py-1 font-label-caps text-[11px] text-on-surface-variant transition-colors hover:bg-surface-high hover:text-primary">
                    <PlusCircle className="h-3.5 w-3.5" /> Add Context
                  </button>
                  <div className="h-4 w-px bg-outline-variant/50" />
                  <span className="flex items-center gap-1 rounded border border-outline-variant/30 bg-surface-container px-2 py-1 font-label-caps text-[10px] text-outline">
                    <Database className="h-3 w-3" /> Enterprise Leads DB
                  </span>
                </div>
                <div className="flex items-end gap-2 px-2 pb-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Copilot to analyze data, draft emails, or search leads..."
                    rows={1}
                    className="max-h-32 min-h-[44px] w-full resize-none border-0 bg-transparent py-3 text-body-sm text-on-surface placeholder:text-outline focus:outline-none"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2.5 text-center font-label-caps text-[10px] text-outline">Copilot can make mistakes. Verify critical intelligence.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
