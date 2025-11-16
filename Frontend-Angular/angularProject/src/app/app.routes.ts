import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { FilePreviewComponent } from './files/file-preview/file-preview.component';
import { RecentComponent } from './pages/recent/recent.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { DownloadsComponent } from './pages/downloads/downloads.component';
import { SharedWithMePage } from './pages/shared-with-me/shared-with-me.page';
import { SharedByMePage } from './pages/shared-by-me/shared-by-me.page';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Dashboard root (My Drive)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  // Dashboard recycle bin view
  { path: 'dashboard/bin', component: DashboardComponent, canActivate: [authGuard] },
  // Dashboard folder view by id
  { path: 'dashboard/:folderId', component: DashboardComponent, canActivate: [authGuard] },
  // Special views
  { path: 'recent', component: RecentComponent, canActivate: [authGuard] },
  { path: 'favorites', component: FavoritesComponent, canActivate: [authGuard] },
  { path: 'downloads', component: DownloadsComponent, canActivate: [authGuard] },
  { path: 'shared-with-me', component: SharedWithMePage, canActivate: [authGuard] },
  { path: 'shared-by-me', component: SharedByMePage, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  // File preview
  { path: 'preview/:fileId', component: FilePreviewComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
