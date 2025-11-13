import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentItem {
  id: string;
  name?: string;
  type?: string;
  size?: number;
  folderId?: string;
  ownerName?: string;
  title?: string; // legacy/alternate naming support
  fileName?: string; // legacy/alternate naming support
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number; // page size
  number: number; // current page index (0-based)
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
}

export type SortField = 'name' | 'type' | 'size';
export type SortDir = 'asc' | 'desc';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private base = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) { }

  // Unified search endpoint with pagination/sorting; works for folder or recycle bin
  searchDocuments(params: {
    name?: string;
    type?: string;
    keyword?: string;
    folderId?: string | null;
    deleted?: boolean;
    page?: number;
    size?: number;
    sort?: SortField;
    dir?: SortDir;
  }): Observable<PageResponse<DocumentItem>> {
    let httpParams = new HttpParams();
    if (params.name) httpParams = httpParams.set('name', params.name);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.folderId) httpParams = httpParams.set('folderId', params.folderId);
    if (params.deleted != null) httpParams = httpParams.set('deleted', String(params.deleted));
    if (params.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params.size != null) httpParams = httpParams.set('size', String(params.size));
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.dir) httpParams = httpParams.set('dir', params.dir);
    return this.http.get<PageResponse<DocumentItem>>(`${this.base}/search`, { params: httpParams });
  }

  // GET /api/files/folder/{folderId} with pagination
  getDocuments(folderId: string, opts?: { page?: number; size?: number; sort?: SortField; dir?: SortDir }): Observable<PageResponse<DocumentItem>> {
    let params = new HttpParams();
    if (opts?.page != null) params = params.set('page', String(opts.page));
    if (opts?.size != null) params = params.set('size', String(opts.size));
    if (opts?.sort) params = params.set('sort', opts.sort);
    if (opts?.dir) params = params.set('dir', opts.dir);
    return this.http.get<PageResponse<DocumentItem>>(`${this.base}/folder/${folderId}`, { params });
  }

  // GET /api/files/deleted/{ownerId} with pagination
  getDeletedDocuments(ownerId: string, opts?: { page?: number; size?: number; sort?: SortField; dir?: SortDir }): Observable<PageResponse<DocumentItem>> {
    let params = new HttpParams();
    if (opts?.page != null) params = params.set('page', String(opts.page));
    if (opts?.size != null) params = params.set('size', String(opts.size));
    if (opts?.sort) params = params.set('sort', opts.sort);
    if (opts?.dir) params = params.set('dir', opts.dir);
    return this.http.get<PageResponse<DocumentItem>>(`${this.base}/deleted/${ownerId}`, { params });
  }

  // GET /api/files/{fileId}
  getDocumentById(fileId: string): Observable<DocumentItem> {
    return this.http.get<DocumentItem>(`${this.base}/${fileId}`);
  }

  // POST /api/files/upload/{folderId} (multipart). Callers should provide a File.
  uploadDocument(folderId: string, file: File, meta?: Partial<DocumentItem>): Observable<DocumentItem> {
    const form = new FormData();
    form.append('file', file);
    if (meta) {
      Object.entries(meta).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v));
      });
    }
    return this.http.post<DocumentItem>(`${this.base}/upload/${folderId}`, form);
  }

  // PUT /api/files/{fileId} (legacy full update)
  updateDocument(fileId: string, file: Partial<DocumentItem>): Observable<DocumentItem> {
    return this.http.put<DocumentItem>(`${this.base}/${fileId}`, file);
  }

  // PUT /api/files/{fileId}/newName - rename endpoint (backend expects newName as request param)
  renameDocument(fileId: string, newName: string): Observable<DocumentItem> {
    let params = new HttpParams().set('newName', newName);
    return this.http.put<DocumentItem>(`${this.base}/${fileId}`, {}, { params });
  }

  // DELETE /api/files/{fileId} (soft delete)
  deleteDocument(fileId: string): Observable<DocumentItem> {
    return this.http.delete<DocumentItem>(`${this.base}/${fileId}`);
  }

  // DELETE /api/files/{fileId}/hard (hard delete)
  deleteDocumentHard(fileId: string): Observable<DocumentItem> {
    return this.http.delete<DocumentItem>(`${this.base}/${fileId}/hard`);
  }

  // PUT /api/files/restore/{fileId}
  restoreDocument(fileId: string): Observable<DocumentItem> {
    return this.http.put<DocumentItem>(`${this.base}/restore/${fileId}`, {});
  }

  // GET /api/files/download/{fileId}
  getDownloadUrl(fileId: string): string {
    return `${this.base}/download/${fileId}`;
  }

  // GET blob to download with Authorization header via interceptors
  downloadDocument(fileId: string): Observable<Blob> {
    return this.http.get(`${this.base}/download/${fileId}`, { responseType: 'blob' });
  }
}
