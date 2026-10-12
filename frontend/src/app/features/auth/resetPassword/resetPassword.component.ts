import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { MatProgressSpinnerModule }  from '@angular/material/progress-spinner';
import { AuthService }               from '@core/services/auth.service';
import { apiErrorMessage }           from '../../../core/utils/api-error';

type ViewState = 'form' | 'success' | 'invalid';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `

    <!-- ── INVALID TOKEN ── -->
    @if (view() === 'invalid') {
      <div class="auth-form">
        <h2>Link expired or invalid</h2>
        <p class="subtitle">
          This password reset link is no longer valid. Links expire after 24 hours.
        </p>
        <button mat-stroked-button color="primary" class="w-full submit-btn"
                routerLink="/auth/forgot-password">
          <mat-icon>refresh</mat-icon> Request a new link
        </button>
        <p class="switch-link">
          <a routerLink="/auth/login">Back to sign in</a>
        </p>
      </div>
    }

    <!-- ── FORM ── -->
    @if (view() === 'form') {
      <div class="auth-form">
        <h2>Set a new password</h2>
        <p class="subtitle">At least 8 characters with a mix of letters and numbers.</p>

        @if (errorMsg()) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ errorMsg() }}
          </div>
        }

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>New password</mat-label>
          <input matInput [type]="showNew ? 'text' : 'password'"
                 [(ngModel)]="newPassword" name="newPassword"
                 placeholder="Min. 8 characters" [disabled]="loading()">
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix type="button" (click)="showNew = !showNew">
            <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (touched && !newPassword) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>

        <!-- Strength bar -->
        @if (newPassword) {
          <div class="strength-bar">
            @for (seg of [0,1,2,3]; track seg) {
              <div class="strength-seg"
                   [style.background]="seg < strength() ? strengthColor() : '#e2e8f0'"></div>
            }
            <span class="strength-label" [style.color]="strengthColor()">{{ strengthLabel() }}</span>
          </div>
        }

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Confirm new password</mat-label>
          <input matInput [type]="showConfirm ? 'text' : 'password'"
                 [(ngModel)]="confirmPassword" name="confirmPassword"
                 placeholder="Repeat your password"
                 (keydown.enter)="submit()" [disabled]="loading()">
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix type="button" (click)="showConfirm = !showConfirm">
            <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (touched && newPassword && newPassword !== confirmPassword) {
            <mat-error>Passwords don't match</mat-error>
          }
        </mat-form-field>

        <button mat-flat-button color="primary" class="w-full submit-btn"
                (click)="submit()" [disabled]="loading()">
          @if (loading()) {
            <mat-spinner diameter="20" />
          } @else {
            Update password
          }
        </button>

        <p class="switch-link">
          <a routerLink="/auth/login">Back to sign in</a>
        </p>
      </div>
    }

    <!-- ── SUCCESS ── -->
    @if (view() === 'success') {
      <div class="auth-form">
        <div class="success-icon">
          <mat-icon>check_circle</mat-icon>
        </div>
        <h2>Password updated!</h2>
        <p class="subtitle">Your password has been changed. You can now sign in with your new password.</p>
        <button mat-flat-button color="primary" class="w-full submit-btn"
                routerLink="/auth/login">
          <mat-icon>login</mat-icon> Go to sign in
        </button>
      </div>
    }
  `,
  styles: [`
    .auth-form {
      animation: fadeIn 0.35s ease;
      h2 { font-size: 1.5rem; font-weight: 700; color: #1a1f3a; }
      .subtitle { color: #6b7280; margin: 4px 0 24px; font-size: .9rem; line-height: 1.6; }
    }

    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: #fee2e2; color: #991b1b;
      padding: 10px 14px; border-radius: 8px;
      font-size: .875rem; margin-bottom: 12px;
      animation: shake 0.4s ease;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }

    .w-full { width: 100%; }
    mat-icon[matPrefix] {
      color: #94a3b8;
      margin-right: 4px;
    }
    .mat-mdc-form-field:focus-within mat-icon[matPrefix] {
      color: #6366f1;
    }
    button[matSuffix] mat-icon {
      color: #94a3b8;
    }

    .submit-btn {
      margin-top: 8px; height: 48px; font-size: 1rem; font-weight: 600;
      border-radius: 10px !important;
      display: flex; align-items: center; justify-content: center;
      gap: 6px;
    }

    .strength-bar {
      display: flex; align-items: center; gap: 4px;
      margin: -12px 0 8px;
    }
    .strength-seg {
      flex: 1; height: 3px; border-radius: 3px;
      transition: background .25s;
    }
    .strength-label {
      font-size: .72rem; font-weight: 700; min-width: 36px;
      transition: color .25s;
    }

    .switch-link {
      text-align: center; margin-top: 20px;
      color: #6b7280; font-size: .875rem;
      a { color: #3949ab; font-weight: 600; text-decoration: none;
          &:hover { text-decoration: underline; } }
    }

    .success-icon {
      display: flex; justify-content: center; margin-bottom: 16px;
      animation: scaleIn 0.4s cubic-bezier(0.16,1,0.3,1);
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #16a34a; }
    }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private authSvc = inject(AuthService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);

  view     = signal<ViewState>('form');
  loading  = signal(false);
  errorMsg = signal('');
  touched  = false;

  newPassword     = '';
  confirmPassword = '';
  showNew         = false;
  showConfirm     = false;

  private token = '';
  private email = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] ?? '';
    this.email = this.route.snapshot.queryParams['email'] ?? '';
    if (!this.token || !this.email) this.view.set('invalid');
  }

  strength(): number {
    const p = this.newPassword;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    return s;
  }

  strengthColor(): string {
    return ['#ef4444', '#f97316', '#eab308', '#22c55e'][this.strength() - 1] ?? '#e2e8f0';
  }

  strengthLabel(): string {
    return ['Weak', 'Fair', 'Good', 'Strong'][this.strength() - 1] ?? '';
  }

  submit(): void {
    this.touched = true;
    if (!this.newPassword || this.newPassword !== this.confirmPassword) return;

    this.loading.set(true);
    this.errorMsg.set('');

    this.authSvc.resetPassword({
      token:              this.token,
      email:              this.email,
      newPassword:        this.newPassword,
      confirmNewPassword: this.confirmPassword,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.view.set('success');
      },
      error: err => {
        this.loading.set(false);
        // The API now answers a failed reset with HTTP 400 and a message.
        const msg = apiErrorMessage(err, 'Something went wrong. Please try again.');
        if (/invalid|expired/i.test(msg)) {
          this.view.set('invalid');
        } else {
          this.errorMsg.set(msg);
        }
      },
    });
  }
}