import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Folder {
  id: number | string;
  folderName: string;
}

@Injectable({ providedIn: 'root' })
export class FoldersService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getFolders(): Observable<Folder[]> {
    return this.http.get<Folder[]>(`${this.base}/folders`);
  }
}
