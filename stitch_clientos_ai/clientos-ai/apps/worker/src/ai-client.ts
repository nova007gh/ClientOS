import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';

export async function scoreLead(data: {
  prospectId: string;
  organizationId: string;
  companyName: string;
  industry?: string;
  website?: string;
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  hasWebsite: boolean;
  services: string[];
}): Promise<{ score: number; reasoning: string; recommendations: string[]; priority: string }> {
  const res = await axios.post(`${AI_SERVICE_URL}/v1/lead-score`, {
    company_name: data.companyName,
    industry: data.industry,
    website: data.website,
    city: data.city,
    country: data.country,
    rating: data.rating,
    review_count: data.reviewCount,
    has_website: data.hasWebsite,
    services: data.services,
  });
  return res.data;
}

export async function draftEmail(data: {
  prospectName: string;
  prospectIndustry?: string;
  prospectWebsite?: string;
  serviceName: string;
  serviceDescription?: string;
  tone?: string;
  language?: string;
}): Promise<{ email_body: string }> {
  const res = await axios.post(`${AI_SERVICE_URL}/v1/email-draft`, {
    prospect_name: data.prospectName,
    prospect_industry: data.prospectIndustry,
    prospect_website: data.prospectWebsite,
    service_name: data.serviceName,
    service_description: data.serviceDescription,
    tone: data.tone ?? 'professional',
    language: data.language ?? 'english',
  });
  return res.data;
}

export async function auditWebsite(data: {
  url: string;
  industry?: string;
  services: string[];
}): Promise<{
  overall_score: number;
  findings: Array<{ category: string; severity: string; title: string; description: string; recommendation: string }>;
  summary: string;
  opportunities: string[];
}> {
  const res = await axios.post(`${AI_SERVICE_URL}/v1/audit`, {
    url: data.url,
    industry: data.industry,
    services: data.services,
  });
  return res.data;
}
