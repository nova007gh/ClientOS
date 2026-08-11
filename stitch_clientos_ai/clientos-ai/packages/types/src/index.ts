// ──────────────────────────────────────────────
// ClientOS AI — Shared Domain Types
// ──────────────────────────────────────────────

// ── Auth & Identity ───────────────────────────

export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_AGENT'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER'
  | 'TEAM_MEMBER'
  | 'VIEWER';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  currency: string;
  timezone: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED' | 'REMOVED';
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
  organization: Organization | null;
  role: UserRole | null;
}

// ── Services ──────────────────────────────────

export interface Service {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  startingPrice: number | null;
  currency: string;
  deliveryDays: number | null;
  idealCustomer: string | null;
  keywords: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
}

// ── Prospects / CRM ───────────────────────────

export type ProspectStatus =
  | 'NEW'
  | 'RESEARCHING'
  | 'AUDITED'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'MEETING'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'DO_NOT_CONTACT';

export type WebsiteStatus = 'NONE' | 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface Prospect {
  id: string;
  organizationId: string;
  companyName: string;
  industryId: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ProspectStatus;
  sourceId: string | null;
  leadScore: number | null;
  assignedUserId: string | null;
  rating: number | null;
  reviewCount: number | null;
  websiteStatus: WebsiteStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectContact {
  id: string;
  prospectId: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  isPrimary: boolean;
}

// ── Website Audit ─────────────────────────────

export type AuditStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface WebsiteAudit {
  id: string;
  prospectId: string;
  websiteUrl: string;
  status: AuditStatus;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  mobileScore: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AuditFinding {
  id: string;
  auditId: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  evidence: string | null;
  recommendation: string | null;
}

// ── Opportunities ─────────────────────────────

export interface ProspectOpportunity {
  id: string;
  prospectId: string;
  serviceId: string;
  problem: string;
  recommendation: string;
  score: number;
  aiConfidence: number;
}

export type OpportunityStage =
  | 'NEW'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'MEETING'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface Opportunity {
  id: string;
  prospectId: string;
  organizationId: string;
  ownerId: string;
  title: string;
  stage: OpportunityStage;
  value: number | null;
  currency: string;
  probability: number;
  expectedCloseDate: string | null;
  wonAt: string | null;
  lostAt: string | null;
}

// ── Activities ────────────────────────────────

export type ActivityType =
  | 'PROSPECT_CREATED'
  | 'PROSPECT_UPDATED'
  | 'AUDIT_STARTED'
  | 'AUDIT_COMPLETED'
  | 'EMAIL_SENT'
  | 'EMAIL_RECEIVED'
  | 'CALL_LOGGED'
  | 'MEETING_SCHEDULED'
  | 'NOTE_ADDED'
  | 'STATUS_CHANGED'
  | 'OPPORTUNITY_CREATED'
  | 'PROPOSAL_CREATED'
  | 'CONTRACT_SENT'
  | 'CONTRACT_SIGNED'
  | 'PROJECT_CREATED';

export interface Activity {
  id: string;
  organizationId: string;
  prospectId: string | null;
  userId: string;
  activityType: ActivityType;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ── Email ─────────────────────────────────────

export interface EmailAccount {
  id: string;
  organizationId: string;
  userId: string;
  provider: 'GMAIL' | 'OUTLOOK';
  email: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  dailyLimit: number;
  signature: string | null;
}

export interface EmailThread {
  id: string;
  organizationId: string;
  prospectId: string | null;
  campaignId: string | null;
  subject: string;
}

export interface Message {
  id: string;
  threadId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  providerMessageId: string | null;
  sender: string;
  recipient: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  status: 'DRAFT' | 'SENT' | 'DELIVERED' | 'BOUNCED' | 'RECEIVED';
  sentAt: string | null;
  receivedAt: string | null;
}

// ── Campaigns ─────────────────────────────────

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  status: CampaignStatus;
  emailAccountId: string;
  objective: string;
  dailyLimit: number;
  timezone: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStep {
  id: string;
  campaignId: string;
  stepNumber: number;
  delayDays: number;
  type: 'INITIAL' | 'FOLLOW_UP' | 'FINAL';
  instructions: string;
}

export type CampaignProspectStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'REPLIED'
  | 'BOUNCED'
  | 'UNSUBSCRIBED'
  | 'STOPPED';

export interface CampaignProspect {
  id: string;
  campaignId: string;
  prospectId: string;
  status: CampaignProspectStatus;
  currentStep: number;
  lastContactAt: string | null;
  nextActionAt: string | null;
}

export interface GeneratedMessage {
  id: string;
  campaignProspectId: string;
  stepId: string;
  generatedText: string;
  personalizationScore: number | null;
  spamScore: number | null;
  approvedBy: string | null;
  generatedAt: string;
}

// ── Proposals ─────────────────────────────────

export type ProposalStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Proposal {
  id: string;
  organizationId: string;
  opportunityId: string | null;
  clientId: string | null;
  title: string;
  status: ProposalStatus;
  total: number | null;
  currency: string;
  publicToken: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalSection {
  id: string;
  proposalId: string;
  sectionType: string;
  title: string;
  content: string;
  sortOrder: number;
}

// ── Contracts ─────────────────────────────────

export type ContractStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'SIGNED' | 'EXPIRED' | 'CANCELLED';

export interface Contract {
  id: string;
  organizationId: string;
  opportunityId: string | null;
  projectId: string | null;
  title: string;
  status: ContractStatus;
  value: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  publicToken: string;
  documentHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractVersion {
  id: string;
  contractId: string;
  version: number;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface ContractParty {
  id: string;
  contractId: string;
  name: string;
  email: string;
  role: string;
}

export interface ContractSignature {
  id: string;
  contractId: string;
  partyId: string;
  signatureData: string;
  signedAt: string;
  auditMetadata: Record<string, unknown>;
}

// ── Projects ──────────────────────────────────

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: string;
  organizationId: string;
  clientId: string | null;
  contractId: string | null;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  budget: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: string | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  projectId: string;
  milestoneId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  startDate: string | null;
  dueDate: string | null;
  aiGenerated: boolean;
}

// ── Reviews & Portfolio ───────────────────────

export interface Review {
  id: string;
  organizationId: string;
  projectId: string;
  clientId: string;
  rating: number;
  review: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedAt: string | null;
  permissionToPublish: boolean;
  createdAt: string;
}

export interface Portfolio {
  id: string;
  organizationId: string;
  username: string;
  headline: string;
  bio: string;
  published: boolean;
}

export interface PortfolioItem {
  id: string;
  portfolioId: string;
  projectId: string;
  title: string;
  description: string;
  featuredImage: string | null;
  published: boolean;
}

// ── AI ────────────────────────────────────────

export interface AiRun {
  id: string;
  organizationId: string;
  userId: string;
  agentType: string;
  entityType: string;
  entityId: string;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

// ── API Response Wrapper ──────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Business Discovery ────────────────────────

export interface BusinessSearchInput {
  country?: string;
  city?: string;
  industry?: string;
  keyword?: string;
  businessSize?: string;
  hasWebsite?: boolean | null;
  minRating?: number;
  maxReviewCount?: number;
  page?: number;
  pageSize?: number;
}

export interface BusinessResult {
  externalId: string;
  provider: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  description?: string;
}

export interface BusinessDetails extends BusinessResult {
  socialMedia?: Record<string, string>;
  openingHours?: Record<string, string>;
  categories?: string[];
}
