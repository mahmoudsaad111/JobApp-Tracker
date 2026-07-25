import {
  Component, inject, signal, computed, ViewChild, ElementRef,
  HostListener, AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

interface PaletteCommand {
  id: string;
  label: string;
  icon: string;
  group: 'Navigate' | 'Actions';
  keywords?: string;
  run: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  animations: [
    trigger('backdropIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('panelIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-12px) scale(0.97)' }),
        animate('200ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0, transform: 'translateY(-8px) scale(0.98)' })),
      ]),
    ]),
  ],
  template: `
    @if (isOpen()) {
      <div class="cp-backdrop" @backdropIn (click)="close()">
        <div class="cp-panel" @panelIn (click)="$event.stopPropagation()">

          <div class="cp-search-row">
            <mat-icon>search</mat-icon>
            <input
              #cpInput
              type="text"
              class="cp-input"
              placeholder="Search pages and actions..."
              [value]="query()"
              (input)="onQueryChange($any($event.target).value)"
              (keydown)="onKeydown($event)"
            />
            <kbd class="cp-esc">esc</kbd>
          </div>

          <div class="cp-results">
            @if (grouped().length === 0) {
              <div class="cp-empty">
                <mat-icon>search_off</mat-icon>
                <span>No matching commands</span>
              </div>
            }
            @for (grp of grouped(); track grp.group) {
              <div class="cp-group-label">{{ grp.group }}</div>
              @for (cmd of grp.items; track cmd.id) {
                <button
                  type="button"
                  class="cp-item"
                  [class.active]="cmd.id === activeId()"
                  (mouseenter)="activeId.set(cmd.id)"
                  (click)="execute(cmd)">
                  <mat-icon>{{ cmd.icon }}</mat-icon>
                  <span>{{ cmd.label }}</span>
                  @if (cmd.id === activeId()) {
                    <mat-icon class="cp-enter-hint">keyboard_return</mat-icon>
                  }
                </button>
              }
            }
          </div>

          <div class="cp-footer">
            <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
            <span><kbd>&crarr;</kbd> select</span>
            <span><kbd>esc</kbd> close</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cp-backdrop {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(10, 15, 30, 0.55);
      backdrop-filter: blur(4px);
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 12vh;
    }
    .cp-panel {
      width: 100%; max-width: 560px; margin: 0 20px;
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border-color);
      overflow: hidden;
      display: flex; flex-direction: column;
      max-height: 70vh;
    }
    .cp-search-row {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 18px;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      mat-icon:first-child { color: var(--text-tertiary); }
    }
    .cp-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 1rem; color: var(--text-primary); font-family: inherit;
      &::placeholder { color: var(--text-tertiary); }
    }
    .cp-esc {
      font-size: 0.68rem; font-weight: 700; color: var(--text-tertiary);
      border: 1px solid var(--border-color); border-radius: 5px;
      padding: 2px 6px; font-family: inherit;
    }
    .cp-results {
      overflow-y: auto; padding: 8px; flex: 1;
    }
    .cp-group-label {
      font-size: 0.68rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.07em; color: var(--text-tertiary);
      padding: 10px 10px 4px;
    }
    .cp-item {
      width: 100%; display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px; border: none;
      background: none; color: var(--text-primary);
      font-size: 0.9rem; font-weight: 600; cursor: pointer; text-align: left;
      transition: background 0.1s ease;
      mat-icon:first-child { color: var(--text-secondary); font-size: 19px; width: 19px; height: 19px; }
      &.active {
        background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12));
        mat-icon:first-child { color: var(--primary); }
      }
    }
    .cp-enter-hint {
      margin-left: auto !important; font-size: 15px !important;
      width: 15px !important; height: 15px !important;
      color: var(--text-tertiary) !important; opacity: 0.6;
    }
    .cp-empty {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 40px 20px; color: var(--text-tertiary);
      mat-icon { font-size: 28px; width: 28px; height: 28px; opacity: 0.5; }
      span { font-size: 0.85rem; }
    }
    .cp-footer {
      display: flex; gap: 16px;
      padding: 10px 18px;
      border-top: 1px solid var(--border-color);
      font-size: 0.72rem; color: var(--text-tertiary);
      flex-shrink: 0;
      kbd {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 16px; padding: 1px 4px; margin-right: 2px;
        border: 1px solid var(--border-color); border-radius: 4px;
        font-family: inherit; font-size: 0.68rem;
      }
    }
  `],
})
export class CommandPaletteComponent implements AfterViewChecked {
  private router = inject(Router);
  private auth   = inject(AuthService);
  theme          = inject(ThemeService);

