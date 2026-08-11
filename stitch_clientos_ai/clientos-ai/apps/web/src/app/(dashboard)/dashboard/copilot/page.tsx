'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, LeadScoreRing } from '@clientos/ui';
import { Send, Edit, PlusCircle, Database, Sparkles, Bookmark, MoreVertical, Loader2, FileText, Mail } from 'lucide-react';

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
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  cards?: LeadCard[];
  actions?: { label: string; icon: 'sparkles' | 'logs' | 'email' | 'report' }[];
}

const history: HistoryItem[] = [
  { id: '1', title: 'Q3 Outreach Performance', sub: 'Today' },
  { id: '2', title: 'Enterprise Lead Audit', sub: 'Today', active: true },
  { id: '3', title: 'Generate follow-up sequence', sub: 'Today' },
  { id: '4', title: 'Weekly Churn Risk Report', sub: 'Saved Workflow' },
  { id: '5', title: 'Competitor Analysis Gen', sub: 'Saved Workflow' },
];

const initialLeadCards: LeadCard[] = [
  { company: 'Stark Industries', score: 92, lastContact: '8 days ago' },
  { company: 'Wayne Enterprises', score: 88, lastContact: '12 days ago' },
  { company: 'Cyberdyne Sys', score: 86, lastContact: '9 days ago' },
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
  const lower = userText.toLowerCase();

  if (lower.includes('email') || lower.includes('follow-up') || lower.includes('follow up') || lower.includes('sequence')) {
    return {
      id,
      role: 'assistant',
      text: `I'll draft a personalized follow-up email sequence based on each account's recent activity and industry context. Here's what I recommend:\n\n1. **Stark Industries** — Reference their recent product launch and offer a security audit.\n2. **Wayne Enterprises** — Mention their Q3 expansion plans and propose a growth strategy call.\n3. **Cyberdyne Sys** — Highlight AI automation opportunities in their current workflow.\n\nShall I generate the full email drafts with subject lines and send schedules?`,
      time: now,
      actions: [
        { label: 'Generate Full Drafts', icon: 'email' },
        { label: 'Schedule Sends', icon: 'sparkles' },
      ],
    };
  }

  if (lower.includes('churn') || lower.includes('risk') || lower.includes('report')) {
    return {
      id,
      role: 'assistant',
      text: `Here's your weekly churn risk analysis:\n\n**High Risk (3 accounts):**\n- Acme Corp — No engagement in 21 days, last touch was a cold proposal\n- Globex Inc — Contact opted out of email sequence\n- Initech — Project stalled in negotiation phase for 14 days\n\n**Medium Risk (5 accounts):**\n- Several accounts showing declining open rates on outreach\n\nWould you like me to generate retention playbooks for the high-risk accounts?`,
      time: now,
      actions: [
        { label: 'Generate Playbooks', icon: 'sparkles' },
        { label: 'Export Report', icon: 'report' },
      ],
    };
  }

  if (lower.includes('competitor') || lower.includes('analysis')) {
    return {
      id,
      role: 'assistant',
      text: `I've pulled together a competitor analysis for your top 3 rivals in the agency growth space:\n\n1. **WebFlow Agency** — Strong in healthcare, weak in legal. Average deal size $12k.\n2. **DigitalCraft** — Dominating hospitality sector. Recently lost 2 key team members.\n3. **NextGen Solutions** — Aggressive pricing model, but poor client retention (62%).\n\nI recommend targeting their hospitality and legal clients with a migration offer. Want me to build a targeted campaign?`,
      time: now,
      actions: [
        { label: 'Build Campaign', icon: 'sparkles' },
        { label: 'Detailed Breakdown', icon: 'report' },
      ],
    };
  }

  if (lower.includes('pitch') || lower.includes('proposal') || lower.includes('generate')) {
    return {
      id,
      role: 'assistant',
      text: `I can generate a tailored pitch for any of your prospects. Based on your pipeline, here are the top candidates for outreach today:\n\n- **Tema Industrial Supplies** (Score: 86) — No website, strong candidate for full build\n- **Accra Dental Care** (Score: 86) — Maintenance + Growth opportunity\n- **Kumasi Auto Parts** (Score: 84) — Full Build + Menu recommended\n\nWhich prospect would you like me to generate a pitch for?`,
      time: now,
      cards: [
        { company: 'Tema Industrial Supplies', score: 86, lastContact: '2 days ago' },
        { company: 'Accra Dental Care', score: 86, lastContact: '5 days ago' },
        { company: 'Kumasi Auto Parts', score: 84, lastContact: '1 day ago' },
      ],
    };
  }

  if (lower.includes('audit') || lower.includes('lead') || lower.includes('scan')) {
    return {
      id,
      role: 'assistant',
      text: `Running a fresh audit on your enterprise leads...\n\nI found 3 additional high-intent accounts that haven't been contacted recently:`,
      time: now,
      cards: [
        { company: 'Stark Industries', score: 92, lastContact: '8 days ago' },
        { company: 'Wayne Enterprises', score: 88, lastContact: '12 days ago' },
        { company: 'Cyberdyne Sys', score: 86, lastContact: '9 days ago' },
      ],
      actions: [
        { label: 'Generate Emails', icon: 'sparkles' },
        { label: 'Show Activity Logs', icon: 'logs' },
      ],
    };
  }

  return {
    id,
    role: 'assistant',
    text: `I can help you with:\n\n- **Audit leads** — Find high-intent accounts that need attention\n- **Generate emails** — Draft personalized follow-up sequences\n- **Churn risk analysis** — Identify accounts at risk of churning\n- **Competitor analysis** — Compare your positioning against rivals\n- **Generate pitches** — Create tailored proposals for prospects\n\nWhat would you like me to do?`,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(() => {
    const text = input.trim();
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
    }, 1200 + Math.random() * 800);
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

  return (
    <div className="relative flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-high/20">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[400px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />

      {/* History Sidebar */}
      <aside className="z-10 flex w-72 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low max-lg:hidden">
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
                  className={`flex w-full items-center justify-between truncate rounded px-3 py-2 text-left text-sm transition-colors ${
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
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
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
      <main className="relative z-20 flex flex-1 flex-col">
        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-container-padding">
          <div className="mx-auto max-w-4xl space-y-8 pb-32">
            <div className="flex justify-center">
              <span className="rounded-full bg-surface-container-high px-4 py-1 font-label-caps text-[10px] text-on-surface-variant">Today at 9:41 AM</span>
            </div>

            {messages.map((m) => (
              <div key={m.id} className={`flex items-start gap-4 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary bg-surface-container">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                {m.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container">
                    <span className="text-[10px] font-semibold text-on-primary-container">ME</span>
                  </div>
                )}

                <div className={`max-w-[85%] space-y-4 ${m.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl p-4 text-body-sm ${
                    m.role === 'user'
                      ? 'rounded-tr-sm border border-outline-variant bg-surface-container-high text-on-surface'
                      : 'text-on-surface'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  </div>

                  {m.cards && (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                      {m.cards.map((card) => (
                        <div
                          key={card.company}
                          className="group rounded-lg border border-outline-variant bg-surface-container-lowest p-4 transition-all hover:shadow-lg"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-surface-container">
                              <div className="h-6 w-6 rounded bg-primary/20" />
                            </div>
                            <LeadScoreRing score={card.score} size={40} />
                          </div>
                          <h4 className="mb-1 text-[16px] font-semibold text-on-surface">{card.company}</h4>
                          <p className="mb-4 font-label-caps text-[10px] uppercase tracking-wider text-on-surface-variant">Last contact: {card.lastContact}</p>
                          <button className="w-full rounded border border-outline-variant py-1.5 font-label-caps text-[11px] text-on-surface transition-colors hover:bg-surface-container">
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
                          className={action.icon === 'sparkles' || action.icon === 'email' ? 'bg-primary text-on-primary' : ''}
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
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary bg-surface-container">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-surface-container-low p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-body-sm text-on-surface-variant">Copilot is analyzing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background to-transparent p-4 pt-12 sm:p-container-padding">
          <div className="mx-auto max-w-4xl">
            <div className="relative rounded-xl border border-outline-variant bg-surface-container-low/70 p-2 shadow-lg backdrop-blur-xl">
              <div className="mb-2 flex items-center gap-2 border-b border-outline-variant/50 px-3 pb-3 pt-2">
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
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary text-on-primary transition-colors hover:bg-primary-fixed disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-3 text-center font-label-caps text-[10px] text-outline">Copilot can make mistakes. Verify critical intelligence.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
