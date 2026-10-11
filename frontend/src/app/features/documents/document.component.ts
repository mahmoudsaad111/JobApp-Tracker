import {
  Component, inject, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule }            from '@angular/forms';
import { environment }            from '@env/environment';

import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';

import { DocumentsService, DocumentDto } from '../../core/services/document.service';
import { NotificationService }           from '../../core/services/notification.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, DatePipe,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  animations: [
    trigger('pageIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('280ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('docStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(10px)' }),
          stagger(35, animate('240ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))),
        ], { optional: true }),
      ]),
    ]),
    trigger('popIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.97)' }),
        animate('200ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
  ],
  template: `
    <div class="page-container" @pageIn>
      <div class="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">Documents</h1>
          <p class="text-slate-500 text-sm mt-1 font-medium">{{ documents().length }} file{{ documents().length === 1 ? '' : 's' }} stored</p>
        </div>
      </div>

    <div class="app-card section-card">

      <!-- ── Header ── -->
      <div class="section-header">
        <div class="section-title">
          <mat-icon>folder_open</mat-icon>
          <h3>My Documents</h3>
          @if (documents().length > 0) {
            <span class="badge">{{ documents().length }}</span>
          }
        </div>
        <button mat-stroked-button (click)="fileInput.click()" [disabled]="uploadingDoc()">
          <mat-icon>upload</mat-icon> Upload
        </button>
        <input #fileInput type="file" hidden accept=".pdf,.doc,.docx"
               (change)="onFileSelected($event)">
      </div>

      <!-- ── Drag-and-drop zone ── -->
      @if (!pendingFile()) {
        <div class="dropzone" [class.dropzone--active]="dragActive()"
             (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)"
             (click)="fileInput.click()">
          <mat-icon>cloud_upload</mat-icon>
          <p><strong>Drop a file here</strong> or click to browse</p>
          <p class="dropzone-sub">PDF, DOC, or DOCX</p>
        </div>
      }

      <!-- ── Pending-upload bar ── -->
      @if (pendingFile()) {
        <div class="upload-bar" @popIn>
          <div class="upload-file-info">
            <div class="upload-file-icon">
              <mat-icon>insert_drive_file</mat-icon>
            </div>
            <span class="upload-filename">{{ pendingFile()!.name }}</span>
          </div>

          <select [value]="pendingDocType"
                  (change)="pendingDocType = $any($event.target).value"
                  class="type-select">
            <option value="CV">CV</option>
            <option value="Resume">Resume</option>
            <option value="CoverLetter">Cover Letter</option>
            <option value="Other">Other</option>
          </select>

          <div class="upload-actions">
            <button mat-stroked-button (click)="cancelUpload()" [disabled]="uploadingDoc()">
              Cancel
            </button>
            <button mat-flat-button color="primary"
                    [disabled]="uploadingDoc()" (click)="confirmUpload()">
              @if (uploadingDoc()) {
                <mat-spinner diameter="16"/>
              } @else {
                <mat-icon>check</mat-icon> Confirm
              }
            </button>
          </div>
        </div>
      }

      <!-- ── Body ── -->
      @if (loadingDocs()) {
        <div class="loading-row"><mat-spinner diameter="28"/></div>

      } @else if (documents().length === 0 && !pendingFile()) {
        <div class="empty-state">
          <mat-icon>description</mat-icon>
          <p>No documents yet.</p>
          <p class="empty-sub">Upload your CV, resume, or cover letter.</p>
        </div>

      } @else {
        <div class="docs-list" [@docStagger]="documents().length">
          @for (doc of documents(); track doc.id) {
            <div class="doc-item">

              <!-- Icon -->
              <div class="doc-icon" [ngClass]="iconClass(doc.contentType)">
                <mat-icon>{{ docIcon(doc.contentType) }}</mat-icon>
              </div>

              <!-- Info -->
              <div class="doc-info">
                <div class="doc-name">{{ doc.fileName }}</div>
                <div class="doc-meta">
                  <span class="meta-chip" [ngClass]="typeChipClass(doc.type)">
                    {{ formatType(doc.type) }}
                  </span>
                  <span class="meta-chip" [ngClass]="contentChipClass(doc.contentType)">
                    <mat-icon>{{ docIcon(doc.contentType) }}</mat-icon>
                    {{ doc.contentType }}
                  </span>
                  <span class="meta-size">{{ formatSize(doc.fileSize) }}</span>
                  <span class="meta-date">{{ doc.createdAt | date:'MMM d, y' }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="doc-actions">

                @if (doc.contentType.toLowerCase() === 'pdf') {
                  <button mat-icon-button matTooltip="View PDF" (click)="viewFile(doc)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                }

                <button mat-icon-button matTooltip="Download" (click)="downloadFile(doc)">
                  <mat-icon>download</mat-icon>
                </button>

                <button mat-icon-button color="warn"
                        matTooltip="Delete"
                        [disabled]="deletingId() === doc.id"
                        (click)="deleteDocument(doc)">
                  @if (deletingId() === doc.id) {
                    <mat-spinner diameter="18"/>
                  } @else {
                    <mat-icon>delete_outline</mat-icon>
                  }
                </button>

              </div>
            </div>
          }
        </div>
      }

    </div>
    </div>
  `,
  styles: [`
    .section-card { padding: 20px; }

    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .section-title {
      display: flex; align-items: center; gap: 8px; flex: 1;
      h3 { font-weight: 600; font-size: 1rem; margin: 0; }
      mat-icon { color: var(--primary, #6366f1); font-size: 20px; width: 20px; height: 20px; }
    }
    .badge {
      background: #ede9fe; color: #6d28d9;
      font-size: .72rem; font-weight: 700;
      padding: 1px 7px; border-radius: 10px;
    }

    .upload-bar {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      background: var(--surface-2, #f8fafc);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
    }
    .upload-file-info {
      display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
    }
    .upload-file-icon {
      width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
      background: #ede9fe; color: #6d28d9;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    :host-context(.dark) .upload-file-icon { background: #4c1d95; color: #ddd6fe; }
    .upload-filename {
      font-size: .875rem; font-weight: 500;
      min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--text-primary);
    }
    .type-select {
      border: 1px solid var(--border, #e2e8f0); border-radius: 8px;
      padding: 6px 10px; font-size: .875rem;
      background: var(--bg-surface); outline: none; cursor: pointer;
      transition: border-color .15s;
      &:focus { border-color: var(--primary, #6366f1); }
    }
    .upload-actions { display: flex; gap: 8px; flex-shrink: 0; }

    .dropzone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; gap: 4px;
      border: 2px dashed var(--border, #e2e8f0); border-radius: 14px;
      padding: 28px 20px; margin-bottom: 16px; cursor: pointer;
      background: var(--surface-2, #f8fafc);
      transition: border-color .18s ease, background .18s ease, transform .18s ease;
      mat-icon { font-size: 30px; width: 30px; height: 30px; color: var(--primary,#6366f1); opacity: .6; margin-bottom: 4px; }
      p { margin: 0; font-size: .85rem; color: var(--text-secondary,#64748b); }
      strong { color: var(--text-primary); }
      &:hover { border-color: color-mix(in srgb, var(--primary,#6366f1) 45%, transparent); background: color-mix(in srgb, var(--primary,#6366f1) 4%, var(--surface-2,#f8fafc)); }
    }
    .dropzone--active {
      border-color: var(--primary,#6366f1);
      background: color-mix(in srgb, var(--primary,#6366f1) 8%, var(--surface-2,#f8fafc));
      transform: scale(1.01);
      mat-icon { opacity: 1; }
    }
    .dropzone-sub { font-size: .72rem !important; opacity: .7; margin-top: 2px !important; }

    .docs-list { display: flex; flex-direction: column; gap: 8px; }

    .doc-item {
      display: flex; align-items: center; gap: 12px;
      border: 1px solid var(--border, #e2e8f0); border-radius: 12px;
      padding: 12px 14px; transition: box-shadow .15s, border-color .15s;
      &:hover {
        box-shadow: 0 2px 12px rgba(0,0,0,.07);
        border-color: color-mix(in srgb, var(--primary,#6366f1) 30%, transparent);
      }
    }

    .doc-icon { width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; mat-icon { font-size: 22px; width: 22px; height: 22px; } }
    .doc-icon--pdf   { background: #fee2e2; color: #dc2626; }
    .doc-icon--word  { background: #dbeafe; color: #2563eb; }
    .doc-icon--image { background: #dcfce7; color: #16a34a; }
    .doc-icon--other { background: #f3f4f6; color: #6b7280; }
    :host-context(.dark) .doc-icon--pdf   { background: #7f1d1d; color: #fca5a5; }
    :host-context(.dark) .doc-icon--word  { background: #1e3a5f; color: #93c5fd; }
    :host-context(.dark) .doc-icon--image { background: #064e3b; color: #6ee7b7; }
    :host-context(.dark) .doc-icon--other { background: #334155; color: #94a3b8; }

    .doc-info { flex: 1; min-width: 0; }
    .doc-name {
      font-weight: 600; font-size: .875rem; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .doc-meta {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      margin-top: 5px; font-size: .75rem; color: var(--text-secondary, #64748b);
    }
    .meta-size, .meta-date { font-size: .72rem; }

    .meta-chip {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 2px 8px; border-radius: 20px;
      font-size: .7rem; font-weight: 700; white-space: nowrap;
      mat-icon { font-size: 11px; width: 11px; height: 11px; }
    }

    .chip--pdf   { background: #fee2e2; color: #dc2626; }
    .chip--word  { background: #dbeafe; color: #2563eb; }
    .chip--image { background: #dcfce7; color: #16a34a; }
    .chip--other { background: #f3f4f6; color: #6b7280; }

    .chip--cv          { background: #ede9fe; color: #6d28d9; }
    .chip--resume      { background: #fef3c7; color: #d97706; }
    .chip--coverletter { background: #d1fae5; color: #059669; }
    .chip--other-type  { background: #f3f4f6; color: #6b7280; }

    :host-context(.dark) .chip--pdf   { background: #7f1d1d; color: #fca5a5; }
    :host-context(.dark) .chip--word  { background: #1e3a5f; color: #93c5fd; }
    :host-context(.dark) .chip--image { background: #064e3b; color: #6ee7b7; }
    :host-context(.dark) .chip--other { background: #334155; color: #94a3b8; }
    :host-context(.dark) .chip--cv          { background: #4c1d95; color: #ddd6fe; }
    :host-context(.dark) .chip--resume      { background: #78350f; color: #fcd34d; }
    :host-context(.dark) .chip--coverletter { background: #064e3b; color: #6ee7b7; }
    :host-context(.dark) .chip--other-type  { background: #334155; color: #94a3b8; }

    .doc-actions { display: flex; gap: 2px; flex-shrink: 0; }

    .loading-row { display: flex; justify-content: center; padding: 32px; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px; color: var(--text-secondary, #64748b); text-align: center;
      mat-icon { font-size: 44px; width: 44px; height: 44px; opacity: .2; margin-bottom: 10px; }
      p { font-size: .875rem; margin: 0; }
      .empty-sub { font-size: .8rem; margin-top: 4px; opacity: .7; }
    }
  `],
})
export class DocumentsComponent implements OnInit {
  private docsSvc = inject(DocumentsService);
  private notify  = inject(NotificationService);
  private cdr     = inject(ChangeDetectorRef);

