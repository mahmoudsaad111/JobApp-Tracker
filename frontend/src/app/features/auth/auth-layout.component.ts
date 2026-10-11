import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, MatIconModule],
  animations: [
    trigger('brandIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('420ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('boxIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px) scale(0.97)' }),
        animate('480ms 80ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
    ]),
  ],
  template: `
    <div class="auth-wrapper">
      <div class="auth-orb auth-orb--1"></div>
      <div class="auth-orb auth-orb--2"></div>
      <div class="auth-orb auth-orb--3"></div>

      <div class="auth-brand" @brandIn>
        <div class="brand-icon">
          <mat-icon>work</mat-icon>
        </div>
        <h1>JobTracker</h1>
        <p>Your career journey, organized.</p>
      </div>
      <div class="auth-box" @boxIn>
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');

    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f4f6;
      padding: 24px;
      flex-direction: column;
      gap: 18px;
      position: relative;
      overflow: hidden;
    }

    /* Decorative floating gradient orbs */
    .auth-orb {
      position: absolute;
      border-radius: 50%;
      display: none;
      filter: none;
      opacity: 0;
      pointer-events: none;
      animation: orbFloat 12s ease-in-out infinite;
    }
    .auth-orb--1 {
      width: 340px; height: 340px; top: -100px; left: -80px;
      background: radial-gradient(circle, #818cf8, transparent 70%);
      animation-delay: 0s;
    }
    .auth-orb--2 {
      width: 280px; height: 280px; bottom: -80px; right: -60px;
      background: radial-gradient(circle, #c084fc, transparent 70%);
      animation-delay: -4s;
    }
    .auth-orb--3 {
      width: 220px; height: 220px; top: 40%; right: 12%;
      background: radial-gradient(circle, #34d399, transparent 70%);
      opacity: 0.2;
      animation-delay: -8s;
    }
    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(24px, -18px) scale(1.06); }
    }

    .auth-brand {
      text-align: center;
      color: #252b31;
      position: relative; z-index: 1;
      .brand-icon {
        width: 42px; height: 42px;
        background: #3986bc;
        border-radius: 5px;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 12px;
        box-shadow: none;
        animation: none;
        mat-icon { font-size: 22px; width: 22px; height: 22px; color: white; }
      }
      h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; }
      p  { opacity: 1; color: #69747d; margin-top: 4px; font-size: .85rem; }
    }
    @keyframes brandPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,.18); }
      50%      { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
    }

    .auth-box {
      background: white;
      border: 1px solid #d9dfe3;
      border-radius: 6px;
      padding: 32px 36px 25px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 2px 8px rgba(27,39,48,.07);
      position: relative; z-index: 1;
    }
  `]
})
export class AuthLayoutComponent {}
