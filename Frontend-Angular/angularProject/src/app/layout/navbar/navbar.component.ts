import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarStateService } from '../../services/sidebar-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private sidebarState = inject(SidebarStateService);

  isLoggedIn = this.auth.authState;
  userFullName = signal<string>('');
  isMobileSidebarOpen = this.sidebarState.isMobileSidebarOpen;
  isMobileMenuOpen = signal(false);

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.loadUserFullName();
    }
  }

  private loadUserFullName() {
    this.auth.getProfile().subscribe({
      next: (profile) => {
        this.userFullName.set(`${profile.firstName} ${profile.lastName}`);
      },
      error: () => {
        // Fallback to email if profile load fails
        this.userFullName.set(this.auth.getUserName() || '');
      }
    });
  }

  logout() {
    this.closeMobileMenu();
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  userName() {
    return this.auth.getUserName();
  }

  toggleSidebar() {
    this.sidebarState.toggleMobileSidebar();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
