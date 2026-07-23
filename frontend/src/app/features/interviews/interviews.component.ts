import { Component, inject, OnInit, signal, computed, HostListener } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule, DatePipe }                       from '@angular/common';
import { RouterLink }                                   from '@angular/router';
import { FormsModule }                                  from '@angular/forms';
import { MatButtonModule }                              from '@angular/material/button';
import { MatIconModule }                                from '@angular/material/icon';
import { MatProgressSpinnerModule }                     from '@angular/material/progress-spinner';
import { MatTooltipModule }                             from '@angular/material/tooltip';
import { InterviewsService }                            from '@core/services/interviews.service';
import { Interview, InterviewType, ApplicationStatus }  from '../../core/models';

const TYPE_META: Record<string, { icon: string; color: string }> = {
  Phone:     { icon: 'phone',        color: '#2563eb' },
  Video:     { icon: 'videocam',     color: '#0891b2' },
  OnSite:    { icon: 'location_on',  color: '#d97706' },
  Technical: { icon: 'code',         color: '#7c3aed' },
  HRRound:   { icon: 'people',       color: '#059669' },
  Final:     { icon: 'emoji_events', color: '#16a34a' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  Draft:               { label: 'Draft',               color: '#374151', bg: '#f3f4f6' },
  Submitted:           { label: 'Submitted',           color: '#1e40af', bg: '#dbeafe' },
  UnderReview:         { label: 'Under Review',        color: '#92400e', bg: '#fef3c7' },
  InterviewScheduled:  { label: 'Interview Scheduled', color: '#3730a3', bg: '#e0e7ff' },
  Interviewed:         { label: 'Interviewed',         color: '#5b21b6', bg: '#ede9fe' },
  Accepted:            { label: 'Accepted',            color: '#065f46', bg: '#d1fae5' },
  Rejected:            { label: 'Rejected',            color: '#991b1b', bg: '#fee2e2' },
  Withdrawn:           { label: 'Withdrawn',           color: '#9d174d', bg: '#fce7f3' },
};

const INTERVIEW_TYPES: InterviewType[] = [
  'Phone', 'Video', 'OnSite', 'Technical', 'HRRound', 'Final'
] as InterviewType[];

const PAGE_SIZE_OPTIONS = [6, 12, 24];

function typeMeta(t: InterviewType)       { return TYPE_META[t]   ?? { icon: 'event', color: '#64748b' }; }
function statusMeta(s: ApplicationStatus) { return STATUS_META[s] ?? { label: s, color: '#6b7280', bg: '#f3f4f6' }; }

function avatarColor(name: string): string {
  const p = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return p[Math.abs(h) % p.length];
}

function relativeDay(date: Date | string): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d     = new Date(date); d.setHours(0, 0, 0, 0);
  const diff  = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0)               return 'Today';
  if (diff === 1)               return 'Tomorrow';
  if (diff === -1)              return 'Yesterday';
  if (diff > 1  && diff <= 6)  return `In ${diff} days`;
  if (diff < -1 && diff >= -6) return `${Math.abs(diff)} days ago`;
  return '';
}

interface EditForm {
  interviewDate: string;
  interviewType: string;
  interviewerName: string;
  note: string;
  feedback: string;
}

