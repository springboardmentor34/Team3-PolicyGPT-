import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * authGuard
 * ----------------------------------------------------------------------
 * Placeholder route guard. No real authentication is implemented on the
 * frontend per project scope — this simply demonstrates where a future
 * AuthService (backed by the FastAPI backend) would be injected to check
 * session/token validity before allowing access to protected routes such
 * as dashboards and profile pages.
 * ----------------------------------------------------------------------
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // TODO: Replace with a real AuthService call once backend auth is wired up.
  const isAuthenticated = true;

  if (!isAuthenticated) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  return true;
};
