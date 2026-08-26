import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // ── Clean slate ──────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.aiFeedback.deleteMany();
  await prisma.aiRun.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.projectMessage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.contractSignature.deleteMany();
  await prisma.contractParty.deleteMany();
  await prisma.contractVersion.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposalSection.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.generatedMessage.deleteMany();
  await prisma.campaignProspect.deleteMany();
  await prisma.campaignStep.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.message.deleteMany();
  await prisma.emailThread.deleteMany();
  await prisma.emailAccount.deleteMany();
  await prisma.suppressionList.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.auditFinding.deleteMany();
  await prisma.websiteAudit.deleteMany();
  await prisma.prospectOpportunity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.prospectContact.deleteMany();
  await prisma.prospect.deleteMany();
  await prisma.prospectSource.deleteMany();
  await prisma.serviceIndustry.deleteMany();
  await prisma.service.deleteMany();
  await prisma.industry.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();

  // ── Plans ────────────────────────────────────
  const freePlan = await prisma.plan.create({
    data: {
      name: 'Free',
      slug: 'free',
      priceMonthly: 0,
      priceAnnual: 0,
      prospectLimit: 50,
      auditLimit: 10,
      aiCredits: 100,
      features: JSON.stringify(['Basic CRM', 'Manual prospects', 'CSV import']),
    },
  });

  const freelancerPlan = await prisma.plan.create({
    data: {
      name: 'Freelancer',
      slug: 'freelancer',
      priceMonthly: 29,
      priceAnnual: 290,
      prospectLimit: 500,
      auditLimit: 100,
      aiCredits: 1000,
      features: JSON.stringify(['CRM', 'Campaigns', 'AI outreach', 'Proposals', 'Portfolio']),
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      name: 'Pro',
      slug: 'pro',
      priceMonthly: 79,
      priceAnnual: 790,
      prospectLimit: 2000,
      auditLimit: 500,
      aiCredits: 5000,
      features: JSON.stringify(['Everything in Freelancer', 'Contracts', 'E-signatures', 'Projects', 'Advanced AI']),
    },
  });

  const agencyPlan = await prisma.plan.create({
    data: {
      name: 'Agency',
      slug: 'agency',
      priceMonthly: 199,
      priceAnnual: 1990,
      prospectLimit: 10000,
      auditLimit: 2000,
      aiCredits: 20000,
      features: JSON.stringify(['Everything in Pro', 'Teams', 'Multiple mailboxes', 'White-label', 'Advanced analytics']),
    },
  });

  // ── Users ────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const owner = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'owner@clientos.ai',
      passwordHash,
      firstName: 'Kwame',
      lastName: 'Mensah',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const agent = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'agent@clientos.ai',
      passwordHash,
      firstName: 'Ama',
      lastName: 'Osei',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  const developer = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: 'dev@clientos.ai',
      passwordHash,
      firstName: 'Yusuf',
      lastName: 'Ibrahim',
      emailVerifiedAt: new Date(),
      status: 'ACTIVE',
    },
  });

  // ── Organization ─────────────────────────────
  const org = await prisma.organization.create({
    data: {
      id: randomUUID(),
      name: 'Digital Boost Agency',
      slug: 'digital-boost',
      country: 'Ghana',
      currency: 'GHS',
      timezone: 'Africa/Accra',
      ownerId: owner.id,
    },
  });

  // ── Members ──────────────────────────────────
  await prisma.organizationMember.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      userId: owner.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  await prisma.organizationMember.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      userId: agent.id,
      role: 'SALES_AGENT',
      status: 'ACTIVE',
    },
  });

  await prisma.organizationMember.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      userId: developer.id,
      role: 'DEVELOPER',
      status: 'ACTIVE',
    },
  });

  // ── Industries ───────────────────────────────
  const industries = await Promise.all(
    [
      { name: 'Healthcare / Dental', slug: 'healthcare-dental' },
      { name: 'Hospitality', slug: 'hospitality' },
      { name: 'Legal Services', slug: 'legal-services' },
      { name: 'Real Estate', slug: 'real-estate' },
      { name: 'Professional Services', slug: 'professional-services' },
      { name: 'Retail / E-commerce', slug: 'retail-ecommerce' },
    ].map((d) =>
      prisma.industry.create({ data: { id: randomUUID(), ...d } }),
    ),
  );

  // ── Services ─────────────────────────────────
  const services = await Promise.all([
    prisma.service.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        name: 'Website Development',
        description: 'Custom responsive websites built with modern frameworks',
        startingPrice: 3000,
        currency: 'GHS',
        deliveryDays: 21,
        idealCustomer: 'Small to medium businesses without a web presence',
        keywords: JSON.stringify(['website', 'web design', 'responsive', 'frontend']),
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        name: 'E-commerce Solution',
        description: 'Full online store with payment integration and inventory',
        startingPrice: 8000,
        currency: 'GHS',
        deliveryDays: 45,
        idealCustomer: 'Retailers looking to sell online',
        keywords: JSON.stringify(['ecommerce', 'shopify', 'payment', 'store']),
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        name: 'SEO Optimization',
        description: 'Technical and content SEO to improve search rankings',
        startingPrice: 1500,
        currency: 'GHS',
        deliveryDays: 30,
        idealCustomer: 'Businesses with existing websites that need more traffic',
        keywords: JSON.stringify(['seo', 'search', 'google', 'ranking']),
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        name: 'Booking System Development',
        description: 'Online appointment and reservation systems',
        startingPrice: 5000,
        currency: 'GHS',
        deliveryDays: 30,
        idealCustomer: 'Clinics, salons, restaurants needing appointment management',
        keywords: JSON.stringify(['booking', 'appointment', 'scheduling', 'reservation']),
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        id: randomUUID(),
        organizationId: org.id,
        name: 'WhatsApp Automation',
        description: 'WhatsApp Business API integration for customer communication',
        startingPrice: 2000,
        currency: 'GHS',
        deliveryDays: 14,
        idealCustomer: 'Businesses relying on WhatsApp for customer interactions',
        keywords: JSON.stringify(['whatsapp', 'automation', 'chatbot', 'messaging']),
        active: true,
      },
    }),
  ]);

  // Link services to industries
  await prisma.serviceIndustry.createMany({
    data: [
      { serviceId: services[0].id, industryId: industries[0].id },
      { serviceId: services[0].id, industryId: industries[1].id },
      { serviceId: services[0].id, industryId: industries[2].id },
      { serviceId: services[1].id, industryId: industries[5].id },
      { serviceId: services[2].id, industryId: industries[2].id },
      { serviceId: services[3].id, industryId: industries[0].id },
      { serviceId: services[3].id, industryId: industries[1].id },
      { serviceId: services[4].id, industryId: industries[0].id },
    ],
  });

  // ── Prospect Source ──────────────────────────
  const source = await prisma.prospectSource.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      provider: 'manual',
      externalId: 'seed-import-001',
    },
  });

  // ── Prospects (20) ───────────────────────────
  const prospectData = [
    { name: 'Kofi Dental Clinic', industry: 0, city: 'Accra', country: 'Ghana', website: 'https://kofidental.gh', rating: 4.2, reviewCount: 286, status: 'AUDITED', leadScore: 91, websiteStatus: 'POOR', assignedTo: agent.id },
    { name: 'Apex Law Partners', industry: 2, city: 'Manchester', country: 'UK', website: 'https://apexlaw.co.uk', rating: 4.5, reviewCount: 112, status: 'QUALIFIED', leadScore: 64, websiteStatus: 'FAIR', assignedTo: agent.id },
    { name: 'Bistro 77', industry: 1, city: 'Chicago', country: 'USA', website: null, rating: 4.7, reviewCount: 540, status: 'NEW', leadScore: 78, websiteStatus: 'NONE', assignedTo: agent.id },
    { name: 'Zenith Realty', industry: 3, city: 'Lagos', country: 'Nigeria', website: 'https://zenithrealty.ng', rating: 3.8, reviewCount: 45, status: 'CONTACTED', leadScore: 72, websiteStatus: 'POOR', assignedTo: agent.id },
    { name: 'Accra Dental Care', industry: 0, city: 'Accra', country: 'Ghana', website: 'https://accradental.com', rating: 4.0, reviewCount: 98, status: 'AUDITED', leadScore: 85, websiteStatus: 'POOR', assignedTo: agent.id },
    { name: 'Prime Legal Consult', industry: 2, city: 'Kumasi', country: 'Ghana', website: 'https://primelegal.gh', rating: 4.3, reviewCount: 67, status: 'NEW', leadScore: 58, websiteStatus: 'FAIR', assignedTo: null },
    { name: 'Savanna Boutique Hotel', industry: 1, city: 'Tamale', country: 'Ghana', website: 'https://savannahotel.com', rating: 4.6, reviewCount: 230, status: 'QUALIFIED', leadScore: 80, websiteStatus: 'FAIR', assignedTo: agent.id },
    { name: 'TechHub Solutions', industry: 4, city: 'Nairobi', country: 'Kenya', website: 'https://techhub.co.ke', rating: 4.1, reviewCount: 34, status: 'NEW', leadScore: 45, websiteStatus: 'GOOD', assignedTo: null },
    { name: 'Green Leaf Restaurant', industry: 1, city: 'Takoradi', country: 'Ghana', website: null, rating: 4.4, reviewCount: 156, status: 'NEW', leadScore: 76, websiteStatus: 'NONE', assignedTo: agent.id },
    { name: 'Cape Coast Medical Center', industry: 0, city: 'Cape Coast', country: 'Ghana', website: 'https://ccmedical.gh', rating: 3.9, reviewCount: 78, status: 'AUDITED', leadScore: 88, websiteStatus: 'POOR', assignedTo: agent.id },
    { name: 'Lagos Fashion House', industry: 5, city: 'Lagos', country: 'Nigeria', website: 'https://lagosfashion.ng', rating: 4.5, reviewCount: 320, status: 'CONTACTED', leadScore: 82, websiteStatus: 'FAIR', assignedTo: agent.id },
    { name: 'Kumasi Auto Parts', industry: 4, city: 'Kumasi', country: 'Ghana', website: null, rating: 3.5, reviewCount: 12, status: 'NEW', leadScore: 52, websiteStatus: 'NONE', assignedTo: null },
    { name: 'Riverside Dental', industry: 0, city: 'Kumasi', country: 'Ghana', website: 'https://riversidedental.gh', rating: 4.8, reviewCount: 410, status: 'REPLIED', leadScore: 93, websiteStatus: 'POOR', assignedTo: agent.id },
    { name: 'Oxford Street Cafe', industry: 1, city: 'Accra', country: 'Ghana', website: 'https://oxfordcafe.gh', rating: 4.2, reviewCount: 89, status: 'NEW', leadScore: 68, websiteStatus: 'FAIR', assignedTo: agent.id },
    { name: 'Nairobi Law Associates', industry: 2, city: 'Nairobi', country: 'Kenya', website: 'https://nla.co.ke', rating: 4.0, reviewCount: 56, status: 'NEW', leadScore: 61, websiteStatus: 'GOOD', assignedTo: null },
    { name: 'Tema Industrial Supplies', industry: 4, city: 'Tema', country: 'Ghana', website: 'https://temasupplies.gh', rating: 3.7, reviewCount: 23, status: 'NEW', leadScore: 49, websiteStatus: 'POOR', assignedTo: null },
    { name: 'East Legon Spa & Wellness', industry: 4, city: 'Accra', country: 'Ghana', website: 'https://eastlegonspa.gh', rating: 4.6, reviewCount: 175, status: 'QUALIFIED', leadScore: 84, websiteStatus: 'FAIR', assignedTo: agent.id },
    { name: 'Kasoa Building Supplies', industry: 4, city: 'Kasoa', country: 'Ghana', website: null, rating: 3.3, reviewCount: 8, status: 'NEW', leadScore: 41, websiteStatus: 'NONE', assignedTo: null },
    { name: 'University Bookstore', industry: 5, city: 'Legon', country: 'Ghana', website: 'https://ubookstore.gh', rating: 4.1, reviewCount: 45, status: 'NEW', leadScore: 55, websiteStatus: 'POOR', assignedTo: null },
    { name: 'Adenta Fitness Center', industry: 4, city: 'Adenta', country: 'Ghana', website: 'https://adentafit.gh', rating: 4.4, reviewCount: 120, status: 'AUDITED', leadScore: 79, websiteStatus: 'FAIR', assignedTo: agent.id },
  ];

  const prospects = await Promise.all(
    prospectData.map((d) =>
      prisma.prospect.create({
        data: {
          id: randomUUID(),
          organizationId: org.id,
          companyName: d.name,
          industryId: industries[d.industry].id,
          website: d.website,
          city: d.city,
          country: d.country,
          rating: d.rating,
          reviewCount: d.reviewCount,
          status: d.status,
          leadScore: d.leadScore,
          websiteStatus: d.websiteStatus,
          assignedUserId: d.assignedTo,
          sourceId: source.id,
          phone: '+233 24 000 ' + Math.floor(1000 + Math.random() * 9000),
          email: d.name.toLowerCase().replace(/[^a-z]/g, '') + '@example.com',
        },
      }),
    ),
  );

  // ── Website Audits (for top prospects) ───────
  const audit1 = await prisma.websiteAudit.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[0].id,
      websiteUrl: 'https://kofidental.gh',
      status: 'COMPLETED',
      performanceScore: 34,
      seoScore: 42,
      accessibilityScore: 55,
      mobileScore: 28,
      httpsEnabled: true,
      sslValid: true,
      pageTitle: 'Kofi Dental Clinic - Home',
      metaDescription: null,
      hasSitemap: false,
      hasRobotsTxt: false,
      hasContactInfo: true,
      hasCTA: false,
      hasSocialLinks: false,
      hasForms: false,
      startedAt: new Date(Date.now() - 86400000),
      completedAt: new Date(Date.now() - 86000000),
    },
  });

  await prisma.auditFinding.createMany({
    data: [
      { id: randomUUID(), auditId: audit1.id, category: 'PERFORMANCE', severity: 'CRITICAL', title: 'Poor mobile performance', description: 'Page load time exceeds 8 seconds on mobile devices', evidence: 'Largest Contentful Paint: 8.2s', recommendation: 'Optimize images, minify CSS/JS, enable compression' },
      { id: randomUUID(), auditId: audit1.id, category: 'SEO', severity: 'HIGH', title: 'Missing meta description', description: 'No meta description tag found on homepage', evidence: 'No <meta name="description"> tag detected', recommendation: 'Add a compelling meta description under 160 characters' },
      { id: randomUUID(), auditId: audit1.id, category: 'CONVERSION', severity: 'HIGH', title: 'No online booking system', description: 'No appointment booking functionality detected', evidence: 'No booking forms or scheduling widgets found', recommendation: 'Implement online appointment booking system' },
      { id: randomUUID(), auditId: audit1.id, category: 'CONVERSION', severity: 'MEDIUM', title: 'No WhatsApp integration', description: 'No WhatsApp contact button or click-to-chat', evidence: 'No WhatsApp links found on any page', recommendation: 'Add WhatsApp Business API integration' },
      { id: randomUUID(), auditId: audit1.id, category: 'ACCESSIBILITY', severity: 'MEDIUM', title: 'Missing alt text on images', description: '3 out of 5 images lack alt attributes', evidence: 'Images without alt: hero-bg.jpg, team-1.png, clinic-2.jpg', recommendation: 'Add descriptive alt text to all images' },
      { id: randomUUID(), auditId: audit1.id, category: 'SEO', severity: 'LOW', title: 'No sitemap.xml', description: 'Sitemap not found at /sitemap.xml', evidence: '404 response on /sitemap.xml', recommendation: 'Generate and submit sitemap to search engines' },
    ],
  });

  const audit2 = await prisma.websiteAudit.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[4].id,
      websiteUrl: 'https://accradental.com',
      status: 'COMPLETED',
      performanceScore: 45,
      seoScore: 38,
      accessibilityScore: 60,
      mobileScore: 40,
      httpsEnabled: true,
      sslValid: false,
      pageTitle: 'Accra Dental Care',
      metaDescription: 'Dental services in Accra',
      hasSitemap: true,
      hasRobotsTxt: true,
      hasContactInfo: true,
      hasCTA: true,
      hasSocialLinks: true,
      hasForms: true,
      startedAt: new Date(Date.now() - 172800000),
      completedAt: new Date(Date.now() - 172000000),
    },
  });

  await prisma.auditFinding.createMany({
    data: [
      { id: randomUUID(), auditId: audit2.id, category: 'SECURITY', severity: 'HIGH', title: 'Invalid SSL certificate', description: 'SSL certificate is expired or misconfigured', evidence: 'Certificate expired 45 days ago', recommendation: 'Renew SSL certificate immediately' },
      { id: randomUUID(), auditId: audit2.id, category: 'PERFORMANCE', severity: 'HIGH', title: 'Slow page load', description: 'Page load time exceeds 5 seconds', evidence: 'LCP: 5.4s, FID: 320ms', recommendation: 'Optimize images and reduce JavaScript bundle size' },
      { id: randomUUID(), auditId: audit2.id, category: 'CONVERSION', severity: 'MEDIUM', title: 'No online booking', description: 'Contact form only, no scheduling', evidence: 'Only a generic contact form found', recommendation: 'Add appointment booking widget' },
    ],
  });

  // ── Prospect Opportunities ───────────────────
  await prisma.prospectOpportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[0].id,
      serviceId: services[0].id,
      problem: 'Website loads slowly on mobile, no online booking, no WhatsApp integration',
      recommendation: 'Website redesign with integrated booking system and WhatsApp automation',
      score: 91,
      aiConfidence: 0.92,
    },
  });

  await prisma.prospectOpportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[0].id,
      serviceId: services[3].id,
      problem: 'No online appointment system — patients must call to book',
      recommendation: 'Implement online booking system with automated reminders',
      score: 88,
      aiConfidence: 0.89,
    },
  });

  await prisma.prospectOpportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[4].id,
      serviceId: services[0].id,
      problem: 'Expired SSL certificate, slow load times, no booking system',
      recommendation: 'Website redesign with SSL renewal and booking integration',
      score: 85,
      aiConfidence: 0.87,
    },
  });

  // ── Email Account ────────────────────────────
  const emailAccount = await prisma.emailAccount.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      userId: agent.id,
      provider: 'GMAIL',
      email: 'agent@digitalboost.ai',
      encryptedCredentials: 'encrypted-placeholder',
      status: 'CONNECTED',
      dailyLimit: 50,
      signature: 'Ama Osei\nDigital Boost Agency\n+233 24 000 0000',
    },
  });

  // ── Campaign ─────────────────────────────────
  const campaign = await prisma.campaign.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: 'Accra Healthcare Outreach',
      status: 'RUNNING',
      emailAccountId: emailAccount.id,
      objective: 'Offer website redesign and booking systems to dental clinics in Accra',
      dailyLimit: 30,
      timezone: 'Africa/Accra',
      createdBy: agent.id,
    },
  });

  const step1 = await prisma.campaignStep.create({
    data: {
      id: randomUUID(),
      campaignId: campaign.id,
      stepNumber: 1,
      delayDays: 0,
      type: 'INITIAL',
      instructions: 'Introduce our services and highlight website issues found during audit',
    },
  });

  const step2 = await prisma.campaignStep.create({
    data: {
      id: randomUUID(),
      campaignId: campaign.id,
      stepNumber: 2,
      delayDays: 4,
      type: 'FOLLOW_UP',
      instructions: 'Follow up with specific examples of lost revenue from poor web presence',
    },
  });

  const step3 = await prisma.campaignStep.create({
    data: {
      id: randomUUID(),
      campaignId: campaign.id,
      stepNumber: 3,
      delayDays: 8,
      type: 'FOLLOW_UP',
      instructions: 'Share a case study of a similar clinic we helped',
    },
  });

  const step4 = await prisma.campaignStep.create({
    data: {
      id: randomUUID(),
      campaignId: campaign.id,
      stepNumber: 4,
      delayDays: 14,
      type: 'FINAL',
      instructions: 'Final follow-up with a limited-time offer',
    },
  });

  // Add prospects to campaign
  const healthcareProspects = prospects.filter((p) =>
    [0, 4, 9, 12].includes(prospects.indexOf(p)),
  );

  await Promise.all(
    healthcareProspects.map((p) =>
      prisma.campaignProspect.create({
        data: {
          id: randomUUID(),
          campaignId: campaign.id,
          prospectId: p.id,
          status: prospects.indexOf(p) === 0 ? 'SENT' : 'PENDING',
          currentStep: prospects.indexOf(p) === 0 ? 1 : 0,
          lastContactAt: prospects.indexOf(p) === 0 ? new Date(Date.now() - 86400000) : null,
          nextActionAt: prospects.indexOf(p) === 0 ? new Date(Date.now() + 259200000) : new Date(),
        },
      }),
    ),
  );

  // Generated message for Kofi Dental
  await prisma.generatedMessage.create({
    data: {
      id: randomUUID(),
      campaignProspectId: (await prisma.campaignProspect.findFirst({
        where: { campaignId: campaign.id, prospectId: prospects[0].id },
      }))!.id,
      stepId: step1.id,
      subject: 'Improving Kofi Dental Clinic\'s online presence',
      generatedText: `Hi Dr. Kofi,

I noticed your clinic currently accepts appointment requests primarily through phone calls. I also saw that your mobile website makes it difficult to find booking information — it took over 8 seconds to load on a mobile device.

I help clinics implement online appointment and WhatsApp booking systems that reduce manual calls and improve patient satisfaction. A well-optimized website with integrated booking typically increases appointment conversions by 30-40%.

Would you be open to a brief call this week to discuss how we could improve your patient booking experience?

Best regards,
Ama Osei
Digital Boost Agency`,
      personalizationScore: 92,
      spamScore: 8,
      ctaStrength: 81,
      approvedBy: agent.id,
    },
  });

  // ── Email Thread ─────────────────────────────
  const thread = await prisma.emailThread.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      prospectId: prospects[0].id,
      campaignId: campaign.id,
      subject: 'Improving Kofi Dental Clinic\'s online presence',
    },
  });

  await prisma.message.create({
    data: {
      id: randomUUID(),
      threadId: thread.id,
      direction: 'OUTBOUND',
      sender: 'agent@digitalboost.ai',
      recipient: 'info@kofidental.gh',
      subject: 'Improving Kofi Dental Clinic\'s online presence',
      bodyText: `Hi Dr. Kofi, I noticed your clinic currently accepts appointment requests primarily through phone calls...`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 86400000),
    },
  });

  await prisma.message.create({
    data: {
      id: randomUUID(),
      threadId: thread.id,
      direction: 'INBOUND',
      sender: 'info@kofidental.gh',
      recipient: 'agent@digitalboost.ai',
      subject: 'Re: Improving Kofi Dental Clinic\'s online presence',
      bodyText: `Hi Ama, thanks for reaching out. This is interesting. How much would something like this cost? We've been thinking about upgrading our website for a while now.`,
      status: 'RECEIVED',
      classification: 'PRICING_REQUEST',
      receivedAt: new Date(Date.now() - 36000000),
    },
  });

  // ── Opportunity ──────────────────────────────
  const opportunity = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[0].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Kofi Dental — Website Redesign + Booking',
      stage: 'PROPOSAL',
      value: 12000,
      currency: 'GHS',
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 604800000),
    },
  });

  // ── Proposal ─────────────────────────────────
  const proposal = await prisma.proposal.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      opportunityId: opportunity.id,
      title: 'Kofi Dental Clinic — Digital Transformation Proposal',
      status: 'SENT',
      total: 12000,
      currency: 'GHS',
      publicToken: randomUUID(),
      expiresAt: new Date(Date.now() + 1209600000),
    },
  });

  await prisma.proposalSection.createMany({
    data: [
      { id: randomUUID(), proposalId: proposal.id, sectionType: 'EXECUTIVE_SUMMARY', title: 'Executive Summary', content: 'We propose a comprehensive digital transformation for Kofi Dental Clinic, including a modern responsive website with integrated online booking, WhatsApp automation, and SEO optimization.', sortOrder: 1 },
      { id: randomUUID(), proposalId: proposal.id, sectionType: 'PROBLEM', title: 'Current Challenges', content: 'Your current website loads slowly on mobile devices (8.2s), lacks online booking functionality, has no WhatsApp integration, and is missing critical SEO metadata.', sortOrder: 2 },
      { id: randomUUID(), proposalId: proposal.id, sectionType: 'SOLUTION', title: 'Proposed Solution', content: 'A complete website redesign with: responsive design, online appointment booking system, WhatsApp Business API integration, SEO optimization, and performance improvements.', sortOrder: 3 },
      { id: randomUUID(), proposalId: proposal.id, sectionType: 'SCOPE', title: 'Scope of Work', content: '1. Website redesign (8 pages)\n2. Booking system development\n3. WhatsApp integration\n4. SEO setup\n5. Performance optimization\n6. Staff training', sortOrder: 4 },
      { id: randomUUID(), proposalId: proposal.id, sectionType: 'TIMELINE', title: 'Timeline', content: 'Week 1-2: Design & wireframes\nWeek 3-4: Development\nWeek 5: Booking system\nWeek 6: WhatsApp integration\nWeek 7: Testing & optimization\nWeek 8: Launch & training', sortOrder: 5 },
      { id: randomUUID(), proposalId: proposal.id, sectionType: 'INVESTMENT', title: 'Investment', content: 'Total project cost: GHS 12,000\nPayment schedule:\n- 50% upfront: GHS 6,000\n- 30% at milestone 4: GHS 3,600\n- 20% on delivery: GHS 2,400', sortOrder: 6 },
      { id: randomUUID(), proposalId: proposal.id, sectionType: 'NEXT_STEPS', title: 'Next Steps', content: '1. Review this proposal\n2. Schedule a kickoff meeting\n3. Sign the contract\n4. Begin development', sortOrder: 7 },
    ],
  });

  // ── Contract ─────────────────────────────────
  const contract = await prisma.contract.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      opportunityId: opportunity.id,
      title: 'Website Development Agreement — Kofi Dental Clinic',
      status: 'SENT',
      value: 12000,
      currency: 'GHS',
      startDate: new Date(Date.now() + 604800000),
      endDate: new Date(Date.now() + 604800000 + 5184000000),
      publicToken: randomUUID(),
    },
  });

  await prisma.contractVersion.create({
    data: {
      id: randomUUID(),
      contractId: contract.id,
      version: 1,
      content: 'WEBSITE DEVELOPMENT AGREEMENT\n\nThis agreement is made between Digital Boost Agency ("Developer") and Kofi Dental Clinic ("Client")...\n\n1. SCOPE OF WORK\nThe Developer agrees to provide website development services including...\n\n2. PAYMENT TERMS\nTotal: GHS 12,000\n50% upfront, 30% at milestone, 20% on delivery\n\n3. TIMELINE\n8 weeks from project kickoff\n\n4. INTELLECTUAL PROPERTY\nAll custom code becomes the property of the Client upon final payment...\n\n5. TERMINATION\nEither party may terminate with 14 days written notice...',
      createdBy: owner.id,
    },
  });

  await prisma.contractParty.createMany({
    data: [
      { id: randomUUID(), contractId: contract.id, name: 'Kwame Mensah', email: 'owner@clientos.ai', role: 'DEVELOPER' },
      { id: randomUUID(), contractId: contract.id, name: 'Dr. Kofi', email: 'info@kofidental.gh', role: 'CLIENT' },
    ],
  });

  // ── Project ──────────────────────────────────
  const project = await prisma.project.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: 'Kofi Dental — Website Redesign + Booking',
      description: 'Complete website redesign with online booking system and WhatsApp integration for Kofi Dental Clinic',
      status: 'ACTIVE',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 5184000000),
      budget: 12000,
      currency: 'GHS',
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: owner.id, projectRole: 'PROJECT_MANAGER' },
      { projectId: project.id, userId: developer.id, projectRole: 'DEVELOPER' },
      { projectId: project.id, userId: agent.id, projectRole: 'SALES_AGENT' },
    ],
  });

  // ── Milestones ───────────────────────────────
  const milestone1 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project.id,
      name: 'Design & Wireframes',
      description: 'Complete UI/UX design and wireframe approval',
      dueDate: new Date(Date.now() + 1209600000),
      status: 'IN_PROGRESS',
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project.id,
      name: 'Core Development',
      description: 'Website development and booking system integration',
      dueDate: new Date(Date.now() + 3024000000),
      status: 'PLANNED',
    },
  });

  const milestone3 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project.id,
      name: 'Integration & Testing',
      description: 'WhatsApp integration, SEO setup, and QA testing',
      dueDate: new Date(Date.now() + 4320000000),
      status: 'PLANNED',
    },
  });

  const milestone4 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project.id,
      name: 'Launch & Training',
      description: 'Final deployment and staff training',
      dueDate: new Date(Date.now() + 5184000000),
      status: 'PLANNED',
    },
  });

  // ── Tasks ────────────────────────────────────
  await prisma.task.createMany({
    data: [
      { id: randomUUID(), projectId: project.id, milestoneId: milestone1.id, title: 'Requirements gathering', description: 'Meet with client to gather detailed requirements', status: 'DONE', priority: 'HIGH', assignedTo: owner.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone1.id, title: 'Create wireframes', description: 'Design wireframes for all 8 pages', status: 'IN_PROGRESS', priority: 'HIGH', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone1.id, title: 'UI design mockups', description: 'Create high-fidelity UI mockups based on wireframes', status: 'TODO', priority: 'HIGH', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone1.id, title: 'Client design approval', description: 'Get client sign-off on design mockups', status: 'TODO', priority: 'URGENT', assignedTo: owner.id, aiGenerated: false },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone2.id, title: 'Set up project repository', description: 'Initialize Next.js project with Tailwind and component system', status: 'TODO', priority: 'MEDIUM', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone2.id, title: 'Develop homepage', description: 'Build responsive homepage with hero, services, and testimonials', status: 'TODO', priority: 'HIGH', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone2.id, title: 'Develop booking system', description: 'Build appointment booking calendar with time slot selection', status: 'TODO', priority: 'URGENT', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone3.id, title: 'WhatsApp Business API integration', description: 'Integrate WhatsApp for appointment confirmations and reminders', status: 'TODO', priority: 'HIGH', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone3.id, title: 'SEO optimization', description: 'Add meta tags, sitemap, robots.txt, and structured data', status: 'TODO', priority: 'MEDIUM', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone4.id, title: 'Deploy to production', description: 'Deploy website to production server with SSL', status: 'TODO', priority: 'URGENT', assignedTo: developer.id, aiGenerated: false },
      { id: randomUUID(), projectId: project.id, milestoneId: milestone4.id, title: 'Staff training session', description: 'Train clinic staff on managing bookings and website content', status: 'TODO', priority: 'MEDIUM', assignedTo: owner.id, aiGenerated: false },
    ],
  });

  // ── Additional Opportunities (spread across stages) ──
  const opp2 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[4].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Accra Dental Care — SSL & Booking Fix',
      stage: 'QUALIFIED',
      value: 4500,
      currency: 'GHS',
      probability: 35,
      expectedCloseDate: new Date(Date.now() + 1209600000),
    },
  });

  const opp3 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[6].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Savanna Boutique Hotel — Website Redesign',
      stage: 'CONTACTED',
      value: 8500,
      currency: 'GHS',
      probability: 25,
      expectedCloseDate: new Date(Date.now() + 2592000000),
    },
  });

  const opp4 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[12].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Riverside Dental — Full Digital Transformation',
      stage: 'NEGOTIATION',
      value: 18000,
      currency: 'GHS',
      probability: 75,
      expectedCloseDate: new Date(Date.now() + 432000000),
    },
  });

  const opp5 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[10].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Lagos Fashion House — E-commerce Store',
      stage: 'PROPOSAL',
      value: 12000,
      currency: 'GHS',
      probability: 50,
      expectedCloseDate: new Date(Date.now() + 864000000),
    },
  });

  const opp6 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[16].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'East Legon Spa — Booking & WhatsApp Integration',
      stage: 'NEW',
      value: 6000,
      currency: 'GHS',
      probability: 10,
      expectedCloseDate: new Date(Date.now() + 5184000000),
    },
  });

  const opp7 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[3].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Zenith Realty — Property Listing Platform',
      stage: 'WON',
      value: 15000,
      currency: 'GHS',
      probability: 100,
      expectedCloseDate: new Date(Date.now() - 604800000),
      wonAt: new Date(Date.now() - 604800000),
    },
  });

  const opp8 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[1].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Apex Law Partners — SEO Optimization',
      stage: 'LOST',
      value: 3000,
      currency: 'GHS',
      probability: 0,
      lostAt: new Date(Date.now() - 2592000000),
    },
  });

  const opp9 = await prisma.opportunity.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[19].id,
      organizationId: org.id,
      ownerId: agent.id,
      title: 'Adenta Fitness Center — Membership Portal',
      stage: 'REPLIED',
      value: 7000,
      currency: 'GHS',
      probability: 40,
      expectedCloseDate: new Date(Date.now() + 3024000000),
    },
  });

  // ── Additional Campaigns ─────────────────────
  const testCampaign = await prisma.campaign.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: 'Test Campaign',
      status: 'DRAFT',
      emailAccountId: emailAccount.id,
      objective: 'Book calls',
      dailyLimit: 30,
      timezone: 'Africa/Accra',
      createdBy: agent.id,
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: 'Hospitality Outreach — Q4',
      status: 'DRAFT',
      emailAccountId: emailAccount.id,
      objective: 'Offer website and booking system upgrades to hotels and restaurants',
      dailyLimit: 25,
      timezone: 'Africa/Accra',
      createdBy: agent.id,
    },
  });

  await Promise.all([
    prisma.campaignStep.create({
      data: {
        id: randomUUID(),
        campaignId: campaign2.id,
        stepNumber: 1,
        delayDays: 0,
        type: 'INITIAL',
        instructions: 'Introduce digital transformation services for hospitality businesses',
      },
    }),
    prisma.campaignStep.create({
      data: {
        id: randomUUID(),
        campaignId: campaign2.id,
        stepNumber: 2,
        delayDays: 5,
        type: 'FOLLOW_UP',
        instructions: 'Share case study of Savanna Boutique Hotel improvement',
      },
    }),
    prisma.campaignStep.create({
      data: {
        id: randomUUID(),
        campaignId: campaign2.id,
        stepNumber: 3,
        delayDays: 12,
        type: 'FINAL',
        instructions: 'Final offer with limited-time 15% discount',
      },
    }),
  ]);

  // Add hospitality prospects to campaign2
  const hospitalityProspects = [2, 6, 8, 13];
  await Promise.all(
    hospitalityProspects.map((idx) =>
      prisma.campaignProspect.create({
        data: {
          id: randomUUID(),
          campaignId: campaign2.id,
          prospectId: prospects[idx].id,
          status: 'PENDING',
          currentStep: 0,
          nextActionAt: new Date(Date.now() + 86400000),
        },
      }),
    ),
  );

  const campaign3 = await prisma.campaign.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: 'Legal Sector — SEO & Web Audit',
      status: 'PAUSED',
      emailAccountId: emailAccount.id,
      objective: 'Target law firms with poor search visibility and offer SEO packages',
      dailyLimit: 20,
      timezone: 'Africa/Accra',
      createdBy: agent.id,
    },
  });

  await Promise.all([
    prisma.campaignStep.create({
      data: {
        id: randomUUID(),
        campaignId: campaign3.id,
        stepNumber: 1,
        delayDays: 0,
        type: 'INITIAL',
        instructions: 'Share free SEO audit results and recommend improvements',
      },
    }),
    prisma.campaignStep.create({
      data: {
        id: randomUUID(),
        campaignId: campaign3.id,
        stepNumber: 2,
        delayDays: 7,
        type: 'FOLLOW_UP',
        instructions: 'Follow up with specific keyword gap analysis',
      },
    }),
  ]);

  // Add legal prospects to campaign3
  const legalProspects = [1, 5, 14];
  await Promise.all(
    legalProspects.map((idx) =>
      prisma.campaignProspect.create({
        data: {
          id: randomUUID(),
          campaignId: campaign3.id,
          prospectId: prospects[idx].id,
          status: idx === 1 ? 'SENT' : 'PENDING',
          currentStep: idx === 1 ? 1 : 0,
          lastContactAt: idx === 1 ? new Date(Date.now() - 172800000) : null,
          nextActionAt: idx === 1 ? new Date(Date.now() + 432000000) : new Date(),
        },
      }),
    ),
  );

  // ── Additional Website Audits ────────────────
  const audit3 = await prisma.websiteAudit.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[12].id,
      websiteUrl: 'https://riversidedental.gh',
      status: 'COMPLETED',
      performanceScore: 52,
      seoScore: 61,
      accessibilityScore: 70,
      mobileScore: 55,
      overallScore: 59,
      httpsEnabled: true,
      sslValid: true,
      pageTitle: 'Riverside Dental — Premium Dental Care',
      metaDescription: 'Premium dental services in Kumasi',
      hasSitemap: true,
      hasRobotsTxt: true,
      hasContactInfo: true,
      hasCTA: true,
      hasSocialLinks: true,
      hasForms: false,
      startedAt: new Date(Date.now() - 259200000),
      completedAt: new Date(Date.now() - 255600000),
    },
  });

  await prisma.auditFinding.createMany({
    data: [
      { id: randomUUID(), auditId: audit3.id, category: 'PERFORMANCE', severity: 'MEDIUM', title: 'Moderate page load time', description: 'LCP of 3.8s on mobile', evidence: 'LCP: 3.8s', recommendation: 'Optimize hero image and enable lazy loading' },
      { id: randomUUID(), auditId: audit3.id, category: 'CONVERSION', severity: 'HIGH', title: 'No online booking', description: 'Patients must call to book appointments', evidence: 'No booking widget found', recommendation: 'Add online appointment scheduling' },
      { id: randomUUID(), auditId: audit3.id, category: 'SEO', severity: 'LOW', title: 'Missing structured data', description: 'No schema.org markup for dental clinic', evidence: 'No JSON-LD found', recommendation: 'Add LocalBusiness and Dentist schema markup' },
    ],
  });

  const audit4 = await prisma.websiteAudit.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[10].id,
      websiteUrl: 'https://lagosfashion.ng',
      status: 'COMPLETED',
      performanceScore: 41,
      seoScore: 29,
      accessibilityScore: 48,
      mobileScore: 35,
      overallScore: 38,
      httpsEnabled: true,
      sslValid: true,
      pageTitle: 'Lagos Fashion House — Latest Trends',
      metaDescription: null,
      hasSitemap: false,
      hasRobotsTxt: false,
      hasContactInfo: false,
      hasCTA: false,
      hasSocialLinks: true,
      hasForms: false,
      startedAt: new Date(Date.now() - 432000000),
      completedAt: new Date(Date.now() - 428400000),
    },
  });

  await prisma.auditFinding.createMany({
    data: [
      { id: randomUUID(), auditId: audit4.id, category: 'SEO', severity: 'CRITICAL', title: 'No meta descriptions', description: 'All pages lack meta description tags', evidence: '0/12 pages have meta descriptions', recommendation: 'Add unique meta descriptions to all pages' },
      { id: randomUUID(), auditId: audit4.id, category: 'PERFORMANCE', severity: 'HIGH', title: 'Large unoptimized images', description: 'Product images are 3-5MB each', evidence: '12 images over 2MB', recommendation: 'Compress and convert images to WebP format' },
      { id: randomUUID(), auditId: audit4.id, category: 'CONVERSION', severity: 'HIGH', title: 'No e-commerce functionality', description: 'No online shopping cart or checkout', evidence: 'No cart or payment system found', recommendation: 'Implement full e-commerce solution with payment gateway' },
      { id: randomUUID(), auditId: audit4.id, category: 'ACCESSIBILITY', severity: 'MEDIUM', title: 'Poor color contrast', description: 'Text contrast ratio below WCAG AA', evidence: 'Contrast ratio 3.2:1 on product pages', recommendation: 'Increase contrast to meet WCAG AA standards (4.5:1)' },
    ],
  });

  const audit5 = await prisma.websiteAudit.create({
    data: {
      id: randomUUID(),
      prospectId: prospects[6].id,
      websiteUrl: 'https://savannahotel.com',
      status: 'COMPLETED',
      performanceScore: 58,
      seoScore: 51,
      accessibilityScore: 65,
      mobileScore: 60,
      overallScore: 58,
      httpsEnabled: true,
      sslValid: true,
      pageTitle: 'Savanna Boutique Hotel — Accra',
      metaDescription: 'Boutique hotel in Accra with modern amenities',
      hasSitemap: true,
      hasRobotsTxt: true,
      hasContactInfo: true,
      hasCTA: false,
      hasSocialLinks: true,
      hasForms: true,
      startedAt: new Date(Date.now() - 518400000),
      completedAt: new Date(Date.now() - 514800000),
    },
  });

  await prisma.auditFinding.createMany({
    data: [
      { id: randomUUID(), auditId: audit5.id, category: 'CONVERSION', severity: 'HIGH', title: 'No online booking system', description: 'Reservations only via phone or third-party portal', evidence: 'No native booking widget', recommendation: 'Implement direct booking engine with room availability' },
      { id: randomUUID(), auditId: audit5.id, category: 'SEO', severity: 'MEDIUM', title: 'Missing local business schema', description: 'No Hotel schema markup', evidence: 'No JSON-LD found', recommendation: 'Add Hotel schema with pricing and availability' },
    ],
  });

  // ── Additional Email Threads for Inbox ────────
  const thread2 = await prisma.emailThread.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      prospectId: prospects[12].id,
      campaignId: campaign.id,
      subject: 'Riverside Dental — Digital transformation proposal',
    },
  });

  await prisma.message.create({
    data: {
      id: randomUUID(),
      threadId: thread2.id,
      direction: 'OUTBOUND',
      sender: 'agent@digitalboost.ai',
      recipient: 'info@riversidedental.gh',
      subject: 'Riverside Dental — Digital transformation proposal',
      bodyText: `Hi Dr. Mensah,\n\nI noticed Riverside Dental has a solid website but is missing online booking. We can add that plus WhatsApp confirmations for your patients.\n\nWould you like to see a quick proposal?\n\nBest,\nAma Osei\nDigital Boost Agency`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 172800000),
    },
  });

  await prisma.message.create({
    data: {
      id: randomUUID(),
      threadId: thread2.id,
      direction: 'INBOUND',
      sender: 'info@riversidedental.gh',
      recipient: 'agent@digitalboost.ai',
      subject: 'Re: Riverside Dental — Digital transformation proposal',
      bodyText: `Hi Ama,\n\nYes, please send the proposal. We've been getting complaints about phone booking wait times. What's the timeline and cost?\n\nBest,\nDr. Mensah`,
      status: 'RECEIVED',
      classification: 'POSITIVE_REPLY',
      receivedAt: new Date(Date.now() - 86400000),
    },
  });

  const thread3 = await prisma.emailThread.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      prospectId: prospects[4].id,
      campaignId: campaign.id,
      subject: 'Accra Dental Care — SSL and website improvements',
    },
  });

  await prisma.message.create({
    data: {
      id: randomUUID(),
      threadId: thread3.id,
      direction: 'OUTBOUND',
      sender: 'agent@digitalboost.ai',
      recipient: 'admin@accradental.com',
      subject: 'Accra Dental Care — SSL and website improvements',
      bodyText: `Hello,\n\nI noticed your SSL certificate expired recently. This could be affecting patient trust and Google rankings. We can fix this and improve your website performance.\n\nLet me know if you'd like a free assessment.\n\nRegards,\nAma Osei`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 259200000),
    },
  });

  const thread4 = await prisma.emailThread.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      prospectId: prospects[10].id,
      campaignId: campaign.id,
      subject: 'Lagos Fashion House — Online store opportunity',
    },
  });

  await prisma.message.create({
    data: {
      id: randomUUID(),
      threadId: thread4.id,
      direction: 'OUTBOUND',
      sender: 'agent@digitalboost.ai',
      recipient: 'hello@lagosfashion.ng',
      subject: 'Lagos Fashion House — Online store opportunity',
      bodyText: `Hi,\n\nYour fashion brand has amazing products but no online store! We build e-commerce solutions that can help you sell across Nigeria and beyond.\n\nInterested in a quick chat?\n\nBest,\nAma Osei`,
      status: 'SENT',
      sentAt: new Date(Date.now() - 432000000),
    },
  });

  await prisma.message.create({
    data: {
      id: randomUUID(),
      threadId: thread4.id,
      direction: 'INBOUND',
      sender: 'hello@lagosfashion.ng',
      recipient: 'agent@digitalboost.ai',
      subject: 'Re: Lagos Fashion House — Online store opportunity',
      bodyText: `Hi Ama,\n\nWe've been thinking about this. Can you send us a proposal with pricing? We get a lot of inquiries on Instagram but can't process orders online.\n\nThanks,\nChioma`,
      status: 'RECEIVED',
      classification: 'POSITIVE_REPLY',
      receivedAt: new Date(Date.now() - 172800000),
    },
  });

  // ── Additional Proposals ─────────────────────
  const proposal2 = await prisma.proposal.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      opportunityId: opp4.id,
      title: 'Riverside Dental — Full Digital Transformation Proposal',
      status: 'DRAFT',
      total: 18000,
      currency: 'GHS',
      publicToken: randomUUID(),
      expiresAt: new Date(Date.now() + 2592000000),
    },
  });

  await prisma.proposalSection.createMany({
    data: [
      { id: randomUUID(), proposalId: proposal2.id, sectionType: 'EXECUTIVE_SUMMARY', title: 'Executive Summary', content: 'A comprehensive digital upgrade for Riverside Dental including website redesign, online booking, WhatsApp automation, and SEO optimization to streamline patient acquisition.', sortOrder: 1 },
      { id: randomUUID(), proposalId: proposal2.id, sectionType: 'PROBLEM', title: 'Current Challenges', content: 'Phone-only booking causes wait times and lost patients. Website lacks booking functionality. No WhatsApp integration for reminders.', sortOrder: 2 },
      { id: randomUUID(), proposalId: proposal2.id, sectionType: 'SOLUTION', title: 'Proposed Solution', content: 'Complete website redesign with integrated booking system, WhatsApp Business API for confirmations, and full SEO optimization.', sortOrder: 3 },
      { id: randomUUID(), proposalId: proposal2.id, sectionType: 'SCOPE', title: 'Scope of Work', content: '1. Website redesign (10 pages)\n2. Online booking system with calendar\n3. WhatsApp appointment reminders\n4. SEO optimization\n5. Google My Business setup\n6. Staff training', sortOrder: 4 },
      { id: randomUUID(), proposalId: proposal2.id, sectionType: 'TIMELINE', title: 'Timeline', content: 'Week 1-2: Design\nWeek 3-5: Development\nWeek 6: Booking system\nWeek 7: WhatsApp integration\nWeek 8: Testing & launch', sortOrder: 5 },
      { id: randomUUID(), proposalId: proposal2.id, sectionType: 'INVESTMENT', title: 'Investment', content: 'Total: GHS 18,000\n40% upfront: GHS 7,200\n30% at milestone: GHS 5,400\n30% on delivery: GHS 5,400', sortOrder: 6 },
    ],
  });

  const proposal3 = await prisma.proposal.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      opportunityId: opp5.id,
      title: 'Lagos Fashion House — E-commerce Solution Proposal',
      status: 'SENT',
      total: 12000,
      currency: 'GHS',
      publicToken: randomUUID(),
      expiresAt: new Date(Date.now() + 1209600000),
    },
  });

  await prisma.proposalSection.createMany({
    data: [
      { id: randomUUID(), proposalId: proposal3.id, sectionType: 'EXECUTIVE_SUMMARY', title: 'Executive Summary', content: 'Transform Lagos Fashion House from Instagram-based selling to a full e-commerce platform with payment integration, inventory management, and nationwide shipping.', sortOrder: 1 },
      { id: randomUUID(), proposalId: proposal3.id, sectionType: 'PROBLEM', title: 'Current Challenges', content: 'No online store. Orders come through Instagram DMs. No payment gateway. Manual inventory tracking. No shipping integration.', sortOrder: 2 },
      { id: randomUUID(), proposalId: proposal3.id, sectionType: 'SOLUTION', title: 'Proposed Solution', content: 'Full e-commerce website with Paystack integration, inventory dashboard, automated shipping calculations, and Instagram shop sync.', sortOrder: 3 },
      { id: randomUUID(), proposalId: proposal3.id, sectionType: 'SCOPE', title: 'Scope of Work', content: '1. E-commerce website (15 pages)\n2. Paystack payment integration\n3. Inventory management system\n4. Shipping calculator\n5. Instagram shop integration\n6. Admin training', sortOrder: 4 },
      { id: randomUUID(), proposalId: proposal3.id, sectionType: 'TIMELINE', title: 'Timeline', content: 'Week 1-3: Design & development\nWeek 4-5: Payment & shipping integration\nWeek 6: Testing\nWeek 7: Launch & training', sortOrder: 5 },
      { id: randomUUID(), proposalId: proposal3.id, sectionType: 'INVESTMENT', title: 'Investment', content: 'Total: GHS 12,000\n50% upfront: GHS 6,000\n50% on delivery: GHS 6,000', sortOrder: 6 },
    ],
  });

  // ── Additional Projects ──────────────────────
  const project2 = await prisma.project.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: 'Zenith Realty — Property Listing Platform',
      description: 'Custom property listing website with search, filter, and agent contact features for Lagos real estate market',
      status: 'COMPLETED',
      startDate: new Date(Date.now() - 7776000000),
      dueDate: new Date(Date.now() - 604800000),
      budget: 15000,
      currency: 'GHS',
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project2.id, userId: owner.id, projectRole: 'PROJECT_MANAGER' },
      { projectId: project2.id, userId: developer.id, projectRole: 'DEVELOPER' },
    ],
  });

  const p2m1 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project2.id,
      name: 'Design & Development',
      description: 'Complete website design and development',
      dueDate: new Date(Date.now() - 6048000000),
      status: 'COMPLETED',
    },
  });

  const p2m2 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project2.id,
      name: 'Search & Filter System',
      description: 'Property search with filters',
      dueDate: new Date(Date.now() - 4320000000),
      status: 'COMPLETED',
    },
  });

  const p2m3 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project2.id,
      name: 'Launch & Handover',
      description: 'Final deployment and training',
      dueDate: new Date(Date.now() - 604800000),
      status: 'COMPLETED',
    },
  });

  await prisma.task.createMany({
    data: [
      { id: randomUUID(), projectId: project2.id, milestoneId: p2m1.id, title: 'Requirements gathering', description: 'Meet with Zenith Realty team', status: 'DONE', priority: 'HIGH', assignedTo: owner.id, aiGenerated: false },
      { id: randomUUID(), projectId: project2.id, milestoneId: p2m1.id, title: 'UI/UX design', description: 'Design property listing pages', status: 'DONE', priority: 'HIGH', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project2.id, milestoneId: p2m1.id, title: 'Frontend development', description: 'Build responsive pages', status: 'DONE', priority: 'HIGH', assignedTo: developer.id, aiGenerated: false },
      { id: randomUUID(), projectId: project2.id, milestoneId: p2m2.id, title: 'Search algorithm', description: 'Implement property search with filters', status: 'DONE', priority: 'URGENT', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project2.id, milestoneId: p2m2.id, title: 'Map integration', description: 'Add Google Maps for property locations', status: 'DONE', priority: 'MEDIUM', assignedTo: developer.id, aiGenerated: false },
      { id: randomUUID(), projectId: project2.id, milestoneId: p2m3.id, title: 'Production deployment', description: 'Deploy to production with SSL', status: 'DONE', priority: 'URGENT', assignedTo: developer.id, aiGenerated: false },
      { id: randomUUID(), projectId: project2.id, milestoneId: p2m3.id, title: 'Staff training', description: 'Train agents on adding listings', status: 'DONE', priority: 'MEDIUM', assignedTo: owner.id, aiGenerated: false },
    ],
  });

  const project3 = await prisma.project.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      name: 'East Legon Spa — Booking & WhatsApp System',
      description: 'Online booking system with WhatsApp reminders for spa and wellness center',
      status: 'PLANNING',
      startDate: new Date(Date.now() + 604800000),
      dueDate: new Date(Date.now() + 5184000000),
      budget: 6000,
      currency: 'GHS',
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project3.id, userId: owner.id, projectRole: 'PROJECT_MANAGER' },
      { projectId: project3.id, userId: developer.id, projectRole: 'DEVELOPER' },
    ],
  });

  const p3m1 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project3.id,
      name: 'Discovery & Design',
      description: 'Requirements and UI design',
      dueDate: new Date(Date.now() + 1209600000),
      status: 'PLANNED',
    },
  });

  const p3m2 = await prisma.milestone.create({
    data: {
      id: randomUUID(),
      projectId: project3.id,
      name: 'Development & Integration',
      description: 'Booking system and WhatsApp integration',
      dueDate: new Date(Date.now() + 3024000000),
      status: 'PLANNED',
    },
  });

  await prisma.task.createMany({
    data: [
      { id: randomUUID(), projectId: project3.id, milestoneId: p3m1.id, title: 'Stakeholder meeting', description: 'Meet with spa management for requirements', status: 'TODO', priority: 'HIGH', assignedTo: owner.id, aiGenerated: false },
      { id: randomUUID(), projectId: project3.id, milestoneId: p3m1.id, title: 'Booking UI design', description: 'Design booking flow and calendar interface', status: 'TODO', priority: 'HIGH', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project3.id, milestoneId: p3m2.id, title: 'Booking backend', description: 'Build booking system with time slots', status: 'TODO', priority: 'URGENT', assignedTo: developer.id, aiGenerated: true },
      { id: randomUUID(), projectId: project3.id, milestoneId: p3m2.id, title: 'WhatsApp integration', description: 'Send booking confirmations via WhatsApp', status: 'TODO', priority: 'HIGH', assignedTo: developer.id, aiGenerated: true },
    ],
  });

  // ── Contract for Zenith Realty project ───────
  const contract2 = await prisma.contract.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      opportunityId: opp7.id,
      projectId: project2.id,
      title: 'Property Listing Platform Agreement — Zenith Realty',
      status: 'SIGNED',
      value: 15000,
      currency: 'GHS',
      startDate: new Date(Date.now() - 7776000000),
      endDate: new Date(Date.now() - 604800000),
      publicToken: randomUUID(),
    },
  });

  await prisma.contractVersion.create({
    data: {
      id: randomUUID(),
      contractId: contract2.id,
      version: 1,
      content: 'PROPERTY LISTING PLATFORM AGREEMENT\n\nThis agreement is made between Digital Boost Agency ("Developer") and Zenith Realty ("Client")...\n\n1. SCOPE OF WORK\nCustom property listing website with search and filter functionality...\n\n2. PAYMENT TERMS\nTotal: GHS 15,000\n50% upfront, 50% on delivery\n\n3. TIMELINE\n90 days from project kickoff\n\n4. INTELLECTUAL PROPERTY\nAll custom code becomes property of Client upon final payment...',
      createdBy: owner.id,
    },
  });

  await prisma.contractParty.createMany({
    data: [
      { id: randomUUID(), contractId: contract2.id, name: 'Kwame Mensah', email: 'owner@clientos.ai', role: 'DEVELOPER' },
      { id: randomUUID(), contractId: contract2.id, name: 'Tunde Adebayo', email: 'info@zenithrealty.ng', role: 'CLIENT' },
    ],
  });

  await prisma.contractSignature.createMany({
    data: [
      { id: randomUUID(), contractId: contract2.id, partyId: (await prisma.contractParty.findFirst({ where: { contractId: contract2.id, role: 'DEVELOPER' } }))!.id, signatureData: 'data:image/png;base64,iVBORw0KGgo=', auditMetadata: JSON.stringify({ ip: '41.215.1.10', userAgent: 'Chrome/120', timestamp: new Date(Date.now() - 7776000000).toISOString() }) },
      { id: randomUUID(), contractId: contract2.id, partyId: (await prisma.contractParty.findFirst({ where: { contractId: contract2.id, role: 'CLIENT' } }))!.id, signatureData: 'data:image/png;base64,iVBORw0KGgo=', auditMetadata: JSON.stringify({ ip: '105.112.1.5', userAgent: 'Safari/17', timestamp: new Date(Date.now() - 7740000000).toISOString() }) },
    ],
  });

  // ── Portfolio ────────────────────────────────
  const portfolio = await prisma.portfolio.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      username: 'digital-boost',
      headline: 'Web Development & Digital Transformation Agency',
      bio: 'We help businesses in Ghana and across Africa build powerful web presences, automate operations, and grow through digital channels.',
      published: true,
    },
  });

  // ── Portfolio Items (case studies) ───────────
  await prisma.portfolioItem.createMany({
    data: [
      { id: randomUUID(), portfolioId: portfolio.id, projectId: project2.id, title: 'Zenith Realty — Property Listing Platform', description: 'Custom real estate platform with advanced search, map integration, and agent dashboard. Increased property inquiries by 300%.', featuredImage: null, published: true },
      { id: randomUUID(), portfolioId: portfolio.id, projectId: project.id, title: 'Kofi Dental Clinic — Digital Transformation', description: 'Complete website redesign with online booking and WhatsApp automation. Reduced phone booking calls by 60%.', featuredImage: null, published: true },
    ],
  });

  // ── Reviews ──────────────────────────────────
  await prisma.review.createMany({
    data: [
      { id: randomUUID(), organizationId: org.id, projectId: project2.id, clientId: prospects[3].id, rating: 5, review: 'Digital Boost delivered an amazing platform. Our agents can now manage listings easily and clients find properties faster. Highly recommended!', status: 'APPROVED', verifiedAt: new Date(Date.now() - 2592000000), permissionToPublish: true },
      { id: randomUUID(), organizationId: org.id, projectId: project.id, clientId: prospects[0].id, rating: 5, review: 'The online booking system has transformed our clinic. Patients love booking online and WhatsApp reminders reduced no-shows significantly.', status: 'APPROVED', verifiedAt: new Date(Date.now() - 86400000), permissionToPublish: true },
    ],
  });

  // ── Subscription ─────────────────────────────
  await prisma.subscription.create({
    data: {
      id: randomUUID(),
      organizationId: org.id,
      planId: agencyPlan.id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      currentPeriodStart: new Date(Date.now() - 1296000000),
      currentPeriodEnd: new Date(Date.now() + 1296000000),
    },
  });

  // ── Additional Activities ────────────────────
  await prisma.activity.createMany({
    data: [
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[12].id, userId: agent.id, activityType: 'EMAIL_RECEIVED', description: 'Riverside Dental replied positively — requested proposal' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[10].id, userId: agent.id, activityType: 'EMAIL_RECEIVED', description: 'Lagos Fashion House replied — interested in e-commerce solution' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[3].id, userId: owner.id, activityType: 'OPPORTUNITY_CREATED', description: 'Opportunity won: Zenith Realty — Property Listing Platform (GHS 15,000)' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[3].id, userId: owner.id, activityType: 'PROJECT_CREATED', description: 'Project completed: Zenith Realty — Property Listing Platform' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[1].id, userId: agent.id, activityType: 'OPPORTUNITY_LOST', description: 'Opportunity lost: Apex Law Partners — went with competitor' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[4].id, userId: agent.id, activityType: 'AUDIT_COMPLETED', description: 'Website audit completed for Accra Dental Care — SSL issues found' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[10].id, userId: agent.id, activityType: 'AUDIT_COMPLETED', description: 'Website audit completed for Lagos Fashion House — score: 38/100' },
    ],
  });

  // ── Additional Notifications ─────────────────
  await prisma.notification.createMany({
    data: [
      { id: randomUUID(), organizationId: org.id, userId: agent.id, type: 'EMAIL_RECEIVED', title: 'Riverside Dental replied', body: 'Prospect requested proposal with timeline and cost', entityType: 'prospect', entityId: prospects[12].id },
      { id: randomUUID(), organizationId: org.id, userId: agent.id, type: 'EMAIL_RECEIVED', title: 'Lagos Fashion House replied', body: 'Interested in e-commerce solution, wants proposal', entityType: 'prospect', entityId: prospects[10].id },
      { id: randomUUID(), organizationId: org.id, userId: owner.id, type: 'PROJECT_COMPLETED', title: 'Project completed', body: 'Zenith Realty — Property Listing Platform marked as completed', entityType: 'project', entityId: project2.id },
      { id: randomUUID(), organizationId: org.id, userId: agent.id, type: 'OPPORTUNITY_WON', title: 'Deal won! 🎉', body: 'Zenith Realty — Property Listing Platform (GHS 15,000)', entityType: 'opportunity', entityId: opp7.id },
    ],
  });

  // ── Prospect Contacts ────────────────────────
  await prisma.prospectContact.createMany({
    data: [
      { id: randomUUID(), prospectId: prospects[0].id, name: 'Dr. Kofi Mensah', title: 'Owner / Lead Dentist', email: 'info@kofidental.gh', phone: '+233 24 123 4567', isPrimary: true },
      { id: randomUUID(), prospectId: prospects[4].id, name: 'Dr. Ama Boateng', title: 'Clinical Director', email: 'admin@accradental.com', phone: '+233 20 987 6543', isPrimary: true },
      { id: randomUUID(), prospectId: prospects[12].id, name: 'Dr. Mensah Owusu', title: 'Senior Dentist', email: 'info@riversidedental.gh', phone: '+233 27 555 0199', isPrimary: true },
      { id: randomUUID(), prospectId: prospects[10].id, name: 'Chioma Okafor', title: 'Founder / Creative Director', email: 'hello@lagosfashion.ng', phone: '+234 80 123 45678', isPrimary: true },
      { id: randomUUID(), prospectId: prospects[3].id, name: 'Tunde Adebayo', title: 'Managing Director', email: 'info@zenithrealty.ng', phone: '+234 80 987 65432', isPrimary: true },
      { id: randomUUID(), prospectId: prospects[6].id, name: 'Kwabena Asante', title: 'General Manager', email: 'stay@savannahotel.com', phone: '+233 24 456 7890', isPrimary: true },
      { id: randomUUID(), prospectId: prospects[16].id, name: 'Akosua Darko', title: 'Owner', email: 'bookings@eastlegonspa.gh', phone: '+233 26 111 2233', isPrimary: true },
    ],
  });

  // ── Activities ───────────────────────────────
  await prisma.activity.createMany({
    data: [
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[0].id, userId: agent.id, activityType: 'PROSPECT_CREATED', description: 'Kofi Dental Clinic added as prospect' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[0].id, userId: agent.id, activityType: 'AUDIT_COMPLETED', description: 'Website audit completed — score: 34/100 performance' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[0].id, userId: agent.id, activityType: 'EMAIL_SENT', description: 'Initial outreach email sent via Accra Healthcare Outreach campaign' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[0].id, userId: agent.id, activityType: 'EMAIL_RECEIVED', description: 'Prospect replied asking about pricing' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[0].id, userId: agent.id, activityType: 'OPPORTUNITY_CREATED', description: 'Opportunity created: Kofi Dental — Website Redesign + Booking (GHS 12,000)' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[0].id, userId: agent.id, activityType: 'PROPOSAL_CREATED', description: 'Proposal sent to Kofi Dental Clinic' },
      { id: randomUUID(), organizationId: org.id, prospectId: prospects[0].id, userId: owner.id, activityType: 'PROJECT_CREATED', description: 'Project created: Kofi Dental — Website Redesign + Booking' },
    ],
  });

  // ── Notifications ────────────────────────────
  await prisma.notification.createMany({
    data: [
      { id: randomUUID(), organizationId: org.id, userId: agent.id, type: 'EMAIL_RECEIVED', title: 'Kofi Dental Clinic replied', body: 'Prospect asked about pricing', entityType: 'prospect', entityId: prospects[0].id },
      { id: randomUUID(), organizationId: org.id, userId: owner.id, type: 'PROJECT_CREATED', title: 'New project started', body: 'Kofi Dental — Website Redesign + Booking', entityType: 'project', entityId: project.id },
      { id: randomUUID(), organizationId: org.id, userId: agent.id, type: 'TASK_OVERDUE', title: 'Task overdue', body: 'Create wireframes is overdue', entityType: 'project', entityId: project.id },
    ],
  });

  console.log('Seed data created successfully!');
  console.log(`Organization: ${org.name} (${org.slug})`);
  console.log(`Users: ${owner.email}, ${agent.email}, ${developer.email}`);
  console.log(`Services: ${services.length}`);
  console.log(`Prospects: ${prospects.length}`);
  console.log(`Login: owner@clientos.ai / Password123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