@Component({
  selector: 'app-interviews',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  providers: [DatePipe],
  animations: [
    trigger('dropdownAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px) scale(0.96)' }),
        animate('180ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      ]),
      transition(':leave', [
        animate('120ms ease-in', style({ opacity: 0, transform: 'translateY(-4px) scale(0.98)' })),
      ]),
    ]),
    trigger('gridStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(18px) scale(0.97)' }),
          stagger(45, animate('320ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))),
        ], { optional: true }),
      ]),
    ]),
    trigger('viewSwitch', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('260ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('heroPop', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.96) translateY(6px)' }),
        animate('320ms 60ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
    ]),
    trigger('fieldStagger', [
      transition(':enter', [
        query('.detail-field, .info-card, .edit-field', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(35, animate('260ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `

<!-- ══ LIST VIEW ══ -->
@if (!selected()) {
<div class="page-container !max-w-[1440px]" @viewSwitch>

  <!-- Header -->
  <div class="flex items-center justify-between gap-4 flex-wrap mb-7">
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
        Interviews
      </h1>
      @if (!loading()) {
        <p class="text-slate-500 text-sm mt-1 font-medium">{{ allCount() }} total interviews</p>
      }
    </div>
  </div>

  <!-- Filter bar -->
  <div class="filters-bar isolate relative z-20 flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(99,102,241,0.08)] px-4 py-4 mb-4 transition-shadow hover:shadow-[0_8px_28px_-6px_rgba(99,102,241,0.14)]">

    <!-- Row 1: search + section tabs -->
    <div class="flex flex-wrap items-center gap-2.5">
      <div class="group flex items-center flex-1 min-w-[220px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white">
        <mat-icon class="!text-[18px] !w-[18px] !h-[18px] pl-3 pr-1.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">search</mat-icon>
        <input class="border-0 bg-transparent outline-none py-2 px-1 text-sm w-full text-slate-800 placeholder:text-slate-400"
               type="text"
               placeholder="Search company, role, interviewer\u2026"
               [value]="searchQuery()"
               (input)="searchQuery.set($any($event.target).value); resetPage()"/>
        @if (searchQuery()) {
          <button class="bg-transparent border-0 cursor-pointer py-1 px-2 text-slate-400 hover:text-rose-500 transition-colors flex items-center animate-pop-in"
                  (click)="searchQuery.set(''); resetPage()">
            <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">close</mat-icon>
          </button>
        }
      </div>

      <div class="flex gap-1 bg-slate-50 border border-slate-200/70 rounded-xl p-1 flex-shrink-0">
        @for (tab of sectionTabs; track tab.value) {
          <button class="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.82rem] font-bold cursor-pointer transition-all duration-200"
                  [class.text-white]="section() === tab.value"
                  [class.shadow-md]="section() === tab.value"
                  [class.text-slate-500]="section() !== tab.value"
                  [class.hover:text-slate-800]="section() !== tab.value"
                  [style.background]="section() === tab.value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent'"
                  (click)="section.set(tab.value); resetPage()">
            <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">{{ tab.icon }}</mat-icon>{{ tab.label }}
          </button>
        }
      </div>
    </div>

    <!-- Row 2: type + date range + clear, separated with a divider -->
    <div class="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">

      <!-- Type dropdown -->
      <div class="dropdown-wrap relative">
        <button class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border-[1.5px] px-3 py-1.5 text-[0.82rem] font-bold cursor-pointer transition-all duration-200"
                [class]="selectedTypes().size > 0
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-400 hover:text-indigo-500'"
                (click)="typeDropOpen = !typeDropOpen">
          <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">category</mat-icon>
          <span>
            @if (selectedTypes().size === 0) { Type }
            @else if (selectedTypes().size === 1) { {{ selectedTypes().values().next().value }} }
            @else { {{ selectedTypes().size }} types }
          </span>
          <mat-icon class="!text-[17px] !w-[17px] !h-[17px] ml-0.5 transition-transform duration-200" [class.rotate-180]="typeDropOpen">expand_more</mat-icon>
        </button>
        @if (typeDropOpen) {
          <div class="absolute top-[calc(100%+8px)] left-0 z-50 min-w-[210px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
               @dropdownAnim (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between px-3.5 pt-2.5 pb-2 border-b border-slate-100 text-[0.72rem] font-extrabold uppercase tracking-wider text-slate-500">
              <span>Interview Type</span>
              @if (selectedTypes().size > 0) {
                <button class="bg-transparent border-0 cursor-pointer text-[0.75rem] font-bold text-rose-500 hover:underline p-0" (click)="clearTypeFilter()">Clear</button>
              }
            </div>
            @for (t of interviewTypes; track t) {
              <label class="flex items-center gap-2 px-3.5 py-2.5 cursor-pointer transition-colors text-sm font-medium text-slate-700 hover:bg-slate-50"
                     [class.bg-indigo-50]="selectedTypes().has(t)">
                <span class="w-[18px] h-[18px] rounded-md border-[1.5px] border-slate-200 flex items-center justify-center flex-shrink-0 bg-white transition-all"
                      [class.bg-indigo-500]="selectedTypes().has(t)"
                      [class.border-indigo-500]="selectedTypes().has(t)">
                  @if (selectedTypes().has(t)) { <mat-icon class="!text-[11px] !text-white">check</mat-icon> }
                </span>
                <mat-icon [style.color]="tColor(t)" class="!text-[16px] !w-[16px] !h-[16px]">{{ tIcon(t) }}</mat-icon>
                <span class="flex-1">{{ t }}</span>
                <input type="checkbox" class="hidden" [checked]="selectedTypes().has(t)" (change)="toggleType(t)"/>
              </label>
            }
          </div>
        }
      </div>

      <!-- Date range -->
      <div class="flex items-center gap-1.5">
        <div class="flex flex-col gap-1">
          <label class="text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-400 pl-0.5">From</label>
          <div class="flex items-center gap-1 rounded-xl border-[1.5px] px-2.5 py-1.5 transition-colors"
               [class]="dateFrom() ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 bg-slate-50'">
            <mat-icon class="!text-[15px] text-slate-400 pointer-events-none flex-shrink-0">event</mat-icon>
            <input type="date" class="border-0 bg-transparent outline-none text-[0.82rem] text-slate-800 font-sans w-[98px]"
                   [value]="dateFrom()"
                   (change)="dateFrom.set($any($event.target).value); resetPage()"/>
          </div>
        </div>
        <span class="text-slate-400 text-sm mt-3.5">\u2192</span>
        <div class="flex flex-col gap-1">
          <label class="text-[0.66rem] font-extrabold uppercase tracking-wider text-slate-400 pl-0.5">To</label>
          <div class="flex items-center gap-1 rounded-xl border-[1.5px] px-2.5 py-1.5 transition-colors"
               [class]="dateTo() ? 'border-indigo-500 bg-indigo-50/60' : 'border-slate-200 bg-slate-50'">
            <mat-icon class="!text-[15px] text-slate-400 pointer-events-none flex-shrink-0">event</mat-icon>
            <input type="date" class="border-0 bg-transparent outline-none text-[0.82rem] text-slate-800 font-sans w-[98px]"
                   [value]="dateTo()"
                   (change)="dateTo.set($any($event.target).value); resetPage()"/>
          </div>
        </div>
      </div>

      @if (hasActiveFilters()) {
        <button class="ml-auto inline-flex items-center gap-1.5 rounded-xl border-[1.5px] border-rose-200 text-rose-500 px-3 py-1.5 text-[0.82rem] font-bold cursor-pointer transition-all hover:bg-rose-50 hover:border-rose-400 animate-pop-in"
                (click)="clearFilters()">
          <mat-icon class="!text-[16px] !w-[16px] !h-[16px]">filter_alt_off</mat-icon> Clear all
        </button>
      }
    </div>
  </div>

  <!-- Active filter summary -->
  @if (hasActiveFilters() && !loading()) {
    <div class="flex items-center flex-wrap gap-1.5 mb-4 px-3.5 py-2 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 animate-fade-in-up">
      <mat-icon class="!text-[15px] text-violet-700">tune</mat-icon>
      <span class="text-[0.82rem] text-violet-700 mr-1"><strong class="font-extrabold">{{ totalFiltered() }}</strong> of {{ allCount() }} shown</span>
      @if (searchQuery()) {
        <span class="inline-flex items-center gap-1 bg-white border border-violet-300 text-violet-700 rounded-full py-0.5 pl-2.5 pr-1.5 text-[0.75rem] font-bold">
          <mat-icon class="!text-[12px] !w-[12px] !h-[12px]">search</mat-icon>"{{ searchQuery() }}"
          <button class="bg-transparent border-0 cursor-pointer p-0 flex opacity-60 hover:opacity-100 rounded-full" (click)="searchQuery.set(''); resetPage()"><mat-icon class="!text-[13px] !w-[13px] !h-[13px]">close</mat-icon></button>
        </span>
      }
      @for (t of selectedTypes(); track t) {
        <span class="inline-flex items-center gap-1 bg-white border border-violet-300 text-violet-700 rounded-full py-0.5 pl-2.5 pr-1.5 text-[0.75rem] font-bold">
          <mat-icon [style.color]="tColor(t)" class="!text-[12px] !w-[12px] !h-[12px]">{{ tIcon(t) }}</mat-icon>{{ t }}
          <button class="bg-transparent border-0 cursor-pointer p-0 flex opacity-60 hover:opacity-100 rounded-full" (click)="toggleType(t)"><mat-icon class="!text-[13px] !w-[13px] !h-[13px]">close</mat-icon></button>
        </span>
      }
      @if (dateFrom() || dateTo()) {
        <span class="inline-flex items-center gap-1 bg-white border border-violet-300 text-violet-700 rounded-full py-0.5 pl-2.5 pr-1.5 text-[0.75rem] font-bold">
          <mat-icon class="!text-[12px] !w-[12px] !h-[12px]">date_range</mat-icon>{{ dateFrom() || '\u2026' }} \u2192 {{ dateTo() || '\u2026' }}
          <button class="bg-transparent border-0 cursor-pointer p-0 flex opacity-60 hover:opacity-100 rounded-full" (click)="dateFrom.set(''); dateTo.set(''); resetPage()"><mat-icon class="!text-[13px] !w-[13px] !h-[13px]">close</mat-icon></button>
        </span>
      }
      @if (section() !== 'all') {
        <span class="inline-flex items-center gap-1 bg-white border border-violet-300 text-violet-700 rounded-full py-0.5 pl-2.5 pr-1.5 text-[0.75rem] font-bold">
          <mat-icon class="!text-[12px] !w-[12px] !h-[12px]">{{ section() === 'upcoming' ? 'upcoming' : 'history' }}</mat-icon>
          {{ section() === 'upcoming' ? 'Upcoming only' : 'Past only' }}
          <button class="bg-transparent border-0 cursor-pointer p-0 flex opacity-60 hover:opacity-100 rounded-full" (click)="section.set('all'); resetPage()"><mat-icon class="!text-[13px] !w-[13px] !h-[13px]">close</mat-icon></button>
        </span>
      }
    </div>
  }

  <!-- Loading / error / empty states -->
  @if (loading()) {
    <div class="iv-grid">
      @for (i of skeletonArray; track i) {
        <div class="app-card rounded-2xl flex flex-col gap-3 px-5 pt-[18px] pb-3.5 cursor-default">
          <div class="flex items-start gap-2.5">
            <div class="skeleton-block w-10 h-10 rounded-xl flex-shrink-0"></div>
            <div class="flex-1 min-w-0">
              <div class="skeleton-block w-[65%] h-[13px] mb-1.5"></div>
              <div class="skeleton-block w-[45%] h-[11px]"></div>
            </div>
          </div>
          <div class="skeleton-block w-full h-8 rounded-lg"></div>
          <div class="skeleton-block h-8 rounded-lg" style="width:70%"></div>
        </div>
      }
    </div>
  } @else if (error()) {
    <div class="flex flex-col items-center gap-3 py-20 text-slate-500 text-center">
      <mat-icon class="!text-5xl !w-12 !h-12 text-rose-500">error_outline</mat-icon>
      <h3 class="text-slate-800 font-semibold text-base">Failed to load interviews</h3>
      <button mat-stroked-button (click)="load()">Retry</button>
    </div>
  } @else if (allCount() === 0) {
    <div class="flex flex-col items-center gap-3 py-20 text-slate-500 text-center animate-fade-in-up">
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
        <mat-icon class="!text-3xl !w-8 !h-8 text-indigo-400">event_note</mat-icon>
      </div>
      <h3 class="text-slate-800 font-semibold text-base">No interviews yet</h3>
      <p>Schedule one from an application page.</p>
    </div>
  } @else if (totalFiltered() === 0) {
    <div class="flex flex-col items-center gap-3 py-20 text-slate-500 text-center animate-fade-in-up">
      <mat-icon class="!text-5xl !w-12 !h-12 opacity-30">search_off</mat-icon>
      <h3 class="text-slate-800 font-semibold text-base">No interviews match your filters</h3>
      <button mat-stroked-button (click)="clearFilters()">Clear Filters</button>
    </div>
  } @else {

    <!-- Upcoming section -->
    @if (pagedUpcoming().length > 0) {
      <div class="flex items-center gap-2.5 mb-3.5">
        <span class="inline-flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full bg-violet-100 text-violet-700">
          <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">upcoming</mat-icon> Upcoming
        </span>
        <span class="text-[0.82rem] font-bold text-slate-500">{{ filteredUpcoming().length }}</span>
      </div>
      <div class="iv-grid" [@gridStagger]="animKey()">
        @for (iv of pagedUpcoming(); track iv.interviewId) {
          <div class="app-card iv-card iv-card--upcoming" [style.borderLeftColor]="tColor(iv.interviewType)" (click)="open(iv)" role="button" tabindex="0" (keydown.enter)="open(iv)">
            <ng-container *ngTemplateOutlet="cardTpl; context:{ $implicit: iv }"/>
          </div>
        }
      </div>
    }

    <!-- Past section -->
    @if (pagedPast().length > 0) {
      <div class="flex items-center gap-2.5 mb-3.5 mt-7">
        <span class="inline-flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full bg-slate-100 text-slate-500">
          <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">history</mat-icon> Past
        </span>
        <span class="text-[0.82rem] font-bold text-slate-500">{{ filteredPast().length }}</span>
      </div>
      <div class="iv-grid" [@gridStagger]="animKey()">
        @for (iv of pagedPast(); track iv.interviewId) {
          <div class="app-card iv-card iv-card--past" [style.borderLeftColor]="tColor(iv.interviewType) + '90'" (click)="open(iv)" role="button" tabindex="0" (keydown.enter)="open(iv)">
            <ng-container *ngTemplateOutlet="cardTpl; context:{ $implicit: iv }"/>
          </div>
        }
      </div>
    }

    <!-- Pagination -->
    @if (totalPages() > 1 || pageSize() !== PAGE_SIZE_OPTIONS[0]) {
      <div class="app-card flex items-center flex-wrap gap-2.5 justify-between px-4.5 py-3 mt-2.5">
        <div class="flex items-center gap-1.5">
          <span class="text-[0.78rem] font-bold text-slate-500">Per page</span>
          @for (n of pageSizeOptions; track n) {
            <button class="rounded-lg border-[1.5px] px-2.5 py-1 text-[0.8rem] font-bold cursor-pointer transition-all"
                    [class]="pageSize() === n
                      ? 'bg-indigo-500 border-indigo-500 text-white'
                      : 'border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-500'"
                    (click)="pageSize.set(n); currentPage.set(0)">{{ n }}</button>
          }
        </div>
        <span class="text-[0.85rem] font-bold text-slate-800 flex items-center gap-1.5">Page {{ currentPage() + 1 }} of {{ totalPages() }}
          <span class="text-slate-500 font-medium">({{ totalFiltered() }} items)</span>
        </span>
        <div class="flex items-center gap-0.5">
          <button class="page-nav-btn" (click)="goToPage(0)" [disabled]="currentPage() === 0" matTooltip="First">
            <mat-icon>first_page</mat-icon>
          </button>
          <button class="page-nav-btn" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 0" matTooltip="Previous">
            <mat-icon>chevron_left</mat-icon>
          </button>
          @for (p of visiblePages(); track $index) {
            @if (p === -1) {
              <span class="w-6 text-center text-sm text-slate-500">\u2026</span>
            } @else {
              <button class="page-nav-btn !w-auto min-w-[32px] px-1.5 text-[0.82rem] font-bold"
                      [class]="p === currentPage() ? '!bg-indigo-500 !border-indigo-500 !text-white' : ''"
                      (click)="goToPage(p)">{{ p + 1 }}</button>
            }
          }
          <button class="page-nav-btn" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1" matTooltip="Next">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <button class="page-nav-btn" (click)="goToPage(totalPages() - 1)" [disabled]="currentPage() >= totalPages() - 1" matTooltip="Last">
            <mat-icon>last_page</mat-icon>
          </button>
        </div>
      </div>
    }

  }
</div>
}

<!-- ══ DETAIL VIEW ══ -->
@if (selected()) {
<div class="page-container !max-w-[1440px]" @viewSwitch>

  <!-- Topbar -->
  <div class="flex items-center justify-between gap-4 flex-wrap mb-5">
    <button class="inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer text-indigo-500 text-sm font-bold py-1.5 transition-transform hover:-translate-x-0.5" (click)="close()">
      <mat-icon class="!text-xl">arrow_back</mat-icon><span>All Interviews</span>
    </button>
    <div class="flex items-center gap-2">
      @if (!editing()) {
        <button class="action-btn action-btn--outline" (click)="startEdit()">
          <mat-icon>edit</mat-icon> Edit Interview
        </button>
      } @else {
        <button class="action-btn action-btn--ghost" (click)="cancelEdit()" [disabled]="saving()">
          <mat-icon>close</mat-icon> Cancel
        </button>
        <button class="action-btn action-btn--primary" (click)="saveEdit()" [disabled]="saving()">
          @if (saving()) { <mat-spinner diameter="16"/> } @else { <mat-icon>check</mat-icon> }
          {{ saving() ? 'Saving\u2026' : 'Save Changes' }}
        </button>
      }
    </div>
  </div>

  <!-- Hero card -->
  <div class="app-card flex items-center justify-between flex-wrap gap-4 px-7 py-6 mb-5 border-t-4"
       [style.border-top-color]="isPast(selected()!.interviewDate) ? '#94a3b8' : 'var(--primary,#6366f1)'"
       [style.background]="isPast(selected()!.interviewDate) ? '' : 'linear-gradient(135deg,#fff,#f5f3ff 130%)'"
       @heroPop>
    <div class="flex items-center gap-4">
      <div class="co-avatar co-avatar--lg shadow-lg ring-4 ring-white" [style.background]="avatarBg(selected()!.jobApplication?.companyName ?? '')">
        {{ (selected()!.jobApplication?.companyName ?? '?')[0].toUpperCase() }}
      </div>
      <div>
        <div class="text-xl font-extrabold text-slate-800 tracking-tight">{{ selected()!.jobApplication?.title ?? '\u2014' }}</div>
        <div class="text-sm text-slate-500 mt-0.5">&#64; {{ selected()!.jobApplication?.companyName ?? '\u2014' }}</div>
      </div>
    </div>
    <div class="flex items-center gap-2 flex-wrap">
      <span class="type-chip" [style.color]="'#fff'" [style.background]="tColor(selected()!.interviewType)" [style.boxShadow]="'0 4px 12px -3px ' + tColor(selected()!.interviewType) + '80'">
        <mat-icon>{{ tIcon(selected()!.interviewType) }}</mat-icon>
        {{ selected()!.interviewType }}
      </span>
      <span class="status-chip"
            [style.color]="sColor(selected()!.jobApplication?.status)"
            [style.background]="sBg(selected()!.jobApplication?.status)">
        {{ sLabel(selected()!.jobApplication?.status) }}
      </span>
    </div>
  </div>

  <!-- Fields grid -->
  @if (!editing()) {
    <div class="detail-grid" @fieldStagger>
      <div class="app-card detail-field detail-field--wide">
        <div class="detail-field-label"><mat-icon>event</mat-icon> Interview Date</div>
        <div class="detail-field-value"
             [class.detail-field-value--upcoming]="!isPast(selected()!.interviewDate)"
             [class.detail-field-value--past]="isPast(selected()!.interviewDate)">
          {{ selected()!.interviewDate | date:'EEEE, MMMM d, y' }}
          @if (dayLabel(selected()!.interviewDate)) {
            <span class="rel-pill" [class.rel-pill--today]="isToday(selected()!.interviewDate)">
              {{ dayLabel(selected()!.interviewDate) }}
            </span>
          }
        </div>
      </div>
      <div class="app-card detail-field">
        <div class="detail-field-label"><mat-icon>schedule</mat-icon> Time</div>
        <div class="detail-field-value">{{ selected()!.interviewDate | date:'h:mm a' }}</div>
      </div>
      @if (selected()!.interviewerName) {
        <div class="app-card detail-field">
          <div class="detail-field-label"><mat-icon>person</mat-icon> Interviewer</div>
          <div class="detail-field-value">{{ selected()!.interviewerName }}</div>
        </div>
      }
      @if (selected()!.jobApplication?.location) {
        <div class="app-card detail-field">
          <div class="detail-field-label"><mat-icon>location_on</mat-icon> Location</div>
          <div class="detail-field-value">{{ selected()!.jobApplication?.location }}</div>
        </div>
      }
      @if (selected()!.jobApplication?.workMode) {
        <div class="app-card detail-field">
          <div class="detail-field-label"><mat-icon>home_work</mat-icon> Work Mode</div>
          <div class="detail-field-value">{{ selected()!.jobApplication?.workMode }}</div>
        </div>
      }
      @if (selected()!.jobApplication?.type) {
        <div class="app-card detail-field">
          <div class="detail-field-label"><mat-icon>work_outline</mat-icon> Job Type</div>
          <div class="detail-field-value">{{ selected()!.jobApplication?.type }}</div>
        </div>
      }
      <div class="app-card detail-field">
        <div class="detail-field-label"><mat-icon>add_circle_outline</mat-icon> Scheduled On</div>
        <div class="detail-field-value">{{ selected()!.createdAt | date:'MMM d, y' }}</div>
      </div>
    </div>

    <!-- Notes / Feedback -->
    <div class="detail-content-grid" @fieldStagger>
      @if (selected()!.note) {
        <div class="app-card info-card info-card--notes">
          <div class="info-card-header"><mat-icon>sticky_note_2</mat-icon><span>Interview Notes</span></div>
          <div class="info-card-body">{{ selected()!.note }}</div>
        </div>
      }
      @if (selected()!.feedback) {
        <div class="app-card info-card info-card--feedback">
          <div class="info-card-header"><mat-icon>rate_review</mat-icon><span>Recruiter Feedback</span></div>
          <div class="info-card-body">{{ selected()!.feedback }}</div>
        </div>
      }
    </div>
  }

  <!-- Edit form -->
  @if (editing()) {
    <div class="app-card edit-panel" @heroPop>
      <div class="edit-grid" @fieldStagger>
        <div class="edit-field edit-field--wide">
          <label class="edit-label"><mat-icon>event</mat-icon> Interview Date &amp; Time</label>
          <input class="edit-input" type="datetime-local" [(ngModel)]="editForm.interviewDate"/>
        </div>
        <div class="edit-field">
          <label class="edit-label"><mat-icon>category</mat-icon> Interview Type</label>
          <div class="edit-select-wrap">
            <select class="edit-select" [(ngModel)]="editForm.interviewType">
              @for (t of interviewTypes; track t) { <option [value]="t">{{ t }}</option> }
            </select>
            <mat-icon class="edit-select-arrow">expand_more</mat-icon>
          </div>
        </div>
        <div class="edit-field">
          <label class="edit-label"><mat-icon>person</mat-icon> Interviewer Name</label>
          <input class="edit-input" type="text" placeholder="e.g. Jane Smith" [(ngModel)]="editForm.interviewerName"/>
        </div>
        <div class="edit-field edit-field--wide">
          <label class="edit-label"><mat-icon>sticky_note_2</mat-icon> Interview Notes</label>
          <textarea class="edit-textarea" rows="4" placeholder="Preparation notes, questions to ask\u2026" [(ngModel)]="editForm.note"></textarea>
        </div>
        <div class="edit-field edit-field--wide">
          <label class="edit-label"><mat-icon>rate_review</mat-icon> Recruiter Feedback</label>
          <textarea class="edit-textarea" rows="4" placeholder="Feedback received after the interview\u2026" [(ngModel)]="editForm.feedback"></textarea>
        </div>
      </div>
      <div class="edit-footer">
        <button class="action-btn action-btn--ghost" (click)="cancelEdit()" [disabled]="saving()">Cancel</button>
        <button class="action-btn action-btn--primary" (click)="saveEdit()" [disabled]="saving()">
          @if (saving()) { <mat-spinner diameter="16"/> } @else { <mat-icon>check</mat-icon> }
          {{ saving() ? 'Saving\u2026' : 'Save Changes' }}
        </button>
      </div>
    </div>
  }

  <!-- Footer -->
  <div class="mt-6">
    <a mat-flat-button color="primary" [routerLink]="['/applications', selected()!.jobApplication?.jobAppId]">
      <mat-icon>open_in_new</mat-icon> View Full Application
    </a>
  </div>
</div>
}

<!-- ── Card template ── -->
<ng-template #cardTpl let-iv>
  <div class="ivc-top">
    <div class="co-avatar" [style.background]="avatarBg(iv.jobApplication?.companyName ?? '')">
      {{ (iv.jobApplication?.companyName ?? '?')[0].toUpperCase() }}
    </div>
    <div class="ivc-meta">
      <div class="ivc-title">{{ iv.jobApplication?.title ?? '\u2014' }}</div>
      <div class="ivc-company text-muted">{{ iv.jobApplication?.companyName ?? '\u2014' }}</div>
    </div>
    <span class="type-chip type-chip--sm"
          [style.color]="'#fff'"
          [style.background]="tColor(iv.interviewType)">
      <mat-icon [style.color]="'#fff'">{{ tIcon(iv.interviewType) }}</mat-icon>
      {{ iv.interviewType }}
    </span>
  </div>

  <div class="ivc-date-row">
    <div class="ivc-date" [class.ivc-date--today]="isToday(iv.interviewDate)">
      <mat-icon>event</mat-icon>
      {{ iv.interviewDate | date:'EEE, MMM d, y' }}
      @if (dayLabel(iv.interviewDate)) {
        <span class="rel-pill" [class.rel-pill--today]="isToday(iv.interviewDate)">
          {{ dayLabel(iv.interviewDate) }}
        </span>
      }
    </div>
    <span class="status-chip"
          [style.color]="sColor(iv.jobApplication?.status)"
          [style.background]="sBg(iv.jobApplication?.status)">
      {{ sLabel(iv.jobApplication?.status) }}
    </span>
  </div>

  @if (iv.interviewerName) {
    <div class="ivc-row">
      <mat-icon>person</mat-icon>
      <span class="ivc-row-label">Interviewer</span>
      <span class="ivc-row-value">{{ iv.interviewerName }}</span>
    </div>
  }
  @if (iv.jobApplication?.location) {
    <div class="ivc-row">
      <mat-icon>location_on</mat-icon>
      <span class="ivc-row-label">Location</span>
      <span class="ivc-row-value">{{ iv.jobApplication?.location }}</span>
    </div>
  }
  @if (iv.note) {
    <div class="ivc-note">
      <mat-icon>notes</mat-icon>
      <span>{{ iv.note }}</span>
    </div>
  }

  <div class="ivc-footer">
    <span class="text-muted" style="font-size:.78rem;font-weight:700;">{{ iv.interviewDate | date:'h:mm a' }}</span>
    <span class="ivc-cta">View details <mat-icon>arrow_forward</mat-icon></span>
  </div>
</ng-template>
  `,
  styles: [`
    /* Everything below is presentation-only: layout primitives that read
       awkwardly as long inline Tailwind strings (dynamic child selectors,
       hover-reveal children, gradients keyed off interview state), plus the
       skeleton shimmer keyframes. No component logic lives here. */

    /* Grid */
    .iv-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(310px,1fr)); gap:16px; }

    /* Interview card — app-card provides bg/border/radius/shadow */
    .iv-card {
      display:flex; flex-direction:column; gap:11px;
      padding:18px 20px 14px; cursor:pointer; user-select:none;
      border-left:4px solid transparent; border-radius:16px;
      transition:transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s ease, border-color .18s;
      &:hover { transform:translateY(-4px) scale(1.012); box-shadow:0 14px 34px -8px rgba(99,102,241,.22); }
      &:active { transform:translateY(-1px) scale(0.99); }
    }
    .iv-card--past { opacity:.85; &:hover { opacity:1; } }

    /* Avatar */
    .co-avatar {
      width:40px; height:40px; border-radius:11px; flex-shrink:0;
      color:#fff; font-weight:700; font-size:.95rem;
      display:flex; align-items:center; justify-content:center;
      transition: transform .2s ease;
    }
    .iv-card:hover .co-avatar { transform: scale(1.08) rotate(-2deg); }
    .co-avatar--lg { width:56px; height:56px; border-radius:16px; font-size:1.3rem; font-weight:900; }

    /* Status/type chips */
    .status-chip {
      display:inline-flex; align-items:center;
      padding:3px 10px; border-radius:20px;
      font-size:.72rem; font-weight:700; white-space:nowrap;
    }
    .type-chip {
      display:inline-flex; align-items:center; gap:4px;
      font-size:.72rem; font-weight:800; padding:3px 9px; border-radius:20px; white-space:nowrap;
      mat-icon { font-size:13px; width:13px; height:13px; }
    }
    .type-chip--sm { flex-shrink:0; }

    /* Card internals */
    .ivc-top { display:flex; align-items:flex-start; gap:10px; }
    .ivc-meta { flex:1; min-width:0; }
    .ivc-title { font-weight:700; font-size:.95rem; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ivc-company { font-size:.82rem; margin-top:2px; }

    .ivc-date-row {
      display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;
      padding:9px 11px; border-radius:10px; background:var(--surface-2,#f8fafc);
    }
    .ivc-date {
      display:flex; align-items:center; gap:5px; font-size:.85rem; font-weight:700;
      color:var(--primary,#6366f1);
      mat-icon { font-size:15px; width:15px; height:15px; }
    }
    .ivc-date--today { color:#16a34a; }
    .rel-pill { font-size:.7rem; font-weight:800; padding:2px 8px; border-radius:20px; background:#ede9fe; color:#5b21b6; margin-left:3px; }
    .rel-pill--today { background:#dcfce7; color:#15803d; animation: pulseGlow 2.2s ease-in-out infinite; }

    .ivc-row {
      display:flex; align-items:center; gap:5px; font-size:.83rem; color:var(--text-secondary);
      mat-icon { font-size:14px; width:14px; height:14px; flex-shrink:0; color:var(--text-tertiary,#cbd5e1); }
    }
    .ivc-row-label { font-size:.7rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:var(--text-secondary); min-width:68px; }
    .ivc-row-value { font-weight:600; color:var(--text-primary); }

    .ivc-note {
      display:flex; align-items:flex-start; gap:5px; font-size:.83rem; color:var(--text-secondary); line-height:1.5;
      mat-icon { font-size:14px; width:14px; height:14px; flex-shrink:0; color:var(--primary,#6366f1); margin-top:1px; }
      span { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    }

    .ivc-footer {
      display:flex; align-items:center; justify-content:space-between;
      padding-top:4px; border-top:1px solid var(--border,#f1f5f9);
    }
    .ivc-cta {
      display:flex; align-items:center; gap:3px; font-size:.78rem; font-weight:800;
      color:var(--primary,#6366f1); opacity:0; transform:translateX(-4px);
      transition:opacity .2s ease, transform .2s ease;
      mat-icon { font-size:14px; width:14px; height:14px; }
    }
    .iv-card:hover .ivc-cta { opacity:1; transform:translateX(0); }

    /* Pagination nav buttons (shared look) */
    .page-nav-btn {
      display:flex; align-items:center; justify-content:center;
      background:none; border:1.5px solid var(--border,#e2e8f0); border-radius:10px;
      width:32px; height:32px; cursor:pointer; color:var(--text-secondary); transition:all .15s;
      mat-icon { font-size:18px; }
      &:hover:not(:disabled) { border-color:var(--primary,#6366f1); color:var(--primary,#6366f1); transform:translateY(-1px); }
      &:active:not(:disabled) { transform:scale(0.92); }
      &:disabled { opacity:.3; cursor:default; }
    }

    /* Detail page */
    .detail-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; margin-bottom:20px; }
    .detail-field { padding:14px 16px; border-radius:14px; transition: transform .18s ease, box-shadow .18s ease; &:hover { transform: translateY(-2px); } }
    .detail-field--wide { grid-column:span 2; }
    .detail-field-label {
      display:flex; align-items:center; gap:4px; font-size:.7rem; font-weight:800;
      text-transform:uppercase; letter-spacing:.07em; color:var(--text-secondary); margin-bottom:6px;
      mat-icon { font-size:13px; width:13px; height:13px; }
    }
    .detail-field-value { font-size:.95rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .detail-field-value--upcoming { color:var(--primary,#6366f1); }
    .detail-field-value--past     { color:var(--text-secondary); }

    .detail-content-grid { display:grid; gap:14px; margin-bottom:20px; }
    .info-card { overflow:hidden; border-left-width:4px; border-radius:14px; transition: transform .18s ease; &:hover { transform: translateY(-2px); } }
    .info-card-header {
      display:flex; align-items:center; gap:8px; padding:11px 16px;
      font-size:.78rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em;
    }
    .info-card-body { padding:16px 20px; line-height:1.8; white-space:pre-wrap; font-size:.93rem; color:var(--text-primary); }
    .info-card--notes    { border-left-color:#3b82f6; .info-card-header { background:#eff6ff; color:#1d4ed8; } }
    .info-card--feedback { border-left-color:#22c55e; .info-card-header { background:#f0fdf4; color:#15803d; } }

    /* Action buttons */
    .action-btn {
      display:inline-flex; align-items:center; gap:6px;
      border-radius:12px; padding:8px 16px; font-size:.85rem; font-weight:700;
      cursor:pointer; transition:all .18s cubic-bezier(.16,1,.3,1);
      mat-icon { font-size:16px; width:16px; height:16px; }
      &:hover:not(:disabled) { transform: translateY(-1px); }
      &:active:not(:disabled) { transform: scale(0.95); }
      &:disabled { opacity:.5; cursor:default; transform:none; }
    }
    .action-btn--primary {
      background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none;
      box-shadow: 0 4px 14px -4px rgba(99,102,241,.5);
      &:hover:not(:disabled) { box-shadow: 0 8px 20px -4px rgba(99,102,241,.6); }
    }
    .action-btn--outline {
      background:var(--surface,#fff); border:1.5px solid var(--border,#e2e8f0); color:var(--text-primary);
      mat-icon { color:var(--primary,#6366f1); }
      &:hover:not(:disabled) { border-color:var(--primary,#6366f1); box-shadow:0 0 0 3px color-mix(in srgb,var(--primary,#6366f1) 10%,transparent); }
    }
    .action-btn--ghost {
      background:none; border:1.5px solid var(--border,#e2e8f0); color:var(--text-secondary);
      &:hover:not(:disabled) { border-color:#dc2626; color:#dc2626; }
    }

    /* Edit form */
    .edit-panel { padding:24px 28px; margin-bottom:20px; border-radius:18px; }
    .edit-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-bottom:22px; @media (max-width:600px) { grid-template-columns:1fr; } }
    .edit-field { display:flex; flex-direction:column; gap:6px; }
    .edit-field--wide { grid-column:span 2; @media (max-width:600px) { grid-column:span 1; } }
    .edit-label {
      display:flex; align-items:center; gap:5px; font-size:.72rem; font-weight:800;
      text-transform:uppercase; letter-spacing:.07em; color:var(--text-secondary);
      mat-icon { font-size:13px; width:13px; height:13px; }
    }
    .edit-input, .edit-select, .edit-textarea {
      width:100%; font-size:.92rem; color:var(--text-primary);
      background:var(--surface-2,#f8fafc); border:1.5px solid var(--border,#e2e8f0);
      border-radius:12px; outline:none; transition:border-color .15s, box-shadow .15s; font-family:inherit;
      &:focus { border-color:var(--primary,#6366f1); box-shadow:0 0 0 3px color-mix(in srgb,var(--primary,#6366f1) 10%,transparent); background:var(--surface,#fff); }
    }
    .edit-input    { padding:10px 14px; }
    .edit-textarea { padding:10px 14px; resize:vertical; min-height:100px; line-height:1.65; }
    .edit-select-wrap { position:relative; }
    .edit-select { padding:10px 36px 10px 14px; appearance:none; cursor:pointer; width:100%; }
    .edit-select-arrow { position:absolute; right:10px; top:50%; transform:translateY(-50%); pointer-events:none; font-size:18px; color:var(--text-secondary); }
    .edit-footer { display:flex; justify-content:flex-end; gap:8px; padding-top:18px; border-top:1.5px solid var(--border,#e2e8f0); }

    /* Skeleton loading */
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,.35); } 50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); } }
    .skeleton-block {
      border-radius:6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e9edf3 37%, #f1f5f9 63%);
      background-size: 400% 100%;
      animation: shimmer 1.6s ease infinite;
    }
  `],
})
export class InterviewsComponent implements OnInit {
  private intSvc = inject(InterviewsService);

  loading  = signal(true);
  error    = signal(false);
  saving   = signal(false);
  editing  = signal(false);
  selected = signal<Interview | null>(null);

  searchQuery   = signal('');
  section       = signal<'all' | 'upcoming' | 'past'>('all');
  selectedTypes = signal<Set<InterviewType>>(new Set());
  dateFrom      = signal('');
  dateTo        = signal('');
  currentPage   = signal(0);
  pageSize      = signal(PAGE_SIZE_OPTIONS[0]);

  typeDropOpen = false;
  skeletonArray = Array.from({ length: 6 }, (_, i) => i);

  interviewTypes  = INTERVIEW_TYPES;
  pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  sectionTabs = [
    { value: 'all'      as const, label: 'All',      icon: 'calendar_month' },
    { value: 'upcoming' as const, label: 'Upcoming', icon: 'upcoming'       },
    { value: 'past'     as const, label: 'Past',     icon: 'history'        },
  ];

  private _upcoming = signal<Interview[]>([]);
  private _past     = signal<Interview[]>([]);

  editForm: EditForm = { interviewDate:'', interviewType:'', interviewerName:'', note:'', feedback:'' };

  allCount = computed(() => this._upcoming().length + this._past().length);

  filteredUpcoming = computed(() => {
    if (this.section() === 'past') return [];
    return this._applyFilters(this._upcoming());
  });
  filteredPast = computed(() => {
    if (this.section() === 'upcoming') return [];
    return this._applyFilters(this._past());
  });
  totalFiltered = computed(() => this.filteredUpcoming().length + this.filteredPast().length);
  totalPages    = computed(() => Math.max(1, Math.ceil(this.totalFiltered() / this.pageSize())));

  pagedUpcoming = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end   = start + this.pageSize();
    const upLen = this.filteredUpcoming().length;
    return this.filteredUpcoming().slice(Math.min(start, upLen), Math.min(end, upLen));
  });
  pagedPast = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end   = start + this.pageSize();
    const upLen = this.filteredUpcoming().length;
    return this.filteredPast().slice(Math.max(0, start - upLen), Math.max(0, end - upLen));
  });
  visiblePages = computed(() => {
    const total = this.totalPages(); const cur = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages: number[] = [0];
    if (cur > 2) pages.push(-1);
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++) pages.push(i);
    if (cur < total - 3) pages.push(-1);
    pages.push(total - 1);
    return pages;
  });
  hasActiveFilters = computed(() =>
    !!this.searchQuery() || this.selectedTypes().size > 0 ||
    !!this.dateFrom() || !!this.dateTo() || this.section() !== 'all'
  );
  animKey = computed(() => `${this.currentPage()}-${this.totalFiltered()}`);

  ngOnInit(): void { this.load(); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.typeDropOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrap') && !target.closest('.relative')) {
      this.typeDropOpen = false;
    }
  }

  load(): void {
    this.loading.set(true); this.error.set(false);
    this.intSvc.getAll().subscribe({
      next: res => {
        const today  = new Date(); today.setHours(0,0,0,0);
        const sorted = [...res.data].sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime());
        this._upcoming.set(sorted.filter(iv => new Date(iv.interviewDate) >= today));
        this._past.set(sorted.filter(iv => new Date(iv.interviewDate) < today).reverse());
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  open(iv: Interview): void  { this.selected.set(iv); this.editing.set(false); this.typeDropOpen = false; }
  close(): void              { this.selected.set(null); this.editing.set(false); }
  toggleType(t: InterviewType): void {
    const next = new Set(this.selectedTypes());
    next.has(t) ? next.delete(t) : next.add(t);
    this.selectedTypes.set(next); this.resetPage();
  }
  clearTypeFilter(): void { this.selectedTypes.set(new Set()); this.resetPage(); }
  clearFilters(): void {
    this.searchQuery.set(''); this.section.set('all');
    this.selectedTypes.set(new Set()); this.dateFrom.set(''); this.dateTo.set('');
    this.resetPage();
  }
  goToPage(p: number): void { this.currentPage.set(Math.max(0, Math.min(p, this.totalPages() - 1))); }
  resetPage(): void         { this.currentPage.set(0); }

  startEdit(): void {
    const iv = this.selected(); if (!iv) return;
    const d = new Date(iv.interviewDate);
    const pad = (n: number) => String(n).padStart(2,'0');
    this.editForm = {
      interviewDate:   `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      interviewType:   iv.interviewType,
      interviewerName: iv.interviewerName ?? '',
      note:            iv.note            ?? '',
      feedback:        iv.feedback        ?? '',
    };
    this.editing.set(true);
  }
  cancelEdit(): void { this.editing.set(false); }
  saveEdit(): void {
    const iv = this.selected(); if (!iv) return;
    this.saving.set(true);
    const savedJobApplication = iv.jobApplication;
    const payload = {
      interviewDate:   this.editForm.interviewDate ? new Date(this.editForm.interviewDate).toISOString() : new Date(iv.interviewDate).toISOString(),
      interviewType:   this.editForm.interviewType as InterviewType,
      interviewerName: this.editForm.interviewerName || null,
      note:            this.editForm.note            || null,
      feedback:        this.editForm.feedback        || null,
    };
    this.intSvc.update(iv.interviewId, payload).subscribe({
      next: (res: any) => {
        const updated: Interview = { ...iv, ...(res?.data ?? res), jobApplication: savedJobApplication };
        this.selected.set(updated);
        const patch = (list: Interview[]) => list.map(x => x.interviewId === updated.interviewId ? updated : x);
        this._upcoming.update(patch); this._past.update(patch);
        this.editing.set(false); this.saving.set(false);
      },
      error: () => { this.saving.set(false); },
    });
  }

  isPast(d: Date | string)                 { return new Date(d) < new Date(); }
  avatarBg(name: string)                   { return avatarColor(name); }
  tIcon(t: InterviewType)                  { return typeMeta(t).icon; }
  tColor(t: InterviewType)                 { return typeMeta(t).color; }
  sColor(s: ApplicationStatus | undefined) { return s ? statusMeta(s).color : '#6b7280'; }
  sBg(s: ApplicationStatus | undefined)    { return s ? statusMeta(s).bg    : '#f3f4f6'; }
  sLabel(s: ApplicationStatus | undefined) { return s ? statusMeta(s).label : '\u2014'; }
  dayLabel(d: Date | string)               { return relativeDay(d); }
  isToday(d: Date | string): boolean {
    const today = new Date(); today.setHours(0,0,0,0);
    const cmp   = new Date(d); cmp.setHours(0,0,0,0);
    return today.getTime() === cmp.getTime();
  }

  private _applyFilters(list: Interview[]): Interview[] {
    const q      = this.searchQuery().trim().toLowerCase();
    const types  = this.selectedTypes();
    const fromMs = this.dateFrom() ? new Date(this.dateFrom()).setHours(0,0,0,0)    : null;
    const toMs   = this.dateTo()   ? new Date(this.dateTo()).setHours(23,59,59,999) : null;
    return list.filter(iv => {
      if (q) {
        const hay = [iv.jobApplication?.companyName ?? '', iv.jobApplication?.title ?? '', iv.interviewType, iv.interviewerName ?? '', iv.note ?? '', iv.feedback ?? ''].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (types.size > 0 && !types.has(iv.interviewType)) return false;
      const ms = new Date(iv.interviewDate).getTime();
      if (fromMs !== null && ms < fromMs) return false;
      if (toMs   !== null && ms > toMs)   return false;
      return true;
    });
  }
}
