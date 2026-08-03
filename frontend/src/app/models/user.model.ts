export type UserRole = 'citizen' | 'government' | 'researcher' | 'organization' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  state?: string;
  createdAt?: string;
}
