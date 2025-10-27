import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  nationalId: string;
  password: string;
  mobileNumber?: string;
  address?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:8080/auth';
  private tokenKey = 'jwt_token';

  constructor(private http: HttpClient) {}

  /** ------------------ LOGIN ------------------ **/
  login(payload: LoginPayload): Observable<any> {
    return this.http.post<{ token: string }>(`${this.base}/login`, payload).pipe(
      tap(response => {
        if (response && response.token) {
          this.setToken(response.token);
        }
      }),
      catchError(this.handleError)
    );
  }

  /** ------------------ REGISTER ------------------ **/
  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.base}/register`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /** ------------------ TOKEN HANDLING ------------------ **/
  setToken(token: string) {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (e) {
      console.warn('Could not store token', e);
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  clearToken() {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch {}
  }

  /** ------------------ ERROR HANDLER ------------------ **/
  private handleError(error: HttpErrorResponse) {
    let message = 'An unexpected error occurred';

    // If backend sends structured Response object
    if (error.error) {
      if (typeof error.error === 'string') {
        message = error.error;
      } else if (error.error.statusMsg) {
        message = error.error.statusMsg;
      } else if (error.error.message) {
        message = error.error.message;
      }
    }

    // Fallback for network or unknown errors
    if (error.status === 0) {
      message = 'Cannot connect to the server. Please check your backend.';
    }

    return throwError(() => new Error(message));
  }
}
