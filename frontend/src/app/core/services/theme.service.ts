import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'jt_theme';

  readonly isDark = signal(this.getInitial());

  constructor() {
    // Runs immediately on injection and again any time isDark() changes.
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }

  set(dark: boolean): void {
    this.isDark.set(dark);
  }

  private getInitial(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    // No saved preference yet — respect the OS/browser setting.
    return typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;
  }
}
