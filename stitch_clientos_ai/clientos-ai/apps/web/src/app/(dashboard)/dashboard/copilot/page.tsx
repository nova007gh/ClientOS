'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, LeadScoreRing } from '@clientos/ui';
import { Send, Edit, PlusCircle, Database, Sparkles, Bookmark, MoreVertical, FileText, Mail, Copy, Check, TrendingUp, AlertTriangle, Target } from 'lucide-react';

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
    const ulMatch = line.match(/^[-]\s+(.+)/);

    if (olMatch) {
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
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const history: HistoryItem[] = [
  { id: '1', title: 'Q3 Outreach Performance', sub: 'Today' },
  { id: '2', title: 'Enterprise Lead Audit', sub: 'Today', active: true },
  { id: '3', title: 'Generate follow-up sequence', sub: 'Today' },
  { id: '4', title: 'Weekly Churn Risk Report', sub: 'Saved Workflow' },
  { id: '5', title: 'Competitor Analysis Gen', sub: 'Saved Workflow' },
];

const initialLeadCards: LeadCard[] = [
  { company: 'Stark Industries', score: 92, lastContact: '8 days ago', industry: 'Defense Tech' },
  { company: 'Wayne Enterprises', score: 88, lastContact: '12 days ago', industry: 'Conglomerate' },
  { company: 'Cyberdyne Sys', score: 86, lastContact: '9 days ago', industry: 'AI / Robotics' },
];

const quickSuggestions = [
  { label: 'Audit enterprise leads', icon: Target },
  { label: 'Generate follow-up emails', icon: Mail },
  { label: 'Churn risk analysis', icon: AlertTriangle },
  { label: 'Competitor analysis', icon: TrendingUp },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'user',
    text: 'Can you run an audit on our current enterprise leads and identify any high-intent accounts that haven\'t been contacted in the last 7 days?',
    time: 'Today at 9:41 AM',
  },
  {
    id: '2',
    role: 'assistant',
    text: 'I\'ve analyzed your current enterprise pipeline. I found 3 high-intent accounts (Score > 85) that have been dormant for over a week. Here is the breakdown:',
    time: 'Today at 9:41 AM',
    cards: initialLeadCards,
  },
  {
    id: '3',
    role: 'assistant',
    text: 'Would you like me to automatically generate highly-personalized follow-up emails for these three accounts based on their recent activity logs?',
    time: 'Today at 9:41 AM',
    actions: [
      { label: 'Generate Emails', icon: 'sparkles' },
      { label: 'Show Activity Logs', icon: 'logs' },
    ],
  },
];

