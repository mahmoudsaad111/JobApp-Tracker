import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title:        string;
  message:      string;
  confirmLabel: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-shell">
      <div class="confirm-icon"><mat-icon>warning_amber</mat-icon></div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button class="confirm-btn confirm-btn--ghost" [mat-dialog-close]="false">Cancel</button>
        <button class="confirm-btn confirm-btn--danger" [mat-dialog-close]="true">
          <mat-icon>delete_outline</mat-icon> {{ data.confirmLabel }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-shell { padding: 4px 2px 0; }
    .confirm-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 14px;
      mat-icon { color: #dc2626; font-size: 26px; width: 26px; height: 26px; }
    }
    h2[mat-dialog-title] {
      font-size: 1.1rem !important; font-weight: 800 !important;
      letter-spacing: -0.01em; margin-bottom: 4px !important;
    }
    mat-dialog-content p {
      color: var(--text-secondary, #64748b); font-size: 0.9rem; line-height: 1.6; margin: 0;
    }
    .confirm-btn {
      display: inline-flex; align-items: center; gap: 6px;
      border-radius: 10px; padding: 8px 18px; font-size: 0.85rem; font-weight: 700;
      cursor: pointer; border: none; transition: transform .15s ease, box-shadow .15s ease;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:active { transform: scale(0.96); }
    }
    .confirm-btn--ghost {
      background: none; border: 1.5px solid var(--border-color, #e2e8f0); color: var(--text-secondary, #64748b);
      &:hover { border-color: #94a3b8; color: var(--text-primary); }
    }
    .confirm-btn--danger {
      background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
      box-shadow: 0 4px 14px -4px rgba(220,38,38,.5);
      &:hover { box-shadow: 0 6px 18px -4px rgba(220,38,38,.6); transform: translateY(-1px); }
    }
  `],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
