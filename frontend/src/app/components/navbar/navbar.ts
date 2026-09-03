import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BackButtonComponent } from '../back-button/back-button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatSidenavModule,
    MatTooltipModule,
    MatSnackBarModule,
    BackButtonComponent,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  mobileMenuOpen = false;
  unreadNotifications = 3;

  navLinks = [
    { label: 'Home', path: '/home' },
    { label: 'Search Policies', path: '/policy-search' },
    { label: 'Eligibility Checker', path: '/eligibility-checker' },
    { label: 'Compare', path: '/compare-policies' },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  logout(): void {

    const confirmed = window.confirm('Are you sure you want to log out?');

    if (!confirmed) {
      return;
    }

    this.authService.logout();
    this.router.navigate(['/login']);

    this.snackBar.open('Logout successful', 'Close', { duration: 3000 });

  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    // Policy Approval Workflow (Task 4): show the Approvals link only to
    // admins, reusing the existing navLinks-driven template as-is.
    const role = (this.authService.getRole() || '').toLowerCase();
    if (role === 'admin' || role === 'administrator') {
      this.navLinks = [...this.navLinks, { label: 'Policy Approvals', path: '/policy-approvals' }];
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  goToDashboard(): void {

    this.closeMobileMenu();

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const role = (this.authService.getRole() || '').toLowerCase();

    if (role === 'admin' || role === 'administrator') {
      this.router.navigate(['/admin-dashboard']);
    } else if (role === 'official') {
      this.router.navigate(['/government-dashboard']);
    } else {
      this.router.navigate(['/citizen-dashboard']);
    }

  }
}