function getAIResponse(userText: string): Message {
  const id = String(Date.now());
  const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const lower = userText.toLowerCase().trim();

  // Email / follow-up / sequence generation
  if (lower.includes('email') || lower.includes('follow-up') || lower.includes('follow up') || lower.includes('sequence') || lower.includes('draft')) {
    return {
      id,
      role: 'assistant',
      text: `I've drafted personalized follow-up email sequences for each dormant high-intent account. Here's my strategy:\n\n1. **Stark Industries** (Defense Tech, Score 92)\n   - Subject: \"Enhancing Stark's Security Infrastructure for 2026\"\n   - Hook: Reference their recent Arc Reactor patent filing and upcoming DOD contract bid\n   - CTA: Offer a complimentary security audit + 30-min strategy call\n   - Send: Tuesday 10:00 AM EST (optimal open rate window)\n\n2. **Wayne Enterprises** (Conglomerate, Score 88)\n   - Subject: \"Scaling Wayne's Digital Operations Across Divisions\"\n   - Hook: Mention their Q3 Gotham expansion and recent acquisition of LexCorp assets\n   - CTA: Propose a cross-division digital growth roadmap workshop\n   - Send: Wednesday 2:00 PM EST\n\n3. **Cyberdyne Systems** (AI/Robotics, Score 86)\n   - Subject: \"AI-Driven Automation for Cyberdyne's Manufacturing Pipeline\"\n   - Hook: Highlight their recent Series C and factory automation gaps\n   - CTA: Demo our AI workflow automation platform with case studies\n   - Send: Thursday 11:00 AM EST\n\nEach email is personalized with firmographic data, recent company events, and industry-specific pain points. Shall I generate the full email drafts or schedule them for sending?`,
      time: now,
      cards: [
        { company: 'Stark Industries', score: 92, lastContact: '8 days ago', industry: 'Defense Tech' },
        { company: 'Wayne Enterprises', score: 88, lastContact: '12 days ago', industry: 'Conglomerate' },
        { company: 'Cyberdyne Sys', score: 86, lastContact: '9 days ago', industry: 'AI / Robotics' },
      ],
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
      text: `I've completed a churn risk analysis across your active client base. Here are the findings:\n\n**Critical Risk (3 accounts — immediate action needed):**\n- **Acme Corp** — No engagement in 21 days. Last touch was a cold proposal sent 3 weeks ago. Their champion (Sarah K.) left the company. Risk score: 89/100.\n- **Globex Inc** — Primary contact opted out of email sequence. Support ticket volume dropped to zero (previously 4-6/month). Risk score: 84/100.\n- **Initech** — Project stalled in negotiation phase for 14 days. Budget freeze rumored for Q4. Risk score: 78/100.\n\n**Elevated Risk (5 accounts — monitor closely):**\n- **Umbrella Corp** — Open rates down 40% over 4 weeks. Still engaging but frequency declining.\n- **Soylent Corp** — 2 support tickets escalated in the past week. Sentiment negative.\n- **Tyrell Corp** — Contract renewal in 45 days, no engagement on renewal materials.\n- **Weyland-Yutani** — Project deliverable feedback cycle slowing down.\n- **Massive Dynamic** — NPS dropped from 8 to 5 in latest survey.\n\n**Recommended Actions:**\n1. Schedule executive check-in calls with all 3 critical risk accounts this week\n2. Re-engage Globex through a different channel (LinkedIn or direct call)\n3. Send Initech a revised proposal with flexible payment terms\n\nWould you like me to generate detailed retention playbooks for the critical risk accounts?`,
      time: now,
      actions: [
        { label: 'Generate Playbooks', icon: 'sparkles' },
        { label: 'Export Full Report', icon: 'report' },
      ],
    };
  }

  // Competitor analysis
  if (lower.includes('competitor') || lower.includes('competition') || lower.includes('rival') || lower.includes('market analysis')) {
    return {
      id,
      role: 'assistant',
      text: `I've compiled a competitive intelligence report on your top 3 rivals in the agency growth space:\n\n**1. WebFlow Agency** (Market share: ~18%)\n- Strengths: Dominating healthcare sector with HIPAA-compliant templates. Strong portfolio of 40+ medical clients.\n- Weaknesses: No legal sector presence. Average deal size only $12k (yours: $18k). Slow onboarding (avg 21 days vs your 12).\n- Recent activity: Hired 3 new developers. Launched a healthcare-specific CMS.\n- Opportunity: Target their underserved legal clients with a compliance-first pitch.\n\n**2. DigitalCraft** (Market share: ~15%)\n- Strengths: Best-in-class hospitality portfolio. Premium branding. Strong referral network.\n- Weaknesses: Recently lost 2 key senior team members (CTO + Lead Designer). Client retention at 71% (yours: 89%).\n- Recent activity: Downsizing office space. Paused new client onboarding for 2 weeks.\n- Opportunity: Poach their hospitality clients during transition period. Offer migration discount.\n\n**3. NextGen Solutions** (Market share: ~12%)\n- Strengths: Aggressive pricing (30% below market average). Fast delivery promises.\n- Weaknesses: Poor client retention (62%). No portfolio or case studies. Single founder dependency.\n- Recent activity: Running heavy Google Ads. Negative reviews citing quality issues.\n- Opportunity: Position as the premium, reliable alternative. Highlight your 89% retention rate and verified portfolio.\n\n**Strategic Recommendation:**\nLaunch a targeted \"Switch & Save\" campaign aimed at DigitalCraft's hospitality clients and WebFlow's legal gap. I can build this campaign with personalized outreach for each segment.\n\nWant me to build the targeted campaign or dive deeper into any competitor?`,
      time: now,
      actions: [
        { label: 'Build Campaign', icon: 'sparkles' },
        { label: 'Detailed Breakdown', icon: 'report' },
      ],
    };
  }

  // Pitch / proposal generation
  if (lower.includes('pitch') || lower.includes('proposal') || lower.includes('generate pitch') || (lower.includes('generate') && !lower.includes('email'))) {
    return {
      id,
      role: 'assistant',
      text: `Based on your current pipeline scoring and recent audit data, here are the top 3 prospects ready for pitch generation:\n\nEach prospect has been analyzed for website gaps, industry benchmarks, and recommended service packages. I can generate a tailored pitch deck with ROI projections, timeline, and pricing for any of these leads.`,
      time: now,
      cards: [
        { company: 'Tema Industrial Supplies', score: 86, lastContact: '2 days ago', industry: 'Industrial' },
        { company: 'Accra Dental Care', score: 86, lastContact: '5 days ago', industry: 'Healthcare' },
        { company: 'Kumasi Auto Parts', score: 84, lastContact: '1 day ago', industry: 'Retail' },
      ],
      actions: [
        { label: 'Generate All Pitches', icon: 'sparkles' },
        { label: 'Export as PDF', icon: 'report' },
      ],
    };
  }

  // Audit / lead scanning
  if (lower.includes('audit') || lower.includes('lead') || lower.includes('scan') || lower.includes('dormant') || lower.includes('contacted') || lower.includes('high-intent') || lower.includes('pipeline')) {
    return {
      id,
      role: 'assistant',
      text: `Running a comprehensive audit on your enterprise pipeline...\n\n**Analysis complete.** I cross-referenced your CRM activity logs, lead scores, and contact history. Here are the key findings:\n\n- **3 high-intent accounts** (Score > 85) have been dormant for 7+ days\n- **2 accounts** show declining engagement trends over the past 2 weeks\n- **1 account** (Cyberdyne) has a champion change — new VP of Engineering started 3 days ago\n\nThe following accounts need immediate outreach:`,
      time: now,
      cards: [
        { company: 'Stark Industries', score: 92, lastContact: '8 days ago', industry: 'Defense Tech' },
        { company: 'Wayne Enterprises', score: 88, lastContact: '12 days ago', industry: 'Conglomerate' },
        { company: 'Cyberdyne Sys', score: 86, lastContact: '9 days ago', industry: 'AI / Robotics' },
      ],
      actions: [
        { label: 'Generate Emails', icon: 'sparkles' },
        { label: 'Show Activity Logs', icon: 'logs' },
      ],
    };
  }

  // Performance / metrics
  if (lower.includes('performance') || lower.includes('metric') || lower.includes('q3') || lower.includes('outreach') || lower.includes('campaign') || lower.includes('stats')) {
    return {
      id,
      role: 'assistant',
      text: `Here's your Q3 outreach performance summary:\n\n**Key Metrics:**\n- Total outreach sent: 1,247 emails across 8 campaigns\n- Open rate: 42.3% (industry avg: 31%)\n- Reply rate: 8.7% (industry avg: 5.2%)\n- Meetings booked: 34 (+18% vs Q2)\n- Pipeline generated: $284K (+32% vs Q2)\n\n**Top Performing Campaigns:**\n1. **Healthcare Digital Transformation** — 51% open rate, 12% reply rate, 8 meetings\n2. **Legal Services Modernization** — 47% open rate, 9% reply rate, 5 meetings\n3. **Hospitality Recovery Outreach** — 39% open rate, 7% reply rate, 7 meetings\n\n**Underperforming:**\n- **Real Estate Cold Outreach** — 22% open rate, 2% reply rate. Recommend pausing and revising subject lines.\n\n**AI Recommendation:** Reallocate budget from Real Estate to Healthcare (3.2x ROI difference). Want me to draft the revised campaign plan?`,
      time: now,
      actions: [
        { label: 'Draft Campaign Plan', icon: 'sparkles' },
        { label: 'Export Report', icon: 'report' },
      ],
    };
  }

  // Greeting / help
  if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'help' || lower === 'what can you do') {
    return {
      id,
      role: 'assistant',
      text: `Hello! I'm your ClientOS AI Copilot. I have access to your entire CRM, audit data, and outreach history. Here's what I can do:\n\n- **Audit enterprise leads** — Identify high-intent accounts that need immediate outreach\n- **Generate email sequences** — Draft personalized follow-ups with subject lines, hooks, and CTAs\n- **Churn risk analysis** — Spot at-risk clients before they leave, with retention playbooks\n- **Competitor intelligence** — Deep-dive on rivals with actionable attack strategies\n- **Performance reports** — Q3 outreach metrics, campaign ROI, and optimization recommendations\n- **Generate pitch proposals** — Tailored decks with ROI projections for top prospects\n\nWhat would you like me to help you with today?`,
      time: now,
    };
  }

  // Default — intelligent fallback
  return {
    id,
    role: 'assistant',
    text: `I understand you're asking about \"${userText}\". Let me help with that.\n\nBased on your current data, here are the most relevant actions I can take:\n\n- **Audit your leads** — Find dormant high-intent accounts needing outreach\n- **Generate emails** — Draft personalized follow-up sequences\n- **Analyze churn risk** — Identify clients at risk of leaving\n- **Run competitor analysis** — Compare your positioning against rivals\n- **Generate a pitch** — Create a tailored proposal for a prospect\n- **Pull performance metrics** — Get your latest campaign and outreach stats\n\nWhich of these would be most helpful, or would you like me to do something else?`,
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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const handleSend = useCallback((textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isTyping) return;

    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const userMsg: Message = { id: String(Date.now()), role: 'user', text, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg = getAIResponse(text);
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1400 + Math.random() * 600);
  }, [input, isTyping]);

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
    <div className="flex h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-high/20 sm:h-[calc(100vh-7rem)]">
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
            <div>
              <h3 className="mb-2 font-label-caps text-[10px] tracking-wider text-outline">TODAY</h3>
              <div className="space-y-1">
                {history.slice(0, 3).map((h) => (
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
            <div>
              <h3 className="mb-2 font-label-caps text-[10px] tracking-wider text-outline">SAVED WORKFLOWS</h3>
              <div className="space-y-1">
                {history.slice(3).map((h) => (
                  <button
                    key={h.id}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  >
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-secondary" />
                    <span className="truncate">{h.title}</span>
                  </button>
                ))}
              </div>
            </div>
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
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Connected to Enterprise Leads DB
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-container-padding">
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex justify-center">
                <span className="rounded-full bg-surface-container-high px-4 py-1 font-label-caps text-[10px] text-on-surface-variant">Today at 9:41 AM</span>
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

                  <div className={`group max-w-[80%] space-y-3 ${m.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl p-4 text-body-sm ${
                      m.role === 'user'
                        ? 'rounded-tr-sm border border-outline-variant bg-surface-container-high text-on-surface'
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
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
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
            <div className="px-4 pb-2 sm:px-container-padding">
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
          <div className="shrink-0 border-t border-outline-variant/40 bg-surface-container-low/30 p-3 backdrop-blur-md sm:p-4">
            <div className="mx-auto max-w-4xl">
              <div className="relative rounded-xl border border-outline-variant bg-surface-container-low/70 p-2 shadow-lg backdrop-blur-xl">
                <div className="mb-2 flex items-center gap-2 border-b border-outline-variant/50 px-3 pb-2.5 pt-2">
                  <button className="flex items-center gap-1 rounded px-2 py-1 font-label-caps text-[11px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary">
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
