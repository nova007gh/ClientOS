import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({});
  if (!org) {
    console.log('Organization not found');
    return;
  }

  const existingConversations = await prisma.conversation.count({ where: { organizationId: org.id } });
  if (existingConversations === 0) {
    const c1 = await prisma.conversation.create({
      data: {
        organizationId: org.id,
        company: 'Acme Corp',
        contact: 'Sarah Jenkins',
        title: 'Re: Enterprise Scale Proposal',
        tags: JSON.stringify(['Meeting Request', 'High Intent']),
        score: 85,
        intent: 'High Intent',
        friction: JSON.stringify([
          'Legacy CRM integration concerns (Salesforce Classic)',
          'Q3 data pipeline bottlenecks',
        ]),
        pitch:
          'Focus on our API-first approach that requires zero downtime to bridge their old CRM to our modern infrastructure.',
        messages: {
          create: [
            {
              sender: 'You',
              body: "Hi Sarah,\n\nFollowing up on our brief chat. Would you be open to a 15-min walk-through this Thursday?",
              isMe: true,
              sentAt: new Date(Date.now() - 86400000),
            },
            {
              sender: 'Sarah Jenkins',
              body: "Hi,\n\nThanks for sending this over. The proposed architecture looks interesting, but I have concerns about integration with our legacy CRM systems.\n\nAre you available for a call tomorrow afternoon?\n\n- Sarah",
              isMe: false,
              sentAt: new Date(Date.now() - 3600000),
            },
          ],
        },
      },
      include: { messages: true },
    });
    const c2 = await prisma.conversation.create({
      data: {
        organizationId: org.id,
        company: 'TechFlow Inc',
        contact: 'Tom Allen',
        title: 'Following up on the demo',
        tags: JSON.stringify(['Interested']),
        score: 64,
        intent: 'Interested',
        friction: JSON.stringify(['Pricing clarity']),
        pitch: 'Show ROI calculator and similar SaaS case study.',
        messages: {
          create: [
            {
              sender: 'You',
              body: 'Thanks for attending the demo. Let me know if you have any questions.',
              isMe: true,
              sentAt: new Date(Date.now() - 7200000),
            },
          ],
        },
      },
    });
    console.log('Created conversations:', c1.id, c2.id);
  } else {
    console.log('Conversations already exist');
  }

  const existingTemplates = await prisma.template.count({ where: { organizationId: org.id } });
  if (existingTemplates === 0) {
    const t1 = await prisma.template.create({
      data: {
        organizationId: org.id,
        type: 'EMAIL',
        name: 'Cold Intro v4.2',
        category: 'SaaS Executives',
        subject: "Quick question regarding {{company_name}}'s data infrastructure",
        body: `Hi {{prospect_name}},

I noticed {{company_name}} recently {{recent_achievement}}. Congrats on that milestone.

As you scale, maintaining data integrity often becomes a bottleneck. We help teams like {{competitor_name}} automate their pipeline monitoring, saving them ~15 hours a week.

Are you open to a brief chat next week to see if we can do the same for your team?

Best,
Jane`,
        active: true,
        openRate: '68% open',
      },
    });
    const t2 = await prisma.template.create({
      data: {
        organizationId: org.id,
        type: 'EMAIL',
        name: 'Follow-up: No Reply',
        category: 'General',
        body: `Hi {{prospect_name}},

Just bumping this up in case it got buried. Let me know if you have 10 minutes for a quick call this week.`,
        active: false,
      },
    });
    const t3 = await prisma.template.create({
      data: {
        organizationId: org.id,
        type: 'CONTRACT',
        name: 'Master Services Agreement',
        category: 'Service Contract',
        content: '<h2>Master Services Agreement</h2><p>Provider agrees to provide the services described in Exhibit A to Client.</p>',
        active: false,
      },
    });
    console.log('Created templates:', t1.id, t2.id, t3.id);
  } else {
    console.log('Templates already exist');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
