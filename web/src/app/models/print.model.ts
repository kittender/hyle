export interface PrintVersion {
  tag: string;
  date: string;
  notes: string;
}

export interface PrintTree {
  [key: string]: PrintTree | null;
}

export interface PrintPulls {
  month?: number;
  half?: number;
  year?: number;
  all?: number;
}

export interface Print {
  id: string;
  author: string;
  name: string;
  stars: number;
  forks: number;
  pulls?: PrintPulls;
  description: string;
  longDesc?: string;
  language: string;
  license: string;
  updated: string;
  tags: string[];
  verified?: boolean;
  community?: boolean;
  versions: PrintVersion[];
  tree: PrintTree;
}

export interface AuthUser {
  name: string;
  username: string;
  email: string;
  avatar?: string | null;
}

export interface ActivityItem {
  type: 'push' | 'pull' | 'verified' | 'community';
  print: string;
  version: string;
  date: string;
  note: string;
}
