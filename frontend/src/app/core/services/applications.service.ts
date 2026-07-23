import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable,tap } from 'rxjs';
import { environment } from '@env/environment';
import {
  JobApplication,
  CreateApplicationRequest,
  UpdateApplicationRequest,
  ApiResponse,
  PagedResponse,
  PagedQuery,
  ApplicationStatus,
  ParseJobPostingRequest,
  ParsedJobPosting,
  MatchResumeRequest,
  ResumeMatchResult,
  GenerateCoverLetterRequest,
  CoverLetterDto
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private http = inject(HttpClient);
  private base  = `${environment.apiUrl}/JobApp`;
  private parseBase = `${environment.apiUrl}/job-postings`;

  // ─── List (paged + filtered) ─────────────────────────────────────────────────
  getAll(query: PagedQuery = {}): Observable<PagedResponse<JobApplication>> {
    let params = new HttpParams();
    if (query.page)     params = params.set('Page',     query.page);
    if (query.pageSize) params = params.set('PageSize', query.pageSize);
    if (query.search)   params = params.set('Search',   query.search);
    if (query.status)   params = params.set('Status',   query.status);
    if (query.sortBy)   params = params.set('SortBy',   query.sortBy);
    if (query.fromDate) params = params.set('FromDate',   query.fromDate.toISOString());
    if (query.toDate)   params = params.set('ToDate',   query.toDate.toISOString());

    //if (query.sortDir)  params = params.set('sortDir',  query.sortDir);
    return this.http.get<PagedResponse<JobApplication>>(this.base, { params });
  }

  // ─── Single ──────────────────────────────────────────────────────────────────
  getById(id: string): Observable<ApiResponse<JobApplication>> {
    return this.http.get<ApiResponse<JobApplication>>(`${this.base}/${id}`);
  }

  // ─── Create ──────────────────────────────────────────────────────────────────
  create(body: CreateApplicationRequest): Observable<ApiResponse<JobApplication>> {
    return this.http.post<ApiResponse<JobApplication>>(this.base, body);
  }

  // ─── Update ──────────────────────────────────────────────────────────────────
  update(id: string, body: UpdateApplicationRequest): Observable<ApiResponse<JobApplication>> {
    return this.http.put<ApiResponse<JobApplication>>(`${this.base}/${id}`, body);
  }

  // ─── Patch status only ───────────────────────────────────────────────────────
  updateStatus(id: string, status: ApplicationStatus): Observable<ApiResponse<JobApplication>> {
    return this.http.patch<ApiResponse<JobApplication>>(`${this.base}/${id}/status`, { status });
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // ─── Parse Job Posting ───────────────────────────────────────────────────────
  parseJobPosting(body: ParseJobPostingRequest): Observable<ApiResponse<ParsedJobPosting>> {
    return this.http.post<ApiResponse<ParsedJobPosting>>(`${this.parseBase}/parse`, body);
  }

  // ─── Resume Match ────────────────────────────────────────────────────────────
  matchResume(jobApplicationId: string, body: MatchResumeRequest): Observable<ApiResponse<ResumeMatchResult>> {
    return this.http.post<ApiResponse<ResumeMatchResult>>(`${environment.apiUrl}/job-applications/${jobApplicationId}/match`, body);
  }

  // ─── Cover Letter Generation ────────────────────────────────────────────────
  generateCoverLetter(jobApplicationId: string, body: GenerateCoverLetterRequest): Observable<ApiResponse<CoverLetterDto>> {
    return this.http.post<ApiResponse<CoverLetterDto>>(`${environment.apiUrl}/job-applications/${jobApplicationId}/cover-letter`, body);
  }
}
