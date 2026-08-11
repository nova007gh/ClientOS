'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { ArrowLeft, Clock, CheckCircle2, FileText, File, Users, MessageSquare, Send, MoreHorizontal, ShieldCheck, Download } from 'lucide-react';

const deliverables = [
  { title: 'UI Wireframes', version: 'v2.1', updated: '2h ago', status: 'Pending' },
  { title: 'Database Schema', version: 'v1.0', updated: '1d ago', status: 'Pending' },
];

const files = [
  { name: 'Acme_MSA_Signed.pdf', size: '2.4 MB' },
  { name: 'API_Keys_Prod.csv', size: '12 KB' },
];

const timeline = [
  { status: 'Completed', date: 'Oct 15', title: 'Requirements Gathering', desc: 'Initial scoping and SRS sign-off.', active: true },
  { status: 'In Progress', date: 'Due Nov 30', title: 'Core Development', desc: 'Building main application modules.', active: false },
  { status: 'Upcoming', date: 'Dec 01 - Dec 15', title: 'QA & Testing', desc: 'UAT and final bug squashing.', active: false },
];

const teamMessages = [
  { sender: 'PM', initials: 'PM', isMe: false, text: 'Hi team, the wireframes are ready for your review. Let me know if you need any walkthrough.', time: '10:42 AM' },
  { sender: 'ME', initials: 'ME', isMe: true, text: "Thanks! I'll take a look this afternoon.", time: '11:05 AM' },
];

export default function ClientPortalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/prospects/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary uppercase tracking-wider">Implementation</Badge>
            <span className="text-body-sm text-on-surface-variant">• Acme Corp</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Client Portal</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <p className="text-xs text-on-surface-variant uppercase tracking-wider">Overall Progress</p>
          <div className="flex h-12 w-12 items-center justify-center">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
              <path className="text-surface-highest" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
              <path className="text-secondary" strokeDasharray="65, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-secondary">65%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md font-semibold">Deliverables for Approval</h2>
                <Badge className="bg-error/10 text-error">2 Pending</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {deliverables.map((d) => (
                  <div key={d.title} className="rounded-lg border border-outline-variant/60 bg-surface p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-on-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-on-surface">{d.title}</h3>
                        <p className="text-xs text-on-surface-variant">{d.version} • Updated {d.updated}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-primary text-on-primary">Approve</Button>
                      <Button size="sm" variant="outline" className="flex-1">Changes</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold">Project Timeline</h2>
              <div className="space-y-6 pl-2">
                {timeline.map((t, i) => (
                  <div key={t.title} className="relative pl-6">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[9px] top-6 h-full w-0.5 bg-outline-variant" />
                    )}
                    <div className={`absolute left-0 top-1 h-5 w-5 rounded-full border-2 ${
                      t.status === 'Completed' ? 'border-secondary bg-secondary' :
                      t.status === 'In Progress' ? 'border-primary bg-surface' : 'border-outline-variant bg-surface'
                    }`}>
                      {t.status === 'Completed' && <CheckCircle2 className="h-3.5 w-3.5 text-surface" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                        <span className={
                          t.status === 'Completed' ? 'text-secondary' :
                          t.status === 'In Progress' ? 'text-primary' : 'text-on-surface-variant'
                        }>{t.status}</span>
                        <span className="text-on-surface-variant">{t.date}</span>
                      </div>
                      <h3 className="mt-1 font-semibold text-on-surface">{t.title}</h3>
                      <p className="text-body-sm text-on-surface-variant">{t.desc}</p>
                      {t.status === 'In Progress' && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-on-surface-variant">Sprint 3 of 5</p>
                          <div className="h-2 overflow-hidden rounded-full bg-surface-highest">
                            <div className="h-full w-[45%] rounded-full bg-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
                  <File className="h-5 w-5 text-on-surface-variant" /> Shared Files
                </h2>
                <Download className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.name} className="flex items-center justify-between rounded-lg bg-surface p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-on-surface-variant" />
                      <div>
                        <p className="text-body-sm font-medium text-on-surface">{f.name}</p>
                        <p className="text-xs text-on-surface-variant">{f.size}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="p-2"><Download className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-on-surface-variant" /> Project Team
                </h2>
                <div className="flex -space-x-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary text-xs font-semibold ring-2 ring-surface">PM</div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-on-primary text-xs font-semibold ring-2 ring-surface">ME</div>
                </div>
              </div>
              <div className="space-y-3">
                {teamMessages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      m.isMe ? 'bg-secondary text-on-primary' : 'bg-primary text-on-primary'
                    }`}>
                      {m.initials}
                    </div>
                    <div className={`rounded-lg p-3 max-w-[80%] ${
                      m.isMe ? 'bg-primary/10 text-on-surface' : 'bg-surface-highest text-on-surface'
                    }`}>
                      <p className="text-body-sm">{m.text}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface p-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full border-0 bg-transparent p-2 text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-center text-xs text-on-surface-variant">© 2024 ClientOS Network. Public Profile</p>
    </div>
  );
}
