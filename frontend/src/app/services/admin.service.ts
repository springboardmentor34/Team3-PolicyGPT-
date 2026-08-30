import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private api = 'http://127.0.0.1:8000/admin';
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.api}/stats`);
  }
  // ================= USER MANAGEMENT =================
  getUsers(filters?: { role?: string; q?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.q) params = params.set('q', filters.q);
    return this.http.get<any>(`${this.api}/users`, { params });
  }
  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/users/${userId}/role`, { role });
  }
  deactivateUser(userId: number): Observable<any> {
    return this.http.patch<any>(`${this.api}/users/${userId}/deactivate`, {});
  }
  activateUser(userId: number): Observable<any> {
    return this.http.patch<any>(`${this.api}/users/${userId}/activate`, {});
  }
  // ================= USAGE STATISTICS (Milestone 3, Task 6) =================
  getUsageStats(): Observable<any> {
    return this.http.get<any>(`${this.api}/usage-stats`);
  }
  // ================= AUDIT LOGS (administrative-action trail — see
  // admin.py get_audit_logs for what this excludes by default) =================
  getAuditLogs(filters?: { limit?: number; action?: string }): Observable<any> {
    let params = new HttpParams();
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.action) params = params.set('action', filters.action);
    return this.http.get<any>(`${this.api}/audit-logs`, { params });
  }
}