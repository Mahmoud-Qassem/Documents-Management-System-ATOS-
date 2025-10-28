import { Component, HostListener, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoldersService, Folder } from '../services/folders.service';
import { DocumentsService, DocumentItem } from '../services/documents.service';

interface Crumb { id: number | string | null; name: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Navigation state
  pathStack: WritableSignal<Crumb[]> = signal([{ id: null, name: 'My Drive' }]);

  // Active area state
  folders: WritableSignal<Folder[] | null> = signal(null);
  loadingFolders = signal(false);
  foldersError = signal<string | null>(null);

  documents = signal<DocumentItem[] | null>(null);
  loadingDocs = signal(false);
  docsError = signal<string | null>(null);

  // UI state
  ownerMap: WritableSignal<Record<string, string>> = signal({});
  openMenuForId: WritableSignal<number | string | null> = signal(null);
  showDetailsFor: WritableSignal<Folder | null> = signal(null);

  constructor(private foldersApi: FoldersService, private docsApi: DocumentsService) {}

  ngOnInit(): void {
    this.loadActiveArea();
  }

  get currentCrumb(): Crumb {
    const stack = this.pathStack();
    return stack[stack.length - 1];
  }

  // Close folder action menu if clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const withinMenu = target.closest('.menu-panel, .item-menu');
    if (!withinMenu && this.openMenuForId()) {
      this.closeMenu();
    }
  }

  // Load folders and documents for the current folder (or root)
  loadActiveArea() {
    const current = this.currentCrumb;
    this.fetchFolders(current.id);
    if (current.id !== null) {
      this.fetchDocuments(current.id);
    } else {
      this.documents.set([]);
      this.loadingDocs.set(false);
      this.docsError.set(null);
    }
  }

  fetchFolders(parentId: number | string | null) {
    this.loadingFolders.set(true);
    this.foldersError.set(null);
    const req$ = parentId === null ? this.foldersApi.getFolders() : this.foldersApi.getSubfolders(parentId);
    req$.subscribe({
      next: (list) => {
        const folders = list || [];
        this.folders.set(folders);
        this.loadingFolders.set(false);
        // fetch owners in background
        folders.forEach(f => this.loadOwner(f.id));
      },
      error: (err) => {
        this.foldersError.set('Seems like the Server is down : (');
        this.loadingFolders.set(false);
      }
    });
  }

  fetchDocuments(folderId: number | string) {
    this.loadingDocs.set(true);
    this.docsError.set(null);
    this.docsApi.getDocuments(folderId).subscribe({
      next: (items) => {
        this.documents.set(items || []);
        this.loadingDocs.set(false);
      },
      error: (err) => {
        this.docsError.set('Seems like the Server is down : (');
        this.loadingDocs.set(false);
      }
    });
  }

  openFolder(folder: Folder) {
    const stack = this.pathStack();
    this.pathStack.set([...stack, { id: folder.id, name: folder.name }]);
    this.loadActiveArea();
  }

  navigateToCrumb(index: number) {
    const stack = this.pathStack();
    this.pathStack.set(stack.slice(0, index + 1));
    this.loadActiveArea();
  }

  private loadOwner(folderId: number | string) {
    const key = String(folderId);
    const map = this.ownerMap();
    if (map[key]) return; // cache hit
    this.foldersApi.getOwner(folderId).subscribe({
      next: (res) => {
        this.ownerMap.set({ ...this.ownerMap(), [key]: res.ownerName });
      },
      error: () => {}
    });
  }

  // Folder item actions
  toggleMenu(folderId: number | string) {
    this.openMenuForId.set(this.openMenuForId() === folderId ? null : folderId);
  }

  closeMenu() {
    this.openMenuForId.set(null);
  }

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
      error: () => {
        this.closeMenu();
      }
    });
  }

  addFolder() {
    const name = window.prompt('Folder name:');
    if (!name) return;
    const parentId = this.currentCrumb.id;
    this.foldersApi.createFolder(name.trim(), parentId).subscribe({
      next: () => this.loadActiveArea(),
      error: () => {}
    });
  }

  addDocument() {
    const name = window.prompt('Document name:');
    if (!name) return;
    const type = window.prompt('Document type:');
    if (!type) return;
    const folderId = this.currentCrumb.id;
    if (folderId === null) return; // documents only inside a folder
    this.docsApi.createDocument(name.trim(), type.trim(), folderId).subscribe({
      next: () => this.fetchDocuments(folderId),
      error: () => {}
    });
  }

  docDisplayName(doc: DocumentItem) {
    return doc.name || doc.title || doc.fileName || `Document ${doc.id}`;
  }
}
