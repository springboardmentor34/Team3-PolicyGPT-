export interface Scheme {
  id?: string;

  scheme_name: string;
  category: string;
  eligibility: string;
  benefits: string;
  department: string;
  state: string;

  isSaved?: boolean;
}