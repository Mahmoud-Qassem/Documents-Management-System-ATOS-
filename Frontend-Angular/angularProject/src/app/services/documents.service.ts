import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentItem {
  id:  string;
  name?: string;
  title?: string;
  fileName?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // GET /api/documents/folder/{folderId}
  getDocuments(folderId:  string): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.base}/documents/folder/${folderId}`);
  }

  

  // POST /api/documents/upload/{folderId} (multipart). Callers should provide a File.
  uploadDocument(folderId: string, file: File, meta?: Partial<DocumentItem>): Observable<DocumentItem> {
    const form = new FormData();
    form.append('file', file);
    if (meta) {
      Object.entries(meta).forEach(([k, v]) => {
        if (v != null) form.append(k, String(v));
      });
    }
    return this.http.post<DocumentItem>(`${this.base}/documents/upload/${folderId}`, form);
  }
}
