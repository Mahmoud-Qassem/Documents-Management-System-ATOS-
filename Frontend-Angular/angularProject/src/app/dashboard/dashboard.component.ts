import { Component, HostListener, OnInit, signal, WritableSignal, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FoldersService, Folder, SearchCriteria } from '../services/folders.service';
import { DocumentsService, DocumentItem, PageResponse, SortDir, SortField } from '../services/documents.service';
import { DocumentSizePipe } from '../pipes/file-size.pipe';
import { ModalComponent } from '../shared/modal/modal.component';
import { RecentService } from '../services/recent.service';
import { DownloadsService } from '../services/downloads.service';
import { FavoritesService } from '../services/favorites.service';
import { FileShareService, SharePermission } from '../services/file-share.service';

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
  binViewMode = signal<'grid'|'list'>('grid');
  docsFilterOpen = signal(false);
  binFilterOpen = signal(false);

  // Global search state
  globalSearchQuery = signal('');
  globalSearchBy = signal<'name'|'type'>('name');
  globalFilterOpen = signal(false);

  // Menu bar states
  addNewOpen = signal(false);
  viewMenuOpen = signal(false);
  sortMenuOpen = signal(false);
  pageSizeMenuOpen = signal(false);
  customPageSizeInput = signal('');

  // Folder sort state (used for loading all folders)
  folderSortField = signal<SortField>('name');
  folderSortDir = signal<SortDir>('asc');

  // Preset page sizes
  pagePresets = [2, 4, 8, 16, 32, 64];

  // Themed modal states
  renameFolderTarget: WritableSignal<Folder | null> = signal(null);
  renameName = signal('');
  confirmDelete: WritableSignal<{ type: 'folder'|'document'; id: string; name: string } | null> = signal(null);
  confirmPermanentDelete: WritableSignal<{ type: 'folder'|'document'; id: string; name: string } | null> = signal(null);
  shareTarget: WritableSignal<{ type: 'folder'|'document'; id: string; name: string } | null> = signal(null);
  shareEmail = signal('');
  sharePermission = signal<SharePermission>('READ');

  // Custom dialogs
  createFolderOpen = signal(false);
  createFolderName = signal('');
  renameDocTarget: WritableSignal<DocumentItem | null> = signal(null);
  renameDocName = signal('');
  uploadDialogOpen = signal(false);
  uploadFile: WritableSignal<File | null> = signal(null);
  uploadProgress = signal(0);
  uploading = signal(false);

  // States
  pathStack: WritableSignal<Crumb[]> = signal([{ id: null, name: 'My Drive' }]);
  folders: WritableSignal<Folder[] | null> = signal(null);
  loadingFolders = signal(false);
  foldersError = signal<string | null>(null);

  files = signal<DocumentItem[] | null>(null);
  loadingDocs = signal(false);
  docsError = signal<string | null>(null);

  // Combined pagination/sort/search state (folders + files)
  combinedQuery = signal<{ keyword: string; searchBy: 'name'|'type'; sort: SortField; dir: SortDir; page: number; size: number }>({
    keyword: '',
    searchBy: 'name',
    sort: 'name',
    dir: 'asc',
    page: 0,
    size: 10
  });

  // All folders and documents data (for combined pagination)
  allFolders: WritableSignal<Folder[]> = signal([]);
  allDocuments: WritableSignal<DocumentItem[]> = signal([]);
  combinedItems: WritableSignal<(Folder | DocumentItem)[]> = signal([]);
  totalCombinedPages = signal(0);
  loadingCombined = signal(false);
  combinedError = signal<string | null>(null);

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
    private cdr: ChangeDetectorRef,
    private recentService: RecentService,
    private downloadsService: DownloadsService,
    private favoritesService: FavoritesService,
    private shareService: FileShareService
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
            const currentPath = this.pathStack();
            const lastCrumb = currentPath[currentPath.length - 1];
            if (lastCrumb.id !== f.id) {
              this.pathStack.update((cp) => [...cp, { id: f.id, name: f.name }]);
            }
            this.loadActiveArea();
          },
          error: () => {
            const currentPath = this.pathStack();
            const lastCrumb = currentPath[currentPath.length - 1];
            if (lastCrumb.id !== folderId) {
              this.pathStack.update((cp) => [...cp, { id: folderId, name: 'Folder' }]);
            }
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

  isFolder(item: any): item is Folder {
    return item && !item.type && 'ownerName' in item;
  }

  isDocument(item: any): item is DocumentItem {
    return item && 'type' in item;
  }

  isFolderFavorited(folder: Folder): boolean {
    return this.favoritesService.isFavorite(folder.id, 'folder');
  }

  isDocumentFavorited(doc: DocumentItem): boolean {
    return this.favoritesService.isFavorite(doc.id, 'document');
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
    this.loadCombinedItems(current.id);
  }

  loadCombinedItems(parentId: string | null) {
    this.loadingCombined.set(true);
    this.combinedError.set(null);
    this.folders.set([]);
    this.files.set([]);

    // Fetch all folders with search filtering
    const folderSearchCriteria: SearchCriteria = {
      folderId: parentId || 'root',
      deleted: false,
      page: 0,
      size: 1000,
      sort: this.combinedQuery().sort,
      dir: this.combinedQuery().dir
    };

    // Apply search keyword to folders if searching by name
    const q = this.combinedQuery();
    if (q.keyword && q.searchBy === 'name') {
      folderSearchCriteria.name = q.keyword;
    }

    let foldersLoaded = false;
    let docsLoaded = false;

    this.foldersApi.searchFolders(folderSearchCriteria).subscribe({
      next: (page) => {
        this.allFolders.set(page.content || []);
        foldersLoaded = true;
        if (docsLoaded) this.processCombinedItems();
      },
      error: (err) => {
        console.error('Error loading folders:', err);
        this.allFolders.set([]);
        foldersLoaded = true;
        if (docsLoaded) this.processCombinedItems();
      },
    });

    // Fetch all documents (only if not in root)
    if (parentId !== null) {
      const docsParams: any = {
        folderId: parentId,
        deleted: false,
        page: 0,
        size: 1000,
        sort: this.combinedQuery().sort,
        dir: this.combinedQuery().dir
      };
      const q = this.combinedQuery();
      if (q.keyword) {
        if (q.searchBy === 'name') docsParams.name = q.keyword;
        else if (q.searchBy === 'type') docsParams.type = q.keyword;
      }

      this.docsApi.searchDocuments(docsParams).subscribe({
        next: (page) => {
          this.allDocuments.set(page?.content || []);
          docsLoaded = true;
          if (foldersLoaded) this.processCombinedItems();
        },
        error: () => {
          this.allDocuments.set([]);
          docsLoaded = true;
          if (foldersLoaded) this.processCombinedItems();
        }
      });
    } else {
      docsLoaded = true;
      this.allDocuments.set([]);
      if (foldersLoaded) this.processCombinedItems();
    }
  }

  private processCombinedItems() {
    const folders = this.allFolders();
    const docs = this.allDocuments();
    const combined = [...folders, ...docs];
    const q = this.combinedQuery();
    const pageSize = q.size;
    const pageNum = q.page;

    // Calculate total pages based on combined list
    const totalPages = Math.ceil(combined.length / pageSize) || 1;
    this.totalCombinedPages.set(totalPages);

    // Get items for current page
    const startIdx = pageNum * pageSize;
    const endIdx = startIdx + pageSize;
    const pageItems = combined.slice(startIdx, endIdx);

    this.combinedItems.set(pageItems);

    // Update folders and files signals separately for template binding
    this.folders.set(pageItems.filter(item => this.isFolder(item)) as Folder[]);
    this.files.set(pageItems.filter(item => this.isDocument(item)) as DocumentItem[]);

    this.loadingCombined.set(false);
    this.loadingFolders.set(false);
    this.loadingDocs.set(false);
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
    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.docsApi.uploadDocumentWithProgress(this.currentCrumb.id, file).subscribe({
      next: (event) => {
        if (typeof event === 'number') {
          this.uploadProgress.set(event);
        } else if (event.type === 4) {
          this.closeUploadDialog();
          this.loadCombinedItems(this.currentCrumb.id!);
          this.uploading.set(false);
          this.uploadProgress.set(0);
        }
      },
      error: () => {
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.closeUploadDialog();
      }
    });
  }



  listPages(total: number): number[] {
    const n = Math.max(0, total || 0);
    return Array.from({ length: n }, (_, i) => i);
  }

  onCombinedSearch() {
    this.combinedQuery.update((s) => ({ ...s, page: 0 }));
    this.loadCombinedItems(this.currentCrumb.id);
  }

  onCombinedKeywordChange(value: string) {
    this.combinedQuery.update((s) => ({ ...s, keyword: value }));
  }

  onCombinedSearchByChange(value: 'name'|'type') {
    this.combinedQuery.update((s) => ({ ...s, searchBy: value }));
  }

  clearCombinedSearch() {
    this.combinedQuery.update((s) => ({ ...s, keyword: '', page: 0 }));
    this.loadCombinedItems(this.currentCrumb.id);
  }

  onCombinedSortChange(field: SortField) {
    this.combinedQuery.update((s) => ({ ...s, sort: field, page: 0 }));
    this.loadCombinedItems(this.currentCrumb.id);
  }

  onCombinedDirChange(dir: SortDir) {
    this.combinedQuery.update((s) => ({ ...s, dir, page: 0 }));
    this.loadCombinedItems(this.currentCrumb.id);
  }

  onCombinedSizeChange(size: number) {
    this.combinedQuery.update((s) => ({ ...s, size, page: 0 }));
    this.loadCombinedItems(this.currentCrumb.id);
  }

  goToCombinedPage(idx: number) {
    this.combinedQuery.update((s) => ({ ...s, page: idx }));
    this.loadCombinedItems(this.currentCrumb.id);
  }

  openFolder(folder: Folder) {
    if (this.inRecycleBin()) return;
    this.recentService.addVisit({
      id: folder.id,
      name: folder.name,
      kind: 'folder',
      size: folder.size
    });
    this.router.navigate(['/dashboard', folder.id]);
  }

  navigateToCrumb(index: number) {
    const stack = this.pathStack();
    const target = stack[index];
    this.pathStack.set(stack.slice(0, index + 1));
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

    const deletedFoldersCriteria: SearchCriteria = {
      deleted: true,
      folderId: 'root',
      page: 0,
      size: this.combinedQuery().size,
      sort: this.folderSortField(),
      dir: this.folderSortDir()
    };

    this.foldersApi.searchFolders(deletedFoldersCriteria).subscribe({
      next: (page) => this.deletedFolders.set(page.content || []),
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
    this.confirmPermanentDelete.set({
      type: 'folder',
      id: folder.id,
      name: folder.name
    });
  }

  confirmPermanentDeleteAction() {
    const target = this.confirmPermanentDelete();
    if (!target) return;

    if (target.type === 'folder') {
      this.foldersApi.deleteFolderHard(target.id).subscribe({
        next: () => {
          this.loadDeletedItems();
          this.confirmPermanentDelete.set(null);
        },
        error: () => { }
      });
    } else {
      this.docsApi.deleteDocumentHard(target.id).subscribe({
        next: () => {
          this.loadDeletedItems();
          this.confirmPermanentDelete.set(null);
        },
        error: () => { }
      });
    }
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
      next: () => { this.renameDocTarget.set(null); this.loadCombinedItems(this.currentCrumb.id); },
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
    this.confirmPermanentDelete.set({
      type: 'document',
      id: doc.id,
      name: this.docDisplayName(doc)
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
        this.downloadsService.trackDownload({
          id: doc.id,
          name: this.docDisplayName(doc),
          size: doc.size,
          type: doc.type
        });
      },
      error: () => { }
    });
    this.closeDocMenu();
  }

  previewDocument(doc: DocumentItem) {
    this.router.navigate(['/preview', doc.id], {
      state: { folderId: this.currentCrumb.id }
    });
    this.closeDocMenu();
  }

  setView(mode: 'grid'|'list') {
    this.viewMode.set(mode);
  }

  setFolderView(mode: 'grid'|'list') { this.folderViewMode.set(mode); }

  setBinView(mode: 'grid'|'list') { this.binViewMode.set(mode); }

  toggleBinFilter() {
    this.binFilterOpen.update((v) => !v);
  }

  toggleDocsFilter() { this.docsFilterOpen.update(v => !v); }

  toggleSort(field: SortField) {
    const q = this.combinedQuery();
    const dir: SortDir = q.sort === field ? (q.dir === 'asc' ? 'desc' : 'asc') : 'asc';
    this.combinedQuery.set({ ...q, sort: field, dir, page: 0 });
    this.loadCombinedItems(this.currentCrumb.id);
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
        next: () => { this.confirmDelete.set(null); this.loadCombinedItems(this.currentCrumb.id); },
        error: () => this.confirmDelete.set(null)
      });
    }
  }

  // Favorites using service
  toggleFolderFavorite(folder: Folder) {
    if (this.isFolderFavorited(folder)) {
      this.favoritesService.removeFavorite(folder.id, 'folder');
    } else {
      this.favoritesService.addFavorite({ kind: 'folder', id: folder.id, name: folder.name });
    }
    this.closeMenu();
  }

  toggleDocumentFavorite(doc: DocumentItem) {
    if (this.isDocumentFavorited(doc)) {
      this.favoritesService.removeFavorite(doc.id, 'document');
    } else {
      this.favoritesService.addFavorite({ kind: 'document', id: doc.id, name: this.docDisplayName(doc) });
    }
    this.closeDocMenu();
  }

  openShareFolder(folder: Folder) {
    this.shareTarget.set({ type: 'folder', id: folder.id, name: folder.name });
    this.shareEmail.set('');
    this.sharePermission.set('READ');
  }

  openShareDocument(doc: DocumentItem) {
    this.shareTarget.set({ type: 'document', id: doc.id, name: this.docDisplayName(doc) });
    this.shareEmail.set('');
    this.sharePermission.set('READ');
  }

  confirmShare() {
    const t = this.shareTarget();
    const email = this.shareEmail().trim();
    if (!t || !email) return;
    if (!this.isValidEmail(email)) return;

    this.shareService.shareFile(t.id, {
      targetUserEmail: email,
      permission: this.sharePermission()
    }).subscribe({
      next: () => {
        this.shareTarget.set(null);
        this.shareEmail.set('');
        this.sharePermission.set('READ');
      },
      error: (err) => {
        console.error('Failed to share file', err);
        alert('Failed to share file. Please try again.');
      }
    });
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Global Search Methods
  onGlobalSearch() {
    const q = this.globalSearchQuery().trim();
    this.combinedQuery.update((s) => ({ ...s, keyword: q, searchBy: this.globalSearchBy(), page: 0 }));
    this.loadCombinedItems(this.currentCrumb.id);
  }

  onGlobalSearchChange(value: string) {
    this.globalSearchQuery.set(value);
  }

  onGlobalSearchByChange(value: 'name'|'type') {
    this.globalSearchBy.set(value);
  }

  clearGlobalSearch() {
    this.globalSearchQuery.set('');
    this.globalSearchBy.set('name');
    this.globalFilterOpen.set(false);
    this.combinedQuery.update((s) => ({ ...s, keyword: '', page: 0 }));
    this.loadActiveArea();
  }

  toggleGlobalFilter() {
    this.globalFilterOpen.update((v) => !v);
  }


  // Menu Bar Methods
  toggleAddNew() {
    this.addNewOpen.update((v) => !v);
    this.viewMenuOpen.set(false);
    this.sortMenuOpen.set(false);
    this.pageSizeMenuOpen.set(false);
  }

  toggleViewMenu() {
    this.viewMenuOpen.update((v) => !v);
    this.addNewOpen.set(false);
    this.sortMenuOpen.set(false);
    this.pageSizeMenuOpen.set(false);
  }

  toggleSortMenu() {
    this.sortMenuOpen.update((v) => !v);
    this.addNewOpen.set(false);
    this.viewMenuOpen.set(false);
    this.pageSizeMenuOpen.set(false);
  }

  togglePageSizeMenu() {
    this.pageSizeMenuOpen.update((v) => !v);
    this.addNewOpen.set(false);
    this.viewMenuOpen.set(false);
    this.sortMenuOpen.set(false);
  }

  // Unified View/Sort/PageSize Methods (apply to both folders and files)
  setAllView(mode: 'grid'|'list') {
    this.viewMode.set(mode);
    this.folderViewMode.set(mode);
  }

  getSortField(): SortField {
    return this.combinedQuery().sort;
  }

  getSortDir(): SortDir {
    return this.combinedQuery().dir;
  }

  getPageSize(): number {
    return this.combinedQuery().size;
  }

  onSortChange(field: SortField) {
    const currentSort = this.combinedQuery().sort;
    const currentDir = this.combinedQuery().dir;

    if (currentSort === field) {
      // Toggle direction if same field
      this.combinedQuery.update((q) => ({ ...q, dir: currentDir === 'asc' ? 'desc' : 'asc', page: 0 }));
    } else {
      this.combinedQuery.update((q) => ({ ...q, sort: field, dir: 'asc', page: 0 }));
    }

    this.folderSortField.set(field);
    this.folderSortDir.set(currentSort === field ? (currentDir === 'asc' ? 'desc' : 'asc') : 'asc');

    this.loadActiveArea();
  }

  setSortDir(dir: SortDir) {
    this.combinedQuery.update((q) => ({ ...q, dir, page: 0 }));
    this.folderSortDir.set(dir);
    this.loadActiveArea();
    // Don't close any menus when changing sort direction
  }

  setPageSize(size: number) {
    this.combinedQuery.update((q) => ({ ...q, size, page: 0 }));
    this.loadActiveArea();
  }

  setCustomPageSize() {
    const val = this.customPageSizeInput().trim();
    if (!val) return;
    const size = parseInt(val, 10);
    if (isNaN(size) || size < 1) return;
    this.customPageSizeInput.set('');
    this.setPageSize(size);
    this.pageSizeMenuOpen.set(false);
  }


  @HostListener('document:click')
  closeAllMenus() {
    const target = (event as MouseEvent).target as HTMLElement | null;
    if (!target) return;

    // Check if click is within any toolbar control group or dropdown menu
    const withinControlGroup = target.closest('.control-group');
    const withinAddNew = target.closest('.add-new-section');
    const withinDropdown = target.closest('.dropdown-menu');

    if (!withinControlGroup && !withinAddNew && !withinDropdown) {
      this.addNewOpen.set(false);
      this.sortMenuOpen.set(false);
      this.pageSizeMenuOpen.set(false);
    }

    if (!target.closest('.search-field, .filter-panel, .search-filter')) {
      this.globalFilterOpen.set(false);
    }

    // Close item context menus
    const withinItemMenu = target.closest('.item-menu, .menu-panel, .folder-menu-btn');
    if (!withinItemMenu) {
      this.openMenuForId.set(null);
      this.openDocMenuForId.set(null);
    }

    this.openRecycleBinMenuId.set(null);
  }
}
