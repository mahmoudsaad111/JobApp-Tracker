import { Component, inject, OnInit, Input } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { ApplicationsService } from '../../../core/services/applications.service';
import { InterviewsService } from '../../../core/services/interviews.service';
import { DocumentsService, DocumentDto } from '../../../core/services/document.service';
import { NotificationService } from '../../../core/services/notification.service';
import { JobApplication, Interview, APPLICATION_STATUSES, INTERVIEW_TYPES, ResumeMatchResult, CoverLetterDto } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const IV_TYPE_COLOR: Record<string, string> = {
  Phone: '#2563eb', Video: '#0891b2', OnSite: '#d97706',
  Technical: '#7c3aed', HRRound: '#059669', Final: '#16a34a',
};
function ivTypeColor(t: string): string { return IV_TYPE_COLOR[t] ?? '#64748b'; }

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule,
    MatProgressSpinnerModule, MatChipsModule,
    MatCardModule, MatTabsModule
  ],
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('280ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('ivStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(40, animate('240ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="page-container" @pageIn>
      @if (loading) {
        <div class="skeleton-detail">
          <div class="skeleton-header">
            <div class="skeleton-block" style="width:36px;height:36px;border-radius:10px"></div>
            <div>
              <div class="skeleton-block" style="width:220px;height:22px;margin-bottom:8px"></div>
              <div class="skeleton-block" style="width:150px;height:13px"></div>
            </div>
          </div>
          <div class="skeleton-detail-grid">
            <div class="skeleton-col">
              @for (i of [1,2,3]; track i) {
                <div class="app-card skeleton-card">
                  <div class="skeleton-block" style="width:60%;height:16px;margin-bottom:16px"></div>
                  <div class="skeleton-block" style="width:100%;height:13px;margin-bottom:10px"></div>
                  <div class="skeleton-block" style="width:85%;height:13px;margin-bottom:10px"></div>
                  <div class="skeleton-block" style="width:70%;height:13px"></div>
                </div>
              }
            </div>
            <div class="app-card skeleton-card">
              <div class="skeleton-block" style="width:50%;height:16px;margin-bottom:16px"></div>
              <div class="skeleton-block" style="width:100%;height:60px;border-radius:12px;margin-bottom:10px"></div>
              <div class="skeleton-block" style="width:100%;height:60px;border-radius:12px"></div>
            </div>
          </div>
        </div>
      } @else if (app) {

        <!-- Celebration confetti — fires when status is set to Accepted -->
        @if (confetti.length) {
          <div class="confetti-layer">
            @for (c of confetti; track c.id) {
              <span class="confetti-piece"
                    [style.left.%]="c.left"
                    [style.background]="c.color"
                    [style.animationDelay]="c.delay + 's'"
                    [style.animationDuration]="c.duration + 's'"></span>
            }
          </div>
        }

        <!-- Header -->
        <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div class="flex items-center gap-3">
            <a mat-icon-button routerLink="/applications"><mat-icon>arrow_back</mat-icon></a>
            <div>
              <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{{ app.title }}</h1>
              <p class="text-slate-500 text-sm mt-1 font-medium">{{ app.companyName }} · {{ app.location }}</p>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <a mat-stroked-button [routerLink]="['/applications', app.jobAppId, 'edit']">
              <mat-icon>edit</mat-icon> Edit
            </a>
            <button mat-stroked-button color="warn" (click)="deleteApp()">
              <mat-icon>delete</mat-icon> Delete
            </button>
          </div>
        </div>

        <div class="detail-grid">
          <!-- Left: Info + Status + Notes -->
          <div class="left-col">
            <!-- Status Card -->
            <div class="app-card info-card">
              <h3><mat-icon class="h3-icon">flag</mat-icon> Quick Update Status</h3>
              <div class="status-row">
                @for (s of statuses; track s) {
                  <button class="status-pill {{ s }}"
                    [class.active]="app.status === s"
                    (click)="changeStatus(s)">
                    {{ s }}
                  </button>
                }
              </div>
            </div>

            <!-- Details -->
            <div class="app-card info-card">
              <h3><mat-icon class="h3-icon">info_outline</mat-icon> Application Details</h3>
              <div class="detail-list">
                <div class="detail-row">
                  <span class="dr-icon"><mat-icon>business</mat-icon></span>
                  <div><div class="dr-label">Company</div><div>{{ app.companyName }}</div></div>
                </div>
                <div class="detail-row">
                  <span class="dr-icon"><mat-icon>work</mat-icon></span>
                  <div><div class="dr-label">Job Title</div><div>{{ app.title }}</div></div>
                </div>
                <div class="detail-row">
                  <span class="dr-icon"><mat-icon>location_on</mat-icon></span>
                  <div><div class="dr-label">Location</div><div>{{ app.location }}</div></div>
                </div>
                <div class="detail-row">
                  <span class="dr-icon"><mat-icon>calendar_today</mat-icon></span>
                  <div>
                    <div class="dr-label">Applied</div>
                    <div>{{ app.appliedAt | date:'MMMM d, y' }}</div>
                  </div>
                </div>
                <div class="detail-row">
                  <span class="dr-icon"><mat-icon>work_outline</mat-icon></span>
                  <div><div class="dr-label">Job Type</div><div>{{ app.type }}</div></div>
                </div>
                <div class="detail-row">
                  <span class="dr-icon"><mat-icon>home_work</mat-icon></span>
                  <div><div class="dr-label">Work Mode</div><div>{{ app.workMode }}</div></div>
                </div>
                @if (app.jobLink) {
                  <div class="detail-row">
                    <span class="dr-icon"><mat-icon>link</mat-icon></span>
                    <div>
                      <div class="dr-label">Job Link</div>
                      <a [href]="app.jobLink" target="_blank" rel="noopener">View Job Posting</a>
                    </div>
                  </div>
                }
                @if (app.requiredSkills?.length) {
                  <div class="detail-row">
                    <span class="dr-icon"><mat-icon>psychology</mat-icon></span>
                    <div>
                      <div class="dr-label">Required Skills</div>
                      <div class="skills-list">
                        @for (skill of app.requiredSkills; track skill) {
                          <span class="skill-chip">{{ skill }}</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Description -->
            <div class="app-card info-card">
              <h3><mat-icon class="h3-icon">notes</mat-icon> Description</h3>
              @if (app.description) {
                <p class="description-text">{{ app.description }}</p>
              } @else {
                <p class="text-muted">No description added yet.</p>
              }
            </div>
          </div>

          <!-- Right: Interviews -->
          <div class="right-col">
            <mat-tab-group dynamicHeight="false">
              <mat-tab label="Interviews">
                <div class="app-card info-card">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <h3>Interviews ({{ app.interviews?.length ?? 0 }})</h3>
                    <button mat-flat-button color="accent" (click)="showAddInterview = !showAddInterview">
                      <mat-icon>add</mat-icon> Add
                    </button>
                  </div>

              <!-- Add interview form -->
              @if (showAddInterview) {
                <form [formGroup]="interviewForm" (ngSubmit)="addInterview()" class="interview-form">

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Interview Date</mat-label>
                    <input matInput [matDatepicker]="dp" formControlName="interviewDate">
                    <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
                    <mat-datepicker #dp></mat-datepicker>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Interview Type</mat-label>
                    <mat-select formControlName="interviewType">
                      @for (t of interviewTypes; track t) {
                        <mat-option [value]="t">{{ t }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Interviewer Name</mat-label>
                    <input matInput formControlName="interviewerName">
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Notes</mat-label>
                    <textarea matInput formControlName="note" rows="3"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Feedback</mat-label>
                    <textarea matInput formControlName="feedback" rows="3"></textarea>
                  </mat-form-field>

                  <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button mat-button type="button" (click)="showAddInterview = false">Cancel</button>
                    <button mat-flat-button color="primary" type="submit"
                            [disabled]="savingInterview || interviewForm.invalid">
                      @if (savingInterview) { <mat-spinner diameter="16"/> } @else { Save }
                    </button>
                  </div>

                </form>
              }

              <!-- Interviews list -->
              @if (app.interviews?.length) {
                <div [@ivStagger]="app.interviews.length">
                @for (iv of app.interviews; track iv.interviewId) {
                  <div class="interview-item" [style.borderLeftColor]="ivColor(iv.interviewType)" (click)="openInterview(iv)"
                       role="button" tabindex="0" (keydown.enter)="openInterview(iv)">
                    <div class="iv-header">
                      <span class="iv-type" [style.color]="'#fff'" [style.background]="ivColor(iv.interviewType)">{{ iv.interviewType }}</span>
                      <button mat-icon-button
                              (click)="deleteInterview(iv); $event.stopPropagation()">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </div>
                    <div class="iv-date">
                      <mat-icon>event</mat-icon> {{ iv.interviewDate | date:'EEE, MMM d, y' }}
                    </div>
                    @if (iv.note) { <div class="iv-note">{{ iv.note }}</div> }
                    <div class="iv-hint"><mat-icon>chevron_right</mat-icon> View details</div>
                  </div>
                }
                </div>
              } @else if (!showAddInterview) {
                <div class="empty-interviews">
                  <mat-icon>event_available</mat-icon>
                  <p>No interviews logged yet</p>
                </div>
              }
            </div>
              </mat-tab>

              <mat-tab label="Resume Match">
                <div class="app-card info-card">
                  <h3>Resume Match</h3>
                  <p class="text-muted" style="margin-bottom:12px">Select a resume document to match against this job.</p>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Select Resume Document</mat-label>
                    <mat-select [(ngModel)]="selectedDocumentId" [disabled]="loadingDocuments" panelClass="detail-select-panel">
                      <mat-option value="">-- select a document --</mat-option>
                      @for (doc of documents; track doc.id) {
                        <mat-option [value]="doc.id">{{ doc.fileName }} ({{ doc.type }})</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <div style="display:flex;gap:8px">
                    <button mat-flat-button color="primary" (click)="matchResume()" [disabled]="matchingResume || !selectedDocumentId">
                      @if (matchingResume) { <mat-spinner diameter="18"/> }
                      @else { <mat-icon>compare</mat-icon> Match Resume }
                    </button>
                  </div>

                  @if (resumeMatchResult) {
                    <div class="result-card" style="margin-top:16px">
                      <div class="match-header">
                        <div class="match-circle" [class.high]="resumeMatchResult.matchPercentage >= 70"
                                                     [class.medium]="resumeMatchResult.matchPercentage >= 40 && resumeMatchResult.matchPercentage < 70"
                                                     [class.low]="resumeMatchResult.matchPercentage < 40">
                          {{ resumeMatchResult.matchPercentage }}%
                        </div>
                        <div>
                          <h4>Match Score</h4>
                          <p class="text-muted">{{ resumeMatchResult.matchedSkills.length }} of {{ resumeMatchResult.matchedSkills.length + resumeMatchResult.missingSkills.length }} required skills matched</p>
                        </div>
                      </div>

                      @if (resumeMatchResult.matchedSkills.length) {
                        <div class="skill-section">
                          <h5>Matched Skills</h5>
                          <div class="skills-list">
                            @for (s of resumeMatchResult.matchedSkills; track s) {
                              <span class="skill-chip matched">{{ s }}</span>
                            }
                          </div>
                        </div>
                      }

                      @if (resumeMatchResult.missingSkills.length) {
                        <div class="skill-section">
                          <h5>Missing Skills</h5>
                          <div class="skills-list">
                            @for (s of resumeMatchResult.missingSkills; track s) {
                              <span class="skill-chip missing">{{ s }}</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </mat-tab>

              <mat-tab label="Cover Letter">
                <div class="app-card info-card">
                  <h3>Cover Letter Generator</h3>
                  <p class="text-muted" style="margin-bottom:12px">Generate a cover letter based on your resume and this job.</p>

                   <mat-form-field appearance="outline" class="full-width">
                     <mat-label>Select Resume Document</mat-label>
                     <mat-select [(ngModel)]="selectedDocumentId" [disabled]="loadingDocuments" panelClass="detail-select-panel">
                       <mat-option value="">-- select a document --</mat-option>
                       @for (doc of documents; track doc.id) {
                         <mat-option [value]="doc.id">{{ doc.fileName }} ({{ doc.type }})</mat-option>
                       }
                     </mat-select>
                   </mat-form-field>

                   <mat-form-field appearance="outline" class="full-width">
                     <mat-label>Tone</mat-label>
                     <mat-select [(ngModel)]="selectedTone" panelClass="detail-select-panel">
                       @for (t of tones; track t) {
                         <mat-option [value]="t">{{ t }}</mat-option>
                       }
                     </mat-select>
                   </mat-form-field>

                  <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button mat-flat-button color="primary" (click)="generateCoverLetter()" [disabled]="generatingCoverLetter || !selectedDocumentId">
                      @if (generatingCoverLetter) { <mat-spinner diameter="18"/> }
                      @else { <mat-icon>auto_fix_high</mat-icon> Generate Cover Letter }
                    </button>
                    @if (generatedCoverLetter) {
                      <button mat-stroked-button (click)="copyToClipboard(generatedCoverLetter.coverLetterText)">
                        <mat-icon>content_copy</mat-icon> Copy
                      </button>
                      <button mat-stroked-button (click)="saveCoverLetterAsDocument()">
                        <mat-icon>save</mat-icon> Save as Document
                      </button>
                    }
                  </div>

                  @if (generatedCoverLetter) {
                    <div class="result-card" style="margin-top:16px">
                      <h4>Generated Cover Letter</h4>
                      <pre class="cover-letter-text">{{ generatedCoverLetter.coverLetterText }}</pre>
                    </div>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
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
    .skeleton-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
    .skeleton-detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }
    .skeleton-col { display: flex; flex-direction: column; gap: 20px; }
    .skeleton-card { padding: 22px; }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }
    .left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }
    .info-card {
      padding: 22px;
      transition: box-shadow .2s ease, transform .2s ease;
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
      h3 {
        display: flex; align-items: center; gap: 8px;
        font-size: 0.95rem; font-weight: 700; margin-bottom: 18px; color: var(--text-primary); letter-spacing: -0.01em;
      }
    }
    .h3-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary,#6366f1); }

    .status-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .status-pill {
      padding: 8px 18px; border-radius: 22px; font-size: 0.8rem; font-weight: 700;
      border: 2px solid transparent; cursor: pointer; transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }
      &:active { transform: scale(0.95); }

      &.Draft              { background: #f1f5f9; color: #334155; &:hover { border-color: #64748b; } &.active { background: linear-gradient(135deg,#64748b,#475569); color: #fff; box-shadow: 0 4px 12px -3px rgba(71,85,105,.45); } }
      &.Submitted          { background: #eff6ff; color: #1d4ed8; &:hover { border-color: #2563eb; } &.active { background: linear-gradient(135deg,#2563eb,#1d4ed8); color: #fff; box-shadow: 0 4px 12px -3px rgba(37,99,235,.45); } }
      &.UnderReview        { background: #fffbeb; color: #b45309; &:hover { border-color: #d97706; } &.active { background: linear-gradient(135deg,#d97706,#b45309); color: #fff; box-shadow: 0 4px 12px -3px rgba(217,119,6,.45); } }
      &.InterviewScheduled { background: #eef2ff; color: #4338ca; &:hover { border-color: #4f46e5; } &.active { background: linear-gradient(135deg,#4f46e5,#4338ca); color: #fff; box-shadow: 0 4px 12px -3px rgba(79,70,229,.45); } }
      &.Interviewed        { background: #f5f3ff; color: #6d28d9; &:hover { border-color: #7c3aed; } &.active { background: linear-gradient(135deg,#7c3aed,#6d28d9); color: #fff; box-shadow: 0 4px 12px -3px rgba(124,58,237,.45); } }
      &.Accepted           { background: #ecfdf5; color: #047857; &:hover { border-color: #059669; } &.active { background: linear-gradient(135deg,#059669,#047857); color: #fff; box-shadow: 0 4px 12px -3px rgba(5,150,105,.45); } }
      &.Rejected           { background: #fef2f2; color: #b91c1c; &:hover { border-color: #dc2626; } &.active { background: linear-gradient(135deg,#dc2626,#b91c1c); color: #fff; box-shadow: 0 4px 12px -3px rgba(220,38,38,.45); } }
      &.Withdrawn          { background: #fdf2f8; color: #be185d; &:hover { border-color: #db2777; } &.active { background: linear-gradient(135deg,#db2777,#be185d); color: #fff; box-shadow: 0 4px 12px -3px rgba(219,39,119,.45); } }
    }

    .detail-list { display: flex; flex-direction: column; gap: 16px; }
    .detail-row { display: flex; align-items: flex-start; gap: 12px; }
    .dr-icon {
      width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0; margin-top: 1px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg,#eef2ff,#e0e7ff);
      transition: transform .15s ease;
      mat-icon { color: #4f46e5; font-size: 16px; width: 16px; height: 16px; }
    }
    .detail-row:hover .dr-icon { transform: scale(1.08); }
    .dr-label { font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 3px; font-weight: 600; }
    .notes-text { color: var(--text-primary); line-height: 1.65; white-space: pre-wrap; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-chip {
      background: #eef2ff; color: #4338ca; padding: 3px 12px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 600; border: 1px solid #e0e7ff;
      transition: all 0.2s ease;
      &:hover { background: #e0e7ff; transform: translateY(-1px); }
    }

    .interview-form {
      background: var(--bg-surface, #f8fafc); padding: 20px; border-radius: var(--radius-md);
      margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px;
      border: 1px solid var(--border-color);
      animation: slideIn 0.25s ease;
    }

    .interview-item {
      border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 10px;
      cursor: pointer; transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
      position: relative; background: var(--bg-surface);

      &:hover {
        border-color: var(--primary);
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.1);
        transform: translateY(-2px);
      }
    }
    .iv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .iv-type {
      background: #eef2ff; color: #4338ca; padding: 3px 12px; border-radius: 20px;
      font-size: 0.78rem; font-weight: 600; border: 1px solid #e0e7ff;
    }
    .iv-date { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-secondary);
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--text-tertiary); }
    }
    .iv-note { margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary); }
    .iv-hint {
      display: flex; align-items: center; gap: 2px; justify-content: flex-end;
      font-size: 0.75rem; color: var(--primary); margin-top: 8px; opacity: 0; transition: opacity 0.2s ease; font-weight: 600;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }
    .interview-item:hover .iv-hint { opacity: 1; }

    .empty-interviews {
      text-align: center; padding: 36px; color: var(--text-secondary);
      mat-icon { font-size: 44px; width: 44px; height: 44px; opacity: 0.25; margin-bottom: 8px; }
      p { font-size: 0.9rem; }
    }

    .result-card {
      background: var(--bg-surface, #f8fafc); padding: 18px; border-radius: var(--radius-md); border: 1px solid var(--border-color);
      h4 { margin: 0 0 14px; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
      h5 { margin: 14px 0 10px; font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    }

    .match-header {
      display: flex; align-items: center; gap: 18px; margin-bottom: 14px;
    }

    .match-circle {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem; font-weight: 800; color: white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      transition: transform 0.2s ease;

      &:hover { transform: scale(1.06); }
      &.high { background: linear-gradient(135deg, #10b981, #34d399); }
      &.medium { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
      &.low { background: linear-gradient(135deg, #ef4444, #f87171); }
    }

    .skill-section { margin-top: 14px; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-chip {
      padding: 3px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
      transition: all 0.2s ease; border: 1px solid transparent;
      &.matched { background: #d1fae5; color: #065f46; border-color: #a7f3d0; &:hover { background: #a7f3d0; transform: translateY(-1px); } }
      &.missing { background: #fee2e2; color: #991b1b; border-color: #fecaca; &:hover { background: #fecaca; transform: translateY(-1px); } }
    }

    .cover-letter-text {
      background: var(--bg-surface, #fff); padding: 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border-color); white-space: pre-wrap;
      font-size: 0.875rem; line-height: 1.7; max-height: 420px; overflow: auto;
      color: var(--text-primary);
      font-family: 'Inter', system-ui, sans-serif;
    }

    .full-width { width: 100%; }

    :host ::ng-deep .detail-select-panel {
      min-width: 260px !important;
      z-index: 9999 !important;
    }

    :host ::ng-deep .mat-mdc-select-panel {
      border-radius: var(--radius-md) !important;
      border: 1px solid var(--border-color) !important;
      box-shadow: var(--shadow-lg) !important;
    }

    :host ::ng-deep .mat-mdc-tab-body-wrapper {
      overflow: visible !important;
    }

    /* ── Dark mode overrides ── */
    :host-context(.dark) .info-card--notes .info-card-header    { background: #1e3a5f; color: #93c5fd; }
    :host-context(.dark) .info-card--feedback .info-card-header { background: #064e3b; color: #6ee7b7; }
    :host-context(.dark) .dr-icon { background: linear-gradient(135deg,#312e81,#1e1b4b); mat-icon { color: #a5b4fc; } }
    :host-context(.dark) .iv-type { background: #312e81; color: #c7d2fe; border-color: #4f46e5; }
    :host-context(.dark) .skill-chip { background: #312e81; color: #c7d2fe; border-color: #4f46e5; &:hover { background: #3730a3; } }
    :host-context(.dark) .skill-chip.matched { background: #064e3b; color: #6ee7b7; border-color: #059669; &:hover { background: #047857; } }
    :host-context(.dark) .skill-chip.missing { background: #7f1d1d; color: #fca5a5; border-color: #dc2626; &:hover { background: #b91c1c; } }
    :host-context(.dark) .status-pill.Draft              { background: #334155; color: #f1f5f9; border-color: #475569; }
    :host-context(.dark) .status-pill.Submitted          { background: #1e3a5f; color: #93c5fd; border-color: #3b82f6; }
    :host-context(.dark) .status-pill.UnderReview        { background: #78350f; color: #fcd34d; border-color: #b45309; }
    :host-context(.dark) .status-pill.InterviewScheduled { background: #312e81; color: #a5b4fc; border-color: #4f46e5; }
    :host-context(.dark) .status-pill.Interviewed        { background: #4c1d95; color: #ddd6fe; border-color: #7c3aed; }
    :host-context(.dark) .status-pill.Accepted           { background: #064e3b; color: #6ee7b7; border-color: #059669; }
    :host-context(.dark) .status-pill.Rejected           { background: #7f1d1d; color: #fca5a5; border-color: #dc2626; }
    :host-context(.dark) .status-pill.Withdrawn          { background: #831843; color: #f9a8d4; border-color: #db2777; }

    /* ── Celebration confetti ── */
    .confetti-layer {
      position: fixed; inset: 0; pointer-events: none; z-index: 9998; overflow: hidden;
    }
    .confetti-piece {
      position: absolute; top: -20px; width: 8px; height: 14px; border-radius: 2px;
      animation-name: confettiFall;
      animation-timing-function: cubic-bezier(0.35, 0, 0.65, 1);
      animation-fill-mode: forwards;
    }
    @keyframes confettiFall {
      0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
    }
  `]
})
export class ApplicationDetailComponent implements OnInit {
  @Input() id!: string;

  private appSvc = inject(ApplicationsService);
  private ivSvc  = inject(InterviewsService);
  private docSvc = inject(DocumentsService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private fb     = inject(FormBuilder);

  app:     JobApplication | null = null;
  loading  = true;
  statuses = APPLICATION_STATUSES;
  interviewTypes   = INTERVIEW_TYPES;
  showAddInterview = false;
  savingInterview  = false;

  ivColor(t: string): string { return ivTypeColor(t); }

  confetti: { id: number; left: number; color: string; delay: number; duration: number }[] = [];
  private confettiTimer: ReturnType<typeof setTimeout> | null = null;

  private celebrate(): void {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    this.confetti = Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 0.9,
    }));
    if (this.confettiTimer) clearTimeout(this.confettiTimer);
    this.confettiTimer = setTimeout(() => { this.confetti = []; }, 2600);
  }

  resumeText = '';
  coverLetterText = '';
  resumeMatchResult: ResumeMatchResult | null = null;
  generatedCoverLetter: CoverLetterDto | null = null;
  matchingResume = false;
  generatingCoverLetter = false;
  selectedTone = 'Professional';
  tones = ['Professional', 'Friendly', 'Formal', 'Enthusiastic'];

  documents: DocumentDto[] = [];
  selectedDocumentId: string | null = null;
  loadingDocuments = false;

  interviewForm = this.fb.nonNullable.group({
    interviewDate:   [new Date(), Validators.required],
    interviewType:   ['Phone' as typeof INTERVIEW_TYPES[number], Validators.required],
    interviewerName: ['', Validators.required],
    note:            [''],
    feedback:        ['']
  });

  ngOnInit(): void {
    this.load();
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loadingDocuments = true;
    this.docSvc.getAll().subscribe({
      next: res => {
        const raw = res as any;
        const list: DocumentDto[] =
          Array.isArray(raw?.data?.Documents) ? raw.data.Documents
        : Array.isArray(raw?.data?.documents) ? raw.data.documents
        : Array.isArray(raw?.data)            ? raw.data
        : Array.isArray(raw)                  ? raw
        : [];
        this.documents = list;
        this.loadingDocuments = false;
      },
      error: () => { this.loadingDocuments = false; }
    });
  }

  load(): void {
    this.loading = true;
    this.appSvc.getById(this.id).subscribe({
      next: res  => { console.log(res); this.app = res.data; this.loading = false; },
      error: ()  => { this.loading = false; this.router.navigate(['/applications']); }
    });
  }

  /** Navigate to the interviews page and pre-select this interview */
  openInterview(iv: Interview): void {
    this.router.navigate(['/interviews'], { queryParams: { id: iv.interviewId } });
  }

  changeStatus(status: typeof APPLICATION_STATUSES[number]): void {
    if (!this.app || this.app.status === status) return;
    this.appSvc.updateStatus(this.app.jobAppId, status).subscribe({
      next: res => {
        this.app = res.data;
        this.notify.success(`Status updated to ${status}`);
        if (status === 'Accepted') this.celebrate();
      },
      error: ()  => { this.notify.error('Failed to update status.'); }
    });
  }

  matchResume(): void {
    if (!this.app || !this.selectedDocumentId) return;
    this.matchingResume = true;
    this.resumeMatchResult = null;
    this.appSvc.matchResume(this.app.jobAppId, { documentId: this.selectedDocumentId }).subscribe({
      next: res => {
        this.resumeMatchResult = res.data;
        this.matchingResume = false;
        this.notify.success('Resume matched successfully');
      },
      error: () => {
        this.matchingResume = false;
        this.notify.error('Failed to match resume');
      }
    });
  }

  generateCoverLetter(): void {
    if (!this.app || !this.selectedDocumentId) return;
    this.generatingCoverLetter = true;
    this.generatedCoverLetter = null;
    this.appSvc.generateCoverLetter(this.app.jobAppId, { documentId: this.selectedDocumentId, tone: this.selectedTone }).subscribe({
      next: res => {
        this.generatedCoverLetter = res.data;
        this.generatingCoverLetter = false;
        this.notify.success('Cover letter generated');
      },
      error: () => {
        this.generatingCoverLetter = false;
        this.notify.error('Failed to generate cover letter');
      }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notify.success('Copied to clipboard');
    });
  }

  saveCoverLetterAsDocument(): void {
    if (!this.generatedCoverLetter?.coverLetterText) return;
    const blob = new Blob([this.generatedCoverLetter.coverLetterText], { type: 'text/plain' });
    const file = new File([blob], 'cover-letter.txt', { type: 'text/plain' });
    this.docSvc.upload(file, 'CoverLetter').subscribe({
      next: () => this.notify.success('Cover letter saved as document'),
      error: () => this.notify.error('Failed to save cover letter')
    });
  }

  addInterview(): void {
    if (this.interviewForm.invalid) return;
    this.savingInterview = true;
    const raw = this.interviewForm.getRawValue();
    this.ivSvc.create({
      JobAppId:       this.id,
      InterviewDate:  (raw.interviewDate as Date).toISOString(),
      InterviewType:  raw.interviewType,
      Note:           raw.note,
      Feedback:       raw.feedback,
      InterviewerName: raw.interviewerName
    }).subscribe({
      next: () => {
        this.notify.success('Interview added!');
        this.showAddInterview = false;
        this.savingInterview  = false;
        this.load();
      },
      error: () => { this.savingInterview = false; }
    });
  }

  deleteInterview(iv: Interview): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Interview', message: 'Remove this interview?', confirmLabel: 'Delete' }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.ivSvc.delete(iv.interviewId).subscribe({
        next: () => { this.notify.success('Interview removed.'); this.load(); },
        error: ()  => { this.notify.error('Failed to remove interview.'); }
      });
    });
  }

  deleteApp(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Application', message: `Delete application for ${this.app?.title}?`, confirmLabel: 'Delete' }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.appSvc.delete(this.id).subscribe({
        next: () => { this.notify.success('Application deleted.'); this.router.navigate(['/applications']); }
      });
    });
  }
}