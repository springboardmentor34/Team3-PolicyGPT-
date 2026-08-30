import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { NotificationService } from '../../services/notification.service';

interface NotificationView {
  id: number;
  type: 'Applications' | 'System';
  isRead: boolean;
  icon: string;
  color: string;
  title: string;
  message: string;
  action: string;
  relatedTable: string | null;
  relatedId: number | null;
  time: string;
}

// notification_type from the backend -> (icon, color, human label used
// only for the filter bucket, not shown directly).
const TYPE_STYLE: Record<string, { icon: string; color: string; bucket: 'Applications' | 'System' }> = {
  'Policy Submitted': { icon: 'pending_actions', color: 'orange', bucket: 'System' },
  'Policy Approved': { icon: 'check_circle', color: 'green', bucket: 'System' },
  'Policy Rejected': { icon: 'cancel', color: 'red', bucket: 'System' },
  'New Policy': { icon: 'campaign', color: 'blue', bucket: 'System' },
  'New Scheme': { icon: 'campaign', color: 'blue', bucket: 'System' },
  'Scheme Updated': { icon: 'update', color: 'purple', bucket: 'System' },
  'Application Status': { icon: 'assignment_turned_in', color: 'orange', bucket: 'Applications' },
};
const DEFAULT_STYLE = { icon: 'notifications', color: 'blue', bucket: 'System' as const };

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function actionLabelFor(relatedTable: string | null): string {
  switch (relatedTable) {
    case 'policies': return 'View Policy';
    case 'schemes': return 'View Scheme';
    case 'applications': return 'Track Application';
    default: return '';
  }
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss']
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  selectedFilter = 'All';
  filteredNotifications: NotificationView[] = [];
  selectedPeriod = 'Last 30 days';
  loading = true;
  errorMessage = '';

  // ================= FILTERS =================

  filters = [
    'All',
    'Unread',
    'Applications',
    'System'
  ];

  periods = [
    'Today',
    'Last 7 Days',
    'Last 30 Days',
    'All'
  ];

  // ================= NOTIFICATIONS =================
  // Was previously a hardcoded 6-row array shown identically to every
  // user regardless of who was logged in — now the real, per-user
  // notifications created by actual events (policy approved/rejected,
  // new policy/scheme, application status changed).
  notifications: NotificationView[] = [];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.errorMessage = '';
    this.notificationService.getMyNotifications().subscribe({
      next: (response: any) => {
        this.notifications = (response.data || []).map((n: any) => {
          const style = TYPE_STYLE[n.notification_type] || DEFAULT_STYLE;
          return {
            id: n.notification_id,
            type: style.bucket,
            isRead: n.is_read,
            icon: style.icon,
            color: style.color,
            title: n.title,
            message: n.message,
            action: actionLabelFor(n.related_table),
            relatedTable: n.related_table,
            relatedId: n.related_id,
            time: timeAgo(n.created_at)
          };
        });
        this.filterNotifications();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load notifications right now.';
        this.loading = false;
      }
    });
  }

  // ================= FILTER =================

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    this.filterNotifications();
  }

  filterNotifications(): void {
    if (this.selectedFilter === 'All') {
      this.filteredNotifications = [...this.notifications];
    } else if (this.selectedFilter === 'Unread') {
      this.filteredNotifications = this.notifications.filter(item => !item.isRead);
    } else if (this.selectedFilter === 'Applications') {
      this.filteredNotifications = this.notifications.filter(item => item.type === 'Applications');
    } else if (this.selectedFilter === 'System') {
      this.filteredNotifications = this.notifications.filter(item => item.type === 'System');
    }
  }

  // ================= MARK READ =================

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(item => item.isRead = true);
        this.filterNotifications();
      }
    });
  }

  markOneRead(item: NotificationView): void {
    if (item.isRead) return;
    this.notificationService.markAsRead(item.id).subscribe({
      next: () => {
        item.isRead = true;
      }
    });
  }

  // Clicking the action link both marks it read AND routes to the
  // related content — previously this link had no click handler at all.
  onAction(item: NotificationView): void {
    this.markOneRead(item);
    if (item.relatedTable === 'policies' && item.relatedId) {
      this.router.navigate(['/policy-details', item.relatedId]);
    } else if (item.relatedTable === 'schemes' && item.relatedId) {
      this.router.navigate(['/scheme-details', item.relatedId]);
    } else if (item.relatedTable === 'applications') {
      this.router.navigate(['/applications']);
    }
  }

  // ================= UNREAD COUNT =================

  getUnreadCount(): number {
    return this.notifications.filter(item => !item.isRead).length;
  }
}