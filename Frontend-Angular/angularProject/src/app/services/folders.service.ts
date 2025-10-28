import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Folder {
  id: number | string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class FoldersService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getFolders(): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.base}/folders`);
  }

  getSubfolders(parentId: number | string): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.base}/folders/${parentId}`);
  }

  getOwner(folderId: number | string): Observable<{ ownerName: string }> {
    return this.http.get<{ ownerName: string }>(`${this.base}/folders/owner/${folderId}`);
  }

  deleteFolder(folderId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.base}/folders/${folderId}`);
  }

  createFolder(name: string, parentId: number | string | null = null): Observable<Folder> {
    const payload: any = { name };
    if (parentId !== null) payload.parentId = parentId;
    return this.http.post<Folder>(`${this.base}/folders`, payload);
  }

  getDownloadUrl(folderId: number | string): string {
    return `${this.base}/folders/${folderId}/download`;
  }
}
