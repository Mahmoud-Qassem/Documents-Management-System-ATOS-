import { Component, HostListener, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FoldersService, Folder } from '../services/folders.service';
import { DocumentsService, DocumentItem, PageResponse, SortDir, SortField } from '../services/documents.service';
import { DocumentSizePipe } from '../pipes/file-size.pipe';

interface Crumb { id: string | null; name: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentSizePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // States
  pathStack: WritableSignal<Crumb[]> = signal([{ id: null, name: 'My Drive' }]);
  folders: WritableSignal<Folder[] | null> = signal(null);
  loadingFolders = signal(false);
  foldersError = signal<string | null>(null);

  files = signal<DocumentItem[] | null>(null);
  loadingDocs = signal(false);
  docsError = signal<string | null>(null);

  // Documents pagination/sort/search state
  docsQuery = signal<{ keyword: string; searchBy: 'name'|'type'; sort: SortField; dir: SortDir; page: number; size: number }>({
    keyword: '',
    searchBy: 'name',
    sort: 'name',
    dir: 'asc',
    page: 0,
    size: 10
  });
  docsPage: WritableSignal<PageResponse<DocumentItem> | null> = signal(null);

  openMenuForId: WritableSignal<string | null> = signal(null);
  showDetailsFor: WritableSignal<Folder | null> = signal(null);

  // Document menus/details
  openDocMenuForId: WritableSignal<string | null> = signal(null);
  showDocDetailsFor: WritableSignal<DocumentItem | null> = signal(null);

  // Recycle Bin state
  inRecycleBin = signal(false);
  deletedFolders: WritableSignal<Folder[] | null> = signal(null);
  deletedDocs: WritableSignal<DocumentItem[] | null> = signal(null);
  loadingDeleted = signal(false);
  deletedError = signal<string | null>(null);
  openRecycleBinMenuId = signal<string | null>(null);

  // Recycle Bin files pagination/sort/search state
  binQuery = signal<{ keyword: string; searchBy: 'name'|'type'; sort: SortField; dir: SortDir; page: number; size: number }>({
    keyword: '',
    searchBy: 'name',
    sort: 'name',
    dir: 'asc',
    page: 0,
    size: 10
  });
  binDocsPage: WritableSignal<PageResponse<DocumentItem> | null> = signal(null);

