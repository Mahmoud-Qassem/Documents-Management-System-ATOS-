import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DocumentItem {
  id: number | string;
  name?: string;
  title?: string;
  fileName?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getDocuments(folderId: number | string): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${this.base}/documents/${folderId}`);
  }

  createDocument(name: string, type: string, folderId: number | string): Observable<DocumentItem> {
    const payload = { name, type, folderId };
    return this.http.post<DocumentItem>(`${this.base}/documents`, payload);
  }
}
