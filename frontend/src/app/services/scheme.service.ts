import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Scheme } from '../models/scheme.model';

@Injectable({
  providedIn: 'root'
})
export class SchemeService {

  private http = inject(HttpClient);

  private api = 'http://127.0.0.1:8000/schemes';

  getAllSchemes(): Observable<any> {
    return this.http.get<any>(`${this.api}/`);
  }

  createScheme(scheme: Scheme): Observable<any> {
    return this.http.post<any>(`${this.api}/`, scheme);
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