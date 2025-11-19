import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from './documents.service';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  size: number;
  path: string; // backend expects this as the parent folder path signature
  ownerId: string;
  ownerName: string;
  deleted?: boolean;
  createdAt?: string | Date;
}

export interface SearchCriteria {
  name?: string;
  type?: string;
  folderId?: string;
  deleted?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  dir?: string;
}

@Injectable({ providedIn: 'root' })
export class FoldersService {
  private base = 'http://mydms-app-env.eba-bwswqqze.eu-north-1.elasticbeanstalk.com/api/folders';

  constructor(private http: HttpClient) { }

  /** Search folders using SearchCriteria */
  searchFolders(searchCriteria: SearchCriteria): Observable<PageResponse<Folder>> {
    return this.http.post<PageResponse<Folder>>(`${this.base}/search`, searchCriteria);
  }

  /** Get a specific folder by id */
  getFolderById(folderId: string): Observable<Folder> {
    return this.http.get<Folder>(`${this.base}/${folderId}`);
  }

  /** Create folder (JWT provides owner id and name). currentPath is the parent path signature like `id_name\\id2_name2\\` */
  createFolder(name: string, parentId: string | null = null, currentPath: string): Observable<Folder> {
    const payload: any = { name };
    if (parentId) payload.parentId = parentId;
    else payload.parentId = "root";
    // Use the property name "path" as the backend reads folder.getPath() when building full path
    payload.path = currentPath || '';
    return this.http.post<Folder>(this.base, payload);
  }

  /** Update folder */
  updateFolder(folderId: string, folder: Partial<Folder>): Observable<Folder> {
    return this.http.post<Folder>(`${this.base}/${folderId}`, folder);
  }

  /** Soft delete (mark as deleted = true) */
  deleteFolder(folderId: string): Observable<Folder> {
    return this.http.delete<Folder>(`${this.base}/${folderId}`);
  }

  /** Hard delete (physically remove folder) */
  deleteFolderHard(folderId: string): Observable<Folder> {
    return this.http.delete<Folder>(`${this.base}/${folderId}/hard`);
  }

  /** Restore folder (from deleted to active) */
  restoreFolder(folderId: string): Observable<Folder> {
    return this.http.put<Folder>(`${this.base}/restore/${folderId}`, {});
  }

  /** Download folder */
  getDownloadUrl(folderId: string): string {
    return `${this.base}/${folderId}/download`;
  }
}
