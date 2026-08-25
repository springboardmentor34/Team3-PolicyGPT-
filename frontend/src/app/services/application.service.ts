import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/applications';

  getMyApplications(): Observable<any> {
    return this.http.get<any>(`${this.api}/me`);
  }

  applyToScheme(schemeId: number): Observable<any> {
    return this.http.post<any>(`${this.api}/`, { scheme_id: schemeId });
  }

  // Officials/Admin: 'Recent Applications' review table on the
  // Government Dashboard. Auto-scoped server-side (an Official only
  // gets applications for their own schemes; Admin gets everything).
  getAllApplications(): Observable<any> {
    return this.http.get<any>(`${this.api}/all`);
  }

  updateStatus(applicationId: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/${applicationId}/status`, { status });
  }
}