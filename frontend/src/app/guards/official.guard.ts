import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * officialGuard
 * ----------------------------------------------------------------------
 * Restricts a route to users whose JWT role is "official" (Government
 * Official) — same pattern as adminGuard. Assumes authGuard already ran
 * first on the same route to confirm the user is logged in at all.
 *
 * A logged-in non-official (e.g. a Citizen typing the URL directly) is
 * redirected to their own dashboard rather than back to /login, since
 * they ARE authenticated — just not authorized. Matches adminGuard's
 * redirect convention.
 * ----------------------------------------------------------------------
 */
export const officialGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const role = (authService.getRole() || '').toLowerCase();

  if (role === 'official') {
    return true;
  }

  router.navigate(['/citizen-dashboard']);
  return false;
};

/**
 * officialOrAdminGuard
 * ----------------------------------------------------------------------
 * Same idea as officialGuard, but also allows Admin/Administrator — for
 * routes (like Manage Policies & Schemes) that both roles legitimately
 * use.
 * ----------------------------------------------------------------------
 */
export const officialOrAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const role = (authService.getRole() || '').toLowerCase();

  if (role === 'official' || role === 'admin' || role === 'administrator') {
    return true;
  }

  router.navigate(['/citizen-dashboard']);
  return false;
};
