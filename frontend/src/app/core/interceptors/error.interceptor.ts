import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        notify.error('Network error – please check your connection.');
      } else if (error.status === 403) {
        notify.error('You do not have permission to perform this action.');
      } else if (error.status === 404) {
        notify.error('The requested resource was not found.');
      } else if (error.status === 429) {
        notify.error('Too many attempts. Please wait a bit and try again.');
      } else if (error.status >= 500) {
        notify.error('A server error occurred. Please try again later.');
      }
      // 400 & 422 handled per-component for better UX
      return throwError(() => error);
    })
  );
};
