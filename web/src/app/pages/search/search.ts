import { Component, OnInit } from '@angular/core';
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
  query = '';
  inputVal = '';
  sort = 'stars';
  filterLanguage: string[] = [];
  filterLicense: string[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public dataService: DataService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const q = params['q'] || '';
      this.query = q;
      this.inputVal = q;
    });
  }

  get languages(): string[] {
    return [...new Set(this.dataService.PRINTS.map(p => p.language))].sort();
  }

  get licenses(): string[] {
    return [...new Set(this.dataService.PRINTS.map(p => p.license))].sort();
  }

  getLangCount(l: string): number {
    return this.dataService.PRINTS.filter(p => p.language === l).length;
  }

  getLicenseCount(l: string): number {
    return this.dataService.PRINTS.filter(p => p.license === l).length;
  }

  toggleLang(l: string) {
    if (this.filterLanguage.includes(l)) {
      this.filterLanguage = this.filterLanguage.filter(v => v !== l);
    } else {
      this.filterLanguage = [...this.filterLanguage, l];
    }
  }

  toggleLicense(l: string) {
    if (this.filterLicense.includes(l)) {
      this.filterLicense = this.filterLicense.filter(v => v !== l);
    } else {
      this.filterLicense = [...this.filterLicense, l];
    }
  }

  get hasFilters(): boolean {
    return this.filterLanguage.length > 0 || this.filterLicense.length > 0;
  }

  clearFilters() {
    this.filterLanguage = [];
    this.filterLicense = [];
  }

  get results(): Print[] {
    return this.dataService.PRINTS
      .filter(p => {
        if (this.filterLanguage.length && !this.filterLanguage.includes(p.language)) return false;
        if (this.filterLicense.length && !this.filterLicense.includes(p.license)) return false;
        if (!this.query) return true;
        const q = this.query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) || p.tags.some(t => t.includes(q)) ||
          p.language.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (this.sort === 'stars') return b.stars - a.stars;
        if (this.sort === 'recent') return new Date(b.updated).getTime() - new Date(a.updated).getTime();
        if (this.sort === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }

  handleSearch(e: Event) {
    e.preventDefault();
    this.query = this.inputVal;
    this.router.navigate(['/search'], { queryParams: { q: this.inputVal } });
  }

  navigateToPrint(id: string) {
    this.router.navigate(['/print', id]);
  }

  clearSearch() {
    this.query = '';
    this.inputVal = '';
    this.filterLanguage = [];
    this.filterLicense = [];
    this.router.navigate(['/search']);
  }
}
