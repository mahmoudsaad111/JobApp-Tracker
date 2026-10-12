import { Component, inject, OnInit, signal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { AuthService }              from '../../core/services/auth.service';
import { NotificationService }      from '../../core/services/notification.service';
import { NotesService, NoteDto }    from '../../core/services/notes.service';
import { DocumentsService, DocumentDto } from '../../core/services/document.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule, CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatTooltipModule,
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
      <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Profile</h1>
          <p class="text-slate-500 text-sm mt-1 font-medium">Manage your account, notes, and documents</p>
        </div>
      </div>

      <div class="profile-grid">

        <!-- ── Left column: avatar ── -->
        <div class="app-card avatar-card">
          <div class="big-avatar">{{ initials }}</div>
          <div class="user-name">{{ auth.userName() }}</div>
          <div class="user-email">{{ auth.userEmail() }}</div>
          <button mat-stroked-button color="warn" (click)="auth.logout()">
            <mat-icon>logout</mat-icon> Logout
          </button>
        </div>

        <!-- ── Right column ── -->
        <div class="right-col">

          <!-- Account Details -->
          <div class="app-card form-card">
            <h3>Account Details</h3>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="field-col">
                <mat-form-field appearance="outline">
                  <mat-label>Full Name</mat-label>
                  <input matInput formControlName="name">
                  <mat-icon matPrefix>person</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email">
                  <mat-icon matPrefix>email</mat-icon>
                </mat-form-field>
              </div>
              <p class="nav-sub">Your name and email can't be changed yet.</p>
            </form>

            <hr class="divider">

            <h3>Change Password</h3>
            <form [formGroup]="pwForm" (ngSubmit)="changePassword()">
              <div class="field-col">
                <mat-form-field appearance="outline">
                  <mat-label>Current Password</mat-label>
                  <input matInput type="password" formControlName="current">
                  <mat-icon matPrefix>lock</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>New Password</mat-label>
                  <input matInput type="password" formControlName="next">
                  <mat-icon matPrefix>lock_outline</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Confirm New Password</mat-label>
                  <input matInput type="password" formControlName="confirm">
                  <mat-icon matPrefix>lock_reset</mat-icon>
                </mat-form-field>
              </div>
              <div class="form-actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="savingPw">
                  @if (savingPw) { <mat-spinner diameter="18"/> } @else { Update Password }
                </button>
              </div>
            </form>
          </div>

          <!-- ── Notes navigation card ── -->
          <div class="app-card section-card">
            <div class="section-header">
              <div class="section-title">
                <mat-icon>sticky_note_2</mat-icon>
                <h3>My Notes</h3>
                @if (noteCount > 0) {
                  <span class="badge badge--notes">{{ noteCount }}</span>
                }
              </div>
              <button mat-flat-button color="primary" (click)="goToNotes()">
                <mat-icon>open_in_new</mat-icon> Open Notes
              </button>
            </div>

            @if (loadingNoteCount) {
              <div class="loading-row"><mat-spinner diameter="28"/></div>
            } @else {
              <div class="nav-body" (click)="goToNotes()">
                <div class="nav-icon nav-icon--notes">
                  <mat-icon>edit_note</mat-icon>
                </div>
                <div class="nav-text">
                  @if (noteCount === 0) {
                    <p class="nav-headline">No notes yet</p>
                    <p class="nav-sub">Head to the notes editor to start writing.</p>
                  } @else {
                    <p class="nav-headline">{{ noteCount }} note{{ noteCount === 1 ? '' : 's' }}</p>
                    <p class="nav-sub">Open the notes editor to read, write and organise your notes.</p>
                  }
                </div>
                <div class="nav-arrow">
                  <mat-icon>arrow_forward</mat-icon>
                </div>
              </div>
            }
          </div>

          <!-- ── Documents navigation card ── -->
          <div class="app-card section-card">
            <div class="section-header">
              <div class="section-title">
                <mat-icon>folder_open</mat-icon>
                <h3>My Documents</h3>
                @if (docCount > 0) {
                  <span class="badge badge--docs">{{ docCount }}</span>
                }
              </div>
              <button mat-flat-button color="primary" (click)="goToDocuments()">
                <mat-icon>open_in_new</mat-icon> Open Documents
              </button>
            </div>

            @if (loadingDocCount) {
              <div class="loading-row"><mat-spinner diameter="28"/></div>
            } @else {
              <div class="nav-body" (click)="goToDocuments()">
                <div class="nav-icon nav-icon--docs">
                  <mat-icon>description</mat-icon>
                </div>
                <div class="nav-text">
                  @if (docCount === 0) {
                    <p class="nav-headline">No documents yet</p>
                    <p class="nav-sub">Upload your CV, resume, or cover letter.</p>
                  } @else {
                    <p class="nav-headline">{{ docCount }} document{{ docCount === 1 ? '' : 's' }}</p>
                    <p class="nav-sub">View, download, and manage your uploaded documents.</p>
                  }
                </div>
                <div class="nav-arrow">
                  <mat-icon>arrow_forward</mat-icon>
                </div>
              </div>
            }
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-grid {
      display: grid; grid-template-columns: 260px 1fr; gap: 20px; align-items: start;
      @media (max-width: 768px) { grid-template-columns: 1fr; }
    }

    /* Avatar card */
    .avatar-card {
      padding: 32px 20px; display: flex; flex-direction: column;
      align-items: center; gap: 8px; text-align: center;
      position: sticky; top: 88px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .big-avatar {
      width: 80px; height: 80px; border-radius: 6px;
      background: var(--primary, #3986bc);
      color: white; font-size: 2rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
      cursor: default;
    }
    .user-name  { font-weight: 700; font-size: 1.15rem; color: var(--text-primary); }
    .user-email { color: var(--text-secondary); font-size: .875rem; margin-bottom: 16px; }

    /* Right column */
    .right-col  { display: flex; flex-direction: column; gap: 20px; }
    .form-card  { padding: 24px; border-radius: var(--radius-md); border: 1px solid var(--border-color);
      h3 { font-weight: 700; margin: 0 0 6px; font-size: 1rem; color: var(--text-primary); }
    }
    .field-col  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px;
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
    .divider    { border: none; border-top: 1px solid var(--border-color); margin: 24px 0; }

    /* Section cards */
    .section-card { padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); transition: box-shadow 0.2s ease, transform 0.2s ease;
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .section-title {
      display: flex; align-items: center; gap: 10px;
      h3 { font-weight: 700; font-size: 1rem; margin: 0; color: var(--text-primary); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary); }
    }

    /* Badges */
    .badge {
      font-size: .72rem; font-weight: 700;
      padding: 2px 8px; border-radius: 10px;
    }
    .badge--notes { background: #ede9fe; color: #6d28d9; }
    .badge--docs  { background: #dbeafe; color: #2563eb; }
    :host-context(.dark) .badge--notes { background: #4c1d95; color: #ddd6fe; }
    :host-context(.dark) .badge--docs  { background: #1e3a5f; color: #93c5fd; }

    /* Shared nav body */
    .nav-body {
      display: flex; align-items: center; gap: 16px;
      background: var(--bg-base);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 16px 20px;
      cursor: pointer; transition: all 0.2s ease;

      &:hover {
        box-shadow: var(--shadow-sm);
        border-color: #c7d2fe;
        background: var(--surface-2);
      }
    }

    .nav-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 22px; width: 22px; height: 22px; }
    }
    .nav-icon--notes {
      background: linear-gradient(135deg, #eef2ff, #e0e7ff);
      mat-icon { color: #4f46e5; }
    }
    .nav-icon--docs {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      mat-icon { color: #2563eb; }
    }
    :host-context(.dark) .nav-icon--notes {
      background: linear-gradient(135deg, #312e81, #1e1b4b);
      mat-icon { color: #a5b4fc; }
    }
    :host-context(.dark) .nav-icon--docs {
      background: linear-gradient(135deg, #1e3a5f, #312e81);
      mat-icon { color: #93c5fd; }
    }

    .nav-text { flex: 1; min-width: 0; }
    .nav-headline {
      font-size: .9rem; font-weight: 700; color: var(--text-primary); margin: 0 0 2px;
    }
    .nav-sub {
      font-size: .78rem; color: var(--text-secondary); margin: 0;
    }

    .nav-arrow {
      flex-shrink: 0; color: var(--text-secondary);
      display: flex; align-items: center;
      mat-icon { font-size: 20px; transition: transform 0.2s, color 0.2s; }
    }
    .nav-body:hover .nav-arrow mat-icon {
      transform: translateX(4px);
      color: var(--primary);
    }

    /* States */
    .loading-row { display: flex; justify-content: center; padding: 32px; }
  `]
})
export class ProfileComponent implements OnInit {
  auth     = inject(AuthService);
  notify   = inject(NotificationService);
  fb       = inject(FormBuilder);
  notesSvc = inject(NotesService);
  docsSvc  = inject(DocumentsService);
  private router = inject(Router);

  saving   = false;
  savingPw = false;

  form = this.fb.nonNullable.group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });
  pwForm = this.fb.nonNullable.group({
    current: ['', Validators.required],
    next:    ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });

  // Notes
  noteCount        = 0;
  loadingNoteCount = false;

  // Documents — count only, no inline management
  docCount        = 0;
  loadingDocCount = false;

  get initials(): string {
    const n = this.auth.userName();
    return n ? n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2) : '?';
  }

  ngOnInit(): void {
    this.form.patchValue({ name: this.auth.userName(), email: this.auth.userEmail() });
    this.form.disable();
    this.loadNoteCount();
    this.loadDocCount();
  }

  // ── Account ───────────────────────────────────────────────────────────────
  save(): void { this.notify.info('Profile update coming soon.'); }

  changePassword(): void {
    if (this.pwForm.invalid) { this.pwForm.markAllAsTouched(); return; }
    const { current, next, confirm } = this.pwForm.getRawValue();
    if (next !== confirm) { this.notify.error('Passwords do not match.'); return; }
    this.savingPw = true;
    this.auth.changePassword({ currentPassword: current, newPassword: next }).subscribe({
      next: () => {
        this.notify.success('Password changed.');
        this.pwForm.reset();
        this.savingPw = false;
      },
      error: err => {
        this.savingPw = false;
        const e = err?.error;
        const msg = e?.message ?? (Array.isArray(e?.errors) ? e.errors.join(' ') : null);
        if (msg) this.notify.error(msg);
      },
    });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  private loadNoteCount(): void {
    this.loadingNoteCount = true;
    this.notesSvc.getAll().subscribe({
      next: res => {
        const raw = res as any;
        const list: NoteDto[] =
          Array.isArray(raw?.data?.notes) ? raw.data.notes
        : Array.isArray(raw?.data)        ? raw.data
        : Array.isArray(raw?.notes)       ? raw.notes
        : Array.isArray(raw)              ? raw
        : [];
        this.noteCount        = list.length;
        this.loadingNoteCount = false;
      },
      error: () => { this.loadingNoteCount = false; },
    });
  }

  goToNotes(): void { this.router.navigate(['/notes']); }

  // ── Documents ─────────────────────────────────────────────────────────────
  private loadDocCount(): void {
    this.loadingDocCount = true;
    this.docsSvc.getAll().subscribe({
      next: res => {
        const raw = res as any;
        const list: DocumentDto[] =
          Array.isArray(raw?.data?.documents) ? raw.data.documents
        : Array.isArray(raw?.data)            ? raw.data
        : Array.isArray(raw)                  ? raw
        : [];
        this.docCount        = list.length;
        this.loadingDocCount = false;
      },
      error: () => { this.loadingDocCount = false; },
    });
  }

  goToDocuments(): void { this.router.navigate(['/documents']); }
}
