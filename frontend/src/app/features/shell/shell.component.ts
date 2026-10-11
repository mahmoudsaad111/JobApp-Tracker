import { Component, inject, signal, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet, RouterLink, RouterLinkActive, Router,
  NavigationStart, NavigationEnd, NavigationCancel, NavigationError,
} from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CommandPaletteComponent } from '../../shared/components/command-palette/command-palette.component';

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
    MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatBadgeModule,
    CommandPaletteComponent,
  ],
  template: `
    <div class="shell" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <app-command-palette />
      @if (navigating()) {
        <div class="route-progress" [style.width.%]="navProgress()"></div>
      }
      @if (mobileOpen()) {
        <div class="mobile-backdrop" (click)="mobileOpen.set(false)"></div>
      }
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
               matTooltipPosition="right"
               (click)="mobileOpen.set(false)">
              <mat-icon>{{ item.icon }}</mat-icon>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <a class="nav-item" routerLink="/profile" routerLinkActive="active"
             [matTooltip]="collapsed() ? 'Profile' : ''" matTooltipPosition="right"
             (click)="mobileOpen.set(false)">
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
            <button type="button" class="cp-trigger" (click)="openPalette()">
              <mat-icon>search</mat-icon>
              <span>Search...</span>
              <kbd>{{ isMac ? '⌘' : 'Ctrl' }}K</kbd>
            </button>
          </div>
          <div class="topbar-right">
            <button mat-icon-button class="theme-toggle" (click)="theme.toggle()" [matTooltip]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
              <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
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
    :host {
      display: block;
      height: 100vh;
    }
    .shell {
      display: flex;
      align-items: stretch;
      height: 100%;
      background: var(--bg-base);
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 230px;
      min-width: 230px;
      background: #292e33;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-right: 1px solid #42484c;
      box-shadow: none;
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
      background: #3986bc;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
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
      min-height: 0;
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
      border-radius: 4px;
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
        background: #41474c;
        color: white;
        font-weight: 600;
        box-shadow: inset 3px 0 0 #3986bc;

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
      min-width: 0;
      min-height: 0;
      background: var(--bg-base);
    }

    .topbar {
      height: 68px;
      min-height: 68px;
      background: var(--bg-surface);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      position: sticky;
      top: 0;
      z-index: 20;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    :host-context(.dark) .topbar {
      background: var(--bg-surface);
    }
    .mobile-menu { display: none; }
    @media (max-width: 768px) {
      .mobile-menu { display: flex; position: relative; z-index: 61; pointer-events: auto; }

      .sidebar {
        position: fixed;
        top: 0; left: 0; bottom: 0;
        z-index: 60;
        width: 260px;
        min-width: 260px;
        transform: translateX(-100%);
        transition: transform 0.28s cubic-bezier(0.16,1,0.3,1);
      }
      .shell.collapsed .sidebar {
        /* On mobile the desktop icon-rail state is irrelevant — the drawer
           is either fully open or fully hidden, never a narrow rail. */
        width: 260px;
        min-width: 260px;
      }
      .shell.mobile-open .sidebar {
        transform: translateX(0);
        box-shadow: 12px 0 40px rgba(0,0,0,0.35);
      }
      .shell.collapsed .brand-name,
      .shell.collapsed .nav-label {
        opacity: 1;
        width: auto;
      }
    }

    .mobile-backdrop {
      position: fixed;
      inset: 0;
      z-index: 55;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(2px);
      animation: fadeIn 0.2s ease;
    }

    /* ── Route-change progress bar ── */
    .route-progress {
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      z-index: 9999;
      background: var(--primary);
      background-size: 100% 100%;
      animation: none;
      transition: width 0.2s ease-out;
      box-shadow: none;
    }
    @keyframes routeShimmer {
      0%   { background-position: 0% 0; }
      100% { background-position: 150% 0; }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cp-trigger {
      display: flex; align-items: center; gap: 8px;
      background: var(--surface-2);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 7px 10px 7px 12px;
      cursor: pointer;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 0.85rem;
      transition: border-color 0.15s ease, background 0.15s ease;

      mat-icon { font-size: 17px; width: 17px; height: 17px; }
      span { white-space: nowrap; }
      kbd {
        margin-left: 4px;
        font-size: 0.68rem; font-weight: 700; font-family: inherit;
        border: 1px solid var(--border-color); border-radius: 5px;
        padding: 1px 6px; color: var(--text-tertiary);
        background: var(--bg-surface);
      }
      &:hover {
        border-color: var(--primary);
        background: var(--bg-surface);
      }
      @media (max-width: 480px) {
        span { display: none; }
      }
    }
    .theme-toggle {
      color: var(--text-secondary);
      mat-icon { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
      &:hover mat-icon { transform: rotate(24deg) scale(1.1); }
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
      background: #3986bc;
      color: white;
      font-size: 0.9rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover { transform: none; box-shadow: none; }
    }
    .user-info-menu {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 6px;
      min-width: 220px;
      .uname {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--text-primary);
      }
      .uemail {
        color: var(--text-secondary);
        font-size: 0.78rem;
        margin-top: 2px;
      }
    }
    .content {
      flex: 1;
      min-height: 0;
      overflow-x: hidden;
      overflow-y: auto;
      position: relative;
    }

  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  auth      = inject(AuthService);
  theme     = inject(ThemeService);
  private router = inject(Router);
  collapsed = signal(false);
  mobileOpen = signal(false);

  @ViewChild(CommandPaletteComponent) palette?: CommandPaletteComponent;
  readonly isMac = typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);

  openPalette(): void {
    this.palette?.open();
  }

  navigating  = signal(false);
  navProgress = signal(0);
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private routerSub?: { unsubscribe(): void };

  ngOnInit(): void {
    this.routerSub = this.router.events.subscribe(evt => {
      if (evt instanceof NavigationStart) {
        this.navigating.set(true);
        this.navProgress.set(8);
        if (this.progressTimer) clearInterval(this.progressTimer);
        this.progressTimer = setInterval(() => {
          const cur = this.navProgress();
          if (cur < 88) this.navProgress.set(cur + (88 - cur) * 0.12);
        }, 120);
      } else if (
        evt instanceof NavigationEnd ||
        evt instanceof NavigationCancel ||
        evt instanceof NavigationError
      ) {
        if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; }
        this.navProgress.set(100);
        setTimeout(() => { this.navigating.set(false); this.navProgress.set(0); }, 220);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    if (this.progressTimer) clearInterval(this.progressTimer);
  }

  toggleMobileMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.mobileOpen.set(!this.mobileOpen());
  }

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
