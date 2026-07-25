import { Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule }             from '@angular/common';
import { FormsModule }              from '@angular/forms';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotesService, NoteDto }    from '../../core/services/notes.service';
import { NotificationService }      from '../../core/services/notification.service';

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/_(.+?)_/g,           '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/^- \[x\] (.+)$/gm, '<li class="md-check md-check--done"><span>$1</span></li>')
    .replace(/^- \[ \] (.+)$/gm, '<li class="md-check"><span>$1</span></li>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="md-ol">$1</li>')
    .replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = html.replace(/(<li.*<\/li>)/gs, '<ul>$1</ul>');
  return `<p>${html}</p>`;
}

interface ToolbarAction { icon: string; label: string; prefix: string; suffix: string; block?: boolean; }

const TOOLBAR: ToolbarAction[] = [
  { icon: 'format_bold',           label: 'Bold',         prefix: '**',     suffix: '**'  },
  { icon: 'format_italic',         label: 'Italic',       prefix: '*',      suffix: '*'   },
  { icon: 'format_strikethrough',  label: 'Strike',       prefix: '~~',     suffix: '~~'  },
  { icon: 'code',                  label: 'Inline code',  prefix: '`',      suffix: '`'   },
  { icon: 'title',                 label: 'Heading 1',    prefix: '# ',     suffix: '',   block: true },
  { icon: 'text_fields',           label: 'Heading 2',    prefix: '## ',    suffix: '',   block: true },
  { icon: 'format_list_bulleted',  label: 'Bullet list',  prefix: '- ',     suffix: '',   block: true },
  { icon: 'format_list_numbered',  label: 'Ordered list', prefix: '1. ',    suffix: '',   block: true },
  { icon: 'check_box',             label: 'Checkbox',     prefix: '- [ ] ', suffix: '',   block: true },
  { icon: 'format_quote',          label: 'Blockquote',   prefix: '> ',     suffix: '',   block: true },
  { icon: 'horizontal_rule',       label: 'Divider',      prefix: '\n---\n',suffix: ''    },
];

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule,
    MatTooltipModule, MatProgressSpinnerModule,
  ],
  animations: [
    trigger('noteListStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(8px)' }),
          stagger(25, animate('220ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' }))),
        ], { optional: true }),
      ]),
    ]),
    trigger('editorSwap', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('220ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
<div class="notes-shell">

  <!-- ══ SIDEBAR ══════════════════════════════════════════ -->
  <aside class="notes-sidebar" [class.notes-sidebar--collapsed]="sidebarCollapsed()">

    <div class="sidebar-head">
      <div class="sidebar-brand">
        <mat-icon>sticky_note_2</mat-icon>
        @if (!sidebarCollapsed()) { <span>My Notes</span> }
      </div>
      <button class="icon-btn" (click)="toggleSidebar()"
              [matTooltip]="sidebarCollapsed() ? 'Expand' : 'Collapse'">
        <mat-icon>{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
      </button>
    </div>

    <div class="sidebar-new-wrap">
      <button class="sidebar-new-btn" (click)="newNote()"
              [matTooltip]="sidebarCollapsed() ? 'New note' : ''">
        <mat-icon>add</mat-icon>
        @if (!sidebarCollapsed()) { <span>New Note</span> }
      </button>
    </div>

    @if (!sidebarCollapsed()) {
      <div class="sidebar-search">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Search notes…"
               [(ngModel)]="searchQuery" (ngModelChange)="onSearch()"/>
        @if (searchQuery) {
          <button class="search-clear" (click)="searchQuery=''; onSearch()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>
    }

    @if (loading()) {
      <div class="sidebar-loading"><mat-spinner diameter="28"/></div>
    } @else if (filteredNotes().length === 0) {
      <div class="sidebar-empty">
        @if (!sidebarCollapsed()) {
          <mat-icon>notes</mat-icon>
          <p>{{ searchQuery ? 'No matches' : 'No notes yet' }}</p>
        }
      </div>
    } @else {
      <div class="note-list" [@noteListStagger]="filteredNotes().length">
        @for (note of filteredNotes(); track note.noteId) {
          <button class="note-item"
                  [class.note-item--active]="activeNote()?.noteId === note.noteId"
                  (click)="selectNote(note)">
            <div class="note-item-inner">
              <div class="note-item-title">{{ noteTitle(note.content) }}</div>
              @if (!sidebarCollapsed()) {
                <div class="note-item-excerpt text-muted">{{ noteExcerpt(note.content) }}</div>
                <div class="note-item-date text-muted">{{ note.updatedAt | date:'MMM d' }}</div>
              }
            </div>
          </button>
        }
      </div>
    }
  </aside>

  <!-- ══ EDITOR ════════════════════════════════════════════ -->
  <main class="notes-main">

    @if (!activeNote() && !isNew()) {
      <!-- Welcome / empty state — matches dashboard empty-recent style -->
      <div class="notes-welcome">
        <mat-icon style="font-size:52px;width:52px;height:52px;opacity:.2;">edit_note</mat-icon>
        <h2>Select a note or create a new one</h2>
        <p class="text-muted">Notes support Markdown — headings, bold, lists, checkboxes and more.</p>
        <button class="welcome-new-btn" (click)="newNote()">
          <mat-icon>add</mat-icon> New Note
        </button>
      </div>

    } @else {

      <div class="editor-shell" @editorSwap>
      <!-- Toolbar bar — styled like filters-card -->
      <div class="editor-topbar">
        <div class="editor-toolbar">
          @for (action of toolbar; track action.label) {
            <button class="tb-btn" [matTooltip]="action.label" (click)="applyFormat(action)">
              <mat-icon>{{ action.icon }}</mat-icon>
            </button>
          }
        </div>

        <div class="editor-actions">
          <!-- View toggle — styled like filter-tabs -->
          <div class="view-toggle">
            <button class="view-btn" [class.view-btn--active]="viewMode()==='edit'"
                    (click)="viewMode.set('edit')" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </button>
            <button class="view-btn" [class.view-btn--active]="viewMode()==='split'"
                    (click)="viewMode.set('split')" matTooltip="Split view">
              <mat-icon>view_column</mat-icon>
            </button>
            <button class="view-btn" [class.view-btn--active]="viewMode()==='preview'"
                    (click)="viewMode.set('preview')" matTooltip="Preview">
              <mat-icon>visibility</mat-icon>
            </button>
          </div>

          <span class="word-count text-muted">{{ wordCount() }} words</span>

          <!-- Save — matches action-btn--primary -->
          <button class="save-btn" [disabled]="saving() || !dirty()" (click)="save()">
            @if (saving()) { <mat-spinner diameter="15"/> }
            @else { <mat-icon>save</mat-icon> }
            {{ saving() ? 'Saving…' : (dirty() ? 'Save' : 'Saved') }}
          </button>

          @if (!isNew()) {
            <button class="delete-btn" (click)="deleteNote()" matTooltip="Delete note">
              <mat-icon>delete_outline</mat-icon>
            </button>
          }
        </div>
      </div>

      <!-- Editor body -->
      <div class="editor-body"
           [class.editor-body--split]="viewMode()==='split'"
           [class.editor-body--preview]="viewMode()==='preview'">

        @if (viewMode() !== 'preview') {
          <div class="write-pane">
            <textarea
              #editorRef
              class="editor-textarea"
              [(ngModel)]="editorContent"
              (ngModelChange)="onContentChange()"
              (keydown)="onKeydown($event)"
              placeholder="Start writing… (Markdown supported)
# Heading 1
## Heading 2
**bold**  *italic*  ~~strike~~
- bullet list
1. ordered list
- [ ] checkbox
> blockquote
\`inline code\`"
            ></textarea>
          </div>
        }

        @if (viewMode() !== 'edit') {
          <div class="preview-pane">
            <div class="preview-content md-body" [innerHTML]="renderedContent()"></div>
          </div>
        }
      </div>

      <!-- Status bar -->
      <div class="editor-status">
        @if (activeNote() && !isNew()) {
          <span>Last saved {{ activeNote()!.updatedAt | date:'MMM d, y · h:mm a' }}</span>
        } @else {
          <span>New note — not saved yet</span>
        }
        <span>{{ editorContent.length }} chars</span>
      </div>
      </div>
    }
  </main>

</div>
  `,
  styles: [`
    :host { display:block; height:100%; }

    .notes-shell {
      display:flex; height:100%;
      background:var(--surface-2,#f8fafc);
      overflow:hidden;
    }

    /* ── SIDEBAR — matches app-card visual language ── */
    .notes-sidebar {
      width:256px; flex-shrink:0;
      background:var(--surface,#fff);
      border-right:1px solid var(--border,#e2e8f0);
      display:flex; flex-direction:column;
      transition:width .2s ease; overflow:hidden;
    }
    .notes-sidebar--collapsed { width:52px; }

    .sidebar-head {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 10px 10px;
      border-bottom:1px solid var(--border,#e2e8f0); flex-shrink:0;
    }
    .sidebar-brand {
      display:flex; align-items:center; gap:7px;
      font-weight:700; font-size:.88rem; color:var(--text-primary);
      white-space:nowrap; overflow:hidden;
      mat-icon { color:var(--primary,#6366f1); font-size:20px; flex-shrink:0; }
    }
    .icon-btn {
      background:none; border:none; cursor:pointer; border-radius:6px;
      padding:4px; color:var(--text-secondary); display:flex; align-items:center;
      transition:background .15s; flex-shrink:0;
      &:hover { background:var(--surface-2,#f1f5f9); }
      mat-icon { font-size:18px; }
    }

    .sidebar-new-wrap { padding:8px 8px 4px; }
    .sidebar-new-btn {
      display:flex; align-items:center; justify-content:center; gap:5px; width:100%;
      background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none;
      border-radius:8px; padding:8px 10px; font-size:.82rem; font-weight:700;
      cursor:pointer; transition:transform .15s ease, box-shadow .15s ease; white-space:nowrap; overflow:hidden;
      box-shadow:0 4px 12px -3px rgba(99,102,241,.45);
      mat-icon { font-size:18px; flex-shrink:0; }
      &:hover { box-shadow:0 6px 16px -3px rgba(99,102,241,.55); transform:translateY(-1px); }
      &:active { transform:scale(0.97); }
    }

    .sidebar-search {
      display:flex; align-items:center; gap:4px;
      margin:4px 8px 6px; background:var(--surface-2,#f8fafc);
      border:1px solid var(--border,#e2e8f0); border-radius:8px; padding:5px 8px; flex-shrink:0;
      mat-icon { font-size:15px; color:var(--text-secondary); flex-shrink:0; }
      input {
        border:none; background:transparent; outline:none; flex:1;
        font-size:.8rem; color:var(--text-primary); min-width:0;
        &::placeholder { color:var(--text-tertiary,#94a3b8); }
      }
    }
    .search-clear {
      background:none; border:none; cursor:pointer; padding:0;
      color:var(--text-secondary); display:flex; align-items:center;
      mat-icon { font-size:13px; }
    }

    .sidebar-loading { display:flex; flex:1; align-items:center; justify-content:center; }
    .sidebar-empty {
      display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center;
      padding:24px 12px 60px; color:var(--text-secondary); text-align:center; gap:6px;
      mat-icon { font-size:30px; opacity:.25; }
      p { font-size:.78rem; margin:0; }
    }

    .note-list { flex:1; overflow-y:auto; padding:3px 5px 10px; }
    .note-item {
      width:100%; background:none; border:none; cursor:pointer;
      border-radius:8px; padding:0; margin-bottom:2px; text-align:left;
      border-left:3px solid transparent;
      transition:background .12s, border-color .12s, transform .12s;
      &:hover { background:var(--surface-2,#f1f5f9); transform:translateX(1px); }
    }
    .note-item--active { background:color-mix(in srgb,var(--primary,#6366f1) 10%,transparent)!important; border-left-color:var(--primary,#6366f1); }
    .note-item-inner { padding:9px 10px; }
    .note-item-title {
      font-size:.82rem; font-weight:700; color:var(--text-primary);
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .note-item-excerpt { font-size:.74rem; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .note-item-date    { font-size:.68rem; margin-top:3px; }
    .note-item--active .note-item-title { color:var(--primary,#6366f1); }

    /* ── EDITOR ── */
    .notes-main { flex:1; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
    .editor-shell { flex:1; display:flex; flex-direction:column; min-height:0; }

    /* Welcome state — matches dashboard empty-recent */
    .notes-welcome {
      flex:1; display:flex; flex-direction:column; align-items:center;
      justify-content:center; gap:12px; padding:40px; text-align:center;
      color:var(--text-secondary);
      h2 { font-size:1.05rem; font-weight:700; color:var(--text-primary); margin:0; }
      p  { font-size:.875rem; margin:0; max-width:340px; line-height:1.6; }
    }
    .welcome-new-btn {
      display:inline-flex; align-items:center; gap:6px; margin-top:6px;
      background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none;
      border-radius:10px; padding:10px 20px; font-size:.875rem; font-weight:700;
      cursor:pointer; transition:transform .15s ease, box-shadow .15s ease;
      box-shadow:0 4px 12px -3px rgba(99,102,241,.4);
      mat-icon { font-size:18px; }
      &:hover { box-shadow:0 6px 16px -3px rgba(99,102,241,.5); transform:translateY(-1px); }
      &:active { transform:scale(0.96); }
    }

    /* Toolbar — same surface/border pattern as filters-card */
    .editor-topbar {
      display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;
      padding:9px 14px; border-bottom:1px solid var(--border,#e2e8f0);
      background:var(--surface,#fff); flex-shrink:0;
    }
    .editor-toolbar { display:flex; align-items:center; gap:1px; flex-wrap:wrap; }
    .tb-btn {
      background:none; border:none; cursor:pointer; border-radius:6px;
      padding:5px; color:var(--text-secondary);
      display:flex; align-items:center; justify-content:center;
      transition:background .12s, color .12s, transform .12s;
      mat-icon { font-size:16px; width:16px; height:16px; }
      &:hover { background:var(--surface-2,#f1f5f9); color:var(--primary,#6366f1); transform:scale(1.1); }
      &:active { transform:scale(0.92); }
    }
    .editor-actions { display:flex; align-items:center; gap:7px; }

    /* View toggle — matches filter-tabs */
    .view-toggle {
      display:flex; border:1.5px solid var(--border,#e2e8f0); border-radius:8px; overflow:hidden;
    }
    .view-btn {
      background:none; border:none; cursor:pointer; padding:5px 8px;
      color:var(--text-secondary); display:flex; align-items:center; transition:background .12s;
      mat-icon { font-size:16px; }
      &:hover { background:var(--surface-2,#f1f5f9); }
    }
    .view-btn--active { background:linear-gradient(135deg,#6366f1,#8b5cf6)!important; color:#fff!important; }

    .word-count { font-size:.72rem; white-space:nowrap; }

    /* Save — matches action-btn--primary */
    .save-btn {
      display:inline-flex; align-items:center; gap:5px;
      background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; border:none;
      border-radius:8px; padding:6px 14px; font-size:.8rem; font-weight:700;
      cursor:pointer; transition:transform .15s ease, box-shadow .15s ease;
      box-shadow:0 4px 12px -3px rgba(99,102,241,.4);
      mat-icon { font-size:15px; }
      &:disabled { opacity:.5; cursor:default; box-shadow:none; }
      &:not(:disabled):hover { box-shadow:0 6px 16px -3px rgba(99,102,241,.5); transform:translateY(-1px); }
      &:not(:disabled):active { transform:scale(0.96); }
    }

    /* Delete — matches action-btn--ghost / row-actions delete pattern */
    .delete-btn {
      background:none; border:1.5px solid var(--border,#e2e8f0); border-radius:8px;
      cursor:pointer; padding:5px 8px; color:var(--text-secondary);
      display:flex; align-items:center; transition:border-color .15s, color .15s;
      mat-icon { font-size:16px; }
      &:hover { border-color:#dc2626; color:#dc2626; }
    }

    /* Editor body */
    .editor-body { flex:1; display:flex; overflow:hidden; background:var(--surface,#fff); }
    .editor-body--split .write-pane,
    .editor-body--split .preview-pane { width:50%; }
    .editor-body--split .write-pane { border-right:1px solid var(--border,#e2e8f0); }

    .write-pane { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .editor-textarea {
      flex:1; width:100%; height:100%; border:none; outline:none; resize:none;
      padding:22px 26px; font-size:.93rem; line-height:1.75;
      color:var(--text-primary); background:var(--surface,#fff);
      font-family:'JetBrains Mono','Fira Code','Cascadia Code',monospace;
      caret-color:var(--primary,#6366f1);
      &::placeholder { color:var(--text-tertiary,#94a3b8); font-family:inherit; }
    }

    .preview-pane { flex:1; overflow-y:auto; padding:22px 26px; background:var(--surface,#fff); }

    /* Status bar — same muted text pattern used in app */
    .editor-status {
      display:flex; align-items:center; justify-content:space-between;
      padding:5px 14px; font-size:.7rem; color:var(--text-tertiary,#94a3b8);
      border-top:1px solid var(--border,#e2e8f0); background:var(--surface,#fff); flex-shrink:0;
    }

    /* ── Markdown preview ── */
    .md-body {
      font-size:.93rem; line-height:1.75; color:var(--text-primary);
      ::ng-deep {
        h1 { font-size:1.5rem; font-weight:800; margin:0 0 12px; color:var(--text-primary); }
        h2 { font-size:1.2rem; font-weight:700; margin:18px 0 8px; }
        h3 { font-size:1rem;   font-weight:700; margin:14px 0 6px; }
        p  { margin:0 0 10px; }
        strong { font-weight:700; }
        em     { font-style:italic; }
        del    { text-decoration:line-through; opacity:.6; }
        code {
          font-family:'JetBrains Mono',monospace; font-size:.84em;
          background:var(--surface-2,#f1f5f9); padding:2px 5px; border-radius:5px;
          color:var(--primary,#6366f1);
        }
        blockquote {
          border-left:3px solid var(--primary,#6366f1); margin:8px 0; padding:6px 14px;
          background:color-mix(in srgb,var(--primary,#6366f1) 6%,transparent);
          border-radius:0 8px 8px 0; color:var(--text-secondary);
        }
        ul { padding-left:18px; margin:5px 0 10px; }
        li { margin-bottom:4px; }
        hr { border:none; border-top:1px solid var(--border,#e2e8f0); margin:14px 0; }

        /* Checkboxes — same visual language as status chips */
        li.md-check {
          list-style:none; display:flex; align-items:center; gap:7px; margin-left:-18px;
          &::before {
            content:''; width:15px; height:15px; border-radius:4px; flex-shrink:0;
            border:2px solid var(--border,#e2e8f0); display:inline-block;
          }
        }
        li.md-check--done {
          &::before {
            background:var(--primary,#6366f1); border-color:var(--primary,#6366f1);
            background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 6l3 3 5-5' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
            background-repeat:no-repeat; background-position:center;
          }
          span { text-decoration:line-through; opacity:.6; }
        }
      }
    }
  `],
})
export class NotesComponent implements OnInit, OnDestroy {
  private notesSvc = inject(NotesService);
  private notify   = inject(NotificationService);

  @ViewChild('editorRef') editorRef!: ElementRef<HTMLTextAreaElement>;

  loading          = signal(true);
  saving           = signal(false);
  dirty            = signal(false);
  sidebarCollapsed = signal(false);
  viewMode         = signal<'edit' | 'split' | 'preview'>('edit');
  searchQuery      = '';

  private _notes = signal<NoteDto[]>([]);
  activeNote     = signal<NoteDto | null>(null);
  isNew          = signal(false);
  editorContent  = '';

  filteredNotes = computed(() => {
    const q = this.searchQuery.toLowerCase();
    return q ? this._notes().filter(n => n.content.toLowerCase().includes(q)) : this._notes();
  });

  renderedContent = computed(() => renderMarkdown(this.editorContent));
  wordCount       = computed(() =>
    this.editorContent.trim() ? this.editorContent.trim().split(/\s+/).length : 0
  );

  toolbar = TOOLBAR;
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void  { this.loadNotes(); }
  ngOnDestroy(): void { if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer); }

  private loadNotes(): void {
    this.loading.set(true);
    this.notesSvc.getAll().subscribe({
      next: (res: any) => {
        const raw  = res as any;
        const list: NoteDto[] =
          Array.isArray(raw?.data?.notes) ? raw.data.notes
        : Array.isArray(raw?.data)        ? raw.data
        : Array.isArray(raw?.notes)       ? raw.notes
        : Array.isArray(raw)              ? raw : [];
        this._notes.set(list);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  selectNote(note: NoteDto): void {
    if (this.dirty()) this._doSave(() => this._openNote(note));
    else this._openNote(note);
  }
  private _openNote(note: NoteDto): void {
    this.activeNote.set(note);
    this.isNew.set(false);
    this.editorContent = note.content ?? '';
    this.dirty.set(false);
    this.viewMode.set('edit');
    setTimeout(() => {
      const ta = this.editorRef?.nativeElement;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }, 50);
  }

  newNote(): void {
    if (this.dirty()) this._doSave(() => this._startNew());
    else this._startNew();
  }
  private _startNew(): void {
    this.activeNote.set(null);
    this.isNew.set(true);
    this.editorContent = '';
    this.dirty.set(false);
    this.viewMode.set('edit');
    setTimeout(() => this.editorRef?.nativeElement.focus(), 50);
  }

  toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }

  onContentChange(): void {
    this.dirty.set(true);
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      if (this.dirty() && this.editorContent.trim()) this._doSave();
    }, 2000);
  }
  onSearch(): void { /* computed handles it */ }

  save(): void { this._doSave(); }
  private _doSave(onDone?: () => void): void {
    if (!this.editorContent.trim()) return;
    this.saving.set(true);
    const isNew  = this.isNew();
    const noteId = this.activeNote()?.noteId;
    const obs    = isNew || !noteId
      ? this.notesSvc.create(this.editorContent)
      : this.notesSvc.update(noteId, this.editorContent);
    obs.subscribe({
      next: (res: any) => {
        const saved: NoteDto = (res as any)?.data ?? res;
        if (isNew || !noteId) {
          this._notes.update(list => [saved, ...list]);
          this.activeNote.set(saved);
          this.isNew.set(false);
        } else {
          this._notes.update(list => list.map(n => n.noteId === noteId ? saved : n));
          this.activeNote.set(saved);
        }
        this.dirty.set(false);
        this.saving.set(false);
        onDone?.();
      },
      error: () => { this.saving.set(false); this.notify.error('Failed to save note.'); },
    });
  }

  deleteNote(): void {
    const note = this.activeNote();
    if (!note) return;
    if (!confirm(`Delete "${this.noteTitle(note.content)}"?`)) return;
    this.notesSvc.delete(note.noteId).subscribe({
      next: () => {
        this._notes.update(list => list.filter(n => n.noteId !== note.noteId));
        this.activeNote.set(null);
        this.isNew.set(false);
        this.editorContent = '';
        this.dirty.set(false);
        this.notify.success('Note deleted.');
      },
      error: () => { this.notify.error('Failed to delete note.'); },
    });
  }

  applyFormat(action: ToolbarAction): void {
    const ta = this.editorRef?.nativeElement;
    if (!ta) return;
    const start    = ta.selectionStart;
    const end      = ta.selectionEnd;
    const selected = this.editorContent.substring(start, end);
    let newText: string; let newStart: number; let newEnd: number;
    if (action.block) {
      const lineStart = this.editorContent.lastIndexOf('\n', start - 1) + 1;
      newText  = this.editorContent.substring(0, lineStart) + action.prefix + this.editorContent.substring(lineStart);
      newStart = start + action.prefix.length;
      newEnd   = end   + action.prefix.length;
    } else if (selected) {
      newText  = this.editorContent.substring(0, start) + action.prefix + selected + action.suffix + this.editorContent.substring(end);
      newStart = start + action.prefix.length;
      newEnd   = end   + action.prefix.length;
    } else {
      const placeholder = 'text';
      newText  = this.editorContent.substring(0, start) + action.prefix + placeholder + action.suffix + this.editorContent.substring(end);
      newStart = start + action.prefix.length;
      newEnd   = newStart + placeholder.length;
    }
    this.editorContent = newText;
    this.onContentChange();
    setTimeout(() => { ta.focus(); ta.setSelectionRange(newStart, newEnd); }, 0);
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target as HTMLTextAreaElement;
      const start = ta.selectionStart; const end = ta.selectionEnd;
      this.editorContent = this.editorContent.substring(0, start) + '  ' + this.editorContent.substring(end);
      setTimeout(() => ta.setSelectionRange(start + 2, start + 2), 0);
      this.onContentChange();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); this.save(); }
  }

  noteTitle(content: string | undefined | null): string {
    if (!content) return 'Untitled';
    const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim();
    return firstLine || 'Untitled';
  }
  noteExcerpt(content: string | undefined | null): string {
    if (!content) return '';
    const lines = content.split('\n').filter(l => l.trim());
    const body  = lines.slice(1).join(' ').replace(/[#*`_~>-]/g, '').trim();
    return body.substring(0, 80) + (body.length > 80 ? '…' : '');
  }
}