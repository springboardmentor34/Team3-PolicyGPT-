import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

import {
  NotificationService,
  BackendNotification,
} from "../../services/notification.service";

@Component({
  selector: "app-notifications",
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
    MatSelectModule,
  ],
  templateUrl: "./notifications.html",
  styleUrls: ["./notifications.scss"],
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);

  selectedFilter = "All";
  selectedPeriod = "Last 30 days";

  filteredNotifications: any[] = [];
  notifications: any[] = [];

  filters = ["All", "Unread", "Applications", "System"];

  periods = ["Today", "Last 7 Days", "Last 30 Days", "All"];

  ngOnInit(): void {
    this.loadNotifications();
  }

  // ================= LOAD FROM BACKEND =================

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data: BackendNotification[]) => {
        this.notifications = data.map((notification) =>
          this.mapNotification(notification)
        );

        this.filterNotifications();
      },

      error: (error) => {
        console.error("Failed to load notifications:", error);
      },
    });
  }

  // ================= MAP BACKEND → UI =================

  private mapNotification(notification: BackendNotification): any {
    let type = "System";
    let icon = "notifications";
    let color = "blue";

    if (notification.notification_type === "application") {
      type = "Applications";
      icon = "task_alt";
      color = "green";
    } else if (notification.notification_type === "deadline_reminder") {
      type = "Applications";
      icon = "calendar_month";
      color = "purple";
    } else if (notification.notification_type === "scheme_update") {
      type = "System";
      icon = "volunteer_activism";
      color = "blue";
    } else if (notification.notification_type === "new_policy") {
      type = "System";
      icon = "policy";
      color = "blue";
    }

    return {
      id: notification.notification_id,
      type: type,
      isRead: notification.is_read,
      icon: icon,
      color: color,
      title: notification.title,
      message: notification.message,
      action: "",
      time: this.formatTime(notification.created_at),
    };
  }

  // ================= TIME =================

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return "Just now";
    }

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 1) {
      return "Yesterday";
    }

    return `${diffDays} days ago`;
  }

  // ================= FILTER =================

  setFilter(filter: string): void {
    this.selectedFilter = filter;

    this.filterNotifications();
  }

  filterNotifications(): void {
    if (this.selectedFilter === "All") {
      this.filteredNotifications = [...this.notifications];
    } else if (this.selectedFilter === "Unread") {
      this.filteredNotifications = this.notifications.filter(
        (item) => !item.isRead
      );
    } else if (this.selectedFilter === "Applications") {
      this.filteredNotifications = this.notifications.filter(
        (item) => item.type === "Applications"
      );
    } else if (this.selectedFilter === "System") {
      this.filteredNotifications = this.notifications.filter(
        (item) => item.type === "System"
      );
    }
  }

  // ================= MARK ONE AS READ =================

  markAsRead(item: any): void {
    if (item.isRead) {
      return;
    }

    this.notificationService.markAsRead(item.id).subscribe({
      next: () => {
        item.isRead = true;

        this.filterNotifications();
      },

      error: (error) => {
        console.error("Failed to mark notification as read:", error);
      },
    });
  }

  // ================= MARK ALL READ =================

  markAllRead(): void {
    const unread = this.notifications.filter((item) => !item.isRead);

    unread.forEach((item) => {
      this.notificationService.markAsRead(item.id).subscribe({
        next: () => {
          item.isRead = true;

          this.filterNotifications();
        },

        error: (error) => {
          console.error("Failed to mark notification as read:", error);
        },
      });
    });
  }

  // ================= UNREAD COUNT =================

  getUnreadCount(): number {
    return this.notifications.filter((item) => !item.isRead).length;
  }
}
