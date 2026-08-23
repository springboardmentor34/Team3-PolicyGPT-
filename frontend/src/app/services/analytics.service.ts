import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private api = 'http://127.0.0.1:8000/analytics';
  // Shared by the Government Dashboard and the Admin Dashboard — live
  // Policy Statistics + Scheme Usage Analytics (Milestone 3, "Develop
  // Analytics Dashboard"). Requires an Official or Admin/Administrator
  // token; the backend derives scope (own submissions vs. system-wide)
  // from the caller's role itself — not a client-supplied flag, since
  // trusting the client here would let an Official see every other
  // official's data just by omitting a query param.
  getOverview(): Observable<any> {
    return this.http.get<any>(`${this.api}/overview`);
  }
  // Content-popularity half of Usage Statistics (Milestone 3, task vi) —
  // Most Viewed Policies/Schemes, Most Searched Terms. Official-
  // accessible, unlike /admin/usage-stats which also has account-activity
  // data (active users, total users) that stays admin-only. Same
  // role-derived scoping as getOverview() above.
  getContentUsage(): Observable<any> {
    return this.http.get<any>(`${this.api}/content-usage`);
  }
}