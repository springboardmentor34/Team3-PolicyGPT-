import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchHistoryService {

  private http = inject(HttpClient);

  private get api() {
    return `${environment.apiUrl}/search`;
  }

  getMyHistory(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.api}/history/me?limit=${limit}`);
  }
}