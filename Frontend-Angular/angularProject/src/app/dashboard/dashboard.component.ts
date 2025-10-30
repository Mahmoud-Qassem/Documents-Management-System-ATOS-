import { Component, HostListener, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FoldersService, Folder } from '../services/folders.service';
import { DocumentsService, DocumentItem } from '../services/documents.service';

interface Crumb { id: string | null; name: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // States
  pathStack: WritableSignal<Crumb[]> = signal([{ id: null, name: 'My Drive' }]);
  folders: WritableSignal<Folder[] | null> = signal(null);
  loadingFolders = signal(false);
  foldersError = signal<string | null>(null);

  documents = signal<DocumentItem[] | null>(null);
  loadingDocs = signal(false);
  docsError = signal<string | null>(null);

  openMenuForId: WritableSignal<string | null> = signal(null);
  showDetailsFor: WritableSignal<Folder | null> = signal(null);

  // Recycle Bin state
  inRecycleBin = signal(false);
  deletedFolders: WritableSignal<Folder[] | null> = signal(null);
  loadingDeleted = signal(false);
  deletedError = signal<string | null>(null);
  openRecycleBinMenuId = signal<string | null>(null);

  constructor(
    private foldersApi: FoldersService,
    private docsApi: DocumentsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // React to URL changes: /dashboard, /dashboard/bin, /dashboard/:folderId
    this.route.paramMap.subscribe(async (params) => {
      const folderId = params.get('folderId');
      const isBin = this.router.url.includes('/dashboard/bin');

      this.openMenuForId.set(null);
      this.showDetailsFor.set(null);

      if (isBin) {
        this.inRecycleBin.set(true);
        this.pathStack.set([{ id: null, name: 'Recycle Bin' }]);
        this.documents.set([]);
        this.loadDeletedFolders();
        return;
      }

      this.inRecycleBin.set(false);
      if (!folderId) {
        // Root
        this.pathStack.set([{ id: null, name: 'My Drive' }]);
        this.loadActiveArea();
      } else {
        // Load the selected folder as current crumb; best-effort fetch for name
        this.foldersApi.getFolderById(folderId).subscribe({
          next: (f) => {
            this.pathStack.update((currentPath) => [
              ...currentPath,
              { id: f.id, name: f.name }
            ]);
            this.loadActiveArea();
          },
          error: () => {
            this.pathStack.update((currentPath) => [
              ...currentPath,
              { id: folderId, name: 'Folder' }
            ]);
            this.loadActiveArea();
          }
        });
      }
    });
  }

  get currentCrumb(): Crumb {
    const stack = this.pathStack();
    return stack[stack.length - 1];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const withinMenu = target.closest('.menu-panel, .item-menu');
    if (!withinMenu && this.openMenuForId()) this.closeMenu();
  }

  loadActiveArea() {
    if (this.inRecycleBin()) {
      this.loadDeletedFolders();
      return;
    }

    const current = this.currentCrumb;
    this.fetchFolders(current.id);
    if (current.id !== null) this.fetchDocuments(current.id);
    else {
      this.documents.set([]);
      this.loadingDocs.set(false);
      this.docsError.set(null);
    }
  }

  fetchFolders(parentId: string | null) {
    this.loadingFolders.set(true);
    this.foldersError.set(null);

    const fetch$ = this.foldersApi.getFoldersByParentId(parentId);

    fetch$.subscribe({
      next: (list) => {
        this.folders.set(list);
        this.loadingFolders.set(false);
      },
      error: (err) => {
        console.error('Error loading folders:', err);
        this.foldersError.set('Failed to load folders');
        this.loadingFolders.set(false);
        this.folders.set([]);
      },
    });
  }

  addDocument() {
    window.alert('Add document feature not implemented yet.');
  }
  fetchDocuments(folderId: string) {
    this.loadingDocs.set(true);
    this.docsError.set(null);
    this.docsApi.getDocuments(folderId).subscribe({
      next: (items) => {
        this.documents.set(items || []);
        this.loadingDocs.set(false);
      },
      error: () => {
        this.docsError.set('Server seems down :(');
        this.loadingDocs.set(false);
      }
    });
  }

