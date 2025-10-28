import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpBackend,
  HttpClient
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class RefreshInterceptor implements HttpInterceptor {
  private router = inject(Router);
  private backend = inject(HttpBackend);

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle only 400/401 errors
        if (![400, 401].includes(error.status)) {
          return throwError(() => error);
        }

        const errorMessage = error.error?.errorMessage || '';

        // Skip if this is the refresh-token or login request itself
        if (req.url.includes('/refresh-token') || req.url.includes('/login')) {
          this.handleRefreshOrLoginError(errorMessage);
          return throwError(() => error);
        }

        // ---- Handle Access Token Errors ----
        if (errorMessage === 'Missed access token') {
          this.handleLogout();
          return throwError(() => error);
        }

        if (errorMessage === 'Invalid access token') {
          this.handleLogout();
          return throwError(() => error);
        }

        if (errorMessage === 'Expired access token') {
          // Try refreshing the access token
          const refreshToken = this.auth.getRefreshToken();
          if (!refreshToken) {
            this.handleLogout();
            return throwError(() => error);
          }

          const http = new HttpClient(this.backend);
          return http
            .post<any>(`${this.auth.getBaseUrl()}/refresh-token`, { refreshToken })
            .pipe(
              switchMap((res) => {
                if (res.accessToken) this.auth.setToken(res.accessToken);
                if (res.refreshToken) this.auth.setRefreshToken(res.refreshToken);

                const newReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${this.auth.getToken()}` }
                });

                return next.handle(newReq);
              }),
              catchError((err: HttpErrorResponse) => {
                this.handleRefreshOrLoginError(err.error?.errorMessage);
                return throwError(() => err);
              })
            );
        }

        // ---- Handle Refresh Token Errors (if returned from backend anyway) ----
        this.handleRefreshOrLoginError(errorMessage);
        return throwError(() => error);
      })
    );
  }

  // Handles refresh/login endpoint-specific errors
  private handleRefreshOrLoginError(errorMessage: string) {
    if (
      errorMessage === 'Invalid refresh token' ||
      errorMessage === 'Expired refresh token' ||
      errorMessage === 'Missed refresh token'
    ) {
      this.handleLogout();
    }
  }

  private handleLogout() {
    this.auth.clearToken();
    this.auth.clearRefreshToken();
    setTimeout(() => this.router.navigateByUrl('/login'));
  }
}
