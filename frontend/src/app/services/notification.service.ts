import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/notifications';

  getMyNotifications(unreadOnly: boolean = false): Observable<any> {
    return this.http.get<any>(`${this.api}/me`, { params: { unread_only: unreadOnly } });
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch<any>(`${this.api}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.api}/read-all`, {});
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${notificationId}`);
  }

  getDeadlineReminders(days: number = 7): Observable<any> {
    return this.http.get<any>(`${this.api}/deadline-reminders`, { params: { days } });
  }
}