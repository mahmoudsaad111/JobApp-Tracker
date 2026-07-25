import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

/**
 * Animates a numeric text value counting up (or down) from its previous
 * value to a new one whenever the bound input changes. Purely presentational
 * — renders text into its host element, no application state involved.
 *
 * Usage: <span [countUp]="summary.totalApplications"></span>
 *        <span [countUp]="responseRate" countUpSuffix="%"></span>
 */
@Directive({
  selector: '[countUp]',
  standalone: true,
})
export class CountUpDirective implements OnChanges {
  @Input('countUp') target = 0;
  @Input() countUpDuration = 900;
  @Input() countUpSuffix = '';

  private el = inject(ElementRef<HTMLElement>);
  private raf: number | null = null;
  private current = 0;
  private firstRun = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['target']) return;
    const to = this.target ?? 0;

    // On first render, count up from 0 for a nice "landing" effect.
    // On subsequent changes, animate from whatever value is currently shown.
    const from = this.firstRun ? 0 : this.current;
    this.firstRun = false;

    if (this.raf) cancelAnimationFrame(this.raf);
    if (from === to) { this.render(to); return; }

    const start = performance.now();
    const duration = this.countUpDuration;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = Math.round(from + (to - from) * eased);
      this.render(value);
      if (t < 1) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.current = to;
        this.raf = null;
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  private render(value: number): void {
    this.current = value;
    this.el.nativeElement.textContent = `${value}${this.countUpSuffix}`;
  }
}
