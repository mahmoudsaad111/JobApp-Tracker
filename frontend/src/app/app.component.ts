import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

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
}
