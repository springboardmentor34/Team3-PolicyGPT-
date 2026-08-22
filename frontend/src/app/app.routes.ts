import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomeComponent),
    title: 'PolicyGPT | Home',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
    title: 'PolicyGPT | Login',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.RegisterComponent),
    title: 'PolicyGPT | Register',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
    title: 'PolicyGPT | Forgot Password',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
    title: 'PolicyGPT | Reset Password',
  },
  {
    path: 'citizen-dashboard',
    loadComponent: () =>
      import('./pages/citizen-dashboard/citizen-dashboard').then((m) => m.CitizenDashboardComponent),
    title: 'PolicyGPT | Citizen Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'government-dashboard',
    loadComponent: () =>
      import('./pages/government-dashboard/government-dashboard').then((m) => m.GovernmentDashboardComponent),
    title: 'PolicyGPT | Government Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent),
    title: 'PolicyGPT | Admin Dashboard',
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'user-management',
    loadComponent: () =>
      import('./pages/user-management/user-management').then((m) => m.UserManagementComponent),
    title: 'PolicyGPT | User Management',
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'manage-policies-schemes',
    loadComponent: () =>
      import('./pages/manage-policies-schemes/manage-policies-schemes').then((m) => m.ManagePoliciesSchemesComponent),
    title: 'PolicyGPT | Manage Policies & Schemes',
    canActivate: [authGuard],
  },
  {
    path: 'policy-approvals',
    loadComponent: () =>
      import('./pages/policy-approvals/policy-approvals').then((m) => m.PolicyApprovalsComponent),
    title: 'PolicyGPT | Policy Approvals',
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'policy-search',
    loadComponent: () => import('./pages/policy-search/policy-search').then((m) => m.PolicySearchComponent),
    title: 'PolicyGPT | Search Policies',
  },
  {
    path: 'policy-details/:id',
    loadComponent: () => import('./pages/policy-details/policy-details').then((m) => m.PolicyDetailsComponent),
    title: 'PolicyGPT | Policy Details',
  },
  {
    path: 'scheme-details/:id',
    loadComponent: () => import('./pages/scheme-details/scheme-details').then((m) => m.SchemeDetailsComponent),
    title: 'PolicyGPT | Scheme Details',
  },
  {
    path: 'eligibility-checker',
    loadComponent: () =>
      import('./pages/eligibility-checker/eligibility-checker').then((m) => m.EligibilityCheckerComponent),
    title: 'PolicyGPT | Eligibility Checker',
  },
  {
  path: 'scheme-matches',
  loadComponent: () =>
    import('./pages/scheme-matches/scheme-matches').then(
      (m) => m.SchemeMatchesComponent
    ),
  title: 'PolicyGPT | My Matched Schemes',
},
   {
  path: 'compare-policies',
  loadComponent: () =>
    import('./pages/compare-policies/compare-policies')
      .then(m => m.CompareComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports').then((m) => m.ReportsComponent),
    title: 'PolicyGPT | Reports',
    canActivate: [authGuard],
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications').then((m) => m.NotificationsComponent),
    title: 'PolicyGPT | Notifications',
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then((m) => m.ProfileComponent),
    title: 'PolicyGPT | Profile',
    canActivate: [authGuard],
  },
  
  {
  path: 'saved-policies',
  loadComponent: () =>
    import('./pages/saved-policies/saved-policies')
      .then(m => m.SavedPoliciesComponent),
  title: 'PolicyGPT | Saved Policies',
},
{
  path: 'applications',
  loadComponent: () =>
    import('./pages/applications/applications')
      .then((m) => m.ApplicationsComponent),
  title: 'PolicyGPT | Applications',
},
];