  constructor(
    private foldersApi: FoldersService,
    private docsApi: DocumentsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(async (params) => {
      const folderId = params.get('folderId');
      const isBin = this.router.url.includes('/dashboard/bin');

      this.openMenuForId.set(null);
      this.openDocMenuForId.set(null);
      this.showDetailsFor.set(null);
      this.showDocDetailsFor.set(null);

      if (isBin) {
        this.inRecycleBin.set(true);
        this.pathStack.set([{ id: null, name: 'Recycle Bin' }]);
        this.files.set([]);
        this.loadDeletedItems(); // updated
        return;
      }

      this.inRecycleBin.set(false);
      if (!folderId) {
        this.pathStack.set([{ id: null, name: 'My Drive' }]);
        this.loadActiveArea();
      } else {
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
    if (!withinMenu) {
      if (this.openMenuForId()) this.closeMenu();
      if (this.openDocMenuForId()) this.closeDocMenu();
    }
  }

  loadActiveArea() {
    if (this.inRecycleBin()) {
      this.loadDeletedItems();
      return;
    }

    const current = this.currentCrumb;
    this.fetchFolders(current.id);
    if (current.id !== null) this.fetchDocuments(current.id);
    else {
      this.files.set([]);
      this.docsPage.set({ content: [], totalPages: 0, totalElements: 0, size: this.docsQuery().size, number: 0 });
      this.loadingDocs.set(false);
      this.docsError.set(null);
    }
  }

  fetchFolders(parentId: string | null) {
    this.loadingFolders.set(true);
    this.foldersError.set(null);

    this.foldersApi.getFoldersByParentId(parentId).subscribe({
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

  triggerUpload(input: HTMLInputElement) {
    if (this.currentCrumb.id === null) return;
    input.value = '';
    input.click();
  }

  onDocumentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file || this.currentCrumb.id === null) return;

    this.loadingDocs.set(true);
    this.docsApi.uploadDocument(this.currentCrumb.id, file).subscribe({
      next: () => {
        this.fetchDocuments(this.currentCrumb.id!);
      },
      error: () => {
        this.loadingDocs.set(false);
      }
    });
  }

  fetchDocuments(folderId: string) {
    this.loadingDocs.set(true);
    this.docsError.set(null);
    const q = this.docsQuery();
    const params: any = { folderId, deleted: false, page: q.page, size: q.size, sort: q.sort, dir: q.dir };
    if (q.keyword) {
      if (q.searchBy === 'name') params.name = q.keyword;
      else if (q.searchBy === 'type') params.type = q.keyword;
    }

    this.docsApi.searchDocuments(params).subscribe({
      next: (page) => {
        this.docsPage.set(page);
        this.files.set(page?.content || []);
        this.loadingDocs.set(false);
      },
      error: () => {
        this.docsError.set('Failed to load files');
        this.loadingDocs.set(false);
      }
    });
  }

  listPages(total: number): number[] {
    const n = Math.max(0, total || 0);
    return Array.from({ length: n }, (_, i) => i);
  }

  onDocsSearch() {
    this.docsQuery.update((s) => ({ ...s, page: 0 }));
    if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
  }

  onDocsKeywordChange(value: string) {
    this.docsQuery.update((s) => ({ ...s, keyword: value }));
  }

  onDocsSearchByChange(value: 'name'|'type') {
    this.docsQuery.update((s) => ({ ...s, searchBy: value }));
  }

  clearDocsSearch() {
    this.docsQuery.update((s) => ({ ...s, keyword: '', page: 0 }));
    if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
  }

  onDocsSortChange(field: SortField) {
    this.docsQuery.update((s) => ({ ...s, sort: field, page: 0 }));
    if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
  }

  onDocsDirChange(dir: SortDir) {
    this.docsQuery.update((s) => ({ ...s, dir, page: 0 }));
    if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
  }

  onDocsSizeChange(size: number) {
    this.docsQuery.update((s) => ({ ...s, size, page: 0 }));
    if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
  }

  goToDocsPage(idx: number) {
    this.docsQuery.update((s) => ({ ...s, page: idx }));
    if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
  }

  openFolder(folder: Folder) {
    if (this.inRecycleBin()) return;
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

  toggleDocMenu(docId: string) {
    this.openDocMenuForId.set(this.openDocMenuForId() === docId ? null : docId);
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
    this.openDocMenuForId.set(null);
  }

  closeMenu() {
    this.openMenuForId.set(null);
  }

  closeDocMenu() {
    this.openDocMenuForId.set(null);
  }

  // Folder actions
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
        this.loadActiveArea();
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

  loadDeletedItems() {
    this.loadingDeleted.set(true);
    this.deletedError.set(null);

    let token: string | null = null;
    try {
      token = localStorage.getItem('jwt_token');
    } catch {}
    const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const ownerId = payload?.nationalId || payload?.sub || 'unknown';

    this.foldersApi.getDeletedFolders(ownerId).subscribe({
      next: (folders) => this.deletedFolders.set(folders || []),
      error: () => this.deletedError.set('Could not load deleted folders'),
    });

    const bq = this.binQuery();
    const params: any = { deleted: true, page: bq.page, size: bq.size, sort: bq.sort, dir: bq.dir };
    if (bq.keyword) {
      if (bq.searchBy === 'name') params.name = bq.keyword;
      else if (bq.searchBy === 'type') params.type = bq.keyword;
    }

    this.docsApi.searchDocuments(params).subscribe({
      next: (page) => {
        // If backend returned results, but user requested type-based search, ensure type filtering is applied client-side
        if (page && (page.content?.length || 0) > 0) {
          if (bq.keyword && bq.searchBy === 'type') {
            const key = bq.keyword.toLowerCase();
            const filtered = (page.content || []).filter(it => (it.type || '').toLowerCase().includes(key));
            const synthetic = {
              content: filtered,
              totalPages: 1,
              totalElements: filtered.length,
              size: filtered.length,
              number: 0
            } as PageResponse<DocumentItem>;
            this.binDocsPage.set(synthetic);
            this.deletedDocs.set(filtered);
            this.loadingDeleted.set(false);
            return;
          }

          // Otherwise use server page
          this.binDocsPage.set(page);
          this.deletedDocs.set(page.content || []);
          this.loadingDeleted.set(false);
          return;
        }

        // Backend returned empty result set: attempt broader fetch & client-side filtering (fallback)
        if (bq.keyword) {
          this.docsApi.getDeletedDocuments(ownerId, { page: 0, size: 1000, sort: bq.sort, dir: bq.dir }).subscribe({
            next: (fullPage) => {
              const all = fullPage?.content || [];
              const key = bq.keyword?.toLowerCase();
              const filtered = all.filter((it) => {
                if (bq.searchBy === 'name') return (it.name || it.title || it.fileName || '').toLowerCase().includes(key);
                if (bq.searchBy === 'type') return (it.type || '').toLowerCase().includes(key);
                return false;
              });
              const synthetic = {
                content: filtered,
                totalPages: 1,
                totalElements: filtered.length,
                size: filtered.length,
                number: 0
              } as PageResponse<DocumentItem>;

              this.binDocsPage.set(synthetic);
              this.deletedDocs.set(filtered);
              this.loadingDeleted.set(false);
            },
            error: () => {
              this.deletedError.set('Could not load deleted files');
              this.loadingDeleted.set(false);
            }
          });
          return;
        }

        // no keyword and nothing returned
        this.binDocsPage.set(page);
        this.deletedDocs.set(page?.content || []);
        this.loadingDeleted.set(false);
      },
      error: () => {
        this.deletedError.set('Could not load deleted files');
        this.loadingDeleted.set(false);
      },
    });
  }

  onBinSearch() {
    this.binQuery.update((s) => ({ ...s, page: 0 }));
    this.loadDeletedItems();
  }

  onBinKeywordChange(value: string) {
    this.binQuery.update((s) => ({ ...s, keyword: value }));
  }

  onBinSearchByChange(value: 'name'|'type') {
    this.binQuery.update((s) => ({ ...s, searchBy: value }));
  }

  clearBinSearch() {
    this.binQuery.update((s) => ({ ...s, keyword: '', page: 0 }));
    this.loadDeletedItems();
  }

  onBinSortChange(field: SortField) {
    this.binQuery.update((s) => ({ ...s, sort: field, page: 0 }));
    this.loadDeletedItems();
  }

  onBinDirChange(dir: SortDir) {
    this.binQuery.update((s) => ({ ...s, dir, page: 0 }));
    this.loadDeletedItems();
  }

  onBinSizeChange(size: number) {
    this.binQuery.update((s) => ({ ...s, size, page: 0 }));
    this.loadDeletedItems();
  }

  goToBinPage(idx: number) {
    this.binQuery.update((s) => ({ ...s, page: idx }));
    this.loadDeletedItems();
  }

  restoreFolder(folder: Folder) {
    this.foldersApi.restoreFolder(folder.id).subscribe({
      next: () => this.loadDeletedItems(),
      error: () => { }
    });
  }

  hardDeleteFolder(folder: Folder) {
    if (!window.confirm(`Permanently delete "${folder.name}"?`)) return;
    this.foldersApi.deleteFolderHard(folder.id).subscribe({
      next: () => this.loadDeletedItems(),
      error: () => { }
    });
  }

  // Document actions
  docDisplayName(doc: DocumentItem) {
    return doc.name || doc.title || doc.fileName || `Document ${doc.id}`;
  }

  showDocDetails(doc: DocumentItem) {
    this.showDocDetailsFor.set(doc);
    this.closeDocMenu();
  }

  deleteDocument(doc: DocumentItem) {
    this.docsApi.deleteDocument(doc.id).subscribe({
      next: () => {
        this.closeDocMenu();
        if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
      },
      error: () => this.closeDocMenu()
    });
  }

  restoreDocument(doc: DocumentItem) {
    this.docsApi.restoreDocument(doc.id).subscribe({
      next: () => this.loadDeletedItems(),
      error: () => { },
    });
  }

  hardDeleteDocument(doc: DocumentItem) {
    if (!window.confirm(`Permanently delete "${this.docDisplayName(doc)}"?`)) return;
    this.docsApi.deleteDocumentHard(doc.id).subscribe({
      next: () => this.loadDeletedItems(),
      error: () => { },
    });
  }

  downloadDocument(doc: DocumentItem) {
    this.docsApi.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.docDisplayName(doc);
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => { }
    });
  }
}
