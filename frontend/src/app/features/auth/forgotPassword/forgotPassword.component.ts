import { Component, signal, inject } from '@angular/core';
import { CommonModule }              from '@angular/common';
import { FormsModule }               from '@angular/forms';
import { RouterLink }                from '@angular/router';
import { MatFormFieldModule }        from '@angular/material/form-field';
import { MatInputModule }            from '@angular/material/input';
import { MatButtonModule }           from '@angular/material/button';
import { MatIconModule }             from '@angular/material/icon';
import { MatProgressSpinnerModule }  from '@angular/material/progress-spinner';
import { AuthService }               from '@core/services/auth.service';

type ViewState = 'form' | 'sent';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `

    <!-- ── FORM VIEW ── -->
    @if (view() === 'form') {
      <div class="auth-form">
        <h2>Forgot your password?</h2>
        <p class="subtitle">Enter your email and we'll send you a reset link.</p>

        @if (errorMsg()) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ errorMsg() }}
          </div>
        }

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email"
                 name="email" placeholder="you@example.com"
                 (keydown.enter)="submit()" [disabled]="loading()">
          <mat-icon matPrefix>email</mat-icon>
          @if (touched && !email) {
            <mat-error>Email is required</mat-error>
          }
        </mat-form-field>

        <button mat-flat-button color="primary" class="w-full submit-btn"
                (click)="submit()" [disabled]="loading()">
          @if (loading()) {
            <mat-spinner diameter="20" />
          } @else {
            Send reset link
          }
        </button>

        <p class="switch-link">
          Remember your password?
          <a routerLink="/auth/login">Sign in</a>
        </p>
      </div>
    }

    <!-- ── SUCCESS VIEW ── -->
    @if (view() === 'sent') {
      <div class="auth-form">
        <div class="success-icon">
          <mat-icon>mark_email_read</mat-icon>
        </div>
        <h2>Check your inbox</h2>
        <p class="subtitle">
          If <strong>{{ email }}</strong> is registered, a reset link is on its way.
          It may take a minute or two to arrive.
        </p>
        <p class="hint">
          Didn't get it? Check your spam folder, or
          <button class="link-btn" (click)="resend()" [disabled]="resendCooldown() > 0">
            resend{{ resendCooldown() > 0 ? ' in ' + resendCooldown() + 's' : '' }}
          </button>.
        </p>
        <p class="switch-link">
          <a routerLink="/auth/login">Back to sign in</a>
        </p>
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

    .submit-btn {
      margin-top: 8px; height: 48px; font-size: 1rem; font-weight: 600;
      border-radius: 10px !important;
      display: flex; align-items: center; justify-content: center;
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
      mat-icon {
        font-size: 48px; width: 48px; height: 48px;
        color: #16a34a;
      }
    }

    .hint {
      color: #6b7280; font-size: .875rem; text-align: center; margin: 0;
    }

    .link-btn {
      background: none; border: none; cursor: pointer;
      color: #3949ab; font-size: inherit; font-weight: 600; padding: 0;
      text-decoration: underline;
      &:disabled { color: #94a3b8; cursor: default; text-decoration: none; }
    }
  `],
})
export class ForgotPasswordComponent {
  private authSvc = inject(AuthService);

  view    = signal<ViewState>('form');
  loading = signal(false);
  errorMsg = signal('');
  touched  = false;
  email    = '';

  resendCooldown = signal(0);
  private _timer: ReturnType<typeof setInterval> | null = null;

  submit(): void {
    this.touched = true;
    if (!this.email.trim()) return;

    this.loading.set(true);
    this.errorMsg.set('');

    this.authSvc.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.view.set('sent');
        this._startCooldown(60);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Something went wrong. Please try again.');
      },
    });
  }

  resend(): void {
    this.authSvc.forgotPassword(this.email.trim()).subscribe();
    this._startCooldown(60);
  }

  private _startCooldown(seconds: number): void {
    this.resendCooldown.set(seconds);
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      const next = this.resendCooldown() - 1;
      this.resendCooldown.set(next);
      if (next <= 0 && this._timer) { clearInterval(this._timer); this._timer = null; }
    }, 1000);
  }
}