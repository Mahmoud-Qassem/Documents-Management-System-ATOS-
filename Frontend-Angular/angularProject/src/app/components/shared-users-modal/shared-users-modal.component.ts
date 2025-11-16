import { Component, Input, Output, EventEmitter, OnInit, OnChanges, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileShareService, ShareRecord, SharePermission } from '../../services/file-share.service';

@Component({
  selector: 'app-shared-users-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shared-users-modal.component.html',
  styleUrls: ['./shared-users-modal.component.scss']
})
export class SharedUsersModalComponent implements OnInit, OnChanges {
  @Input() fileId: string | null = null;
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  shareRecords = signal<ShareRecord[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  editingEmail: WritableSignal<string | null> = signal(null);
  editingPermission: WritableSignal<SharePermission | null> = signal(null);

  constructor(private shareService: FileShareService) {}

  ngOnInit(): void {
    if (this.visible && this.fileId) {
      this.loadShareDetails();
    }
  }

  ngOnChanges(): void {
    if (this.visible && this.fileId) {
      this.loadShareDetails();
    }
  }

  loadShareDetails(): void {
    if (!this.fileId) return;
    this.loading.set(true);
    this.error.set(null);
    this.shareService.getShareDetails(this.fileId).subscribe({
      next: (records) => {
        this.shareRecords.set(records || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load share details');
        this.loading.set(false);
        console.error('Error loading share details', err);
      }
    });
  }

  startEditPermission(record: ShareRecord): void {
    this.editingEmail.set(record.email);
    this.editingPermission.set(record.permission);
  }

  cancelEdit(): void {
    this.editingEmail.set(null);
    this.editingPermission.set(null);
  }

  savePermission(): void {
    const email = this.editingEmail();
    const permission = this.editingPermission();
    if (!email || !permission || !this.fileId) return;

    this.shareService.updateSharePermission(this.fileId, email, permission).subscribe({
      next: () => {
        this.editingEmail.set(null);
        this.editingPermission.set(null);
        this.loadShareDetails();
      },
      error: (err) => {
        this.error.set('Failed to update permission');
        console.error('Error updating permission', err);
      }
    });
  }

  removeAccess(email: string): void {
    if (!this.fileId) return;
    if (!confirm(`Remove ${email} access to this file?`)) return;

    this.shareService.removeShareAccess(this.fileId, email).subscribe({
      next: () => {
        this.loadShareDetails();
      },
      error: (err) => {
        this.error.set('Failed to remove access');
        console.error('Error removing access', err);
      }
    });
  }

  closeModal(): void {
    this.editingEmail.set(null);
    this.editingPermission.set(null);
    this.close.emit();
  }

  getPermissionLabel(permission: SharePermission): string {
    return permission === 'READ' ? 'READ ONLY' : 'DOWNLOAD';
  }
}
