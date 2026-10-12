import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Just add withCredentials to every request — cookie is handled by browser
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // A 401 on the login form just means "wrong password" — it is not an expired session.
      const isLoginAttempt = req.url.toLowerCase().includes('/auth/login');
      if (error.status === 401 && !isLoginAttempt) {
        // Cookie expired or invalid — just logout, no refresh needed
        authService.clearSession();
      }
      return throwError(() => error);
    })
  );
};
