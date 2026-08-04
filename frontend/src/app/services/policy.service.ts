import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PolicyService {

  private api = 'http://127.0.0.1:8000/policies';

  constructor(private http: HttpClient) {}

  getAllPolicies(): Observable<any> {
    return this.http.get(this.api + '/');
  }

  getPolicyById(id: string | number): Observable<any> {
    return this.http.get(this.api + '/' + id);
  }

  createPolicy(policy: any): Observable<any> {
    return this.http.post(this.api + '/', policy);
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