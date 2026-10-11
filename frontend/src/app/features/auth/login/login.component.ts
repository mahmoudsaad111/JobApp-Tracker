import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatCheckboxModule
  ],
  template: `
    <div class="auth-form">
      <h2>Welcome back</h2>
      <p class="subtitle">Sign in to your JobTracker account</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label class="login-field-label" for="login-email">Email address</label>
        <mat-form-field appearance="outline" class="w-full">
          <input matInput id="login-email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="username">
          <mat-icon matPrefix>email</mat-icon>
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>Email is required</mat-error>
          }
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <mat-error>Enter a valid email</mat-error>
          }
        </mat-form-field>

        <label class="login-field-label" for="login-password">Password</label>
        <mat-form-field appearance="outline" class="w-full">
          <input matInput id="login-password" [type]="showPwd ? 'text' : 'password'" formControlName="password" placeholder="Enter your password" autocomplete="current-password">
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd">
            <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
            <mat-error>Password is required</mat-error>
          }
        </mat-form-field>
        <div class="forgot-row">
<a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
        </div>

        @if (errorMessage) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage }}
          </div>
        }

        <button mat-flat-button color="primary" class="w-full submit-btn" type="submit" [disabled]="loading">
          @if (loading) {
            <mat-spinner diameter="20" />
          } @else {
            Sign In
          }
        </button>
      </form>

      <p class="switch-link">
        Don't have an account?
        <a routerLink="/auth/register">Create one</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-form {
      h2 {
        font-size: 1.6rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.03em;
      }
      .subtitle {
        color: #64748b;
        margin: 4px 0 26px;
        font-size: 0.9rem;
      }
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .login-field-label {
      color: #3d454d;
      font-size: 0.8rem;
      font-weight: 600;
      margin: 5px 0 2px;
    }

    input.mat-mdc-input-element {
      color: #252b31;
      font-size: 0.9rem;
      font-weight: 400;
      -webkit-text-fill-color: #252b31;
    }

    input.mat-mdc-input-element:-webkit-autofill,
    input.mat-mdc-input-element:-webkit-autofill:hover,
    input.mat-mdc-input-element:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px #fff inset;
      -webkit-text-fill-color: #252b31;
      caret-color: #252b31;
      transition: background-color 9999s ease-out;
    }

    /* matPrefix/matSuffix icons don't reliably inherit a visible color from
       Material's theme tokens — set it explicitly so they're never washed out. */
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

    .forgot-row {
      display: flex;
      justify-content: flex-end;
      margin-top: -6px;
      margin-bottom: 6px;
    }
    .forgot-link {
      font-size: 0.8rem;
      font-weight: 600;
      color: #6366f1;
      text-decoration: none;
      transition: opacity 0.15s;

      &:hover {
        opacity: 0.75;
        text-decoration: underline;
      }
    }

    .submit-btn {
      margin-top: 10px;
      height: 50px;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 12px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.01em;
      box-shadow: 0 4px 14px rgba(99,102,241,0.25) !important;
      transition: all 0.2s ease !important;

      &:hover {
        box-shadow: 0 6px 20px rgba(99,102,241,0.35) !important;
        transform: translateY(-1px);
      }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fef2f2;
      color: #991b1b;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.875rem;
      border: 1px solid #fecaca;
      font-weight: 500;
      animation: shake 0.4s ease;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #dc2626;
      }
    }
    .switch-link {
      text-align: center;
      margin-top: 22px;
      color: #64748b;
      font-size: 0.875rem;

      a {
        color: #6366f1;
        font-weight: 700;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  form = inject(FormBuilder).nonNullable.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading      = false;
  showPwd      = false;
  errorMessage = '';

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading      = true;
    this.errorMessage = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.notify.success('Welcome back!');
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Invalid email or password.';
      },
      complete: () => { this.loading = false; }
    });
  }
}
