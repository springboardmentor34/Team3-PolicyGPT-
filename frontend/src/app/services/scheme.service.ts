import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Scheme } from '../models/scheme.model';

@Injectable({
  providedIn: 'root'
})
export class SchemeService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/schemes';

  getAllSchemes(filters?: { category?: string; state?: string; department?: string; status?: string; keyword?: string; include_archived?: boolean; mine_only?: boolean }): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<any>(`${this.api}/`, { params });
  }

  createScheme(scheme: Scheme): Observable<any> {
    return this.http.post<any>(`${this.api}/`, scheme);
  }

  updateScheme(id: string | number, scheme: any): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}`, scheme);
  }

  archiveScheme(id: string | number): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/archive`, {});
  }

  unarchiveScheme(id: string | number): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/unarchive`, {});
  }

  getUpcomingDeadlines(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.api}/upcoming-deadlines`, { params: { limit } });
  }

  getLatestSchemes(limit: number): Observable<any[]> {

  return new Observable(observer => {

    this.getAllSchemes().subscribe({

      next: (response: any) => {

        observer.next(response.data.slice(0, limit));

        observer.complete();

      },

      error: (err) => observer.error(err)

    });

  });

}

getSchemeById(id: string | number): Observable<any> {
  return this.http.get<any>(`${this.api}/${id}`);
}

}