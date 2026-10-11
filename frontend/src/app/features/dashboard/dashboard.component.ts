import { Component, inject, OnInit } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary } from '../../core/models';
import { CountUpDirective } from '../../shared/directives/count-up.directive';
import { MagneticDirective } from '../../shared/directives/magnetic.directive';

function statusKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatCardModule, NgChartsModule, CountUpDirective, MagneticDirective
  ],
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('280ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('statStagger', [
      transition(':enter', [
        query('.stat-card', [
          style({ opacity: 0, transform: 'translateY(14px) scale(0.96)' }),
          stagger(50, animate('320ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))),
        ], { optional: true }),
      ]),
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('320ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('listStagger', [
      transition(':enter', [
        query('.recent-item', [
          style({ opacity: 0, transform: 'translateX(-8px)' }),
          stagger(40, animate('260ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateX(0)' }))),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="page-container" @pageIn>
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Dashboard</h1>
          <p class="text-slate-500 text-sm mt-1 font-medium">Welcome back, {{ auth.userName() }}!</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/applications/new" magnetic>
          <mat-icon>add</mat-icon> Add Application
        </a>
      </div>

      @if (loading) {
        <div class="loading-center">
          <mat-spinner diameter="48"/>
        </div>
      } @else if (summary) {

        <!-- Stat Cards -->
        <div class="stat-grid" @statStagger>
          <div class="stat-card total">
            <div class="stat-icon"><mat-icon>work</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value"><span [countUp]="summary.totalApplications"></span></div>
              <div class="stat-label">Total</div>
            </div>
          </div>
          <div class="stat-card applied">
            <div class="stat-icon"><mat-icon>send</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value"><span [countUp]="summary.byStatus.applied"></span></div>
              <div class="stat-label">Applied</div>
            </div>
          </div>
          <div class="stat-card interview">
            <div class="stat-icon"><mat-icon>event_available</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value"><span [countUp]="summary.byStatus.interviewing"></span></div>
              <div class="stat-label">Interviewing</div>
            </div>
          </div>
          <div class="stat-card offer">
            <div class="stat-icon"><mat-icon>check_circle</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value"><span [countUp]="summary.byStatus.offered"></span></div>
              <div class="stat-label">Offered</div>
            </div>
          </div>
          <div class="stat-card rejected">
            <div class="stat-icon"><mat-icon>cancel</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value"><span [countUp]="summary.byStatus.rejected"></span></div>
              <div class="stat-label">Rejected</div>
            </div>
          </div>
          <div class="stat-card week">
            <div class="stat-icon"><mat-icon>calendar_today</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value"><span [countUp]="summary.thisWeekApplications"></span></div>
              <div class="stat-label">This Week</div>
            </div>
          </div>
          <div class="stat-card rate">
            <div class="stat-icon"><mat-icon>trending_up</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value"><span [countUp]="responseRate" countUpSuffix="%"></span></div>
              <div class="stat-label">Response Rate</div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-grid" @fadeInUp>

          <!-- Status Distribution -->
          <div class="app-card chart-card">
            <h3>Status Distribution</h3>
            @if (summary.totalApplications === 0) {
              <div class="empty-chart">
                <mat-icon>donut_large</mat-icon>
                <p>No data yet</p>
              </div>
            } @else {
              <div class="chart-legend">
                @for (item of chartLegendItems; track item.label) {
                  <div class="legend-item">
                    <span class="legend-dot" [style.background]="item.color"></span>
                    <span class="legend-label">{{ item.label }}</span>
                    <span class="legend-value">{{ item.value }}</span>
                    <span class="legend-pct">{{ item.pct }}%</span>
                  </div>
                }
              </div>
              <div class="chart-wrapper">
                <canvas baseChart
                  [data]="doughnutData"
                  [options]="doughnutOptions"
                  [plugins]="doughnutPlugins"
                  type="doughnut">
                </canvas>
              </div>
            }
          </div>

          <!-- Upcoming Interviews -->
          <div class="app-card chart-card">
            <h3>Upcoming Interviews</h3>
            @if (summary.upcomingInterviews.length === 0) {
              <div class="empty-recent">
                <mat-icon>event_busy</mat-icon>
                <p>No upcoming interviews</p>
              </div>
            } @else {
               <div class="recent-list" @listStagger>
                 @for (interview of summary.upcomingInterviews; track interview.id) {
                   <div class="recent-item" (click)="openInterview(interview.id)">
                     <div class="company-avatar">{{ interview.company[0] }}</div>
                     <div class="app-info">
                       <div class="app-title">{{ interview.position }}</div>
                       <div class="app-company">{{ interview.company }}</div>
                     </div>
                     <div class="app-date">
                       <div>{{ interview.interviewDate | date:'MMM d, y' }}</div>
                       <span class="status-chip status--interviewscheduled">
                         {{ interview.interviewType }}
                       </span>
                     </div>
                   </div>
                 }
               </div>
            }
          </div>
        </div>

        <!-- Recent Applications -->
        <div class="app-card recent-card">
          <div class="recent-header">
            <h3>Recent Applications</h3>
            <a mat-stroked-button routerLink="/applications">View All</a>
          </div>
          @if (summary.recentApplications.length === 0) {
            <div class="empty-recent">
              <mat-icon>inbox</mat-icon>
              <p>No applications yet. <a routerLink="/applications/new">Add your first one!</a></p>
            </div>
          } @else {
            <div class="recent-list" @listStagger>
              @for (app of summary.recentApplications; track app.jobAppId) {
                <a class="recent-item" [routerLink]="['/applications', app.jobAppId]">
                  <div class="company-avatar">{{ app.company[0] }}</div>
                  <div class="app-info">
                    <div class="app-title">{{ app.position }}</div>
                    <div class="app-company">{{ app.company }}</div>
                  </div>
                  <!-- ✅ fixed: use [ngClass] with statusKey() helper -->
                  <span class="status-chip" [ngClass]="'status--' + statusKey(app.status)">
                    {{ app.status }}
                  </span>
                  <div class="app-date">{{ app.appliedDate | date:'MMM d' }}</div>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .loading-center { display: flex; justify-content: center; align-items: center; padding: 100px; }

    .charts-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 18px; margin-bottom: 24px;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .chart-card {
      padding: 22px;
      border-radius: var(--radius-md);

      h3 {
        font-size: 0.95rem;
        font-weight: 700;
        margin: 0 0 18px;
        color: var(--text-primary);
        letter-spacing: -0.01em;
      }
    }

    .chart-wrapper {
      position: relative; height: 260px;
      display: flex; align-items: center; justify-content: center;
    }

    .chart-legend { display: flex; flex-direction: column; gap: 8px; }
    .legend-item  { display: flex; align-items: center; gap: 10px; font-size: 0.82rem; padding: 4px 0; }
    .legend-dot   { width: 10px; height: 10px; border-radius: 4px; flex-shrink: 0; }
    .legend-label { flex: 1; color: var(--text-secondary); font-weight: 500; }
    .legend-value { font-weight: 700; color: var(--text-primary); min-width: 20px; text-align: right; }
    .legend-pct   { font-size: 0.75rem; color: var(--text-tertiary); min-width: 40px; text-align: right; }

    .empty-chart {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 220px; color: var(--text-secondary);

      mat-icon {
        font-size: 52px; width: 52px; height: 52px; opacity: 0.2; margin-bottom: 10px;
      }
      p { margin-top: 10px; font-size: 0.875rem; }
    }

    .recent-card { padding: 22px; }
    .recent-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;

      h3 {
        font-size: 0.95rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }
    }

    .recent-list { display: flex; flex-direction: column; }
    .recent-item {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 10px; border-radius: var(--radius-sm);
      text-decoration: none; color: inherit;

      &:hover {
        background: var(--surface-2,#f8fafc);
      }
    }
    .company-avatar {
      width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; font-weight: 700; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(99,102,241,0.25);
    }
    .app-info    { flex: 1; min-width: 0; }
    .app-title   { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
    .app-company { color: var(--text-secondary); font-size: 0.8rem; }
    .app-date    { color: var(--text-secondary); font-size: 0.78rem; white-space: nowrap; }

    .empty-recent {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 48px; color: var(--text-secondary);

      mat-icon {
        font-size: 48px; width: 48px; height: 48px; opacity: 0.25; margin-bottom: 12px;
      }
      a { color: #6366f1; font-weight: 600; }
      p { font-size: 0.875rem; }
    }

    .status-chip {
      display: inline-flex; align-items: center;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
      border: 1px solid transparent;
      letter-spacing: 0.03em;
    }

    .status--draft              { background: #f1f5f9; color: #334155; border-color: #e2e8f0; }
    .status--submitted          { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
    .status--underreview        { background: #fffbeb; color: #b45309; border-color: #fef3c7; }
    .status--interviewscheduled { background: #eef2ff; color: #4338ca; border-color: #e0e7ff; }
    .status--interviewed        { background: #f5f3ff; color: #6d28d9; border-color: #ede9fe; }
    .status--accepted           { background: #ecfdf5; color: #047857; border-color: #d1fae5; }
    .status--rejected           { background: #fef2f2; color: #b91c1c; border-color: #fee2e2; }
    .status--withdrawn          { background: #fdf2f8; color: #be185d; border-color: #fce7f3; }

    .status--applied      { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; }
    .status--interviewing { background: #eef2ff; color: #4338ca; border-color: #e0e7ff; }
    .status--offered      { background: #ecfdf5; color: #047857; border-color: #d1fae5; }

    :host-context(.dark) .status--draft              { background: #334155; color: #f1f5f9; border-color: #475569; }
    :host-context(.dark) .status--submitted          { background: #1e3a5f; color: #93c5fd; border-color: #3b82f6; }
    :host-context(.dark) .status--underreview        { background: #78350f; color: #fcd34d; border-color: #b45309; }
    :host-context(.dark) .status--interviewscheduled { background: #312e81; color: #a5b4fc; border-color: #4f46e5; }
    :host-context(.dark) .status--interviewed        { background: #4c1d95; color: #ddd6fe; border-color: #7c3aed; }
    :host-context(.dark) .status--accepted           { background: #064e3b; color: #6ee7b7; border-color: #059669; }
    :host-context(.dark) .status--rejected           { background: #7f1d1d; color: #fca5a5; border-color: #dc2626; }
    :host-context(.dark) .status--withdrawn          { background: #831843; color: #f9a8d4; border-color: #db2777; }
    :host-context(.dark) .status--applied      { background: #1e3a5f; color: #93c5fd; border-color: #3b82f6; }
    :host-context(.dark) .status--interviewing { background: #312e81; color: #a5b4fc; border-color: #4f46e5; }
    :host-context(.dark) .status--offered      { background: #064e3b; color: #6ee7b7; border-color: #059669; }
  `]
})
export class DashboardComponent implements OnInit {
  private dashService = inject(DashboardService);
  private router     = inject(Router);
  auth                = inject(AuthService);

  summary: DashboardSummary | null = null;
  loading = true;

  readonly statusKey = statusKey;

  private readonly STATUS_COLORS: Record<string, string> = {
    applied:      '#60a5fa',
    interviewing: '#f59e0b',
    offered:      '#34d399',
    rejected:     '#f87171',
    withdrawn:    '#94a3b8',
  };

  private readonly STATUS_LABELS: Record<string, string> = {
    applied:      'Applied',
    interviewing: 'Interviewing',
    offered:      'Offered',
    rejected:     'Rejected',
    withdrawn:    'Withdrawn',
  };

  chartLegendItems: { label: string; color: string; value: number; pct: string }[] = [];

  doughnutData: ChartData<'doughnut'> = {
    labels: Object.values(this.STATUS_LABELS),
    datasets: [{
      data: [],
      backgroundColor:      Object.values(this.STATUS_COLORS),
      hoverBackgroundColor: Object.values(this.STATUS_COLORS),
      borderWidth: 3,
      borderColor: '#ffffff',
      hoverOffset: 8,
    }]
  };

  doughnutPlugins: Plugin<'doughnut'>[] = [{
    id: 'centerText',
    afterDraw(chart) {
      const { ctx, chartArea: { width, height, left, top } } = chart;
      const total = (chart.data.datasets[0].data as number[]).reduce((a, b) => a + (b as number), 0);
      const cx = left + width / 2;
      const cy = top  + height / 2;
      ctx.save();
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#1e293b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(total), cx, cy - 10);
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('total', cx, cy + 14);
      ctx.restore();
    }
  }];

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { animateRotate: true, animateScale: true, duration: 700, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b', padding: 12, cornerRadius: 8,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont:  { size: 12 },
        callbacks: {
          label: (ctx) => {
            const data  = ctx.dataset.data as number[];
            const total = data.reduce((a, b) => a + b, 0);
            const pct   = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
            return `  ${ctx.parsed} applications  (${pct}%)`;
          }
        }
      }
    },
    cutout: '72%',
  };

  get responseRate(): number {
    // Single source of truth: the backend computes the rate (drafts excluded).
    return Math.round(this.summary?.responseRate ?? 0);



  }

  ngOnInit(): void { this.loadDashboard(); }

  openInterview(id: number | string): void {
    this.router.navigate(['/interviews'], { queryParams: { id } });
  }

  private loadDashboard(): void {
    this.dashService.getSummary().subscribe({
      next: res => {
        this.summary = res.data;
        const s = res.data.byStatus;
        const counts: Record<string, number> = {
          applied:      s.applied,
          interviewing: s.interviewing,
          offered:      s.offered,
          rejected:     s.rejected,
          withdrawn:    s.withdrawn,
        };
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        this.chartLegendItems = Object.entries(counts)
          .filter(([, v]) => v > 0)
          .map(([key, value]) => ({
            label: this.STATUS_LABELS[key],
            color: this.STATUS_COLORS[key],
            value,
            pct: total > 0 ? Math.round((value / total) * 100).toString() : '0',
          }));
        this.doughnutData = {
          ...this.doughnutData,
          datasets: [{ ...this.doughnutData.datasets[0], data: Object.values(counts) }]
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}