import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {

  private apiUrl = 'http://127.0.0.1:8000/compare';

  constructor(private http: HttpClient) {}

  comparePolicies(policy1Id: number, policy2Id: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/policies/${policy1Id}/${policy2Id}`
    );
  }

  compareSchemes(scheme1Id: number, scheme2Id: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/schemes/${scheme1Id}/${scheme2Id}`
    );
  }

  comparePoliciesMulti(ids: number[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/policies/multi`,
      { ids }
    );
  }

  compareSchemesMulti(ids: number[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/schemes/multi`,
      { ids }
    );
  }
}