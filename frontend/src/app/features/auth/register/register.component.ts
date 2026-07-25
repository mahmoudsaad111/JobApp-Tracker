import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordMatch(g: AbstractControl) {
  const pw  = g.get('password')?.value;
  const cpw = g.get('confirmPassword')?.value;
  return pw === cpw ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-form">

  @if (registered) {
    <!-- ── Success State ── -->
    <div class="success-state">
      <div class="success-icon">
        <mat-icon>mark_email_unread</mat-icon>
      </div>
      <h2>Check your inbox!</h2>
      <p class="subtitle">
        We sent a verification link to<br>
        <strong>{{ registeredEmail }}</strong>
      </p>
      <p class="hint">Please confirm your email to activate your account.</p>
      <a routerLink="/auth/login" mat-flat-button color="primary" class="w-full submit-btn">
        Go to Sign In
      </a>
    </div>

  } @else {
    <!-- ── Register Form ── -->
    <h2>Create account</h2>
    <p class="subtitle">Start tracking your job search today</p>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>First Name</mat-label>
        <input matInput formControlName="firstName" placeholder="Jane">
        <mat-icon matPrefix>person</mat-icon>
        @if (form.get('firstName')?.hasError('required') && form.get('firstName')?.touched) {
          <mat-error>First name is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Last Name</mat-label>
        <input matInput formControlName="lastName" placeholder="Doe">
        <mat-icon matPrefix>person_outline</mat-icon>
        @if (form.get('lastName')?.hasError('required') && form.get('lastName')?.touched) {
          <mat-error>Last name is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Email</mat-label>
        <input matInput type="email" formControlName="email" placeholder="you@example.com">
        <mat-icon matPrefix>email</mat-icon>
        @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
          <mat-error>Email is required</mat-error>
        }
        @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
          <mat-error>Enter a valid email</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Password</mat-label>
        <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="password">
        <mat-icon matPrefix>lock</mat-icon>
        <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd">
          <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
        @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
          <mat-error>Minimum 8 characters</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Confirm Password</mat-label>
        <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="confirmPassword">
        <mat-icon matPrefix>lock_outline</mat-icon>
        @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
          <mat-error>Passwords do not match</mat-error>
        }
      </mat-form-field>

      @if (errorMessage) {
        <div class="error-banner">
          <mat-icon>error_outline</mat-icon>
          {{ errorMessage }}
        </div>
      }

      <button mat-flat-button color="primary" class="w-full submit-btn" type="submit" [disabled]="loading">
        @if (loading) { <mat-spinner diameter="20" /> } @else { Create Account }
      </button>
    </form>

    <p class="switch-link">
      Already have an account? <a routerLink="/auth/login">Sign in</a>
    </p>
  }

</div>
  `,
  styles: [`
    .auth-form {
      h2 { font-size: 1.5rem; font-weight: 700; color: #1a1f3a; }
      .subtitle { color: #6b7280; margin: 4px 0 24px; font-size: .9rem; }
    }
    form { display: flex; flex-direction: column; gap: 4px; }
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
    }
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: #fee2e2; color: #991b1b;
      padding: 10px 14px; border-radius: 8px; font-size: .875rem;
      animation: shake 0.4s ease;
    }
    .switch-link {
      text-align: center; margin-top: 20px; color: #6b7280; font-size: .875rem;
      a { color: #3949ab; font-weight: 600; text-decoration: none; }
    }

    /* ── Registration success state ── */
    .success-state {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 8px 0 4px;
      animation: scaleIn 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    .success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 18px;
      box-shadow: 0 8px 24px -6px rgba(16,185,129,.4);
      mat-icon { font-size: 34px; width: 34px; height: 34px; color: #059669; }
    }
    .success-state h2 { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .success-state .subtitle {
      color: #64748b; font-size: .9rem; line-height: 1.6; margin: 0 0 6px;
      strong { color: #0f172a; }
    }
    .success-state .hint {
      color: #94a3b8; font-size: .8rem; margin: 0 0 24px;
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }
  `]
})
export class RegisterComponent {
  private auth   = inject(AuthService);
  private notify = inject(NotificationService);

  form = inject(FormBuilder).nonNullable.group({
    firstName:            ['', Validators.required],
    lastName:['', Validators.required],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatch });

  loading = false;
  showPwd = false;
  errorMessage = ''; 
  registered  = false;
  registeredEmail = '';
  submit(): void {

    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const { firstName,lastName, email, password } = this.form.getRawValue();

    this.auth.register({ firstName,lastName, email, password }).subscribe({
      next: () => {
         this.registered = true;
         this.registeredEmail = email;  // ← comes from the form right here
         this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.message ?? 'Registration failed. Please try again.';
      },
      complete: () => { this.loading = false; }
    });
  }
}
