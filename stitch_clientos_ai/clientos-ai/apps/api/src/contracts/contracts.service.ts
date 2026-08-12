import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { prisma } from '@clientos/database';

const DEFAULT_CONTENT = `<h2 class="text-center text-2xl font-bold uppercase tracking-wider">Master Services Agreement</h2>

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

@Injectable()
export class ContractsService {
  async list(orgId: string, opts: { status?: string; search?: string } = {}) {
    const where: any = { organizationId: orgId };
    if (opts.status) where.status = opts.status;
    if (opts.search) {
      where.title = { contains: opts.search, mode: 'insensitive' };
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          opportunity: { select: { id: true, title: true } },
          parties: { select: { id: true, name: true, role: true } },
          _count: { select: { signatures: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return { data: contracts, total };
  }

  async get(orgId: string, id: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, organizationId: orgId },
      include: {
        opportunity: { select: { id: true, title: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
        parties: {
          include: {
            signatures: { orderBy: { signedAt: 'desc' }, take: 1 },
          },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async getByPublicToken(token: string) {
    const contract = await prisma.contract.findUnique({
      where: { publicToken: token },
      include: {
        opportunity: { select: { id: true, title: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
        parties: {
          include: {
            signatures: { orderBy: { signedAt: 'desc' }, take: 1 },
          },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async create(orgId: string, data: any) {
    const title = data.title ?? 'Untitled Contract';
    const status = data.status ?? 'DRAFT';

    return prisma.contract.create({
      data: {
        organizationId: orgId,
        opportunityId: data.opportunityId ?? null,
        title,
        status,
        value: data.value ?? null,
        currency: data.currency ?? 'USD',
        publicToken: randomBytes(24).toString('hex'),
        versions: {
          create: {
            version: 1,
            content: data.content ?? DEFAULT_CONTENT,
            createdBy: data.createdBy ?? 'system',
          },
        },
        parties: data.parties
          ? {
              create: data.parties.map((party: any) => ({
                name: party.name,
                email: party.email ?? '',
                role: party.role ?? 'SIGNER',
              })),
            }
          : undefined,
      },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        parties: true,
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await prisma.contract.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Contract not found');

    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.status !== undefined) patch.status = data.status;
    if (data.value !== undefined) patch.value = data.value ? parseFloat(data.value) : null;
    if (data.currency !== undefined) patch.currency = data.currency;
    if (data.opportunityId !== undefined) patch.opportunityId = data.opportunityId;

    return prisma.contract.update({
      where: { id },
      data: patch,
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        parties: true,
      },
    });
  }

  async updateContent(orgId: string, id: string, content: string, userId: string) {
    const existing = await prisma.contract.findFirst({
      where: { id, organizationId: orgId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });
    if (!existing) throw new NotFoundException('Contract not found');

    const latest = existing.versions[0];
    const version = latest ? latest.version + 1 : 1;

    await prisma.contractVersion.create({
      data: {
        contractId: id,
        version,
        content,
        createdBy: userId,
      },
    });

    return this.get(orgId, id);
  }

  async addParty(orgId: string, id: string, party: any) {
    const existing = await prisma.contract.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Contract not found');

    return prisma.contractParty.create({
      data: {
        contractId: id,
        name: party.name,
        email: party.email ?? '',
        role: party.role ?? 'SIGNER',
      },
    });
  }

  async sign(orgId: string, id: string, partyId: string, signatureData: string) {
    const contract = await prisma.contract.findFirst({
      where: { id, organizationId: orgId },
      include: { parties: true, signatures: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const party = contract.parties.find((p) => p.id === partyId);
    if (!party) throw new NotFoundException('Party not found');

    if (contract.signatures.some((s) => s.partyId === partyId)) {
      throw new BadRequestException('Party has already signed');
    }

    await prisma.contractSignature.create({
      data: {
        contractId: id,
        partyId,
        signatureData,
        signedAt: new Date(),
        auditMetadata: JSON.stringify({ ip: 'unknown', userAgent: 'unknown' }),
      },
    });

    const totalParties = contract.parties.length;
    const signedCount = contract.signatures.length + 1;
    const newStatus = signedCount >= totalParties ? 'SIGNED' : 'PENDING_SIGNATURE';

    if (contract.status !== 'SIGNED') {
      await prisma.contract.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    return this.get(orgId, id);
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.contract.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Contract not found');
    return prisma.contract.delete({ where: { id } });
  }
}
