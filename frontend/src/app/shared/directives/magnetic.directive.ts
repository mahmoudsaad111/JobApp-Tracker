import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Applies a subtle "magnetic" pull toward the cursor while hovering, and
 * springs back to rest on mouseleave. Presentational only — writes a CSS
 * transform on the host element, touches no application state.
 *
 * Usage: <a mat-flat-button color="primary" magnetic>...</a>
 */
@Directive({
  selector: '[magnetic]',
  standalone: true,
})
export class MagneticDirective {
  private el = inject(ElementRef<HTMLElement>);
  private strength = 0.3;

  @HostListener('mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    const el = this.el.nativeElement;
    const r  = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = 'transform 0.08s linear';
    el.style.transform  = `translate(${dx * this.strength}px, ${dy * this.strength}px)`;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    const el = this.el.nativeElement;
    el.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'; // springy ease
    el.style.transform  = 'translate(0, 0)';
  }
}
