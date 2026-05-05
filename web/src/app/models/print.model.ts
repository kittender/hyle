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

// Mapper and helpers

type HyleManifest = any; // Import from CLI when needed

export function buildTreeFromManifest(manifest: HyleManifest): PrintTree {
  const tree: PrintTree = {};

  const folders = ['ontology', 'identities', 'craft', 'ethics'] as const;
  for (const folder of folders) {
    const files = manifest[folder];
    if (Array.isArray(files)) {
      tree[folder] = {};
      for (const file of files) {
        tree[folder]![file] = null;
      }
    } else {
      tree[folder] = null;
    }
  }

  return tree;
}

export function substrateToprint(s: any): Print {
  const date = new Date(s.created_at);
  const dateStr = date.toISOString().split('T')[0];

  return {
    id: `${s.author}/${s.name}`,
    author: s.author,
    name: s.name,
    stars: 0,
    forks: 0,
    description: s.description || '',
    language: s.manifest.models?.primary?.provider ?? 'Unknown',
    license: 'Unknown',
    updated: dateStr,
    tags: s.tags || [],
    versions: [],
    tree: buildTreeFromManifest(s.manifest),
  };
}
