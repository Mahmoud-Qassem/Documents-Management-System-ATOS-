import { Injectable, WritableSignal, signal } from '@angular/core';
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

export type ProfilePayload = Omit<RegisterPayload, 'password'> & { password?: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = 'http://localhost:8080/auth';
  private tokenKey = 'jwt_token';

  // reactive auth state
  authState: WritableSignal<boolean> = signal(false);

  constructor(private http: HttpClient) {
    this.authState.set(this.isLoggedIn());
  }

  /** ------------------ LOGIN ------------------ **/
  login(payload: LoginPayload): Observable<any> {
    return this.http.post<any>(`${this.base}/login`, payload).pipe(
      tap(response => {
        // Expecting response to contain accessToken and refreshToken
        if (response.accessToken) {
          this.setToken(response.accessToken);
        }
        if (response.refreshToken) {
          this.setRefreshToken(response.refreshToken);
        }
        this.authState.set(this.isLoggedIn());
        try {
          localStorage.setItem('username', payload.email);
        } catch {
          // ignore when not available (SSR)
        }
      }),
      catchError(this.handleError)
    );
  }
  getBaseUrl() {
    return this.base;
  }
  getUserName() {
    try {
      return localStorage.getItem('username');
    } catch {
      return null;
    }
  }

  /** ------------------ REGISTER ------------------ **/
  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.base}/register`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /** ------------------ PROFILE ------------------ **/
  getProfile(): Observable<ProfilePayload> {
    return this.http.get<ProfilePayload>(`${this.base}/profile`).pipe(
      catchError(this.handleError)
    );
  }

  updateProfile(payload: ProfilePayload): Observable<any> {
    return this.http.put(`${this.base}/profile`, payload).pipe(
      catchError(this.handleError)
    );
  }

  /** ------------------ REFRESH TOKEN ------------------ **/
  setRefreshToken(token: string) {
    try {
      localStorage.setItem(this.tokenKey + '_refresh', token);
    } catch (e) {
      console.warn('Could not store refresh token', e);
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey + '_refresh');
    } catch {
      return null;
    }
  }

  clearRefreshToken() {
    try {
      localStorage.removeItem(this.tokenKey + '_refresh');
    } catch { }
  }

  /** ------------------ AUTH STATE ------------------ **/
  isLoggedIn(): boolean {
    const token = this.getRefreshToken();
    if (!token) return false;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true; // not a JWT
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return true;
      // exp is in seconds
      return payload.exp * 1000 > Date.now();
    } catch {
      return true;
    }
  }

  logout() {
    this.clearToken();
    this.clearRefreshToken();
    this.authState.set(this.isLoggedIn());
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
    } catch { }
  }

  /** ------------------ ERROR HANDLER ------------------ **/
  private handleError(error: HttpErrorResponse) {
    // Re-throw the original HttpErrorResponse so callers can inspect fields
    return throwError(() => error);
  }
}
