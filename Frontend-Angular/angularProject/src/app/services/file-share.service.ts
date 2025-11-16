import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SharePermission = 'READ' | 'DOWNLOAD';

export interface SharedFile {
  id: string;
  name?: string;
  type?: string;
  size?: number;
  ownerName?: string;
  createdAt?: string | Date;
  permission?: SharePermission;
}

export interface ShareRecord {
  email: string;
  permission: SharePermission;
  sharedAt?: string | Date;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
}

export interface ShareRequest {
  targetUserEmail: string;
  permission: SharePermission;
}

@Injectable({ providedIn: 'root' })
export class FileShareService {
  private base = 'http://localhost:8080/api/files';

  constructor(private http: HttpClient) { }

  // POST /api/files/{fileId}/share - Share a file with a user
  shareFile(fileId: string, payload: ShareRequest): Observable<any> {
    console.log(payload);
    return this.http.post(`${this.base}/${fileId}/share`, payload);
  }

  // GET /api/files/shared-with-me - Get files shared with the current user
  getFilesSharedWithMe(page: number = 0, size: number = 20): Observable<PageResponse<SharedFile>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<SharedFile>>(`${this.base}/shared-with-me`, { params });
  }

  // GET /api/files/shared-by-me - Get files shared by the current user
  getFilesSharedByMe(page: number = 0, size: number = 20): Observable<PageResponse<any>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<any>>(`${this.base}/shared-by-me`, { params });
  }

  // GET /api/files/{fileId}/share - Get all users this file is shared with
  getShareDetails(fileId: string): Observable<ShareRecord[]> {
    return this.http.get<ShareRecord[]>(`${this.base}/${fileId}/share`);
  }

  // PATCH /api/files/{fileId}/share/{email} - Update permission for a shared user
  updateSharePermission(fileId: string, email: string, permission: SharePermission): Observable<any> {
    return this.http.patch(`${this.base}/${fileId}/share/${email}`, permission);
  }

  // DELETE /api/files/{fileId}/share/{email} - Remove share access from a user
  removeShareAccess(fileId: string, email: string): Observable<any> {
    return this.http.delete(`${this.base}/${fileId}/share/${email}`);
  }
}
