import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/auth';

  login(data: any): Observable<any> {
    return this.http.post(`${this.api}/login`, data);
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.api}/register`, data);
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  getMe(): Observable<any> {
    return this.http.get(`${this.api}/me`);
  }

  /**
   * Decodes the role out of the stored JWT payload. Used for route
   * guards / conditional UI (e.g. showing the Policy Approvals link only
   * to admins). Mirrors the decode logic already used in login.ts for
   * the post-login redirect — not verified here, since the backend
   * independently verifies the token's signature on every real request.
   */
  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      return payload.role || null;
    } catch {
      return null;
    }
  }

}