export type SchemeStatus = 'active' | 'upcoming' | 'closed';

export interface Scheme {
  id: string;
  name: string;
  description: string;
  category: string;
  ministry: string;
  state: string;
  status: SchemeStatus;
  launchDate: string;
  applicationDeadline?: string;
  benefits: string[];
  eligibility: string[];
  requiredDocuments: string[];
  applicationProcess: string[];
  beneficiaries: number;
  budget?: string;
  isSaved?: boolean;
}