  openFolder(folder: Folder) {
    if (this.inRecycleBin()) return; // no navigation inside recycle bin
    // Navigate and let the route subscription rebuild state
    this.router.navigate(['/dashboard', folder.id]);
  }

  navigateToCrumb(index: number) {
    const stack = this.pathStack();
    const target = stack[index];
    this.inRecycleBin.set(false);
    if (!target.id) this.router.navigate(['/dashboard']);
    else this.router.navigate(['/dashboard', target.id]);
  }

  toggleMenu(folderId: string) {
    this.openMenuForId.set(this.openMenuForId() === folderId ? null : folderId);
  }

  toggleRecycleBinMenu(id: string) {
    if (this.openRecycleBinMenuId() === id) {
      this.openRecycleBinMenuId.set(null);
    } else {
      this.openRecycleBinMenuId.set(id);
    }
  }
  @HostListener('document:click')
  closeAllMenus() {
    this.openRecycleBinMenuId.set(null);
    this.openMenuForId.set(null);
  }
  closeMenu() {
    this.openMenuForId.set(null);
  }

  // Actions
  downloadFolder(folder: Folder) {
    const url = this.foldersApi.getDownloadUrl(folder.id);
    window.open(url, '_blank');
    this.closeMenu();
  }

  showDetails(folder: Folder) {
    this.showDetailsFor.set(folder);
    this.closeMenu();
  }

  deleteFolder(folder: Folder) {
    this.foldersApi.deleteFolder(folder.id).subscribe({
      next: () => {
        this.closeMenu();
        this.loadActiveArea();
      },
      error: () => this.closeMenu()
    });
  }
  updateFolder(folder: Folder) {
    const newName = window.prompt('Enter new folder name:', folder.name);
    if (!newName || newName.trim() === folder.name) return;

    const updatedData = { name: newName.trim() };

    this.foldersApi.updateFolder(folder.id, updatedData).subscribe({
      next: () => {
        this.openMenuForId.set(null);
        this.loadActiveArea(); // reload folders to reflect change
      },
      error: (err) => {
        console.error('Failed to rename folder:', err);
        this.openMenuForId.set(null);
      },
    });
  }

  addFolder() {
    const name = window.prompt('Folder name:');
    if (!name) return;

    const parentId = this.currentCrumb.id;
    const path = this.buildPath();

    this.foldersApi.createFolder(name.trim(), parentId, path).subscribe({
      next: () => this.loadActiveArea(),
      error: () => { }
    });
  }

  private buildPath(): string {
    return this.pathStack()
      .filter(c => c.id)
      .map(c => `${c.id}\\`)
      .join('');
  }

  // Recycle Bin logic
  openRecycleBin() {
    this.router.navigate(['/dashboard', 'bin']);
  }

  loadDeletedFolders() {
    this.loadingDeleted.set(true);
    this.deletedError.set(null);

    const token = localStorage.getItem('jwt_token');
    const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const ownerId = payload?.nationalId || payload?.sub || 'unknown';

    this.foldersApi.getDeletedFolders(ownerId).subscribe({
      next: (list) => {
        this.deletedFolders.set(list || []);
        this.loadingDeleted.set(false);
      },
      error: () => {
        this.deletedError.set('Could not load deleted folders');
        this.loadingDeleted.set(false);
      }
    });
  }

  restoreFolder(folder: Folder) {
    this.foldersApi.restoreFolder(folder.id).subscribe({
      next: () => this.loadDeletedFolders(),
      error: () => { }
    });
  }

  hardDeleteFolder(folder: Folder) {
    if (!window.confirm(`Permanently delete "${folder.name}"?`)) return;
    this.foldersApi.deleteFolderHard(folder.id).subscribe({
      next: () => this.loadDeletedFolders(),
      error: () => { }
    });
  }

  docDisplayName(doc: DocumentItem) {
    return doc.name || doc.title || doc.fileName || `Document ${doc.id}`;
  }
}