  documents    = signal<DocumentDto[]>([]);
  loadingDocs  = signal(false);
  uploadingDoc = signal(false);
  deletingId   = signal<string | null>(null);

  // ← converted to signal so OnPush picks up changes
  pendingFile    = signal<File | null>(null);
  pendingDocType = 'CV';
  dragActive     = signal(false);

  ngOnInit(): void { this.loadDocuments(); }

  // ── Load ──────────────────────────────────────────────────────────────────
  private loadDocuments(): void {
    this.loadingDocs.set(true);
    this.docsSvc.getAll().subscribe({
      next: res => {
        // handle both { data: [...] } and { data: { documents: [...] } }
        const raw  = res as any;
        const list: DocumentDto[] =
          Array.isArray(raw?.data?.documents) ? raw.data.documents
        : Array.isArray(raw?.data)            ? raw.data
        : Array.isArray(raw)                  ? raw
        : [];
        this.documents.set(list);
        this.loadingDocs.set(false);
      },
      error: (err) => {
        console.error('[Documents] load failed:', err);
        this.loadingDocs.set(false);
      },
    });
  }

  // ── File actions ──────────────────────────────────────────────────────────
  // Files are private: fetch them through the authenticated API as a blob,
  // then hand the browser a temporary local URL.
  viewFile(doc: DocumentDto): void {
    // Open the tab synchronously so popup blockers allow it, then point it at the blob.
    const tab = window.open('', '_blank');
    this.docsSvc.getFile(doc.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        if (tab) tab.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        tab?.close();
        this.notify.error('Could not open the document.');
      },
    });
  }

  downloadFile(doc: DocumentDto): void {
    this.docsSvc.getFile(doc.id, true).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: () => this.notify.error('Could not download the document.'),
    });
  }

  // ── Upload ────────────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.pendingFile.set(input.files[0]);
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.pendingFile.set(file);
  }

  cancelUpload(): void {
    this.pendingFile.set(null);
    this.pendingDocType = 'CV';
  }

  confirmUpload(): void {
    const file = this.pendingFile();
    if (!file) return;

    this.uploadingDoc.set(true);

    this.docsSvc.upload(file, this.pendingDocType).subscribe({
      next: res => {
        this.notify.success('Document uploaded.');
        this.cancelUpload();
        this.uploadingDoc.set(false);
        this.loadDocuments();  // ← replace everything else with this
      },
      error: (err) => {
        console.error('[Documents] upload failed:', err.status, err.error);
        this.uploadingDoc.set(false);
        this.notify.error(
          err?.error?.message ?? 'Failed to upload document.'
        );
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteDocument(doc: DocumentDto): void {
    const id = doc.id;
    if (!id) { this.notify.error('Cannot delete: document ID is missing.'); return; }

    this.deletingId.set(id);
    this.docsSvc.delete(id).subscribe({
      next: () => {
        this.documents.update(l => l.filter(d => d.id !== id));
        this.notify.success('Document deleted.');
        this.deletingId.set(null);
      },
      error: (err) => {
        console.error('[Documents] delete failed:', err.status, err.error);
        this.notify.error('Failed to delete document.');
        this.deletingId.set(null);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  docIcon(contentType: string): string {
    const t = contentType?.toLowerCase();
    if (t === 'pdf')   return 'picture_as_pdf';
    if (t === 'word')  return 'description';
    if (t === 'image') return 'image';
    return 'insert_drive_file';
  }

  iconClass(contentType: string): string {
    return 'doc-icon--' + (contentType?.toLowerCase() ?? 'other');
  }

  contentChipClass(contentType: string): string {
    return 'meta-chip chip--' + (contentType?.toLowerCase() ?? 'other');
  }

  typeChipClass(type: string): string {
    const map: Record<string, string> = {
      cv:          'chip--cv',
      resume:      'chip--resume',
      coverletter: 'chip--coverletter',
    };
    const key = type?.toLowerCase().replace(/\s/g, '') ?? '';
    return 'meta-chip ' + (map[key] ?? 'chip--other-type');
  }

  formatType(type: string): string {
    const map: Record<string, string> = {
      CV: 'CV', Resume: 'Resume', CoverLetter: 'Cover Letter', Other: 'Other',
    };
    return map[type] ?? type;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}