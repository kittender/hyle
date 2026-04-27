import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Print, ActivityItem } from '../../models/print.model';

const SOCIAL_DEFS = [
  { key: 'github', label: 'GitHub', color: '#c9d1d9', bg: 'rgba(36,41,46,0.55)' },
  { key: 'linkedin', label: 'LinkedIn', color: '#0077b5', bg: 'rgba(0,119,181,0.4)' },
  { key: 'x', label: 'X', color: '#e7e7e7', bg: 'rgba(20,20,20,0.65)' },
  { key: 'mastodon', label: 'Mastodon', color: '#a6a7ff', bg: 'rgba(99,100,255,0.35)' },
  { key: 'bluesky', label: 'Bluesky', color: '#6dc4ff', bg: 'rgba(0,133,255,0.35)' },
  { key: 'instagram', label: 'Instagram', color: '#f78fb3', bg: 'rgba(225,48,108,0.35)' },
  { key: 'facebook', label: 'Facebook', color: '#74a9f9', bg: 'rgba(24,119,242,0.35)' },
];

const CARD_ACCENTS = [
  { bg: 'linear-gradient(135deg,#0e2318 0%,#1a3a24 100%)', border: 'rgba(196,152,42,0.25)', tag: 'rgba(196,152,42,0.18)', tagText: '#e8c96a' },
  { bg: 'linear-gradient(135deg,#0d1f35 0%,#1a3050 100%)', border: 'rgba(96,165,250,0.25)', tag: 'rgba(96,165,250,0.15)', tagText: '#93c5fd' },
  { bg: 'linear-gradient(135deg,#1a1035 0%,#2d1f50 100%)', border: 'rgba(167,139,250,0.25)', tag: 'rgba(167,139,250,0.15)', tagText: '#c4b5fd' },
  { bg: 'linear-gradient(135deg,#1e1a10 0%,#332d0e 100%)', border: 'rgba(251,191,36,0.25)', tag: 'rgba(251,191,36,0.15)', tagText: '#fde68a' },
];

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  isPublic = false;
  tab = signal('published');
  bio = signal('Senior engineer. Loves clean code and well-structured AI workflows. Building the future of substrate-driven development.');
  editingBio = signal(false);
  bioDraft = '';
  editingSocials = signal(false);
  socials = signal<Record<string, string>>({
    github: 'andrej-kirskyn', linkedin: 'andrej-kirskyn', x: 'andrej_dev',
    mastodon: '', bluesky: '', instagram: '', facebook: '',
  });
  socialsDraft: Record<string, string> = {};
  copied = signal(false);

  socialDefs = SOCIAL_DEFS;
  cardAccents = CARD_ACCENTS;

  myPrints: Print[] = [];
  starredPrints: Print[] = [];
  activity: ActivityItem[] = [];

  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.url.subscribe(segments => {
      this.isPublic = segments.some(s => s.path === 'public');
    });

    if (this.authService.user()) {
      const username = this.authService.user()!.username;
      this.myPrints = this.dataService.PRINTS.filter(p => p.author === username);
    }
    this.starredPrints = this.dataService.MOCK_STARRED;
    this.activity = this.dataService.MOCK_ACTIVITY;
  }

  get totalStars(): string {
    const total = this.myPrints.reduce((a, p) => a + p.stars, 0);
    return total >= 1000 ? (total / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(total);
  }

  getCardAccent(i: number) {
    return this.cardAccents[i % this.cardAccents.length];
  }

  getStarsDisplay(p: Print): string {
    return p.stars >= 1000 ? (p.stars / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(p.stars);
  }

  getActiveSocials() {
    return this.socialDefs.filter(s => this.socials()[s.key]);
  }

  getSocialHref(key: string, val: string): string {
    const map: Record<string, string> = {
      x: `https://x.com/${val}`,
      mastodon: `https://mastodon.social/@${val}`,
    };
    return map[key] || `https://${key}.com/${val}`;
  }

  startEditBio() {
    this.bioDraft = this.bio();
    this.editingBio.set(true);
  }

  saveBio() {
    this.bio.set(this.bioDraft);
    this.editingBio.set(false);
  }

  cancelBio() {
    this.bioDraft = this.bio();
    this.editingBio.set(false);
  }

  startEditSocials() {
    this.socialsDraft = { ...this.socials() };
    this.editingSocials.set(true);
  }

  saveSocials() {
    this.socials.set({ ...this.socialsDraft });
    this.editingSocials.set(false);
  }

  cancelSocials() {
    this.socialsDraft = { ...this.socials() };
    this.editingSocials.set(false);
  }

  share() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  navigateToPrint(id: string) {
    this.router.navigate(['/print', id]);
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  getActivityBadge(type: string): { label: string; style: string } {
    if (type === 'push') return { label: 'PUSH', style: 'background:rgba(22,163,74,0.12); color:#16a34a; border:1px solid rgba(22,163,74,0.2);' };
    if (type === 'verified') return { label: 'VERIFIED', style: 'background:rgba(20,83,45,0.15); color:#166534; border:1px solid rgba(34,197,94,0.35);' };
    if (type === 'community') return { label: 'COMMUNITY', style: 'background:rgba(120,53,15,0.12); color:#92400e; border:1px solid rgba(196,152,42,0.35);' };
    return { label: 'PULL', style: 'background:rgba(196,152,42,0.12); color:var(--gold); border:1px solid rgba(196,152,42,0.25);' };
  }

  isSpecialActivity(type: string): boolean {
    return type === 'verified' || type === 'community';
  }
}
