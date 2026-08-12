import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MSA_CONTENT = `<h2 class="text-center text-2xl font-bold uppercase tracking-wider">Master Services Agreement</h2>

<p class="leading-relaxed">This Master Services Agreement (this "Agreement") is entered into as of <span class="rounded bg-primary/10 px-1 text-primary">[Effective Date]</span> (the "Effective Date") by and between:</p>

<div class="rounded border-l-4 border-primary bg-surface-high/30 p-4 my-4">
  <p class="font-semibold">Provider:</p>
  <p class="text-primary hover:underline cursor-pointer">ClientOS Technologies Inc.</p>
  <p class="text-on-surface-variant">, a Delaware corporation with its principal place of business at 123 Tech Blvd, San Francisco, CA 94105.</p>
  <p class="mt-2 font-semibold">Client:</p>
  <p class="text-primary hover:underline cursor-pointer">Acme Corp Global</p>
  <p class="text-on-surface-variant">, a New York corporation with its principal place of business at 456 Enterprise Way, New York, NY 10001.</p>
</div>

<h3 class="text-lg font-bold">1. Scope of Work</h3>
<p class="leading-relaxed">Provider shall perform the services described in one or more Statements of Work ("SOW") executed by the parties (the "Services"). Each SOW will reference this Agreement and will be governed by its terms. In the event of a conflict between this Agreement and a SOW, the terms of the SOW shall prevail for that specific engagement.</p>

<h3 class="text-lg font-bold">2. Payment Terms</h3>
<p class="leading-relaxed">Client shall pay Provider the fees set forth in the applicable SOW. Unless otherwise specified in a SOW, invoices will be issued monthly and are payable within <span class="rounded bg-primary/10 px-1 text-primary">[Net 30]</span> days of receipt. Late payments will incur interest at a rate of <span class="rounded bg-primary/10 px-1 text-primary">[1.5%]</span> per month or the highest rate permitted by law, whichever is lower.</p>

<h3 class="text-lg font-bold">3. Confidentiality</h3>
<p class="leading-relaxed">Each party (the "Receiving Party") agrees to maintain the confidentiality of all proprietary information disclosed by the other party (the "Disclosing Party"). The Receiving Party shall use the Disclosing Party's Confidential Information solely to perform its obligations or exercise its rights under this Agreement.</p>`;

async function main() {
  const orgs = await prisma.organization.findMany({ take: 1 });
  if (!orgs.length) {
    console.log('No organization found. Skipping contract seed.');
    return;
  }
  const org = orgs[0];

  // Check if the sample MSA already exists
  const existing = await prisma.contract.findFirst({
    where: { title: 'Master Services Agreement', organizationId: org.id },
  });
  if (existing) {
    console.log('Master Services Agreement already exists:', existing.id);
    return;
  }

  const contract = await prisma.contract.create({
    data: {
      organizationId: org.id,
      title: 'Master Services Agreement',
      status: 'PENDING_SIGNATURE',
      value: 150000,
      currency: 'USD',
      publicToken: 'msa-2023-0892-' + Math.random().toString(36).slice(2, 10),
      versions: {
        create: {
          version: 1,
          content: MSA_CONTENT,
          createdBy: 'system',
        },
      },
      parties: {
        create: [
          { name: 'Sarah Jenkins', email: 'sarah@clientos.ai', role: 'PROVIDER' },
          { name: 'Michael Chang', email: 'michael@acmecorp.com', role: 'CLIENT' },
        ],
      },
    },
  });

  console.log('Seeded MSA contract:', contract.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
