import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

export interface DocSection {
  id: string;
  label: string;
  group: string;
  content: string;
}

export interface DocGroup {
  group: string;
  sections: DocSection[];
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

  // Sections grouped by folder, preserving the build-time order.
  getGroups(): Observable<DocGroup[]> {
    return this.docsData$.pipe(
      map(data => {
        const groups: DocGroup[] = [];
        for (const s of data.sections) {
          let g = groups.find(x => x.group === s.group);
          if (!g) {
            g = { group: s.group, sections: [] };
            groups.push(g);
          }
          g.sections.push(s);
        }
        return groups;
      })
    );
  }
}
