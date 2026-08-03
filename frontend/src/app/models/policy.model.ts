export type PolicyStatus = 'active' | 'upcoming' | 'closed';

export interface Policy {
  id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  state: string;
  status: PolicyStatus;
  publishedDate: string;
  effectiveDate: string;
  benefits: string[];
  eligibility: string[];
  requiredDocuments: string[];
  tags: string[];
  thumbnail?: string;
  documentUrl?: string;
  viewCount: number;
  isSaved?: boolean;
}