  @ViewChild('cpInput') cpInput?: ElementRef<HTMLInputElement>;
  private didFocus = false;

  isOpen  = signal(false);
  query   = signal('');
  activeId = signal<string | null>(null);

  private commands = computed<PaletteCommand[]>(() => [
    { id: 'nav-dashboard',    label: 'Dashboard',          icon: 'dashboard',    group: 'Navigate', run: () => this.router.navigateByUrl('/dashboard') },
    { id: 'nav-applications', label: 'Applications',       icon: 'work_outline', group: 'Navigate', run: () => this.router.navigateByUrl('/applications') },
    { id: 'nav-interviews',   label: 'Interviews',         icon: 'event',        group: 'Navigate', run: () => this.router.navigateByUrl('/interviews') },
    { id: 'nav-notes',        label: 'Notes',              icon: 'note_alt',     group: 'Navigate', run: () => this.router.navigateByUrl('/notes') },
    { id: 'nav-documents',    label: 'Documents',          icon: 'description',  group: 'Navigate', run: () => this.router.navigateByUrl('/documents') },
    { id: 'nav-profile',      label: 'Profile',            icon: 'account_circle', group: 'Navigate', run: () => this.router.navigateByUrl('/profile') },
    { id: 'act-new-app',      label: 'New Application',    icon: 'add_circle',   group: 'Actions', keywords: 'create add job', run: () => this.router.navigateByUrl('/applications/new') },
    { id: 'act-theme',        label: this.theme.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode', icon: this.theme.isDark() ? 'light_mode' : 'dark_mode', group: 'Actions', keywords: 'theme dark light appearance', run: () => this.theme.toggle() },
    { id: 'act-logout',       label: 'Logout',             icon: 'logout',       group: 'Actions', keywords: 'sign out', run: () => this.auth.logout() },
  ]);

  filtered = computed<PaletteCommand[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.commands();
    if (!q) return all;
    return all.filter(c =>
      c.label.toLowerCase().includes(q) || (c.keywords ?? '').includes(q)
    );
  });

  grouped = computed<{ group: string; items: PaletteCommand[] }[]>(() => {
    const items = this.filtered();
    const nav = items.filter(c => c.group === 'Navigate');
    const act = items.filter(c => c.group === 'Actions');
    const out: { group: string; items: PaletteCommand[] }[] = [];
    if (nav.length) out.push({ group: 'Navigate', items: nav });
    if (act.length) out.push({ group: 'Actions', items: act });
    return out;
  });

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(e: KeyboardEvent): void {
    const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (isCmdK) {
      e.preventDefault();
      this.isOpen() ? this.close() : this.open();
    }
  }

  open(): void {
    this.query.set('');
    this.isOpen.set(true);
    this.didFocus = false;
    const first = this.filtered()[0];
    this.activeId.set(first?.id ?? null);
  }

  close(): void {
    this.isOpen.set(false);
  }

  ngAfterViewChecked(): void {
    if (this.isOpen() && !this.didFocus && this.cpInput) {
      this.didFocus = true;
      this.cpInput.nativeElement.focus();
    }
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    const first = this.filtered()[0];
    this.activeId.set(first?.id ?? null);
  }

  onKeydown(e: KeyboardEvent): void {
    const flat = this.filtered();
    if (flat.length === 0) {
      if (e.key === 'Escape') this.close();
      return;
    }
    const idx = flat.findIndex(c => c.id === this.activeId());

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = flat[(idx + 1 + flat.length) % flat.length];
      this.activeId.set(next.id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = flat[(idx - 1 + flat.length) % flat.length];
      this.activeId.set(prev.id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const active = flat.find(c => c.id === this.activeId()) ?? flat[0];
      if (active) this.execute(active);
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  execute(cmd: PaletteCommand): void {
    cmd.run();
    this.close();
  }
}
