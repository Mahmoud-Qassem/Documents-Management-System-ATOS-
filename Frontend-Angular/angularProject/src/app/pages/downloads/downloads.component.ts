import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadsService, DownloadItem } from '../../services/downloads.service';
import { DocumentSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-downloads',
  standalone: true,
  imports: [CommonModule, DocumentSizePipe],
  templateUrl: './downloads.component.html',
  styleUrls: ['./downloads.component.scss']
})
export class DownloadsComponent implements OnInit {
  downloads = signal<DownloadItem[]>([]);
  viewMode = signal<'grid' | 'list'>('grid');

  constructor(private downloadsService: DownloadsService) {}

  ngOnInit(): void {
    this.loadDownloads();
  }

  loadDownloads(): void {
    const items = this.downloadsService.getDownloads();
    this.downloads.set(items);
  }

  clearDownloads(): void {
    if (confirm('Are you sure you want to clear all downloads?')) {
      this.downloadsService.clearDownloads();
      this.loadDownloads();
    }
  }

  removeDownload(item: DownloadItem): void {
    const items = this.downloads().filter(d => d.id !== item.id);
    this.downloads.set(items);
  }

  setView(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }
}
