import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PreviewResponse {
  base64Data?: string;
  mimeType: string;
  fileName: string;
  type: string;
}

@Injectable({ providedIn: 'root' })
export class FilePreviewService {
  private base = 'http://mydms-app-env.eba-bwswqqze.eu-north-1.elasticbeanstalk.com/api/files';

  constructor(private http: HttpClient) { }

  /**
   * Fetch file preview from backend
   * Response can be either:
   * 1. JSON with base64Data (for small files)
   * 2. Binary stream (for large files)
   */
  getPreview(fileId: string): Observable<any> {
    return this.http.get(
      `${this.base}/${fileId}/preview`,
      { responseType: 'blob' }
    );
  }

  /**
   * Attempt to get preview as JSON first, fallback to blob
   */
  getPreviewAsJson(fileId: string): Observable<PreviewResponse> {
    return this.http.get<PreviewResponse>(
      `${this.base}/${fileId}/preview`
    );
  }

  /**
   * Get preview with response headers to determine content type
   */
  getPreviewWithResponse(fileId: string): Observable<any> {
    return this.http.get(
      `${this.base}/${fileId}/preview`,
      { responseType: 'blob', observe: 'response' }
    );
  }
}
