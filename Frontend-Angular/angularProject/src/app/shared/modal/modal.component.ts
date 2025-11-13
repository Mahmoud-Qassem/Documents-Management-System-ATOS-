import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="app-modal-overlay" [class.open]="visible" (click)="onOverlayClick($event)" role="dialog" [attr.aria-hidden]="!visible">
    <div class="app-modal" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="btn-icon" aria-label="Close" (click)="close.emit()"><i class="pi pi-times"></i></button>
      </div>
      <div class="modal-body">
        <ng-content></ng-content>
      </div>
      <div class="modal-footer" *ngIf="showFooter">
        <button class="btn secondary" (click)="close.emit()">Cancel</button>
        <button class="btn primary" (click)="confirm.emit()">OK</button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .btn-icon {
      background: transparent;
      border: 0;
      padding: 6px;
      cursor: pointer;
      color: var(--accent);
      transition: all var(--transition-normal) var(--easing-ease);
    }

    .btn-icon:hover {
      color: var(--accent-strong);
      transform: scale(1.1);
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.95rem;
      transition: all var(--transition-normal) var(--easing-ease);
    }

    .btn.primary {
      background: var(--pill-accent);
      color: white;
    }

    .btn.primary:hover {
      background: var(--accent-strong);
      box-shadow: 0 4px 12px rgba(124, 45, 18, 0.3);
      transform: translateY(-2px);
    }

    .btn.primary:active {
      transform: translateY(0);
    }

    .btn.secondary {
      background: var(--surface-muted);
      color: var(--text-main);
      border: 1px solid var(--surface-muted);
    }

    .btn.secondary:hover {
      background: var(--surface-card);
      border-color: var(--surface-muted);
      transform: translateY(-2px);
    }

    .btn.secondary:active {
      transform: translateY(0);
    }

    .modal-title {
      margin: 0;
      font-size: 1.05rem;
      color: var(--text-main);
    }
  `]
})
export class ModalComponent{
  @Input() visible = false;
  @Input() title = '';
  @Input() showFooter = true;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  onOverlayClick(e:Event){
    this.close.emit();
  }
}
