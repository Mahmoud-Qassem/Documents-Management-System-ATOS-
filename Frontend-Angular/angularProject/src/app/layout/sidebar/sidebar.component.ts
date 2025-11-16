import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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
  isCollapsed = signal(true);
  isPinned = signal(false);
  expandedSection = signal<string | null>(null);

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

  constructor(private router: Router) {}

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
    this.expandedSection.update(v => v === sectionTitle ? null : sectionTitle);
  }

  isSectionExpanded(sectionTitle: string): boolean {
    return this.expandedSection() === sectionTitle && !this.isCollapsed();
  }

  navigate(item: NavItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    }
    if (item.action) {
      item.action();
    }
  }

  getSectionIcon(sectionTitle: string): string {
    if (sectionTitle === 'My Space') return 'pi-home';
    if (sectionTitle === 'Management') return 'pi-cog';
    return 'pi-folder';
  }
}
