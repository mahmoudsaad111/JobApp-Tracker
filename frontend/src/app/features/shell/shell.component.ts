import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatBadgeModule
  ],
  template: `
    <div class="shell" [class.collapsed]="collapsed()">
      <!-- ── Sidebar ──────────────────────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon"><mat-icon>work</mat-icon></div>
            <span class="brand-name">JobTracker</span>
          </div>
          <button mat-icon-button class="collapse-btn" (click)="collapsed.set(!collapsed())">
            <mat-icon>{{ collapsed() ? 'menu' : 'menu_open' }}</mat-icon>
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a class="nav-item"
               [routerLink]="item.route"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
               [matTooltip]="collapsed() ? item.label : ''"
               matTooltipPosition="right">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <a class="nav-item" routerLink="/profile" routerLinkActive="active"
             [matTooltip]="collapsed() ? 'Profile' : ''" matTooltipPosition="right">
            <mat-icon>account_circle</mat-icon>
            <span class="nav-label">Profile</span>
          </a>
          <button class="nav-item logout" (click)="auth.logout()"
                  [matTooltip]="collapsed() ? 'Logout' : ''" matTooltipPosition="right">
            <mat-icon>logout</mat-icon>
            <span class="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <!-- ── Main ─────────────────────────────────────────────────────────── -->
      <div class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <button mat-icon-button class="mobile-menu" (click)="collapsed.set(!collapsed())">
              <mat-icon>menu</mat-icon>
            </button>
          </div>
          <div class="topbar-right">
            <button class="avatar-btn" [matMenuTriggerFor]="userMenu">
              <div class="avatar">{{ initials }}</div>
            </button>
            <mat-menu #userMenu="matMenu" xPosition="before">
              <div class="user-info-menu">
                <div class="uname">{{ auth.userName() }}</div>
                <div class="uemail">{{ auth.userEmail() }}</div>
              </div>
              <button mat-menu-item routerLink="/profile">
                <mat-icon>account_circle</mat-icon> Profile
              </button>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon> Logout
              </button>
            </mat-menu>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-base);
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 260px;
      min-width: 260px;
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid rgba(255,255,255,0.06);
      box-shadow: 4px 0 24px rgba(0,0,0,0.08);
      contain: layout style;
    }
    .shell.collapsed .sidebar {
      width: 72px;
      min-width: 72px;
    }

    .sidebar-header {
      padding: 18px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      min-height: 68px;
      background: rgba(255,255,255,0.02);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }
    .brand-icon {
      width: 38px;
      height: 38px;
      min-width: 38px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: white;
      }
    }
    .brand-name {
      color: white;
      font-weight: 700;
      font-size: 1.15rem;
      white-space: nowrap;
      letter-spacing: -0.02em;
    }
    .collapse-btn {
      color: rgba(255,255,255,0.55);
      transition: color 0.15s ease;
      &:hover { color: white; }
    }
    .shell.collapsed .brand-name {
      opacity: 0;
      width: 0;
      transition: opacity 0.2s ease;
    }

    .sidebar-nav {
      flex: 1;
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      overflow-y: auto;
    }
    .sidebar-footer {
      padding: 12px 10px;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: 12px;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      border: none;
      background: none;
      font-size: 0.9rem;
      font-weight: 500;
      font-family: inherit;
      white-space: nowrap;
      overflow: hidden;
      position: relative;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        min-width: 20px;
        opacity: 0.85;
      }
      .nav-label {
        overflow: hidden;
        transition: opacity 0.2s ease;
      }

      &:hover {
        background: rgba(255,255,255,0.08);
        color: white;
      }
      &.active {
        background: linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.08) 100%);
        color: white;
        font-weight: 600;
        box-shadow: inset 3px 0 0 #6366f1;

        mat-icon { opacity: 1; color: #818cf8; }
      }
      &.logout:hover {
        background: rgba(239,68,68,0.18);
        color: #fca5a5;
      }
    }
    .shell.collapsed .nav-label {
      opacity: 0;
      width: 0;
    }

    /* ── Main ── */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: var(--bg-base);
      contain: layout style paint;
    }

    .topbar {
      height: 68px;
      min-height: 68px;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .mobile-menu { display: none; }
    @media (max-width: 768px) {
      .mobile-menu { display: flex; }
    }

    .avatar-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      outline: none;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(99,102,241,0.35);
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover { transform: scale(1.08); box-shadow: 0 4px 16px rgba(99,102,241,0.45); }
    }
    .user-info-menu {
      padding: 14px 18px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 6px;
      min-width: 220px;
      .uname {
        font-weight: 700;
        font-size: 0.9rem;
        color: #0f172a;
      }
      .uemail {
        color: #64748b;
        font-size: 0.78rem;
        margin-top: 2px;
      }
    }
    .content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: 40px;
      position: relative;
    }

  `]
})
export class ShellComponent {
  auth      = inject(AuthService);
  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',    route: '/dashboard'    },
    { label: 'Applications', icon: 'work_outline', route: '/applications' },
    { label: 'Interviews',   icon: 'event',        route: '/interviews'   },
    { label: 'Notes',   icon: 'note_alt',        route: '/notes'   },
    {label: 'Documents',   icon: 'description',        route: '/documents'   },
  ];

  get initials(): string {
    const name = this.auth.userName();
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  }
}
