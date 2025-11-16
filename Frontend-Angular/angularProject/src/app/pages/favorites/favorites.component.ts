import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService, FavoriteItem } from '../../services/favorites.service';
import { FoldersService } from '../../services/folders.service';
import { DocumentsService } from '../../services/documents.service';
import { DocumentSizePipe } from '../../pipes/file-size.pipe';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, DocumentSizePipe],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  favorites = signal<FavoriteItem[]>([]);
  viewMode = signal<'grid' | 'list'>('grid');
  error = signal<string | null>(null);

  constructor(
    private favoritesService: FavoritesService,
    private foldersService: FoldersService,
    private docsService: DocumentsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    const items = this.favoritesService.getFavorites();
    this.favorites.set(items);
  }

  openItem(item: FavoriteItem): void {
    if (item.kind === 'folder') {
      this.router.navigate(['/dashboard', item.id]);
    } else {
      this.router.navigate(['/preview', item.id]);
    }
  }

  removeFavorite(item: FavoriteItem, event: Event): void {
    event.stopPropagation();
    this.favoritesService.removeFavorite(item.id, item.kind);
    this.loadFavorites();
  }

  downloadItem(item: FavoriteItem, event: Event): void {
    event.stopPropagation();
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

  getItemIcon(item: FavoriteItem): string {
    return item.kind === 'folder' ? 'pi-folder' : 'pi-file';
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear all favorites? This action cannot be undone.')) {
      this.favoritesService.clearFavorites();
      this.loadFavorites();
    }
  }
}
