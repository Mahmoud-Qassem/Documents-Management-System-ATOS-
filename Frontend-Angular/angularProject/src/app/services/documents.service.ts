import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private base = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) { }

  // GET /api/files/folder/{folderId}
  getDocuments(folderId: string): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.base}/folder/${folderId}`);
  }

  // GET /api/files/deleted/{ownerId}
  getDeletedDocuments(ownerId: string): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.base}/deleted/${ownerId}`);
  }

  // GET /api/files/{fileId}
  getDocumentById(fileId: string): Observable<DocumentItem> {
    return this.http.get<DocumentItem>(`${this.base}/${fileId}`);
  }

  // POST /api/files/upload/{folderId} (multipart). Callers should provide a File.
  uploadDocument(folderId: string, file: File, meta?: Partial<DocumentItem>): Observable<DocumentItem> {
    const form = new FormData();
    // Backend expects a multipart file - match common param name "file"
    form.append('file', file);
    if (meta) {
      Object.entries(meta).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v));
      });
    }
    return this.http.post<DocumentItem>(`${this.base}/upload/${folderId}`, form);
  }

  // PUT /api/files/{fileId}
  updateDocument(fileId: string, file: Partial<DocumentItem>): Observable<DocumentItem> {
    return this.http.put<DocumentItem>(`${this.base}/${fileId}`, file);
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
