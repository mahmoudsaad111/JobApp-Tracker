import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="auth-form verify-wrapper">

      @if (state === 'loading') {
        <mat-spinner diameter="48" />
        <p class="subtitle">Verifying your email…</p>
      }

      @if (state === 'success') {
        <div class="icon-circle success">
          <mat-icon>check_circle</mat-icon>
        </div>
        <h2>Email verified!</h2>
        <p class="subtitle">Your account is now active. You can sign in.</p>
        <a routerLink="/auth/login" mat-flat-button color="primary" class="w-full submit-btn">
          Go to Sign In
        </a>
      }

      @if (state === 'error') {
        <div class="icon-circle error">
          <mat-icon>error_outline</mat-icon>
        </div>
        <h2>Verification failed</h2>
        <p class="subtitle">{{ errorMessage }}</p>
        <a routerLink="/auth/login" mat-stroked-button color="primary" class="w-full submit-btn">
          Back to Sign In
        </a>
      }

    </div>
  `,
  styles: [`
    .verify-wrapper {
      display: flex; flex-direction: column;
      align-items: center; text-align: center; gap: 16px;
      animation: fadeIn 0.35s ease;
    }
    .icon-circle {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      animation: scaleIn 0.4s cubic-bezier(0.16,1,0.3,1);
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
      &.success { background: #dcfce7; mat-icon { color: #16a34a; } }
      &.error   { background: #fee2e2; mat-icon { color: #dc2626; } }
    }
    .submit-btn {
      margin-top: 8px; height: 48px; font-size: 1rem; font-weight: 600;
      border-radius: 10px !important;
      display: flex; align-items: center; justify-content: center;
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);

  state: 'loading' | 'success' | 'error' = 'loading';
  errorMessage = '';
  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const userId = this.route.snapshot.queryParamMap.get('userId');
    if (!token || !userId) {
      
      this.state = 'error';
      this.errorMessage = 'Verification link is invalid or expired.';
      return;
    }
    this.auth.verifyEmail({userId,token}).subscribe({
      next: () => this.state = 'success',
      error: err => {
      
        this.state = 'error';
        this.errorMessage = apiErrorMessage(err, 'Link is invalid or has expired.');
      }
    });
  }
}