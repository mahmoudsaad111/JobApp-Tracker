import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import {
  LoginRequest, RegisterRequest, AuthResponse,VerifyEmailRequest,ChangePasswordRequest,forgotPasswordDto,resetPasswordDto, UserProfile, ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  
  private readonly USER_KEY = 'jt_user';

  // ─── Reactive state ─────────────────────────────────────────────────────────
  private _currentUser = signal<UserProfile | null>(this.loadUser());
  readonly currentUser  = this._currentUser.asReadonly();
  readonly isLoggedIn   = computed(() => !!this._currentUser());
readonly userName = computed( () => `${this._currentUser()?.firstName ?? ''} ${this._currentUser()?.lastName ?? ''}`.trim()
);  readonly userEmail    = computed(() => this._currentUser()?.email ?? '');

  // ─── Register ──────────────────────────────────────────────────────────────
register(body: RegisterRequest): Observable<ApiResponse<void>> {
  return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/register`, body);
}

// ─── Login ─────────────────────────────────────────────────────────────────
login(body: LoginRequest): Observable<ApiResponse<UserProfile>> {
  return this.http.post<ApiResponse<UserProfile>>(`${environment.apiUrl}/auth/login`, body)
    .pipe(tap(res => {
      this._currentUser.set(res.data);
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
    }));
}

// ─── Verify Email ───────────────────────────────────────────────────────────
verifyEmail(queryParamMap: VerifyEmailRequest): Observable<ApiResponse<void>> {
  return this.http.get<ApiResponse<void>>(
    `${environment.apiUrl}/auth/VerifyEmail?userId=${queryParamMap.userId}&token=${encodeURIComponent(queryParamMap.token!)}`
  );
}

// ─── Resend Verification ────────────────────────────────────────────────────
forgotPassword(email: string): Observable<forgotPasswordDto> {
    return this.http.post<forgotPasswordDto>(`${environment.apiUrl}/auth/ForgotPassword`, { email });
}
 
resetPassword(payload: {
    token:              string;
    email:              string;
    newPassword:        string;
    confirmNewPassword: string;
  }): Observable<resetPasswordDto> {
    return this.http.post<resetPasswordDto>(`${environment.apiUrl}/auth/ResetPassword`, payload);
  }
// ─── Resend Verification ────────────────────────────────────────────────────
resendVerification(email: string): Observable<ApiResponse<void>> {
  return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/ResendConfirmationEmail`, { email });
}

// ─── Change Password ────────────────────────────────────────────────────
changePassword(body: ChangePasswordRequest): Observable<ApiResponse<void>> {
  return this.http.post<ApiResponse<void>>(
    `${environment.apiUrl}/auth/ChangePassword`,body);
}

// ─── Logout ─────────────────────────────────────────────────────────────────
logout(): void {
  this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({
    complete: () => {
      localStorage.removeItem(this.USER_KEY);
      this._currentUser.set(null);
      this.router.navigate(['/auth/login']);
    },
    error: () => {
      localStorage.removeItem(this.USER_KEY);
      this._currentUser.set(null);
      this.router.navigate(['/auth/login']);
    }
  });
}

// ─── Profile ────────────────────────────────────────────────────────────────
getProfile(): Observable<ApiResponse<UserProfile>> {
  return this.http.get<ApiResponse<UserProfile>>(`${environment.apiUrl}/auth/me`)
    .pipe(tap(res => {
      this._currentUser.set(res.data);
      localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
    }));
}
clearSession(): void {
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
}
private loadUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
 }
}
