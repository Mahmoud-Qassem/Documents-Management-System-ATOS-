import { Injectable, signal } from '@angular/core';

export interface RecentItem {
  id: string;
  name: string;
  kind: 'folder' | 'document';
  visitedAt: string; // ISO timestamp
  type?: string;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class RecentService {
  private readonly STORAGE_KEY = 'app_recent_items';
  private readonly MAX_RECENT = 10;
  
  recentItems = signal<RecentItem[]>([]);

  constructor() {
    this.loadRecent();
  }

  private loadRecent(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as RecentItem[];
        this.recentItems.set(items);
      }
    } catch (error) {
      console.error('Error loading recent items:', error);
      this.recentItems.set([]);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentItems()));
    } catch (error) {
      console.error('Error persisting recent items:', error);
    }
  }

  addVisit(item: Omit<RecentItem, 'visitedAt'>): void {
    const items = this.recentItems();
    const now = new Date().toISOString();
    
    // Remove if already exists
    const filtered = items.filter(it => !(it.id === item.id && it.kind === item.kind));
    
    // Add to front
    const updated = [{ ...item, visitedAt: now }, ...filtered].slice(0, this.MAX_RECENT);
    
    this.recentItems.set(updated);
    this.persist();
  }

  getRecent(): RecentItem[] {
    return this.recentItems();
  }

  clearRecent(): void {
    this.recentItems.set([]);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }
}
