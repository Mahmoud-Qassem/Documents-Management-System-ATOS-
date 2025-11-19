import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FileShareService, SharedFile, PageResponse, SharePermission } from '../../services/file-share.service';
import { DocumentsService } from '../../services/documents.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

@Component({
  selector: 'app-shared-with-me',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shared-with-me.page.html',
  styleUrls: ['./shared-with-me.page.scss']
})
export class SharedWithMePage implements OnInit {
  files = signal<SharedFile[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  currentPage = signal(0);
  pageSize = signal(20);
  totalPages = signal(0);

  constructor(
    private shareService: FileShareService,
    private docsService: DocumentsService,
    private router: Router,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit(): void {
    this.loadSharedFiles();
  }

  loadSharedFiles(): void {
    this.loading.set(true);
    this.error.set(null);
    this.shareService.getFilesSharedWithMe(this.currentPage(), this.pageSize()).subscribe({
      next: (response: PageResponse<SharedFile>) => {
        this.files.set(response.content);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.errorHandler.getErrorMessage(err));
        this.loading.set(false);
        console.error('Error loading shared files', err);
      }
    });
  }

  previewFile(file: SharedFile): void {
    if (file.id) {
      this.router.navigate(['/preview', file.id]);
    }
  }

  downloadFile(file: SharedFile): void {
    if (file.id && file.permission === 'DOWNLOAD') {
      this.docsService.downloadDocument(file.id).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name || 'download';
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          this.error.set(null);
        },
        error: (err) => this.error.set(this.errorHandler.getErrorMessage(err))
      });
    }
  }

  canDownload(permission: SharePermission | undefined): boolean {
    return permission === 'DOWNLOAD';
  }

  setView(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadSharedFiles();
    }
  }

  getFileTypeIcon(type: string | undefined): string {
    if (!type) return 'pi-file';
    if (type.includes('pdf')) return 'pi-file-pdf';
    if (type.includes('image')) return 'pi-image';
    if (type.includes('video')) return 'pi-video';
    if (type.includes('audio')) return 'pi-volume-up';
    return 'pi-file';
  }
}
