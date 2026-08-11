'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Badge, Input } from '@clientos/ui';
import { api, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  Cloud,
  Grid,
  RefreshCw,
  Copy,
  Trash2,
  Check,
  Users,
  Shield,
  Plus,
  Search,
  CreditCard,
  TrendingUp,
  Zap,
  BarChart3,
  Key,
} from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Offline' | 'Invited';
  lastActive: string;
  initials: string;
}

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard';
  last4: string;
  exp: string;
  isDefault: boolean;
}

const tabs = ['General', 'Team', 'Integrations', 'Billing'];

const members: Member[] = [
  { id: '1', name: 'Sarah Jenkins', email: 'sarah@clientos.ai', role: 'Owner', status: 'Active', lastActive: 'Just now', initials: 'SJ' },
  { id: '2', name: 'Marcus Johnson', email: 'marcus@clientos.ai', role: 'Admin', status: 'Active', lastActive: '2 hours ago', initials: 'MJ' },
  { id: '3', name: 'David Chen', email: 'david.c@clientos.ai', role: 'Sales Manager', status: 'Offline', lastActive: 'Yesterday, 4:30 PM', initials: 'DC' },
  { id: '4', name: 'elena.r@clientos.ai', email: 'elena.r@clientos.ai', role: 'Developer', status: 'Invited', lastActive: 'Never', initials: 'ER' },
];

const invoices = [
  { date: 'Sep 15, 2023', amount: 299.0, status: 'Paid' },
  { date: 'Aug 15, 2023', amount: 299.0, status: 'Paid' },
  { date: 'Jul 15, 2023', amount: 349.0, status: 'Paid' },
];

const payments: PaymentMethod[] = [
  { id: '1', type: 'visa', last4: '4242', exp: '12/25', isDefault: true },
  { id: '2', type: 'mastercard', last4: '8899', exp: '08/24', isDefault: false },
];

