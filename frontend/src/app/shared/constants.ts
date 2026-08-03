/**
 * Shared, static reference data used across multiple pages (filters, forms,
 * dropdowns). Centralized here so it can later be swapped for a REST-driven
 * lookup service without touching component logic.
 */
export const POLICY_CATEGORIES = [
  'Education',
  'Healthcare',
  'Agriculture',
  'Housing',
  'Environment',
  'Economy',
  'Women & Child',
  'Employment',
] as const;

export const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Maharashtra',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Uttar Pradesh',
  'West Bengal',
] as const;

export const POLICY_STATUSES = ['active', 'upcoming', 'closed'] as const;

export const USER_ROLES = ['citizen', 'government', 'researcher', 'organization', 'guest'] as const;
