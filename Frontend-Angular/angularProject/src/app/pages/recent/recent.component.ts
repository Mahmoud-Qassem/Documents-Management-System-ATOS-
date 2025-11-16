import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecentService, RecentItem } from '../../services/recent.service';
import { FoldersService, Folder } from '../../services/folders.service';
import { DocumentsService, DocumentItem } from '../../services/documents.service';
import { DocumentSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-recent',
  standalone: true,
  imports: [CommonModule, DocumentSizePipe],
  templateUrl: './recent.component.html',
  styleUrls: ['./recent.component.scss']
})
export class RecentComponent implements OnInit {
  recentItems = signal<RecentItem[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');

  constructor(
    private recentService: RecentService,
    private foldersService: FoldersService,
    private docsService: DocumentsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRecent();
  }

  loadRecent(): void {
    const items = this.recentService.getRecent();
    this.recentItems.set(items);
  }

  openItem(item: RecentItem): void {
    if (item.kind === 'folder') {
      this.router.navigate(['/dashboard', item.id]);
    } else {
      this.router.navigate(['/preview', item.id]);
    }
  }

  downloadItem(item: RecentItem): void {
    if (item.kind === 'document') {
      this.docsService.downloadDocument(item.id).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
        error: () => this.error.set('Failed to download file')
      });
    } else {
      const downloadUrl = this.foldersService.getDownloadUrl(item.id);
      window.open(downloadUrl, '_blank');
    }
  }

  setView(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  getItemIcon(item: RecentItem): string {
    return item.kind === 'folder' ? 'pi-folder' : 'pi-file';
  }

  getItemDisplayName(item: RecentItem): string {
    return item.name;
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear all recent items? This action cannot be undone.')) {
      this.recentService.clearRecent();
      this.loadRecent();
    }
  }
}
