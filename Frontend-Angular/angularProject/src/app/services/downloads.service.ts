import { Injectable, signal } from '@angular/core';

export interface DownloadItem {
  id: string;
  name: string;
  downloadedAt: string; // ISO timestamp
  size?: number;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class DownloadsService {
  private readonly STORAGE_KEY = 'app_downloaded_items';
  
  downloads = signal<DownloadItem[]>([]);

  constructor() {
    this.loadDownloads();
  }

  private loadDownloads(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as DownloadItem[];
        this.downloads.set(items);
      }
    } catch (error) {
      console.error('Error loading downloads:', error);
      this.downloads.set([]);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.downloads()));
    } catch (error) {
      console.error('Error persisting downloads:', error);
    }
  }

  trackDownload(item: Omit<DownloadItem, 'downloadedAt'>): void {
    const items = this.downloads();
    const now = new Date().toISOString();
    
    // Remove if already exists and add to front
    const filtered = items.filter(it => it.id !== item.id);
    const updated = [{ ...item, downloadedAt: now }, ...filtered];
    
    this.downloads.set(updated);
    this.persist();
  }

  getDownloads(): DownloadItem[] {
    return this.downloads();
  }

  clearDownloads(): void {
    this.downloads.set([]);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }
}
