import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FileShareService, PageResponse } from '../../services/file-share.service';
import { SharedUsersModalComponent } from '../../components/shared-users-modal/shared-users-modal.component';

export interface SharedByMeFile {
  id: string;
  name?: string;
  type?: string;
  size?: number;
  createdAt?: string | Date;
  sharedWithCount?: number;
}

@Component({
  selector: 'app-shared-by-me',
  standalone: true,
  imports: [CommonModule, SharedUsersModalComponent],
  templateUrl: './shared-by-me.page.html',
  styleUrls: ['./shared-by-me.page.scss']
})
export class SharedByMePage implements OnInit {
  files = signal<SharedByMeFile[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  currentPage = signal(0);
  pageSize = signal(20);
  totalPages = signal(0);
  
  showUsersModal = signal(false);
  selectedFileId = signal<string | null>(null);

  constructor(
    private shareService: FileShareService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSharedFiles();
  }

  loadSharedFiles(): void {
    this.loading.set(true);
    this.error.set(null);
    this.shareService.getFilesSharedByMe(this.currentPage(), this.pageSize()).subscribe({
      next: (response: PageResponse<any>) => {
        this.files.set(response.content.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          createdAt: f.createdAt,
          sharedWithCount: f.sharedWith?.length || 0
        } as SharedByMeFile)));
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load files shared by you');
        this.loading.set(false);
        console.error('Error loading shared files', err);
      }
    });
  }

  openUsersModal(file: SharedByMeFile): void {
    this.selectedFileId.set(file.id);
    this.showUsersModal.set(true);
  }

  closeUsersModal(): void {
    this.showUsersModal.set(false);
    this.selectedFileId.set(null);
  }

  onUsersModalClose(): void {
    this.closeUsersModal();
    this.loadSharedFiles();
  }

  previewFile(file: SharedByMeFile): void {
    if (file.id) {
      this.router.navigate(['/preview', file.id]);
    }
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
