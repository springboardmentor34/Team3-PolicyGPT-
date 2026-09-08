import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Feedback {

  private http = inject(HttpClient);

  private get api() {
    return `${environment.apiUrl}/feedback`;
  }

  submitFeedback(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/`, data);
  }

  getFeedback(): Observable<any> {
    return this.http.get<any>(`${this.api}/`);
  }
}