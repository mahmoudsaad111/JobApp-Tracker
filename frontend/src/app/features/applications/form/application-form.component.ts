import { Component, inject, OnInit, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ApplicationsService } from '../../../core/services/applications.service';
import { NotificationService } from '../../../core/services/notification.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import { APPLICATION_STATUSES, JOB_TYPES, WORK_MODES, JobType, WorkMode, ParsedJobPosting } from '../../../core/models';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatCardModule
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
      <div class="flex items-center gap-3 mb-6">
        <a mat-icon-button routerLink="/applications">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">{{ isEdit ? 'Edit Application' : 'New Application' }}</h1>
      </div>

      <div class="app-card form-wrapper">
        @if (loadingData) {
          <div style="display:flex;justify-content:center;padding:60px">
            <mat-spinner diameter="40" />
          </div>
        } @else {

          @if (!showParser) {
            <button mat-stroked-button color="accent" type="button" (click)="showParser = true" class="parser-toggle">
              <mat-icon>auto_fix_high</mat-icon> Parse Job Posting with AI
            </button>
          }

          @if (showParser) {
            <div class="parser-section">
              <h3>Paste Job Posting</h3>
              <p class="text-muted">Paste the job description below and AI will extract details for you.</p>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Job Posting Text</mat-label>
                <textarea matInput [(ngModel)]="rawJobText" rows="6"
                  placeholder="Paste job title, company, location, requirements, skills..."></textarea>
              </mat-form-field>
              <div class="parser-actions">
                <button mat-button type="button" (click)="showParser = false">Cancel</button>
                <button mat-flat-button color="primary" type="button" (click)="parseJobPosting()" [disabled]="parsing || !rawJobText.trim()">
                  @if (parsing) { <mat-spinner diameter="18" /> }
                  @else { <mat-icon>auto_fix_high</mat-icon> Parse }
                </button>
              </div>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Company Name *</mat-label>
                <input matInput formControlName="CompanyName" maxlength="200" placeholder="e.g. Google">
                <mat-icon matPrefix>business</mat-icon>
                @if (form.get('CompanyName')?.hasError('required') && form.get('CompanyName')?.touched) {
                  <mat-error>Company name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Job Title *</mat-label>
                <input matInput formControlName="Title" maxlength="200" placeholder="e.g. Frontend Developer">
                <mat-icon matPrefix>work</mat-icon>
                @if (form.get('Title')?.hasError('required') && form.get('Title')?.touched) {
                  <mat-error>Job title is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Location</mat-label>
                <input matInput formControlName="Location" maxlength="255" placeholder="e.g. London, UK / Remote">
                <mat-icon matPrefix>location_on</mat-icon>
                @if (form.get('Location')?.hasError('required') && form.get('Location')?.touched) {
                  <mat-error>Location is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status *</mat-label>
                <mat-select formControlName="Status">
                  @for (s of Statuses; track s) {
                    <mat-option [value]="s">{{ s }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>flag</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Application Date *</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="ApplicationDate">
                <mat-icon matPrefix>calendar_today</mat-icon>
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                @if (form.get('ApplicationDate')?.hasError('required') && form.get('ApplicationDate')?.touched) {
                  <mat-error>Date is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Job Link (optional)</mat-label>
                <input matInput formControlName="Link" maxlength="500" placeholder="https://…">
                <mat-icon matPrefix>link</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Job Type</mat-label>
                <mat-select formControlName="Type">
                  @for (t of JobTypes; track t) {
                    <mat-option [value]="t">{{ t }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>work_outline</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Work Mode</mat-label>
                <mat-select formControlName="WorkMode">
                  @for (w of WorkModes; track w) {
                    <mat-option [value]="w">{{ w }}</mat-option>
                  }
                </mat-select>
                <mat-icon matPrefix>home_work</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Required Skills (comma separated)</mat-label>
                <textarea matInput formControlName="RequiredSkills" rows="3"
                  placeholder="e.g. Angular, TypeScript, C#"></textarea>
                <mat-icon matPrefix>psychology</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description (optional)</mat-label>
                <textarea matInput formControlName="Description" rows="4" maxlength="1000"
                  placeholder="Recruiter contact, salary expectations, preparation Description…"></textarea>
                <mat-icon matPrefix>description</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <a mat-stroked-button routerLink="/applications">Cancel</a>
              <button mat-flat-button color="primary" type="submit" [disabled]="loading">
                @if (loading) { <mat-spinner diameter="18" /> }
                @else { {{ isEdit ? 'Save Changes' : 'Add Application' }} }
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .form-wrapper {
      padding: 28px;
      max-width: 880px;
    }

    .parser-toggle {
      width: 100%;
      margin-bottom: 22px;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      font-weight: 700;
      border-radius: var(--radius-sm) !important;
      letter-spacing: 0.01em;
      border: 1px dashed var(--border-color) !important;
      color: var(--primary);
      background: var(--bg-surface) !important;
      transition: all 0.2s ease !important;

      &:hover {
        border-style: solid !important;
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm) !important;
      }
    }

    .parser-section {
      background: var(--bg-surface);
      padding: 22px;
      border-radius: var(--radius-md);
      margin-bottom: 26px;
      border: 1px solid var(--border-color);
      animation: scaleIn 0.25s cubic-bezier(0.16,1,0.3,1);

      h3 {
        margin: 0 0 6px;
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-primary);
      }
      p {
        margin: 0 0 14px;
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    }

    .parser-section .full-width { width: 100%; }

    .parser-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 14px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 26px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class ApplicationFormComponent implements OnInit {
  @Input() id?: string;

  private fb     = inject(FormBuilder);
  private svc    = inject(ApplicationsService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  Statuses    = APPLICATION_STATUSES;
  JobTypes    = JOB_TYPES;
  WorkModes   = WORK_MODES;
  loading     = false;
  loadingData = false;
  isEdit      = false;

  showParser = false;
  parsing    = false;
  rawJobText = '';

  form = this.fb.nonNullable.group({
    CompanyName:     ['', Validators.required],
    Title:           ['', Validators.required],
    Location:        [''],
    Status:          ['Submitted' as typeof APPLICATION_STATUSES[number], Validators.required],
    ApplicationDate: [new Date(), Validators.required],
    Link:            [''],
    Type:            ['FullTime' as JobType],
    WorkMode:        ['Onsite' as WorkMode],
    RequiredSkills:  [''],
    Description:     ['']
  });

  parseJobPosting(): void {
    if (!this.rawJobText.trim()) return;
    this.parsing = true;
    this.svc.parseJobPosting({ rawText: this.rawJobText }).subscribe({
      next: (res) => {
        
        this.applyParsedData(res.data);
        this.parsing = false;
        this.showParser = false;
        this.notify.success('Job posting parsed successfully');
      },
      error: (err) => {
        
        this.parsing = false;
        this.notify.error(apiErrorMessage(err, 'Failed to parse job posting'));
      }
    });
  }

  private applyParsedData(parsed: ParsedJobPosting): void {
    
    if (!parsed) {
      
      return;
    }
    const patch: Partial<Record<string, unknown>> = {};
    if (parsed.companyName) {
      
      patch['CompanyName'] = parsed.companyName;
    }
    if (parsed.jobTitle) {
      
      patch['Title'] = parsed.jobTitle;
    }
    if (parsed.location) {
      
      patch['Location'] = parsed.location;
    }
    if (parsed.requiredSkills?.length) {
      const skills = parsed.requiredSkills.join(', ');
      
      patch['RequiredSkills'] = skills;
    }

    const workModeValues: WorkMode[] = ['Onsite', 'Remote', 'Hybrid'];
    if (parsed.jobType && workModeValues.includes(parsed.jobType as WorkMode)) {
      
      patch['WorkMode'] = parsed.jobType as WorkMode;
    } else if (parsed.jobType && JOB_TYPES.includes(parsed.jobType as JobType)) {
      
      patch['Type'] = parsed.jobType as JobType;
    }

    
    this.form.patchValue(patch);
    
  }

  ngOnInit(): void {
    if (this.id) {
      this.isEdit      = true;
      this.loadingData = true;
      this.svc.getById(this.id).subscribe({
        next: res => {
          const a = res.data;
          const skills = (a.requiredSkills ?? []).join(', ');
          this.form.patchValue({
            CompanyName:     a.companyName,
            Title:           a.title,
            Location:        a.location,
            Status:          a.status,
            ApplicationDate: new Date(a.appliedAt),
            Link:            a.jobLink     ?? '',
            Type:            a.type,
            WorkMode:        a.workMode,
            RequiredSkills:  skills,
            Description:     a.description ?? '',
          });
          this.loadingData = false;
        },
        error: () => { this.loadingData = false; this.router.navigate(['/applications']); }
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    const raw    = this.form.getRawValue();
    const skills = raw.RequiredSkills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const body   = {
      CompanyName:     raw.CompanyName,
      Title:           raw.Title,
      Location:        raw.Location,
      Status:          raw.Status,
      ApplicationDate: raw.ApplicationDate as Date,
      JobLink:         raw.Link,
      Type:            raw.Type,
      WorkMode:        raw.WorkMode,
      RequiredSkills:  skills,
      Description:     raw.Description,
    };

    const obs = this.isEdit
      ? this.svc.update(this.id!, body)
      : this.svc.create(body);

    obs.subscribe({
      next: () => {
        this.notify.success(this.isEdit ? 'Application updated.' : 'Application added!');
        this.router.navigate(['/applications']);
      },
      error: (err) => {
        this.loading = false;
        // Show the server's reason (for example "link cannot exceed 500 characters").
        this.notify.error(apiErrorMessage(err, 'Could not save the application. Please try again.'));
      }
    });
  }
}