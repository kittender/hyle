import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export interface DocSection {
  id: string;
  label: string;
  content: string;
}

export interface DocsData {
  sections: DocSection[];
}

@Injectable({
  providedIn: 'root'
})
export class DocsService {
  private docsData$ = new BehaviorSubject<DocsData>({ sections: [] });

  constructor(private http: HttpClient) {
    this.loadDocs();
  }

  private loadDocs() {
    this.http.get<DocsData>('docs-data.json')
      .pipe(
        catchError(err => {
          console.error('Failed to load docs data:', err);
          return of({ sections: [] });
        })
      )
      .subscribe(data => this.docsData$.next(data));
  }

  getDocs(): Observable<DocsData> {
    return this.docsData$.asObservable();
  }

  getSection(id: string): Observable<DocSection | undefined> {
    return this.docsData$.pipe(
      map(data => data.sections.find(s => s.id === id))
    );
  }
}
