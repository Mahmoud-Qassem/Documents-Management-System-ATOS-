import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FilePreviewService, PreviewResponse } from '../../services/file-preview.service';
import { DocumentsService } from '../../services/documents.service';
import { DocumentSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [CommonModule, DocumentSizePipe],
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent implements OnInit, OnDestroy {
  fileId = signal<string | null>(null);
  fileName = signal<string>('');
  fileType = signal<string>('');
  fileSize = signal<number>(0);
  mimeType = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  previewUrl = signal<SafeResourceUrl | SafeUrl | null>(null);
  previewBlob = signal<Blob | null>(null);
  isBase64Preview = signal<boolean>(false);
  supportedForPreview = signal<boolean>(true);
  previousFolderId = signal<string | null>(null);

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private previewService: FilePreviewService,
    private documentsService: DocumentsService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    const state = this.router.getCurrentNavigation()?.extras?.state;
    if (state?.['folderId']) {
      this.previousFolderId.set(state['folderId']);
    }

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('fileId');
      if (id) {
        this.fileId.set(id);
        this.loadPreview(id);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPreview(fileId: string) {
    this.loading.set(true);
    this.error.set(null);

    // Try to fetch with blob response first to capture both JSON and binary
    this.previewService.getPreviewWithResponse(fileId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        const contentType = response.headers.get('content-type') || '';
        const blob = response.body;

        if (!blob) {
          this.error.set('No preview data received');
          this.loading.set(false);
          return;
        }

        // Check if response is JSON (base64 data)
        if (contentType.includes('application/json')) {
          this.handleJsonResponse(blob);
        } else {
          // Binary stream response
          this.handleBlobResponse(blob, contentType);
        }

        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.error.set('File not found');
        } else if (err.status === 403) {
          this.error.set('Permission denied');
        } else {
          this.error.set(err.error?.message || 'Failed to load preview');
        }
      }
    });

    // Load file metadata
    this.documentsService.getDocumentById(fileId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (doc) => {
        this.fileName.set(((doc.fileName || doc.name || doc.title)+'.'+doc.type) || 'Unknown');
        this.fileType.set(doc.type || '');
        this.fileSize.set(doc.size || 0);
      },
      error: (err) => {
        // If metadata fails, just continue with preview
        console.warn('Could not load file metadata', err);
      }
    });
  }

  private handleJsonResponse(blob: Blob) {
    blob.text().then(text => {
      try {
        const data: PreviewResponse = JSON.parse(text);
        this.mimeType.set(data.mimeType);
        this.isBase64Preview.set(true);

        // Check if this file type is supported for preview
        if (!this.isSupportedFileType(data.mimeType)) {
          this.supportedForPreview.set(false);
          this.error.set('Preview not available for this file type');
          return;
        }

        // Create data URL from base64
        if (data.base64Data) {
          let dataUrl: string;

          // For text content, wrap in HTML with black text styling
          if (data.mimeType.includes('text') && !data.mimeType.includes('html')) {
            const decodedText = atob(data.base64Data);
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {
  margin: 20px;
  font-family: monospace;
  color: black;
  background-color: white;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>
</head>
<body>${this.escapeHtml(decodedText)}</body>
</html>`;
            const encoded = btoa(unescape(encodeURIComponent(htmlContent)));
            dataUrl = `data:text/html;base64,${encoded}`;
          } else {
            dataUrl = `data:${data.mimeType};base64,${data.base64Data}`;
          }

          if (data.mimeType.includes('image')) {
            this.previewUrl.set(this.sanitizer.bypassSecurityTrustUrl(dataUrl));
          } else if (data.mimeType.includes('pdf')) {
            // Hide PDF toolbar by appending viewer parameters
            const pdfUrl = dataUrl + '#toolbar=0&navpanes=0&pagemode=none';
            this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl));
          } else {
            this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl));
          }
        }
      } catch (e) {
        this.error.set('Invalid preview data format');
      }
    }).catch(err => {
      this.error.set('Failed to process preview data');
    });
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  private handleBlobResponse(blob: Blob, contentType: string) {
    this.mimeType.set(contentType);
    this.previewBlob.set(blob);

    // Check if this file type is supported for preview
    if (!this.isSupportedFileType(contentType)) {
      this.supportedForPreview.set(false);
      this.error.set('Preview not available for this file type');
      return;
    }

    // For text content, wrap in HTML with black text styling
    if (contentType.includes('text') && !contentType.includes('html')) {
      blob.text().then(text => {
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {
  margin: 20px;
  font-family: monospace;
  color: black;
  background-color: white;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>
</head>
<body>${this.escapeHtml(text)}</body>
</html>`;
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(htmlBlob);
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl));
      }).catch(() => {
        const blobUrl = URL.createObjectURL(blob);
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl));
      });
    } else {
      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob);
      if (contentType.includes('image')) {
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustUrl(blobUrl));
      } else if (contentType.includes('pdf')) {
        // Hide PDF toolbar by appending viewer parameters
        const pdfUrl = blobUrl + '#toolbar=0&navpanes=0&pagemode=none';
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl));
      } else {
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl));
      }
    }
  }

  private isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/html',
      'text/css',
      'application/json',
      'application/xml',
      'text/xml'
    ];
    return supportedTypes.some(type => mimeType.includes(type));
  }

  getPreviewType(): 'pdf' | 'image' | 'text' | 'unknown' {
    const mime = this.mimeType();
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('image')) return 'image';
    if (mime.includes('text') || mime.includes('json') || mime.includes('xml')) return 'text';
    return 'unknown';
  }

  downloadFile() {
    const fileId = this.fileId();
    if (!fileId) return;

    this.documentsService.downloadDocument(fileId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.fileName() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error.set('Failed to download file');
        console.error('Download error:', err);
      }
    });
  }

  goBack() {
    const folderId = this.previousFolderId();
    if (folderId) {
      this.router.navigate(['/dashboard', folderId]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
