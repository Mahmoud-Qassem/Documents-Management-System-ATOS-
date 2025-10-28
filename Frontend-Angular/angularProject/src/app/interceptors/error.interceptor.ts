import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { throwError, catchError } from 'rxjs';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        let message = 'An unexpected error occurred';
        if (error.error?.statusMsg) message = error.error.statusMsg;
        else if (error.message) message = error.message;
        return throwError(() => new Error(message));
      })
    );
  }
}
