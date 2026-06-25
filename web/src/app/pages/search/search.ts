import { Component, OnInit, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, BlueprintResponse } from '../../services/api.service';
import { BadgeListComponent } from '../../components/badge-list/badge-list';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeListComponent],
  templateUrl: './search.html',
  styleUrl: './search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit {
  query = signal('');
  inputVal = signal('');
  sort = signal<'recent' | 'name'>('recent');
  selectedTags = signal<string[]>([]);
  authorFilter = signal('');
  results = signal<BlueprintResponse[]>([]);
  allTags = signal<string[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  offset = signal(0);
  hasMore = signal(false);
  limit = 20;
  private initialized = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {
    // Auto-run search when query/sort/tags/author change (after init)
    effect(() => {
      if (!this.initialized) return;
      const q = this.query();
      const s = this.sort();
      const tags = this.selectedTags();
      const author = this.authorFilter();
      this.offset.set(0);
      this.runSearch();
    });
  }

  ngOnInit() {
    // Load all tags for filter
    this.apiService.getTags().subscribe({
      next: (tags) => this.allTags.set(tags),
      error: () => {} // Silently fail tag loading
    });

    // Load initial params from URL synchronously first
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      const sort = params['sort'] || 'recent';
      const tags = params['tags'] ? params['tags'].split(',').filter((t: string) => t) : [];
      const author = params['author'] || '';

      this.query.set(q);
      this.inputVal.set(q);
      this.sort.set(sort);
      this.selectedTags.set(tags);
      this.authorFilter.set(author);

      // Now mark as initialized and trigger search
      if (!this.initialized) {
        this.initialized = true;
        this.runSearch();
      }
    });
  }

  private runSearch() {
    const tagsParam = this.selectedTags().length > 0 ? this.selectedTags().join(',') : undefined;
    this.loading.set(true);
    this.error.set(null);

    // Request limit+1 to determine if there are more results
    const requestLimit = this.limit + 1;

    this.apiService.search({
      q: this.query() || undefined,
      author: this.authorFilter() || undefined,
      tags: tagsParam,
      sort: this.sort(),
      offset: this.offset(),
      limit: requestLimit,
    }).subscribe({
      next: (results) => {
        // Check if we got more than limit (indicates hasMore)
        this.hasMore.set(results.length > this.limit);
        // Only store up to limit results
        const displayResults = results.slice(0, this.limit);

        if (this.offset() === 0) {
          this.results.set(displayResults);
        } else {
          this.results.set([...this.results(), ...displayResults]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load blueprints');
        this.loading.set(false);
      }
    });
  }

  toggleTag(tag: string) {
    const current = this.selectedTags();
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    this.selectedTags.set(updated);
    this.syncUrl();
  }

  get filteredTags(): string[] {
    return this.allTags();
  }

  handleSearch(e: Event) {
    e.preventDefault();
    const q = this.inputVal();
    this.query.set(q);
    this.offset.set(0);
    this.syncUrl();
  }

  syncUrl() {
    const queryParams: any = {};
    if (this.query()) queryParams['q'] = this.query();
    if (this.sort() !== 'recent') queryParams['sort'] = this.sort();
    if (this.selectedTags().length > 0) queryParams['tags'] = this.selectedTags().join(',');
    if (this.authorFilter()) queryParams['author'] = this.authorFilter();

    this.router.navigate(['/search'], { queryParams });
  }

  navigateToPrint(author: string, name: string) {
    this.router.navigate(['/print', author, name]);
  }

  loadMore() {
    this.offset.set(this.offset() + this.limit);
    this.runSearch();
  }

  clearSearch() {
    this.query.set('');
    this.inputVal.set('');
    this.selectedTags.set([]);
    this.authorFilter.set('');
    this.offset.set(0);
    this.results.set([]);
    this.router.navigate(['/search']);
  }
}
