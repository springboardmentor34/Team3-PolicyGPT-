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
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
// Matches the action strings actually logged in admin.py/policy.py/
// scheme.py — kept as a fixed list rather than derived from results, so
// the filter dropdown still shows every category even when a given
// action hasn't happened yet (e.g. a fresh install with no rejections).
const ACTION_FILTERS = [
  { value: '', label: 'All administrative actions' },
  { value: 'update_user_role', label: 'Role changes' },
  { value: 'activate_user', label: 'Account activated' },
  { value: 'deactivate_user', label: 'Account deactivated' },
  { value: 'approve_policy', label: 'Policy approved' },
  { value: 'reject_policy', label: 'Policy rejected' },
  { value: 'unapprove_policy', label: 'Policy approval undone' },
  { value: 'admin_archive_policy', label: 'Admin archived a policy' },
  { value: 'admin_unarchive_policy', label: 'Admin restored a policy' },
  { value: 'admin_archive_scheme', label: 'Admin archived a scheme' },
  { value: 'admin_unarchive_scheme', label: 'Admin restored a scheme' },
];
// Icon + short human label per action prefix, for readable rendering of
// what's otherwise a raw action string (e.g. "update_user_role: official
// -> admin" still needs a "Role Change" badge, not just the raw text).
const ACTION_DISPLAY: { prefix: string; label: string; icon: string }[] = [
  { prefix: 'update_user_role', label: 'Role Change', icon: 'swap_horiz' },
  { prefix: 'activate_user', label: 'Account Activated', icon: 'check_circle' },
  { prefix: 'deactivate_user', label: 'Account Deactivated', icon: 'block' },
  { prefix: 'approve_policy', label: 'Policy Approved', icon: 'thumb_up' },
  { prefix: 'reject_policy', label: 'Policy Rejected', icon: 'thumb_down' },
  { prefix: 'unapprove_policy', label: 'Approval Undone', icon: 'undo' },
  { prefix: 'admin_archive', label: 'Admin Archived', icon: 'archive' },
  { prefix: 'admin_unarchive', label: 'Admin Restored', icon: 'unarchive' },
];
@Component({
  selector: 'app-audit-logs',
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
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.scss',
})
export class AuditLogsComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);
  actionFilters = ACTION_FILTERS;
  actionFilter = '';
  logs: any[] = [];
  loading = true;
  error = '';
  ngOnInit(): void {
    this.loadLogs();
  }
  loadLogs(): void {
    this.loading = true;
    this.error = '';
    this.adminService.getAuditLogs({ limit: 200, action: this.actionFilter || undefined }).subscribe({
      next: (response: any) => {
        this.logs = response.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.status === 403
          ? 'You do not have permission to view this page.'
          : 'Unable to load the audit trail right now.';
      }
    });
  }
  onFilterChange(): void {
    this.loadLogs();
  }
  // Splits "update_user_role: official -> admin" into a display label
  // ("Role Change") plus the detail that follows the colon, if any —
  // rather than showing the raw action string verbatim in the table.
  actionLabel(action: string): string {
    const prefix = action.split(':')[0].trim();
    const match = ACTION_DISPLAY.find(a => prefix.startsWith(a.prefix));
    return match?.label || prefix;
  }
  actionIcon(action: string): string {
    const prefix = action.split(':')[0].trim();
    const match = ACTION_DISPLAY.find(a => prefix.startsWith(a.prefix));
    return match?.icon || 'history';
  }
  actionDetail(action: string): string {
    const parts = action.split(':');
    return parts.length > 1 ? parts.slice(1).join(':').trim() : '';
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
