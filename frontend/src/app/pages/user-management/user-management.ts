import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
const ASSIGNABLE_ROLES = [
  'citizen', 'official', 'researcher', 'organization',
  'admin', 'administrator',
];
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  assignableRoles = ASSIGNABLE_ROLES;
  users: any[] = [];
  loading = true;
  error = '';
  // The logged-in admin's own user_id, so their row can be prevented
  // from self-deactivation in the UI too (the backend also blocks it,
  // but disabling the button here avoids a confusing error round-trip).
  currentUserId: number | null = null;
  searchTerm = '';
  roleFilter = '';
  // Tracks which user_id currently has a role-update or activate/
  // deactivate request in flight, so that row's controls can show a
  // busy state instead of allowing a second click mid-request.
  pendingUserId: number | null = null;
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadUsers();
  }
  loadCurrentUser(): void {
    this.authService.getMe().subscribe({
      next: (user: any) => {
        this.currentUserId = user.user_id;
      },
      error: () => {
        // Non-fatal — self-deactivation is still blocked server-side
        // even if this call fails, this just skips the extra UI guard.
      }
    });
  }
  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getUsers({
      role: this.roleFilter || undefined,
      q: this.searchTerm || undefined,
    }).subscribe({
      next: (response: any) => {
        this.users = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.status === 403
          ? 'You do not have permission to view this page.'
          : 'Unable to load users right now.';
      }
    });
  }
  onSearchChange(): void {
    this.loadUsers();
  }
  onRoleFilterChange(): void {
    this.loadUsers();
  }
  changeRole(user: any, newRole: string): void {
    if (!newRole || newRole === user.role) return;
    const previousRole = user.role;
    this.pendingUserId = user.user_id;
    this.adminService.updateUserRole(user.user_id, newRole).subscribe({
      next: () => {
        user.role = newRole;
        this.pendingUserId = null;
        this.snackBar.open(`${user.full_name}'s role changed to ${newRole}`, 'Close', { duration: 2500 });
      },
      error: (err) => {
        this.pendingUserId = null;
        user.role = previousRole;
        this.showApiError(err, 'update role');
      }
    });
  }
  toggleActive(user: any): void {
    if (user.user_id === this.currentUserId) {
      this.snackBar.open('You cannot deactivate your own account.', 'Close', { duration: 3000 });
      return;
    }
    const action = user.is_active ? 'deactivate' : 'activate';
    if (action === 'deactivate') {
      const confirmed = window.confirm(`Deactivate ${user.full_name}? They will be logged out immediately and unable to sign back in until reactivated.`);
      if (!confirmed) return;
    }
    this.pendingUserId = user.user_id;
    const request$ = action === 'deactivate'
      ? this.adminService.deactivateUser(user.user_id)
      : this.adminService.activateUser(user.user_id);
    request$.subscribe({
      next: (response: any) => {
        user.is_active = response.is_active;
        this.pendingUserId = null;
        this.snackBar.open(
          `${user.full_name} ${response.is_active ? 'activated' : 'deactivated'}`,
          'Close',
          { duration: 2500 }
        );
      },
      error: (err) => {
        this.pendingUserId = null;
        this.showApiError(err, action);
      }
    });
  }
  private showApiError(err: any, action: string): void {
    const detail = err?.error?.detail;
    const message = typeof detail === 'string' ? detail : `Failed to ${action}`;
    this.snackBar.open(message, 'Close', { duration: 4000 });
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}