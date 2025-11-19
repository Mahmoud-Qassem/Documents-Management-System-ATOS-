import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarStateService } from '../../services/sidebar-state.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  action?: () => void;
  children?: NavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private sidebarState = inject(SidebarStateService);
  private router = inject(Router);

  isCollapsed = signal(true);
  isPinned = signal(false);
  expandedSections = signal<Set<string>>(new Set(['My Space', 'Management']));
  isMobileSidebarOpen = this.sidebarState.isMobileSidebarOpen;

  sections: NavSection[] = [
    {
      title: 'My Space',
      items: [
        { label: 'My Drive', icon: 'pi-folder', route: '/dashboard' },
        { label: 'Shared With Me', icon: 'pi-inbox', route: '/shared-with-me' },
        { label: 'Shared By Me', icon: 'pi-send', route: '/shared-by-me' },
        { label: 'Favorites', icon: 'pi-star', route: '/favorites' },
        { label: 'Recent', icon: 'pi-history', route: '/recent' },
        { label: 'Downloads', icon: 'pi-download', route: '/downloads' }
      ]
    },
    {
      title: 'Management',
      items: [
        { label: 'Recycle Bin', icon: 'pi-trash', route: '/dashboard/bin' },
        { label: 'Archived', icon: 'pi-inbox', route: '/dashboard' },
        { label: 'Storage Usage', icon: 'pi-database', route: '/dashboard' }
      ]
    }
  ];


  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }

  togglePin() {
    this.isPinned.update(v => !v);
    if (this.isPinned()) {
      this.isCollapsed.set(false);
    }
  }

  toggleSection(sectionTitle: string) {
    if (this.isCollapsed()) return;
    // Always keep My Space and Management expanded
    if (sectionTitle === 'My Space' || sectionTitle === 'Management') {
      return;
    }
    this.expandedSections.update(sections => {
      const newSections = new Set(sections);
      if (newSections.has(sectionTitle)) {
        newSections.delete(sectionTitle);
      } else {
        newSections.add(sectionTitle);
      }
      return newSections;
    });
  }

  isSectionExpanded(sectionTitle: string): boolean {
    return this.expandedSections().has(sectionTitle) && !this.isCollapsed();
  }

  navigate(item: NavItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    }
    if (item.action) {
      item.action();
    }
    this.closeMobileSidebar();
  }

  closeMobileSidebar() {
    this.sidebarState.closeMobileSidebar();
  }

  getSectionIcon(sectionTitle: string): string {
    if (sectionTitle === 'My Space') return 'pi-home';
    if (sectionTitle === 'Management') return 'pi-cog';
    return 'pi-folder';
  }
}
