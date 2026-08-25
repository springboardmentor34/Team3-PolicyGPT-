import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SavedPolicyService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/saved-policies';

  getMySaved(): Observable<any> {
    return this.http.get<any>(`${this.api}/me`);
  }

  isSaved(policyId: number | string): Observable<any> {
    return this.http.get<any>(`${this.api}/is-saved/${policyId}`);
  }

  save(policyId: number | string): Observable<any> {
    return this.http.post<any>(`${this.api}/`, { policy_id: policyId });
  }

  unsave(policyId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.api}/${policyId}`);
  }
}