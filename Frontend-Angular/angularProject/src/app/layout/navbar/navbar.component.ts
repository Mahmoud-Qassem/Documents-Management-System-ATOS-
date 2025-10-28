import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoggedIn = this.auth.authState;

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
