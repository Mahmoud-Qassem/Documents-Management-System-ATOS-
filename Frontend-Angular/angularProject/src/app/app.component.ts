import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { ModalComponent } from './shared/modal/modal.component';
import { AuthService } from './services/auth.service';
import { SidebarStateService } from './services/sidebar-state.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, NavbarComponent, SidebarComponent, ModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angularProject';
  private sidebarState = inject(SidebarStateService);

  constructor(public authService: AuthService) {}

  isSidebarOpen() {
    return this.sidebarState.isMobileSidebarOpen();
  }

  closeSidebar() {
    this.sidebarState.closeMobileSidebar();
  }
}
