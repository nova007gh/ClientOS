import { z } from 'zod';

// ── Auth ───────────────────────────────────────

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

// ── Organization ───────────────────────────────

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, alphanumeric, and hyphenated'),
  country: z.string().optional(),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum([
    'OWNER',
    'ADMIN',
    'SALES_MANAGER',
    'SALES_AGENT',
    'PROJECT_MANAGER',
    'DEVELOPER',
    'TEAM_MEMBER',
    'VIEWER',
  ]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([
    'OWNER',
    'ADMIN',
    'SALES_MANAGER',
    'SALES_AGENT',
    'PROJECT_MANAGER',
    'DEVELOPER',
    'TEAM_MEMBER',
    'VIEWER',
  ]),
});

// ── Onboarding ─────────────────────────────────

export const onboardingSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  country: z.string().min(1, 'Country is required'),
  city: z.string().min(1, 'City is required'),
  timezone: z.string().default('UTC'),
  currency: z.string().default('USD'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  companyName: z.string().min(1, 'Company name is required').max(200),
  services: z
    .array(
      z.object({
        name: z.string().min(1, 'Service name is required'),
        description: z.string().optional().default(''),
        startingPrice: z.number().min(0).optional().nullable(),
        currency: z.string().default('USD'),
        deliveryDays: z.number().int().min(1).optional().nullable(),
        idealCustomer: z.string().optional(),
        keywords: z.array(z.string()).default([]).transform((v) => JSON.stringify(v)),
      }),
    )
    .min(1, 'At least one service is required'),
});

// ── Services ───────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(200),
  description: z.string().max(2000).optional().default(''),
  startingPrice: z.number().min(0).optional().nullable(),
  currency: z.string().default('USD'),
  deliveryDays: z.number().int().min(1).optional().nullable(),
  idealCustomer: z.string().optional(),
  keywords: z.array(z.string()).default([]).transform((v) => JSON.stringify(v)),
  active: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();

// ── Prospects ──────────────────────────────────

export const createProspectSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  industryId: z.string().uuid().optional().nullable(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviewCount: z.number().int().min(0).optional().nullable(),
});

export const updateProspectSchema = createProspectSchema.partial().extend({
  status: z
    .enum([
      'NEW',
      'RESEARCHING',
      'AUDITED',
      'QUALIFIED',
      'CONTACTED',
      'REPLIED',
      'MEETING',
      'PROPOSAL',
      'NEGOTIATION',
      'WON',
      'LOST',
      'DO_NOT_CONTACT',
    ])
    .optional(),
  leadScore: z.number().int().min(0).max(100).optional().nullable(),
  assignedUserId: z.string().uuid().optional().nullable(),
});

export const csvImportSchema = z.object({
  file: z.any(),
  mapping: z.record(z.string(), z.string()).optional(),
});

// ── Business Discovery ─────────────────────────

export const businessSearchSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  keyword: z.string().optional(),
  businessSize: z.string().optional(),
  hasWebsite: z.boolean().optional().nullable(),
  minRating: z.number().min(0).max(5).optional(),
  maxReviewCount: z.number().int().min(0).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

// ── Campaigns ──────────────────────────────────

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  emailAccountId: z.string().uuid(),
  objective: z.string().max(500).optional().default(''),
  dailyLimit: z.number().int().min(1).max(500).default(50),
  timezone: z.string().default('UTC'),
  steps: z
    .array(
      z.object({
        stepNumber: z.number().int().min(1),
        delayDays: z.number().int().min(0),
        type: z.enum(['INITIAL', 'FOLLOW_UP', 'FINAL']),
        instructions: z.string().min(1, 'Instructions are required'),
      }),
    )
    .min(1, 'At least one campaign step is required'),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z
    .enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'])
    .optional(),
  objective: z.string().max(500).optional(),
  dailyLimit: z.number().int().min(1).max(500).optional(),
});

export const addProspectsToCampaignSchema = z.object({
  prospectIds: z.array(z.string().uuid()).min(1, 'Select at least one prospect'),
});

// ── Email Accounts ─────────────────────────────

export const connectEmailSchema = z.object({
  provider: z.enum(['GMAIL', 'OUTLOOK']),
  authCode: z.string().min(1, 'Authorization code is required'),
});

export const updateEmailAccountSchema = z.object({
  dailyLimit: z.number().int().min(1).max(500).optional(),
  signature: z.string().optional(),
  status: z.enum(['CONNECTED', 'DISCONNECTED']).optional(),
});

// ── Proposals ──────────────────────────────────

export const createProposalSchema = z.object({
  opportunityId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  sections: z
    .array(
      z.object({
        sectionType: z.string(),
        title: z.string(),
        content: z.string(),
        sortOrder: z.number().int(),
      }),
    )
    .optional(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  sections: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        sectionType: z.string(),
        title: z.string(),
        content: z.string(),
        sortOrder: z.number().int(),
      }),
    )
    .optional(),
});

// ── Contracts ──────────────────────────────────

export const createContractSchema = z.object({
  opportunityId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  value: z.number().min(0).optional().nullable(),
  currency: z.string().default('USD'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  content: z.string(),
  parties: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.string(),
      }),
    )
    .min(1, 'At least one party is required'),
});

export const updateContractSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  value: z.number().min(0).optional().nullable(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'EXPIRED', 'CANCELLED']).optional(),
});

// ── Projects ───────────────────────────────────

export const createProjectSchema = z.object({
  contractId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().optional().default(''),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  currency: z.string().default('USD'),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
});

// ── Tasks ──────────────────────────────────────

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional().nullable(),
  parentTaskId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().optional().default(''),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedTo: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});

// ── Reviews ────────────────────────────────────

export const createReviewSchema = z.object({
  projectId: z.string().uuid(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  review: z.string().min(10, 'Review must be at least 10 characters').max(5000),
  permissionToPublish: z.boolean().default(false),
});

// ── AI ─────────────────────────────────────────

export const aiLeadScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  confidence: z.number().min(0).max(1),
  problems: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
    }),
  ),
  recommendedServices: z.array(
    z.object({
      serviceId: z.string().uuid(),
      reason: z.string(),
    }),
  ),
  nextAction: z.enum(['CONTACT', 'RESEARCH', 'DISQUALIFY', 'WAIT']),
  reasoningSummary: z.string(),
});

export const aiMessageSchema = z.object({
  subject: z.string(),
  body: z.string(),
  personalizationScore: z.number().min(0).max(100),
  spamScore: z.number().min(0).max(100),
  ctaStrength: z.number().min(0).max(100),
});

export const aiReplyClassificationSchema = z.object({
  classification: z.enum([
    'INTERESTED',
    'NOT_INTERESTED',
    'QUESTION',
    'PRICING_REQUEST',
    'MEETING_REQUEST',
    'FOLLOW_UP_LATER',
    'OBJECTION',
    'UNSUBSCRIBE',
    'OUT_OF_OFFICE',
  ]),
  confidence: z.number().min(0).max(1),
  suggestedResponse: z.string(),
  requiresApproval: z.boolean(),
});

export const aiProjectPlanSchema = z.object({
  phases: z.array(
    z.object({
      name: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      milestones: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          dueDate: z.string(),
          tasks: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
              estimatedDays: z.number().int().min(1),
              suggestedRole: z.string(),
              dependencies: z.array(z.string()).optional(),
            }),
          ),
        }),
      ),
    }),
  ),
});

// ── Pagination ─────────────────────────────────

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

// ── Type Exports ───────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type CreateProspectInput = z.infer<typeof createProspectSchema>;
export type BusinessSearchInput = z.infer<typeof businessSearchSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
