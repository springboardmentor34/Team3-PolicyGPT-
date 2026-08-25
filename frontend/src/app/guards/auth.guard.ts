import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * authGuard
 * ----------------------------------------------------------------------
 * Protects routes that require a logged-in user (dashboards, reports,
 * profile, etc). Checks for a real JWT token via AuthService, and
 * redirects to /login with a returnUrl if the user isn't authenticated.
 * ----------------------------------------------------------------------
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const isAuthenticated = authService.isLoggedIn();

  if (!isAuthenticated) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  return true;
};