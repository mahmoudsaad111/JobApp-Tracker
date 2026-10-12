import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent {
  // Injected here (rather than only in Shell) so the theme class is applied
  // to <html> as early as possible — including on auth pages before login —
  // avoiding a flash of the wrong theme.
  private theme = inject(ThemeService);
  private auth  = inject(AuthService);

  constructor() {
    // The app remembers the user in localStorage, but the real login is the server cookie
    // (it expires after idle time). Check it once at startup: if it is gone the API answers
    // 401 and the interceptor logs the user out right away, instead of on their first click.
    if (this.auth.isLoggedIn()) {
      this.auth.getProfile().subscribe({ error: () => { /* 401 is handled by the interceptor */ } });
    }
  }
}