export default function SettingsPage() {
  const { organization, accessToken, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('General');
  const [orgName, setOrgName] = useState(organization?.name ?? '');
  const [orgCurrency, setOrgCurrency] = useState(organization?.currency ?? 'USD');
  const [orgTimezone, setOrgTimezone] = useState(organization?.timezone ?? 'UTC');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      await api.patch('/organizations/current', {
        name: orgName,
        currency: orgCurrency,
        timezone: orgTimezone,
      }, accessToken);
      setSavedMsg('Organization saved');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function copyApiKey() {
    navigator.clipboard.writeText('sk_live_***************************8f2a');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline-lg text-headline-lg font-semibold">Organization Settings</h1>
        <p className="mt-1 text-body-sm text-on-surface-variant">Manage your team, billing, and connected services.</p>
      </div>

      {error && (
        <div className="rounded border border-error/20 bg-error/10 px-3 py-2 text-body-sm text-error">{error}</div>
      )}
      {savedMsg && (
        <div className="rounded border border-secondary/20 bg-secondary/10 px-3 py-2 text-body-sm text-secondary">{savedMsg}</div>
      )}

      <div className="border-b border-outline-variant">
        <div className="flex gap-4 overflow-x-auto pb-px sm:gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap pb-3 text-body-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'General' && (
        <Card className="border border-outline-variant/60 bg-surface-high/20">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <h2 className="font-headline-md text-headline-md font-semibold">Organization Details</h2>
            <form onSubmit={handleSaveOrg} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-label-caps text-on-surface-variant">Organization name</label>
                <Input className="mt-1" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div>
                <label className="text-label-caps text-on-surface-variant">Currency</label>
                <Input className="mt-1" value={orgCurrency} onChange={(e) => setOrgCurrency(e.target.value)} />
              </div>
              <div>
                <label className="text-label-caps text-on-surface-variant">Timezone</label>
                <Input className="mt-1" value={orgTimezone} onChange={(e) => setOrgTimezone(e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save organization'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'Team' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
            <Card className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Total Members</p>
                <p className="mt-1 text-3xl font-semibold text-on-surface">12</p>
                <p className="mt-1 text-body-sm text-secondary flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> 2</p>
                <p className="text-xs text-on-surface-variant">2 seats remaining on plan</p>
              </CardContent>
            </Card>
            <Card className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Active Roles</p>
                <p className="mt-1 text-3xl font-semibold text-on-surface">4</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Owner', 'Admin', 'Sales'].map((r) => (
                    <Badge key={r} className="bg-surface-highest text-on-surface-variant">{r}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Pending Invites</p>
                <p className="mt-1 text-3xl font-semibold text-on-surface">3</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full w-[75%] rounded-full bg-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <Input className="pl-9" placeholder="Search members..." />
                </div>
                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  <Button variant="outline" className="shrink-0">All Roles</Button>
                  <Button variant="outline" className="shrink-0">Status</Button>
                </div>
              </div>

              {/* Mobile Member Cards */}
              <div className="space-y-3 lg:hidden">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-outline-variant/60 bg-surface-high/20 p-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      m.status === 'Invited' ? 'bg-surface-highest text-on-surface-variant' : 'bg-primary text-on-primary'
                    }`}>
                      {m.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-on-surface">{m.name}</p>
                      <p className="truncate text-xs text-on-surface-variant">{m.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className="bg-surface-highest text-on-surface-variant">{m.role}</Badge>
                        <span className={`inline-flex items-center gap-1 text-[10px] ${
                          m.status === 'Active' ? 'text-secondary' :
                          m.status === 'Offline' ? 'text-on-surface-variant' : 'text-tertiary'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            m.status === 'Active' ? 'bg-secondary' :
                            m.status === 'Offline' ? 'bg-on-surface-variant' : 'bg-tertiary'
                          }`} />
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Member Table */}
              <table className="hidden w-full lg:block">
                <thead>
                  <tr className="border-b border-outline-variant text-left text-xs uppercase tracking-wider text-on-surface-variant">
                    <th className="pb-3 font-medium">Member</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Last Active</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-outline-variant last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            m.status === 'Invited' ? 'bg-surface-highest text-on-surface-variant' : 'bg-primary text-on-primary'
                          }`}>
                            {m.initials}
                          </div>
                          <div>
                            <p className="font-medium text-on-surface">{m.name}</p>
                            {m.status !== 'Invited' && <p className="text-xs text-on-surface-variant">{m.email}</p>}
                            {m.status === 'Invited' && <p className="text-xs text-on-surface-variant">Invitation sent 2 days ago</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className="bg-surface-highest text-on-surface-variant">
                          {m.role === 'Owner' && <Shield className="mr-1 h-3 w-3" />}
                          {m.role === 'Admin' && <Users className="mr-1 h-3 w-3" />}
                          {m.role === 'Sales Manager' && <TrendingUp className="mr-1 h-3 w-3" />}
                          {m.role === 'Developer' && <CodeIcon className="mr-1 h-3 w-3" />}
                          {m.role}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 text-body-sm ${
                          m.status === 'Active' ? 'text-secondary' :
                          m.status === 'Offline' ? 'text-on-surface-variant' : 'text-tertiary'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                            m.status === 'Active' ? 'bg-secondary' :
                            m.status === 'Offline' ? 'bg-on-surface-variant' : 'bg-tertiary'
                          }`} />
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 text-body-sm text-on-surface-variant">{m.lastActive}</td>
                      <td className="py-3 text-right"><MoreHorizontal /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between pt-2">
                <p className="text-body-sm text-on-surface-variant">Showing 1 to 4 of 12 members</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">&lt;</Button>
                  <Button size="sm" variant="outline">&gt;</Button>
                </div>
              </div>

              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Invite Member
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Integrations' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-headline-md text-headline-md font-semibold">Connected Services</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
              <Card className="border border-outline-variant/60 bg-surface-high/20">
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Cloud className="h-8 w-8 text-on-surface-variant" />
                    <Badge className="bg-secondary/10 text-secondary">Connected</Badge>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold">Google Workspace</h3>
                  <p className="text-body-sm text-on-surface-variant">Sync calendar events, emails, and contacts automatically with ClientOS AI.</p>
                  <Button variant="outline" className="w-full">Manage Settings</Button>
                </CardContent>
              </Card>
              <Card className="border border-outline-variant/60 bg-surface-high/20">
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Grid className="h-8 w-8 text-on-surface-variant" />
                    <Badge className="bg-primary/10 text-primary">Connect</Badge>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold">Microsoft 365</h3>
                  <p className="text-body-sm text-on-surface-variant">Connect your Outlook and Office apps for seamless lead data flow.</p>
                  <Button className="w-full bg-primary text-on-primary">Connect</Button>
                </CardContent>
              </Card>
              <Card className="border border-outline-variant/60 bg-surface-high/20">
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <RefreshCw className="h-8 w-8 text-on-surface-variant" />
                    <Badge className="bg-tertiary/10 text-tertiary">Configuring</Badge>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold">CRM Sync</h3>
                  <p className="text-body-sm text-on-surface-variant">Two-way sync with Salesforce, HubSpot, or custom endpoints.</p>
                  <Button variant="outline" className="w-full">Setup Webhooks</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
                <Key className="h-5 w-5 text-on-surface-variant" /> API Keys
              </h2>
              <p className="text-body-sm text-on-surface-variant">Manage API keys for custom integrations and developer access.</p>
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-on-surface-variant uppercase tracking-wider">Production Key</p>
                    <p className="mt-1 font-mono text-body-sm text-on-surface">sk_live_***************************8f2a</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyApiKey}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Generate New Key</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-5 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-secondary/10 text-secondary uppercase tracking-wider">Active Plan</Badge>
                    <h2 className="mt-2 font-headline-xl text-headline-xl font-semibold">Pro Agency</h2>
                    <p className="text-body-sm text-on-surface-variant">$299 / month • Renews Oct 15, 2023</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline">Cancel Plan</Button>
                    <Button>Upgrade</Button>
                  </div>
                </div>
                <div className="h-px bg-outline-variant" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Plan Features Included</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {['Unlimited Clients', '5 Team Members', 'Advanced Outreach Automation', 'Priority Support'].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-body-sm text-on-surface">
                        <Check className="h-4 w-4 text-secondary" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md font-semibold">AI Credits</h2>
                  <Zap className="h-5 w-5 text-on-surface-variant" />
                </div>
                <p className="text-3xl font-semibold text-on-surface">14,250 <span className="text-lg font-normal text-on-surface-variant">/ 20,000 used</span></p>
                <p className="text-right text-xs text-on-surface-variant">71% CONSUMED</p>
                <div className="h-2 overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full w-[71%] rounded-full bg-primary" />
                </div>
                <Button variant="outline" className="w-full">Buy Credits Manually</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            <Card className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md font-semibold">Payment Methods</h2>
                  <Button size="sm" variant="ghost" className="text-primary">+ Add New</Button>
                </div>
                <div className="space-y-3">
                  {payments.map((pm) => (
                    <div key={pm.id} className={`flex items-center justify-between rounded-lg border p-3 ${pm.isDefault ? 'border-outline-variant bg-surface-high/30' : 'border-outline-variant/60 bg-surface'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-16 items-center justify-center rounded bg-surface-highest text-xs font-bold ${pm.type === 'visa' ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                          {pm.type === 'visa' ? 'VISA' : 'MC'}
                        </div>
                        <div>
                          <p className="text-body-sm font-medium text-on-surface">{pm.type === 'visa' ? 'Visa' : 'Mastercard'} ending in {pm.last4}</p>
                          <p className="text-body-sm text-on-surface-variant">Expires {pm.exp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pm.isDefault ? (
                          <Badge className="bg-secondary/10 text-secondary">Default</Badge>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-on-surface-variant">Make Default</Button>
                        )}
                        <button className="p-2 text-on-surface-variant hover:text-error"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-2 text-body-sm text-on-surface-variant"><Shield className="h-4 w-4" /> Payments processed securely by Stripe</p>
              </CardContent>
            </Card>

            <Card className="border border-outline-variant/60 bg-surface-high/20">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-md text-headline-md font-semibold">Recent Invoices</h2>
                  <Button size="sm" variant="ghost" className="text-primary">View All</Button>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline-variant text-left text-xs text-on-surface-variant uppercase tracking-wider">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.date} className="border-b border-outline-variant last:border-0">
                        <td className="py-3 text-body-sm text-on-surface">{inv.date}</td>
                        <td className="py-3 text-body-sm text-on-surface">${inv.amount.toFixed(2)}</td>
                        <td className="py-3 text-right"><Badge className="bg-secondary/10 text-secondary">{inv.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function CodeIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function MoreHorizontal(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || 'h-4 w-4 text-on-surface-variant'}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}
