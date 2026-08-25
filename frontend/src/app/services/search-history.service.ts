import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchHistoryService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/search';

  getMyHistory(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.api}/history/me?limit=${limit}`);
  }
}