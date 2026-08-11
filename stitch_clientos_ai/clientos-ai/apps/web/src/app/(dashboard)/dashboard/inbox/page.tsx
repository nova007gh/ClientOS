'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Badge, LeadScoreRing } from '@clientos/ui';
import { Mail, Phone, MoreVertical, Filter, Sparkles, Send, Bold, Link2, Paperclip, Smile, ArrowLeft } from 'lucide-react';

interface Conversation {
  id: string;
  company: string;
  contact: string;
  title: string;
  time: string;
  tags: string[];
  messages: { id: string; sender: string; body: string; time: string; isMe: boolean }[];
  score: number;
  intent: string;
  friction: string[];
  pitch: string;
}

const conversations: Conversation[] = [
  {
    id: '1',
    company: 'Acme Corp',
    contact: 'Sarah Jenkins',
    title: 'Re: Enterprise Scale Proposal',
    time: '10m ago',
    tags: ['Meeting Request', 'High Intent'],
    messages: [
      { id: '1', sender: 'You', body: "Hi Sarah,\n\nFollowing up on our brief chat. I've put together a proposal showing how ClientOS can streamline Acme Corp's data pipelines, specifically addressing the bottleneck you mentioned in Q3.\n\nWould you be open to a 15-min walk-through this Thursday?", time: 'Yesterday, 10:24 AM', isMe: true },
      { id: '2', sender: 'Sarah Jenkins', body: "Hi,\n\nThanks for sending this over. The proposed architecture looks interesting, but I have concerns about integration with our legacy CRM systems.\n\nI'd like to discuss this further. Are you available for a call tomorrow afternoon?\n\n- Sarah", time: 'Today, 9:15 AM', isMe: false },
    ],
    score: 85,
    intent: 'High Intent',
    friction: ['Legacy CRM integration concerns (Salesforce Classic)', 'Q3 data pipeline bottlenecks'],
    pitch: 'Focus on our API-first approach that requires zero downtime to bridge their old CRM to our modern infrastructure.',
  },
  {
    id: '2',
    company: 'TechFlow Inc',
    contact: 'Tom Allen',
    title: 'Following up on the demo',
    time: '2h ago',
    tags: ['Interested'],
    messages: [
      { id: '1', sender: 'You', body: 'Thanks for attending the demo. Let me know if you have any questions.', time: '2h ago', isMe: true },
    ],
    score: 64,
    intent: 'Interested',
    friction: ['Pricing clarity'],
    pitch: 'Show ROI calculator and similar SaaS case study.',
  },
  {
    id: '3',
    company: 'Global Logistics',
    contact: 'Rachel Kim',
    title: 'Not at this time',
    time: 'Yesterday',
    tags: ['Objection'],
    messages: [
      { id: '1', sender: 'Rachel Kim', body: 'This is not a priority for us right now.', time: 'Yesterday', isMe: false },
    ],
    score: 32,
    intent: 'Low',
    friction: ['Timing'],
    pitch: 'Nurture with quarterly value content.',
  },
];

export default function InboxPage() {
  const [selected, setSelected] = useState<Conversation>(conversations[0]);
  const [reply, setReply] = useState('Reply to Sarah... (or use AI suggestions above)');

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-headline-lg text-headline-lg font-semibold">Inbox</h1>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-4 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-high/20 lg:h-[calc(100vh-12rem)] lg:grid-cols-12">
        {/* Conversation list */}
        <div className={`col-span-1 overflow-y-auto border-r border-outline-variant p-3 lg:col-span-3 ${selected ? 'hidden lg:block' : 'block'}`}>
          <div className="space-y-2">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  selected.id === c.id ? 'bg-surface-high/50' : 'hover:bg-surface-high/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-on-surface">{c.company}</span>
                  <span className="text-xs text-on-surface-variant">{c.time}</span>
                </div>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">{c.contact}</p>
                <p className="mt-1 text-xs text-on-surface">{c.title}</p>
                <div className="mt-2 flex gap-1">
                  {c.tags.map((tag) => (
                    <Badge key={tag} className={`text-xs ${
                      tag === 'High Intent' ? 'bg-secondary/10 text-secondary' :
                      tag === 'Meeting Request' ? 'bg-primary/10 text-primary' :
                      tag === 'Interested' ? 'bg-tertiary/10 text-tertiary' :
                      'bg-surface-highest text-on-surface-variant'
                    }`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className={`col-span-1 flex flex-col border-r border-outline-variant lg:col-span-6 ${selected ? 'flex' : 'hidden lg:flex'}`}>
          <div className="border-b border-outline-variant p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button className="lg:hidden rounded-lg p-1 text-on-surface-variant hover:bg-surface-high" onClick={() => setSelected(null as any)}>
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h2 className="font-headline-md text-headline-md font-semibold truncate">{selected.title}</h2>
                  <p className="text-body-sm text-on-surface-variant truncate">{selected.contact} <span className="text-on-surface-variant/50">•</span> {selected.company}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="ghost" className="p-2"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
            {selected.messages.map((m) => (
              <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 sm:p-4 text-body-sm ${
                  m.isMe ? 'rounded-tr-none bg-primary/10 text-on-surface' : 'rounded-tl-none bg-surface-highest text-on-surface'
                }`}>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-2 text-xs ${m.isMe ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {m.isMe ? 'You' : m.sender} • {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant p-3 sm:p-4 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <Button size="sm" variant="outline" className="shrink-0 bg-surface-highest text-on-surface">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Accept meeting & address CRM
              </Button>
              <Button size="sm" variant="outline" className="shrink-0 bg-surface-highest text-on-surface">
                Request call
              </Button>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface p-3">
              <textarea
                className="w-full resize-none border-0 bg-transparent p-0 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-2 text-on-surface-variant">
                  <Bold className="h-4 w-4" />
                  <Link2 className="h-4 w-4" />
                  <Paperclip className="h-4 w-4" />
                  <Smile className="h-4 w-4" />
                </div>
                <Button size="sm" className="bg-primary text-on-primary">
                  Send <Send className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Prospect Intelligence */}
        <div className="col-span-1 overflow-y-auto p-4 lg:col-span-3 hidden lg:block">
          <div className="mb-4 flex items-center gap-2 text-body-sm font-semibold text-on-surface">
            <Sparkles className="h-4 w-4 text-primary" /> Prospect Intelligence
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-surface-highest" />
            <div>
              <p className="font-semibold text-on-surface">{selected.contact}</p>
              <p className="text-body-sm text-on-surface-variant">VP Engineering, {selected.company}</p>
            </div>
          </div>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-on-surface-variant">Lead Score</span>
                <Badge className="bg-secondary/10 text-secondary">{selected.intent}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <LeadScoreRing score={selected.score} />
                <div className="text-body-sm text-on-surface-variant">
                  <p>Engaged with pricing page 3x this week.</p>
                  <p>Recent expansion funding announced.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">Identified Friction Points</p>
            {selected.friction.map((f) => (
              <div key={f} className="flex items-start gap-2 rounded-lg bg-surface-high/30 p-3">
                <AlertTriangleIcon className="mt-0.5 h-4 w-4 text-tertiary" />
                <p className="text-body-sm text-on-surface">{f}</p>
              </div>
            ))}
          </div>

          <Card className="mt-4 border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">Recommended Pitch Angle</p>
              <p className="text-body-sm text-on-surface italic">&quot;{selected.pitch}&quot;</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Integration Case Study</Button>
                <Button size="sm" variant="outline">API Docs</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AlertTriangleIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
