import { HttpInterceptorFn } from '@angular/common/http';

/**
 * authInterceptor
 * ----------------------------------------------------------------------
 * Automatically attaches the stored JWT token as an Authorization header
 * to every outgoing HTTP request, so individual services/components don't
 * need to manually set it each time.
 * ----------------------------------------------------------------------
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};