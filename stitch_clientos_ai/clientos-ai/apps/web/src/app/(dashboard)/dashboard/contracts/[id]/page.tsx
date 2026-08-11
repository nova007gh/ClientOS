'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Badge } from '@clientos/ui';
import { ArrowLeft, Edit, Send, Lock, FileCheck, CheckCircle2, Circle, Clock, MoreHorizontal, Mail } from 'lucide-react';

export default function ContractDetailPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" /> Back to Contracts
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-semibold">Master Services Agreement</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">Ref: MSA-2023-0892 • Last edited 2 hours ago by Sarah Jenkins</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-warning/10 text-warning">Pending Signature</Badge>
          <Button variant="outline"><Edit className="h-4 w-4" /> Edit Draft</Button>
          <Button><Send className="mr-2 h-4 w-4" /> Send for Signature</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 border-b border-outline-variant p-3">
                <button className="rounded p-1.5 hover:bg-surface-high"><strong className="text-on-surface">B</strong></button>
                <button className="rounded p-1.5 italic text-on-surface hover:bg-surface-high">I</button>
                <button className="rounded p-1.5 hover:bg-surface-high"><FileCheck className="h-4 w-4" /></button>
                <button className="rounded p-1.5 hover:bg-surface-high"><MoreHorizontal className="h-4 w-4" /></button>
                <span className="ml-auto text-xs text-on-surface-variant">Auto-saved 1m ago</span>
              </div>

              <div className="space-y-6 p-8 text-on-surface">
                <h2 className="text-center text-2xl font-bold uppercase tracking-wider">Master Services Agreement</h2>

                <p className="text-sm leading-relaxed">
                  This Master Services Agreement (this &quot;Agreement&quot;) is entered into as of <span className="rounded bg-primary/10 px-1 text-primary">[Effective Date]</span> (the &quot;Effective Date&quot;) by and between:
                </p>

                <div className="rounded border-l-4 border-primary bg-surface-high/30 p-4 text-sm">
                  <p className="font-semibold">Provider:</p>
                  <p className="text-primary hover:underline cursor-pointer">ClientOS Technologies Inc.</p>
                  <p className="text-on-surface-variant">, a Delaware corporation with its principal place of business at 123 Tech Blvd, San Francisco, CA 94105.</p>
                  <p className="mt-2 font-semibold">Client:</p>
                  <p className="text-primary hover:underline cursor-pointer">Acme Corp Global</p>
                  <p className="text-on-surface-variant">, a New York corporation with its principal place of business at 456 Enterprise Way, New York, NY 10001.</p>
                </div>

                <div className="space-y-4 text-sm">
                  <h3 className="text-lg font-bold">1. Scope of Work</h3>
                  <p className="leading-relaxed">
                    Provider shall perform the services described in one or more Statements of Work (&quot;SOW&quot;) executed by the parties (the &quot;Services&quot;). Each SOW will reference this Agreement and will be governed by its terms. In the event of a conflict between this Agreement and a SOW, the terms of the SOW shall prevail for that specific engagement.
                  </p>

                  <h3 className="text-lg font-bold">2. Payment Terms</h3>
                  <p className="leading-relaxed">
                    Client shall pay Provider the fees set forth in the applicable SOW. Unless otherwise specified in a SOW, invoices will be issued monthly and are payable within <span className="rounded bg-primary/10 px-1 text-primary">[Net 30]</span> days of receipt. Late payments will incur interest at a rate of <span className="rounded bg-primary/10 px-1 text-primary">[1.5%]</span> per month or the highest rate permitted by law, whichever is lower.
                  </p>

                  <h3 className="text-lg font-bold">3. Confidentiality</h3>
                  <p className="leading-relaxed">
                    Each party (the &quot;Receiving Party&quot;) agrees to maintain the confidentiality of all proprietary information disclosed by the other party (the &quot;Disclosing Party&quot;). The Receiving Party shall use the Disclosing Party&apos;s Confidential Information solely to perform its obligations or exercise its rights under this Agreement.
                  </p>
                </div>

                <div className="rounded-lg border border-outline-variant bg-surface-high/30 p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><FileCheck className="h-4 w-4 text-primary" /> Signatures Required</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-on-surface-variant">For Provider</p>
                      <div className="rounded border border-dashed border-outline-variant bg-surface p-4 text-center">
                        <p className="text-sm text-on-surface-variant">Click to sign</p>
                        <p className="mt-2 text-sm font-semibold text-on-surface">Sarah Jenkins</p>
                        <p className="text-xs text-on-surface-variant">Director of Sales, ClientOS</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wider text-on-surface-variant">For Client</p>
                      <div className="rounded border border-dashed border-outline-variant bg-warning/5 p-4 text-center">
                        <p className="text-sm text-warning">Awaiting signature</p>
                        <p className="mt-2 text-sm font-semibold text-on-surface">Michael Chang</p>
                        <p className="text-xs text-on-surface-variant">VP of Operations, Acme Corp</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5 text-on-surface-variant" /> Contract Intelligence
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-body-sm text-on-surface">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-secondary" />
                  <span>Standard terms detected. Matches company playbook 98%.</span>
                </div>
                <div className="flex items-start gap-2 text-body-sm text-on-surface">
                  <Circle className="mt-0.5 h-4 w-4 text-warning" />
                  <span>Non-standard payment terms. Net 30 negotiated from Net 45.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <h2 className="font-headline-md text-headline-md font-semibold">Parties Involved</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-highest" />
                  <div>
                    <p className="font-semibold text-on-surface">Sarah Jenkins</p>
                    <p className="text-xs text-on-surface-variant">ClientOS • Sender</p>
                  </div>
                  <Badge className="ml-auto bg-surface-highest text-on-surface-variant">Drafting</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-highest" />
                  <div>
                    <p className="font-semibold text-on-surface">Michael Chang</p>
                    <p className="text-xs text-on-surface-variant">Acme Corp • Signer</p>
                  </div>
                  <Badge className="ml-auto bg-warning/10 text-warning">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-outline-variant/60 bg-surface-high/20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-headline-md font-semibold">History</h2>
                <MoreHorizontal className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="space-y-4">
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-secondary" />
                  <p className="text-body-sm font-medium text-on-surface">Ready for Signature</p>
                  <p className="text-xs text-on-surface-variant">Contract finalized and marked ready by Sarah Jenkins.</p>
                  <p className="text-xs text-on-surface-variant/60">2h ago</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-on-surface-variant" />
                  <p className="text-body-sm font-medium text-on-surface">Variables Updated</p>
                  <p className="text-xs text-on-surface-variant">Payment terms updated to Net 30.</p>
                  <p className="text-xs text-on-surface-variant/60">3h ago</p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1 h-2 w-2 rounded-full bg-on-surface-variant" />
                  <p className="text-body-sm font-medium text-on-surface">Draft Created</p>
                  <p className="text-xs text-on-surface-variant">Generated from template &quot;Standard MSA v2.1&quot;.</p>
                  <p className="text-xs text-on-surface-variant/60">Yesterday</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
