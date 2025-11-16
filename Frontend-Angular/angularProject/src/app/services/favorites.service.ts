import { Injectable, signal } from '@angular/core';

export interface FavoriteItem {
  id: string;
  name: string;
  kind: 'folder' | 'document';
  addedAt: string; // ISO timestamp
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly STORAGE_KEY = 'app_favorites';
  
  favorites = signal<FavoriteItem[]>([]);

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as FavoriteItem[];
        this.favorites.set(items);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      this.favorites.set([]);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favorites()));
    } catch (error) {
      console.error('Error persisting favorites:', error);
    }
  }

  addFavorite(item: Omit<FavoriteItem, 'addedAt'>): void {
    const favorites = this.favorites();
    const exists = favorites.some(f => f.id === item.id && f.kind === item.kind);
    
    if (!exists) {
      const updated = [...favorites, { ...item, addedAt: new Date().toISOString() }];
      this.favorites.set(updated);
      this.persist();
    }
  }

  removeFavorite(id: string, kind: 'folder' | 'document'): void {
    const updated = this.favorites().filter(f => !(f.id === id && f.kind === kind));
    this.favorites.set(updated);
    this.persist();
  }

  isFavorite(id: string, kind: 'folder' | 'document'): boolean {
    return this.favorites().some(f => f.id === id && f.kind === kind);
  }

  getFavorites(): FavoriteItem[] {
    return this.favorites();
  }

  clearFavorites(): void {
    this.favorites.set([]);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }
}
