import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * adminGuard
 * ----------------------------------------------------------------------
 * Restricts a route to users whose JWT role is "admin" (or
 * "administrator" — matches the backend's case-insensitive check in
 * require_roles()). Assumes authGuard already ran first on the same
 * route to confirm the user is logged in at all; this only adds the
 * role check on top.
 *
 * A logged-in non-admin is redirected to their own dashboard rather than
 * back to /login, since they ARE authenticated — just not authorized.
 * ----------------------------------------------------------------------
 */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const role = (authService.getRole() || '').toLowerCase();

  if (role === 'admin' || role === 'administrator') {
    return true;
  }

  router.navigate(['/citizen-dashboard']);
  return false;
};
