import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Feedback {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/feedback';

  submitFeedback(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/`, data);
  }

  getFeedback(): Observable<any> {
    return this.http.get<any>(`${this.api}/`);
  }
}