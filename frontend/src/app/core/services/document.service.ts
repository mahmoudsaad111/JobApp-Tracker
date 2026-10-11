import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap }    from 'rxjs/operators';
import { environment }        from '../../../environments/environment';

export interface DocumentDto {
  id:          string;
  fileName:    string;
  filePath:    string;
  fileSize:    number;
  type:        string;   // "CV" | "Resume" | "CoverLetter" | "Other"
  contentType: string;   // "Pdf" | "Word" | "Image" | "Other"
  createdAt:   string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private http = inject(HttpClient);

  // ⚠️ Must match your controller route — ASP.NET [controller] = "Documents" → /api/documents
  private base = `${environment.apiUrl}/Document`;

  /** GET /api/documents */
  getAll(): Observable<{ data: DocumentDto[] }> {
    return this.http.get<{ data: DocumentDto[] }>(this.base).pipe(
      tap(res  => console.log('[Documents] getAll:', res)),
      catchError(err => {
        console.error('[Documents] getAll error:', err);
        return throwError(() => err);
      })
    );
  }

  /** POST /api/documents  (multipart/form-data) */
  upload(file: File, type: string): Observable<{ data: DocumentDto }> {
    const fd = new FormData();
    fd.append('file', file, file.name);   // ← pass filename explicitly
    fd.append('type', type);

    console.log('[Documents] uploading:', file.name, 'type:', type, 'to:', this.base);

    return this.http.post<{ data: DocumentDto }>(this.base, fd).pipe(
      tap(res  => console.log('[Documents] upload success:', res)),
      catchError(err => {
        console.error('[Documents] upload error:', err.status, err.error);
        return throwError(() => err);
      })
    );
  }

  /** GET /api/document/:id/file  (authenticated, returns the raw file) */
  getFile(id: string, download = false): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/file`, {
      params: { download },
      responseType: 'blob',
    });
  }

  /** DELETE /api/documents/:id */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(()   => console.log('[Documents] deleted:', id)),
      catchError(err => {
        console.error('[Documents] delete error:', err.status, err.error);
        return throwError(() => err);
      })
    );
  }
}