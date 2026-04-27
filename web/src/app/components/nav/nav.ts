import { Component, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class NavComponent {
  query = '';
  menuOpen = signal(false);

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

  get currentPath(): string {
    return this.router.url;
  }

  isActive(path: string): boolean {
    return this.currentPath === path || this.currentPath.startsWith(path + '/') || this.currentPath.startsWith(path + '?');
  }

  handleSearch(e: Event) {
    e.preventDefault();
    if (this.query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.query.trim() } });
    } else {
      this.router.navigate(['/search']);
    }
  }

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  goTo(path: string) {
    this.router.navigate([path]);
    this.closeMenu();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeMenu();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.nav-user-menu')) {
      this.menuOpen.set(false);
    }
  }
}
