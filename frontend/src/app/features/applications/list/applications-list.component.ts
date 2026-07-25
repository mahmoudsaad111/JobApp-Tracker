import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ApplicationsService } from '../../../core/services/applications.service';
import { NotificationService } from '../../../core/services/notification.service';
import { JobApplication, ApplicationStatus, APPLICATION_STATUSES } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MagneticDirective } from '../../../shared/directives/magnetic.directive';

// Map every status value → a stable CSS key (no spaces, all lowercase)
function statusKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '');
}

function avatarColor(name: string): string {
  const p = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#64748b', submitted: '#2563eb', underreview: '#d97706',
  interviewscheduled: '#4f46e5', interviewed: '#7c3aed',
  accepted: '#059669', rejected: '#dc2626', withdrawn: '#db2777',
};
function statusColor(s: string): string { return STATUS_COLOR[statusKey(s)] ?? '#94a3b8'; }

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatMenuModule, MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatTooltipModule, MagneticDirective
  ],
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('280ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="page-container" @pageIn>
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Applications</h1>
          <p class="text-slate-500 text-sm mt-1 font-medium">{{ total }} total applications</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/applications/new" magnetic>
          <mat-icon>add</mat-icon> New Application
        </a>
      </div>

      <!-- Filters -->
      <div class="filters-card isolate relative z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 dark:bg-slate-900/60 dark:border-slate-700/60 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(99,102,241,0.08)] px-5 py-4 mb-5 transition-shadow hover:shadow-[0_8px_28px_-6px_rgba(99,102,241,0.14)] dark:hover:shadow-[0_8px_28px_-6px_rgba(99,102,241,0.14)]">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search</mat-label>
          <input matInput [formControl]="searchCtrl" placeholder="Company, title, location…">
          <mat-icon matPrefix>search</mat-icon>
          @if (searchCtrl.value) {
            <button matSuffix mat-icon-button (click)="searchCtrl.setValue('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="status-field">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusCtrl">
            <mat-option value="">All Statuses</mat-option>
            @for (s of statuses; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="date-field">
          <mat-label>From Date</mat-label>
          <input matInput [matDatepicker]="fromPicker" [formControl]="fromDateCtrl" placeholder="MM/DD/YYYY">
          <mat-datepicker-toggle matSuffix [for]="fromPicker"/>
          <mat-datepicker #fromPicker/>
        </mat-form-field>

        <mat-form-field appearance="outline" class="date-field">
          <mat-label>To Date</mat-label>
          <input matInput [matDatepicker]="toPicker" [formControl]="toDateCtrl" placeholder="MM/DD/YYYY">
          <mat-datepicker-toggle matSuffix [for]="toPicker"/>
          <mat-datepicker #toPicker/>
        </mat-form-field>

        @if (fromDateCtrl.value || toDateCtrl.value) {
          <button class="inline-flex items-center gap-1.5 rounded-xl border-[1.5px] border-rose-200 text-rose-500 px-3 py-1.5 text-[0.82rem] font-bold cursor-pointer transition-all hover:bg-rose-50 hover:border-rose-400"
                  (click)="clearDates()">
            <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">clear</mat-icon> Clear Dates
          </button>
        }
      </div>

      <!-- Table -->
      <div class="app-card table-card rounded-2xl overflow-hidden">
        @if (loading) {
          <div class="skeleton-rows">
            @for (i of skeletonRows; track i) {
              <div class="skeleton-row">
                <div class="skeleton-block skeleton-avatar"></div>
                <div class="skeleton-block" style="width:22%;height:13px"></div>
                <div class="skeleton-block" style="width:14%;height:22px;border-radius:20px"></div>
                <div class="skeleton-block" style="width:12%;height:13px"></div>
                <div class="skeleton-block" style="width:8%;height:22px;border-radius:12px"></div>
              </div>
            }
          </div>
        } @else if (applications.length === 0) {
          <div class="empty-table">
            <mat-icon>work_outline</mat-icon>
            <h3>No applications found</h3>
            <p>{{ searchCtrl.value || statusCtrl.value ? 'Try adjusting your filters.' : 'Start tracking your job search!' }}</p>
            @if (!searchCtrl.value && !statusCtrl.value) {
              <a mat-flat-button color="primary" routerLink="/applications/new">Add First Application</a>
            }
          </div>
        } @else {
          <div class="desktop-table">
          <table mat-table [dataSource]="applications" matSort matSortDisableClear [matSortActive]="activeSortColumn" [matSortDirection]="sortDir" (matSortChange)="onSort($event)">

            <!-- Company -->
            <ng-container matColumnDef="companyName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Company</th>
              <td mat-cell *matCellDef="let row">
                <div class="company-cell">
                  <div class="co-avatar" [style.background]="avatarBg(row.companyName)">{{ row.companyName[0] }}</div>
                  <div>
                    <div class="co-name">{{ row.companyName }}</div>
                    <div class="co-loc text-muted">{{ row.location }}</div>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Job Title -->
            <ng-container matColumnDef="jobTitle">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Job Title</th>
              <td mat-cell *matCellDef="let row">{{ row.title }}</td>
            </ng-container>

            <!-- Status — use statusKey() helper for the CSS class -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-chip" [ngClass]="'status--' + statusKey(row.status)">
                  {{ row.status }}
                </span>
              </td>
            </ng-container>

            <!-- Date -->
            <ng-container matColumnDef="applicationDate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Applied</th>
              <td mat-cell *matCellDef="let row" class="text-muted">
                {{ row.appliedAt | date:'MMM d, y' }}
              </td>
            </ng-container>

            <!-- Interviews -->
            <ng-container matColumnDef="interviews">
              <th mat-header-cell *matHeaderCellDef>Interviews</th>
              <td mat-cell *matCellDef="let row">
                @if (row.interviews?.length) {
                  <span class="interview-badge">{{ row.interviews.length }}</span>
                } @else {
                  <span class="text-muted">—</span>
                }
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <div class="row-actions">
                  <a mat-icon-button [routerLink]="['/applications', row.jobAppId]" matTooltip="View">
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <a mat-icon-button [routerLink]="['/applications', row.jobAppId, 'edit']" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </a>
                  <button mat-icon-button matTooltip="Delete" (click)="delete(row)">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns" [style.borderLeftColor]="statusAccent(row.status)"></tr>
          </table>
          </div>

          <!-- Mobile card layout (shown ≤ 700px via CSS) -->
          <div class="mobile-cards">
            @for (row of applications; track row.jobAppId) {
              <a class="mobile-card" [routerLink]="['/applications', row.jobAppId]" [style.borderLeftColor]="statusAccent(row.status)">
                <div class="mobile-card-top">
                  <div class="co-avatar" [style.background]="avatarBg(row.companyName)">{{ row.companyName[0] }}</div>
                  <div class="mobile-card-meta">
                    <div class="co-name">{{ row.title }}</div>
                    <div class="co-loc text-muted">{{ row.companyName }} · {{ row.location }}</div>
                  </div>
                  <span class="status-chip" [ngClass]="'status--' + statusKey(row.status)">{{ row.status }}</span>
                </div>
                <div class="mobile-card-bottom">
                  <span class="text-muted">{{ row.appliedAt | date:'MMM d, y' }}</span>
                  @if (row.interviews?.length) {
                    <span class="interview-badge">{{ row.interviews.length }} interview{{ row.interviews.length === 1 ? '' : 's' }}</span>
                  }
                  <div class="mobile-card-actions" (click)="$event.preventDefault(); $event.stopPropagation()">
                    <a mat-icon-button [routerLink]="['/applications', row.jobAppId, 'edit']" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </a>
                    <button mat-icon-button matTooltip="Delete" (click)="delete(row)">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                </div>
              </a>
            }
          </div>

          <mat-paginator
            [length]="total"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPage($event)"
            showFirstLastButtons>
          </mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [`
    .filters-card {
      display: flex; flex-wrap: wrap; gap: 12px;
      padding: 18px 22px; margin-bottom: 18px; align-items: center;
      border-radius: var(--radius-md);
    }
    .search-field { flex: 1; min-width: 240px; }
    .status-field { width: 180px; }
    .date-field   { width: 170px; }

    .table-card {
      overflow: hidden;
      border-radius: var(--radius-md);
    }
    .table-loading {
      display: flex; justify-content: center; align-items: center;
      padding: 72px;
    }
    .skeleton-rows { display: flex; flex-direction: column; }
    .skeleton-row {
      display: flex; align-items: center; gap: 24px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      &:last-child { border-bottom: none; }
    }
    .skeleton-avatar { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .skeleton-block {
      border-radius: 6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e9edf3 37%, #f1f5f9 63%);
      background-size: 400% 100%;
      animation: shimmer 1.6s ease infinite;
    }
    :host-context(.dark) .skeleton-block {
      background: linear-gradient(90deg, #334155 25%, #475569 37%, #334155 63%);
      background-size: 400% 100%;
    }
    .empty-table {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; padding: 72px 28px; color: var(--text-secondary);

       mat-icon {
         font-size: 52px; width: 52px; height: 52px;
         color: var(--text-tertiary); margin-bottom: 14px;
       }
      h3 {
        margin: 0 0 6px;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
      }
      p {
        color: var(--text-secondary);
        margin-bottom: 22px;
        max-width: 420px;
      }
    }

    .company-cell {
      display: flex; align-items: center; gap: 12px;
    }
    .co-avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(99,102,241,0.25);
      transition: transform .2s ease;
    }
    tr.mat-mdc-row:hover .co-avatar { transform: scale(1.08) rotate(-2deg); }
    .co-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .co-loc  {
      font-size: 0.78rem;
      color: var(--text-secondary);
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

    :host-context(.dark) .status--draft              { background: #334155; color: #f1f5f9; border-color: #475569; }
    :host-context(.dark) .status--submitted          { background: #1e3a5f; color: #93c5fd; border-color: #3b82f6; }
    :host-context(.dark) .status--underreview        { background: #78350f; color: #fcd34d; border-color: #b45309; }
    :host-context(.dark) .status--interviewscheduled { background: #312e81; color: #a5b4fc; border-color: #4f46e5; }
    :host-context(.dark) .status--interviewed        { background: #4c1d95; color: #ddd6fe; border-color: #7c3aed; }
    :host-context(.dark) .status--accepted           { background: #064e3b; color: #6ee7b7; border-color: #059669; }
    :host-context(.dark) .status--rejected           { background: #7f1d1d; color: #fca5a5; border-color: #dc2626; }
    :host-context(.dark) .status--withdrawn          { background: #831843; color: #f9a8d4; border-color: #db2777; }

    .interview-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 24px; height: 24px; padding: 0 7px;
      border-radius: 12px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
      font-size: 0.75rem; font-weight: 700;
      border: 1px solid #fcd34d;
    }
    :host-context(.dark) .interview-badge {
      background: linear-gradient(135deg, #78350f, #92400e);
      color: #fcd34d;
      border-color: #b45309;
    }

    .row-actions {
      display: flex; gap: 2px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    tr.mat-mdc-row {
      border-left: 4px solid transparent;
      transition: background-color .18s ease, transform .18s ease;
    }
    tr.mat-mdc-row:hover {
      background: var(--surface-2,#f8fafc);
      transform: translateX(2px);
    }
    tr.mat-mdc-row:hover .row-actions { opacity: 1; }

    /* ── Responsive: table on desktop, cards on narrow screens ── */
    .mobile-cards { display: none; }
    @media (max-width: 700px) {
      .desktop-table { display: none; }
      .mobile-cards { display: flex; flex-direction: column; gap: 10px; padding: 14px; }
    }

    .mobile-card {
      display: flex; flex-direction: column; gap: 10px;
      border: 1px solid var(--border-color, #e2e8f0); border-left: 4px solid transparent;
      border-radius: 14px; padding: 14px 16px; text-decoration: none; color: inherit;
      background: var(--bg-surface, #fff);
      transition: transform .15s ease, box-shadow .15s ease;
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
      &:active { transform: scale(0.99); }
    }
    .mobile-card-top { display: flex; align-items: center; gap: 12px; }
    .mobile-card-meta { flex: 1; min-width: 0; }
    .mobile-card-bottom {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding-top: 8px; border-top: 1px solid var(--border-color, #e2e8f0);
      font-size: 0.8rem;
    }
    .mobile-card-actions { display: flex; gap: 2px; margin-left: auto; }
  `]
})
export class ApplicationsListComponent implements OnInit, OnDestroy {
  private svc      = inject(ApplicationsService);
  private notify   = inject(NotificationService);
  private dialog   = inject(MatDialog);
  private destroy$ = new Subject<void>();

  applications: JobApplication[] = [];
  total    = 0;
  loading  = true;
  page     = 1;
  pageSize = 10;
  sortBy   = 'AppliedAt';
  sortDir: 'asc' | 'desc' = 'desc';
  activeSortColumn = 'applicationDate';

  statuses = APPLICATION_STATUSES;
  columns  = ['companyName', 'jobTitle', 'status', 'applicationDate', 'interviews', 'actions'];
  skeletonRows = Array.from({ length: 6 }, (_, i) => i);

  searchCtrl   = new FormControl('');
  statusCtrl   = new FormControl<ApplicationStatus | ''>('');
  fromDateCtrl = new FormControl<Date | null>(null);
  toDateCtrl   = new FormControl<Date | null>(null);

  // expose helper to template
  readonly statusKey = statusKey;
  avatarBg(name: string): string { return avatarColor(name); }
  statusAccent(status: string): string { return statusColor(status); }

  ngOnInit(): void {
    this.load();

    this.searchCtrl.valueChanges.pipe(
      debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$)
    ).subscribe(() => { this.page = 1; this.load(); });

    this.statusCtrl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.load(); });

    this.fromDateCtrl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.load(); });

    this.toDateCtrl.valueChanges.pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => { this.page = 1; this.load(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  load(): void {
    this.loading = true;
    this.svc.getAll({
      page:     this.page,
      pageSize: this.pageSize,
      search:   this.searchCtrl.value ?? '',
      status:   this.statusCtrl.value ?? '',
      sortBy:   this.sortBy,
      sortDir:  this.sortDir,
      fromDate: this.fromDateCtrl.value ?? undefined,
      toDate:   this.toDateCtrl.value   ?? undefined,
    }).subscribe({
      next: res => { this.applications = res.data ?? []; this.total = res.total ?? 0; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  onPage(e: PageEvent): void { this.page = e.pageIndex + 1; this.pageSize = e.pageSize; this.load(); }
  onSort(s: Sort): void {
    const map: Record<string, string> = {
      companyName: 'CompanyName',
      jobTitle: 'Title',
      status: 'Status',
      applicationDate: 'AppliedAt',
    };
    this.activeSortColumn = s.active;
    this.sortBy = map[s.active] ?? s.active;
    this.sortDir = s.direction === 'asc' ? 'asc' : 'desc';
    this.load();
  }

  clearDates(): void { this.fromDateCtrl.setValue(null); this.toDateCtrl.setValue(null); }

  delete(app: JobApplication): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Application', message: `Delete application for ${app.title} at ${app.companyName}?`, confirmLabel: 'Delete' }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.delete(app.jobAppId).subscribe({
        next: () => { this.notify.success('Application deleted.'); this.load(); },
        error: ()  => { this.notify.error('Failed to delete application.'); }
      });
    });
  }
}