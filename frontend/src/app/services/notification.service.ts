import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BackendNotification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/notifications';

  getNotifications(): Observable<BackendNotification[]> {
    return this.http.get<BackendNotification[]>(`${this.api}/`);
  }

  markAsRead(notificationId: number): Observable<BackendNotification> {
    return this.http.patch<BackendNotification>(
      `${this.api}/${notificationId}/read`,
      {}
    );
  }

  updateNotification(
    notificationId: number,
    isRead: boolean
  ): Observable<BackendNotification> {
    return this.http.patch<BackendNotification>(
      `${this.api}/${notificationId}`,
      { is_read: isRead }
    );
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(
      `${this.api}/${notificationId}`
    );
  }
}