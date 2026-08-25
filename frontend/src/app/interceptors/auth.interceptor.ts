import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/**
 * authInterceptor
 * ----------------------------------------------------------------------
 * Automatically attaches the stored JWT token as an Authorization header
 * to every outgoing HTTP request, so individual services/components don't
 * need to manually set it each time.
 *
 * Also handles session expiry globally: if any request comes back 401
 * while a token was attached, the token is stale/expired. Rather than
 * every page silently failing its own way, the user is signed out and
 * sent to login with a clear message — once, in one place, instead of
 * being handled (or not handled) differently on every page.
 * ----------------------------------------------------------------------
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  const router = inject(Router);
  const toast = inject(ToastService);

  return next(cloned).pipe(
    catchError((error) => {
      // Only treat a 401 as "session expired" if a token was actually
      // sent — a 401 with no token is just an unauthenticated request
      // (e.g. a wrong password on the login form itself), not an
      // expired session, and shouldn't trigger a forced logout.
      if (error?.status === 401 && token) {
        localStorage.removeItem('token');

        if (!router.url.startsWith('/login')) {
          toast.info('Your session has expired. Please log in again.');
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};