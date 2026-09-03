import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * NavigationHistoryService
 * ----------------------------------------------------------------------
 * Backs a real Back button on every page. Uses genuine browser history
 * (Location.back()) rather than a fixed "return to dashboard" link, so
 * it goes to wherever the person actually came from.
 *
 * The one thing plain Location.back() can't tell you is whether there
 * IS an in-app page to go back to — if someone opens a page directly
 * (a bookmark, a fresh tab, a shared link), calling back() could exit
 * the app entirely or land on an unrelated page from browser history.
 * This service counts real in-app navigations so it knows the
 * difference, and falls back to the person's own dashboard
 * (Citizen/Official/Admin) when there's nowhere real to go back to.
 * ----------------------------------------------------------------------
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationHistoryService {

  private router = inject(Router);
  private location = inject(Location);
  private authService = inject(AuthService);

  private navigationCount = 0;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.navigationCount++;
      });
  }

  /**
   * True once the app has completed at least one real in-app navigation
   * beyond the page currently loaded — meaning there's a genuine
   * "previous page" for Location.back() to land on.
   */
  get canGoBack(): boolean {
    return this.navigationCount > 1;
  }

  goBack(): void {
    if (this.canGoBack) {
      this.location.back();
      return;
    }

    this.router.navigate([this.fallbackRoute()]);
  }

  private fallbackRoute(): string {
    const role = (this.authService.getRole() || '').toLowerCase();

    if (role === 'admin' || role === 'administrator') {
      return '/admin-dashboard';
    }
    if (role === 'official') {
      return '/government-dashboard';
    }
    if (role === 'citizen') {
      return '/citizen-dashboard';
    }

    // Not logged in / role unknown — safest fallback is the homepage.
    return '/';
  }
}