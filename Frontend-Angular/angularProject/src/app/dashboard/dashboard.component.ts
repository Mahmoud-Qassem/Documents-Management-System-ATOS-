import { Component, HostListener, OnInit, signal, WritableSignal, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FoldersService, Folder } from '../services/folders.service';
import { DocumentsService, DocumentItem, PageResponse, SortDir, SortField } from '../services/documents.service';
import { DocumentSizePipe } from '../pipes/file-size.pipe';
import { ModalComponent } from '../shared/modal/modal.component';

interface Crumb { id: string | null; name: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentSizePipe, ModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('renameFolderInput') renameFolderInput?: ElementRef;
  @ViewChild('createFolderInput') createFolderInput?: ElementRef;
  @ViewChild('renameDocInput') renameDocInput?: ElementRef;
  @ViewChild('shareEmailInput') shareEmailInput?: ElementRef;
  // View mode
  viewMode = signal<'grid'|'list'>('grid');
  folderViewMode = signal<'grid'|'list'>('grid');
  docsFilterOpen = signal(false);

  // Themed modal states
  renameFolderTarget: WritableSignal<Folder | null> = signal(null);
  renameName = signal('');
  confirmDelete: WritableSignal<{ type: 'folder'|'document'; id: string; name: string } | null> = signal(null);
  shareTarget: WritableSignal<{ type: 'folder'|'document'; id: string; name: string } | null> = signal(null);
  shareEmail = signal('');

  // Custom dialogs
  createFolderOpen = signal(false);
  createFolderName = signal('');
  renameDocTarget: WritableSignal<DocumentItem | null> = signal(null);
  renameDocName = signal('');
  uploadDialogOpen = signal(false);
  uploadFile: WritableSignal<File | null> = signal(null);

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Auto-focus rename folder input when modal opens
    effect(() => {
      if (this.renameFolderTarget()) {
        setTimeout(() => {
          this.renameFolderInput?.nativeElement?.focus();
          this.renameFolderInput?.nativeElement?.select?.();
        }, 100);
      }
    });

    // Auto-focus create folder input when modal opens
    effect(() => {
      if (this.createFolderOpen()) {
        setTimeout(() => {
          this.createFolderInput?.nativeElement?.focus();
        }, 100);
      }
    });

    // Auto-focus rename doc input when modal opens
    effect(() => {
      if (this.renameDocTarget()) {
        setTimeout(() => {
          this.renameDocInput?.nativeElement?.focus();
          this.renameDocInput?.nativeElement?.select?.();
        }, 100);
      }
    });

    // Auto-focus share email input when modal opens
    effect(() => {
      if (this.shareTarget()) {
        setTimeout(() => {
          this.shareEmailInput?.nativeElement?.focus();
        }, 100);
      }
    });
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

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
    const withinFilter = target.closest('.search-field, .filter-panel, .search-filter');
    if (!withinMenu) {
      if (this.openMenuForId()) this.closeMenu();
      if (this.openDocMenuForId()) this.closeDocMenu();
    }
    if (!withinFilter && this.docsFilterOpen()) this.docsFilterOpen.set(false);
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

  // Upload dialog helpers
  openUploadDialog() {
    if (this.currentCrumb.id === null) return;
    this.uploadFile.set(null);
    this.uploadDialogOpen.set(true);
  }

  closeUploadDialog() {
    this.uploadDialogOpen.set(false);
    this.uploadFile.set(null);
  }

  onUploadFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    this.uploadFile.set(file || null);
  }

  confirmUpload() {
    const file = this.uploadFile();
    if (!file || this.currentCrumb.id === null) { this.closeUploadDialog(); return; }
    this.loadingDocs.set(true);
    this.docsApi.uploadDocument(this.currentCrumb.id, file).subscribe({
      next: () => {
        this.closeUploadDialog();
        this.fetchDocuments(this.currentCrumb.id!);
      },
      error: () => {
        this.loadingDocs.set(false);
        this.closeUploadDialog();
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
    this.confirmDelete.set({ type: 'folder', id: folder.id, name: folder.name });
  }

  updateFolder(folder: Folder) {
    this.renameFolderTarget.set(folder);
    this.renameName.set(folder.name);
    this.closeMenu();
  }

  openCreateFolderDialog() {
    this.createFolderName.set('');
    this.createFolderOpen.set(true);
  }

  submitCreateFolder() {
    const value = this.createFolderName().trim();
    if (!value) { this.createFolderOpen.set(false); return; }
    const parentId = this.currentCrumb.id;
    const path = this.buildPath();
    this.foldersApi.createFolder(value, parentId, path).subscribe({
      next: () => { this.createFolderOpen.set(false); this.loadActiveArea(); },
      error: () => { this.createFolderOpen.set(false); }
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
    return (doc.name || doc.title || doc.fileName || `Document ${doc.id}`)  +"."+ doc.type;
  }

  showDocDetails(doc: DocumentItem) {
    this.showDocDetailsFor.set(doc);
    this.closeDocMenu();
  }

  openRenameDocument(doc: DocumentItem) {
    const base = (doc.name || doc.title || doc.fileName || '').replace(/\.[^/.]+$/, '');
    this.renameDocTarget.set(doc);
    this.renameDocName.set(base || (doc.name || ''));
    this.closeDocMenu();
  }

  submitRenameDocument() {
    const target = this.renameDocTarget();
    const value = this.renameDocName().trim();
    if (!target) return;
    if (!value) { this.renameDocTarget.set(null); return; }
    this.docsApi.renameDocument(target.id, value).subscribe({
      next: () => { this.renameDocTarget.set(null); if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id); },
      error: () => { this.renameDocTarget.set(null); }
    });
  }

  deleteDocument(doc: DocumentItem) {
    this.confirmDelete.set({ type: 'document', id: doc.id, name: this.docDisplayName(doc) });
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

  setView(mode: 'grid'|'list') {
    this.viewMode.set(mode);
  }

  setFolderView(mode: 'grid'|'list') { this.folderViewMode.set(mode); }

  toggleDocsFilter() { this.docsFilterOpen.update(v => !v); }

  toggleSort(field: SortField) {
    const q = this.docsQuery();
    const dir: SortDir = q.sort === field ? (q.dir === 'asc' ? 'desc' : 'asc') : 'asc';
    this.docsQuery.set({ ...q, sort: field, dir, page: 0 });
    if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id);
  }

  submitRename() {
    const folder = this.renameFolderTarget();
    const value = this.renameName().trim();
    if (!folder || !value) { this.renameFolderTarget.set(null); return; }
    if (value === folder.name) { this.renameFolderTarget.set(null); return; }
    this.foldersApi.updateFolder(folder.id, { name: value }).subscribe({
      next: () => { this.renameFolderTarget.set(null); this.loadActiveArea(); },
      error: () => this.renameFolderTarget.set(null)
    });
  }

  confirmDeleteAction() {
    const data = this.confirmDelete();
    if (!data) return;
    if (data.type === 'folder') {
      this.foldersApi.deleteFolder(data.id).subscribe({
        next: () => { this.confirmDelete.set(null); this.loadActiveArea(); },
        error: () => this.confirmDelete.set(null)
      });
    } else {
      this.docsApi.deleteDocument(data.id).subscribe({
        next: () => { this.confirmDelete.set(null); if (this.currentCrumb.id) this.fetchDocuments(this.currentCrumb.id); },
        error: () => this.confirmDelete.set(null)
      });
    }
  }

  // Favorites persistence (localStorage)
  private addFavorite(entry: { kind: 'folder'|'document'; id: string; name: string }) {
    try {
      const raw = localStorage.getItem('favorites') || '[]';
      const list = JSON.parse(raw) as any[];
      if (!list.find(x => x.kind === entry.kind && x.id === entry.id)) list.push(entry);
      localStorage.setItem('favorites', JSON.stringify(list));
    } catch {}
  }

  addFolderToFavorites(folder: Folder) {
    this.addFavorite({ kind: 'folder', id: folder.id, name: folder.name });
    this.closeMenu();
  }

  addDocumentToFavorites(doc: DocumentItem) {
    this.addFavorite({ kind: 'document', id: doc.id, name: this.docDisplayName(doc) });
    this.closeDocMenu();
  }

  openShareFolder(folder: Folder) {
    this.shareTarget.set({ type: 'folder', id: folder.id, name: folder.name });
    this.shareEmail.set('');
  }

  openShareDocument(doc: DocumentItem) {
    this.shareTarget.set({ type: 'document', id: doc.id, name: this.docDisplayName(doc) });
    this.shareEmail.set('');
  }

  confirmShare() {
    const t = this.shareTarget();
    const email = this.shareEmail().trim();
    if (!t || !email) return;
    if (!this.isValidEmail(email)) return;
    console.log('Share', t, 'with', email);
    this.shareTarget.set(null);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
