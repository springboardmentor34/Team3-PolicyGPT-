import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {

  private api = 'http://127.0.0.1:8000/policies';

  constructor(private http: HttpClient) {}

  getAllPolicies(filters?: { category?: string; state?: string; department?: string; ministry?: string; status?: string; keyword?: string; include_archived?: boolean; public_only?: boolean }): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get(this.api + '/', { params });
  }

  getPolicyById(id: string | number): Observable<any> {
    return this.http.get(this.api + '/' + id);
  }

  createPolicy(policy: any): Observable<any> {
    return this.http.post(this.api + '/', policy);
  }

  updatePolicy(id: string | number, policy: any): Observable<any> {
    return this.http.put(this.api + '/' + id, policy);
  }

  archivePolicy(id: string | number): Observable<any> {
    return this.http.patch(this.api + '/' + id + '/archive', {});
  }

  unarchivePolicy(id: string | number): Observable<any> {
    return this.http.patch(this.api + '/' + id + '/unarchive', {});
  }

  // ===== Policy Approval Workflow (admin-only on the backend) =====

  getPendingPolicies(): Observable<any> {
    return this.http.get(this.api + '/pending');
  }

  approvePolicy(id: string | number): Observable<any> {
    return this.http.patch(this.api + '/' + id + '/approve', {});
  }

  rejectPolicy(id: string | number, reason: string): Observable<any> {
    return this.http.patch(this.api + '/' + id + '/reject', { reason });
  }

  // Temporary until backend endpoint is created
  getPopularCategories(): Observable<any[]> {
    return of([
      { name: 'Agriculture', icon: 'agriculture', count: 1 },
      { name: 'Health', icon: 'health_and_safety', count: 0 },
      { name: 'Education', icon: 'school', count: 0 },
      { name: 'Housing', icon: 'home', count: 0 },
      { name: 'Employment', icon: 'work', count: 0 }
    ]);
  }

}