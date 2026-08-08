import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EligibilityRuleService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/eligibility-rules';

  getRulesForScheme(schemeId: number | string): Observable<any> {
    return this.http.get<any>(`${this.api}/?scheme_id=${schemeId}`);
  }

  createRule(rule: any): Observable<any> {
    return this.http.post<any>(`${this.api}/`, rule);
  }

  updateRule(ruleId: number, rule: any): Observable<any> {
    return this.http.put<any>(`${this.api}/${ruleId}`, rule);
  }

  deleteRule(ruleId: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${ruleId}`);
  }
}