import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoldersService, Folder } from '../services/folders.service';
import { DocumentsService, DocumentItem } from '../services/documents.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  folders: WritableSignal<Folder[] | null> = signal(null);
  loadingFolders = signal(false);
  foldersError = signal<string | null>(null);

  selectedFolder = signal<Folder | null>(null);
  documents = signal<DocumentItem[] | null>(null);
  loadingDocs = signal(false);
  docsError = signal<string | null>(null);

  constructor(private foldersApi: FoldersService, private docsApi: DocumentsService) {}

  ngOnInit(): void {
    this.fetchFolders();
  }

  fetchFolders() {
    this.loadingFolders.set(true);
    this.foldersError.set(null);
    this.foldersApi.getFolders().subscribe({
      next: (list) => {
        this.folders.set(list || []);
        this.loadingFolders.set(false);
      },
      error: (err) => {
        this.foldersError.set(err.message || 'Failed to load folders');
        this.loadingFolders.set(false);
      }
    });
  }

  openFolder(folder: Folder) {
    this.selectedFolder.set(folder);
    this.loadingDocs.set(true);
    this.docsError.set(null);
    this.documents.set(null);
    this.docsApi.getDocuments(folder.id).subscribe({
      next: (items) => {
        this.documents.set(items || []);
        this.loadingDocs.set(false);
      },
      error: (err) => {
        this.docsError.set(err.message || 'Failed to load documents');
        this.loadingDocs.set(false);
      }
    });
  }

  docDisplayName(doc: DocumentItem) {
    return doc.name || doc.title || doc.fileName || `Document ${doc.id}`;
  }
}
