import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Print } from '../../models/print.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class SearchComponent implements OnInit {
  query = signal('');
  inputVal = signal('');
  sort = signal<'recent' | 'name'>('recent');
  selectedTags = signal<string[]>([]);
  results = signal<Print[]>([]);
  allTags = signal<string[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  offset = signal(0);
  hasMore = signal(false);
  limit = 20;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public dataService: DataService,
  ) {
    // Auto-run search when query/sort/tags change
    effect(() => {
      const q = this.query();
      const s = this.sort();
      const tags = this.selectedTags();
      this.offset.set(0);
      this.runSearch();
    });
  }

  ngOnInit() {
    // Load tags for filter
    this.dataService.getTags$().subscribe({
      next: (tags) => this.allTags.set(tags),
      error: () => {} // Silently fail tag loading
    });

    // Load initial query from URL
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      const tag = params['tag'] || '';
      this.query.set(q);
      this.inputVal.set(q);
      if (tag) this.selectedTags.set([tag]);
    });
  }

  private runSearch() {
    const tagsParam = this.selectedTags().length > 0 ? this.selectedTags().join(',') : undefined;
    this.loading.set(true);
    this.error.set(null);

    this.dataService.search$({
      q: this.query() || undefined,
      tags: tagsParam,
      sort: this.sort(),
      offset: this.offset(),
      limit: this.limit,
    }).subscribe({
      next: (results) => {
        if (this.offset() === 0) {
          this.results.set(results);
        } else {
          this.results.set([...this.results(), ...results]);
        }
        this.hasMore.set(results.length >= this.limit);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to load substrates');
        this.loading.set(false);
      }
    });
  }

  toggleTag(tag: string) {
    const current = this.selectedTags();
    if (current.includes(tag)) {
      this.selectedTags.set(current.filter(t => t !== tag));
    } else {
      this.selectedTags.set([...current, tag]);
    }
  }

  get filteredTags(): string[] {
    return this.allTags().slice(0, 10);
  }

  handleSearch(e: Event) {
    e.preventDefault();
    this.query.set(this.inputVal());
    this.router.navigate(['/search'], { queryParams: { q: this.inputVal() } });
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
    this.offset.set(0);
    this.results.set([]);
    this.router.navigate(['/search']);
  }
}
