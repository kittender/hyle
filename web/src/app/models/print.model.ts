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
  id?: number;
  name: string;
  username: string;
  email: string;
  avatar?: string | null;
  token?: string;
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

/**
 * Build a nested file tree from a manifest's `blueprint.{ontology,identities,
 * craft,ethics}` path arrays. Paths like "craft/examples/UserService.java" nest
 * into folders; the leaf file maps to null.
 */
export function buildTreeFromManifest(manifest: HyleManifest): PrintTree {
  const tree: PrintTree = {};
  const bp = (manifest && manifest.blueprint) || {};
  const folders = ['ontology', 'identities', 'craft', 'ethics'] as const;

  for (const folder of folders) {
    const paths: string[] = Array.isArray(bp[folder]) ? bp[folder] : [];
    for (const path of paths) {
      const parts = path.split('/').filter(Boolean);
      let node: PrintTree = tree;
      parts.forEach((part, i) => {
        const isLeaf = i === parts.length - 1;
        if (isLeaf) {
          if (!(part in node)) node[part] = null;
        } else {
          if (!node[part]) node[part] = {};
          node = node[part] as PrintTree;
        }
      });
    }
  }

  return tree;
}

function hasBadge(s: any, type: string): boolean {
  return Array.isArray(s.badges) && s.badges.some((b: any) => b?.type === type);
}

export function blueprintToprint(s: any): Print {
  const date = new Date(s.created_at);
  const dateStr = isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  const manifest = s.manifest || {};

  return {
    id: `${s.author}/${s.name}`,
    author: s.author,
    name: s.name,
    stars: s.star_count ?? 0,
    forks: s.fork_count ?? manifest.fork_count ?? 0,
    pulls: { all: s.install_count ?? 0 },
    description: s.description || '',
    longDesc: s.long_description ?? manifest.long_description ?? s.description ?? '',
    language: s.language ?? manifest.language ?? 'Unknown',
    license: s.license ?? manifest.license ?? 'Unknown',
    updated: dateStr,
    tags: s.tags || [],
    verified: hasBadge(s, 'verified'),
    community: hasBadge(s, 'community'),
    versions: [],
    tree: buildTreeFromManifest(manifest),
  };
}
