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

// 'All India' is a wildcard value, not a real state — it means "no state
// restriction" and must be kept in sync with the wildcard strings the
// backend recognizes in eligibility_check.py's _matches().
export const ALL_INDIA = 'All India';

export const INDIAN_STATES = [
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
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
] as const;

// State -> a few representative districts. Not exhaustive — extend as
// needed — but every state a user can pick MUST have an entry here so the
// district dropdown is never silently wrong for the selected state.
export const STATE_DISTRICTS: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Punjab': ['Amritsar', 'Ludhiana', 'Jalandhar', 'Patiala'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Salem', 'Madurai', 'Erode', 'Trichy', 'Tiruppur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
};

// Genders a person can identify as (used for the citizen's own profile).
export const GENDERS = ['Male', 'Female', 'Other'] as const;

// Occupations the eligibility checker asks a citizen to pick from. An
// eligibility rule's `occupation` field must use one of these exact
// strings (or be left blank for "any occupation") to ever be able to
// match — free text on the admin side can never match a citizen pick.
export const OCCUPATIONS = ['Farmer', 'Self-employed', 'Salaried', 'Unemployed'] as const;

export const SOCIAL_CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'] as const;

export const POLICY_STATUSES = ['active', 'upcoming', 'closed'] as const;

export const USER_ROLES = ['citizen', 'government', 'researcher', 'organization', 'guest'] as const;