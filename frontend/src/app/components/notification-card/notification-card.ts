import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppNotification } from '../../models/notification.model';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './notification-card.html',
  styleUrl: './notification-card.scss',
})
export class NotificationCardComponent {
  @Input({ required: true }) notification!: AppNotification;
  @Output() markAsRead = new EventEmitter<AppNotification>();
  @Output() dismiss = new EventEmitter<AppNotification>();

  private readonly iconMap: Record<AppNotification['type'], string> = {
    policy: 'gavel',
    scheme: 'volunteer_activism',
    system: 'settings',
    deadline: 'schedule',
  };

  get icon(): string {
    return this.iconMap[this.notification.type];
  }

  onMarkAsRead(): void {
    this.markAsRead.emit(this.notification);
  }

  onDismiss(): void {
    this.dismiss.emit(this.notification);
  }
}
