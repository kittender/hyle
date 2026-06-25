import { Database } from "bun:sqlite";
import type { RegistryRecord, SearchQuery, ScanResult, User, Review } from "./types";

export interface IDatabase {
  init(): void;
  insertBlueprint(
    author: string,
    name: string,
    version: string,
    manifestJson: string,
    bundlePath: string,
    checksum: string,
    description: string | undefined,
    tags: string[],
    is_stable: boolean
  ): RegistryRecord;
  getLatestStable(author: string, name: string): RegistryRecord | null;
  getVersion(author: string, name: string, version: string): RegistryRecord | null;
  getVersions(author: string, name: string): RegistryRecord[];
  search(query: SearchQuery): RegistryRecord[];
  exists(author: string, name: string, version: string): boolean;
  getAllTags(): string[];
  getTrending(limit: number): RegistryRecord[];
  getAuthorBlueprints(author: string): RegistryRecord[];
  insertScan(blueprintId: number, result: ScanResult): void;
  getScan(blueprintId: number): ScanResult | null;
  recordPublish(author: string): void;
  countRecentPublishes(author: string, windowSeconds: number): number;
  flagBlueprint(id: number, reason: string): void;
  // User operations
  upsertUser(github_id: string, username: string, email?: string, avatar_url?: string): User;
  getUser(id: number): User | null;
  getUserByUsername(username: string): User | null;
  updateUser(id: number, bio?: string, website?: string): User | null;
  // Star operations
  toggleStar(user_id: number, blueprint_author: string, blueprint_name: string): boolean;
  getStarCount(blueprint_author: string, blueprint_name: string): number;
  isStarredBy(user_id: number, blueprint_author: string, blueprint_name: string): boolean;
  // Review operations
  upsertReview(user_id: number, blueprint_author: string, blueprint_name: string, rating: number, body?: string): Review;
  getReviews(blueprint_author: string, blueprint_name: string): Review[];
  getAvgRating(blueprint_author: string, blueprint_name: string): number | null;
  // Install count operations
  incrementInstallCount(blueprint_author: string, blueprint_name: string): void;
  getInstallCount(blueprint_author: string, blueprint_name: string): number;
  // Notification prefs
  getNotificationPrefs(user_id: number): { email_on_star: boolean; email_on_review: boolean; email_on_new_version: boolean } | null;
  upsertNotificationPrefs(user_id: number, email_on_star: boolean, email_on_review: boolean, email_on_new_version: boolean): void;
}

export class SQLiteDatabase implements IDatabase {
  private db: InstanceType<typeof Database>;
  private dbPath: string;

  constructor(dbPath: string = ":memory:") {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
  }

  init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS blueprints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        is_stable INTEGER NOT NULL DEFAULT 1,
        is_flagged INTEGER NOT NULL DEFAULT 0,
        flag_reason TEXT,
        checksum TEXT NOT NULL,
        bundle_path TEXT NOT NULL,
        manifest_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(author, name, version)
      );
      CREATE INDEX IF NOT EXISTS idx_blueprints_author_name ON blueprints(author, name);
      CREATE INDEX IF NOT EXISTS idx_blueprints_stable ON blueprints(is_stable);

      CREATE TABLE IF NOT EXISTS security_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blueprint_id INTEGER NOT NULL,
        scan_status TEXT NOT NULL DEFAULT 'pending',
        findings_json TEXT NOT NULL DEFAULT '[]',
        scanned_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (blueprint_id) REFERENCES blueprints(id)
      );
      CREATE INDEX IF NOT EXISTS idx_scans_blueprint ON security_scans(blueprint_id);

      CREATE TABLE IF NOT EXISTS publish_rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        published_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_rate_limits_author ON publish_rate_limits(author, published_at);

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        avatar_url TEXT,
        bio TEXT,
        website TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_login TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

      CREATE TABLE IF NOT EXISTS install_counts (
        blueprint_author TEXT NOT NULL,
        blueprint_name TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (blueprint_author, blueprint_name)
      );

      CREATE TABLE IF NOT EXISTS stars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        blueprint_author TEXT NOT NULL,
        blueprint_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, blueprint_author, blueprint_name)
      );
      CREATE INDEX IF NOT EXISTS idx_stars_user ON stars(user_id);
      CREATE INDEX IF NOT EXISTS idx_stars_blueprint ON stars(blueprint_author, blueprint_name);

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        blueprint_author TEXT NOT NULL,
        blueprint_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        body TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id, blueprint_author, blueprint_name)
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_blueprint ON reviews(blueprint_author, blueprint_name);

      CREATE TABLE IF NOT EXISTS notification_prefs (
        user_id INTEGER NOT NULL PRIMARY KEY REFERENCES users(id),
        email_on_star INTEGER NOT NULL DEFAULT 0,
        email_on_review INTEGER NOT NULL DEFAULT 0,
        email_on_new_version INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  insertBlueprint(
    author: string,
    name: string,
    version: string,
    manifestJson: string,
    bundlePath: string,
    checksum: string,
    description: string | undefined,
    tags: string[],
    is_stable: boolean
  ): RegistryRecord {
    const tagsJson = JSON.stringify(tags);
    const stmt = this.db.prepare(`
      INSERT INTO blueprints (author, name, version, description, tags, checksum, bundle_path, manifest_json, is_stable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
    `);

    const result = stmt.get(
      author,
      name,
      version,
      description || null,
      tagsJson,
      checksum,
      bundlePath,
      manifestJson,
      is_stable ? 1 : 0
    ) as any;

    return {
      id: result.id,
      author: result.author,
      name: result.name,
      version: result.version,
      description: result.description,
      tags: JSON.parse(result.tags),
      is_stable: result.is_stable === 1,
      is_flagged: result.is_flagged === 1,
      flag_reason: result.flag_reason,
      checksum: result.checksum,
      bundle_path: result.bundle_path,
      manifest_json: result.manifest_json,
      created_at: result.created_at,
    };
  }

  getLatestStable(author: string, name: string): RegistryRecord | null {
    const stmt = this.db.prepare(`
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM blueprints
      WHERE author = ? AND name = ? AND is_stable = 1
      ORDER BY version DESC
      LIMIT 1
    `);

    const result = stmt.get(author, name) as any;
    return result ? this.mapRecord(result) : null;
  }

  getVersion(author: string, name: string, version: string): RegistryRecord | null {
    const stmt = this.db.prepare(`
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM blueprints
      WHERE author = ? AND name = ? AND version = ?
      LIMIT 1
    `);

    const result = stmt.get(author, name, version) as any;
    return result ? this.mapRecord(result) : null;
  }

  getVersions(author: string, name: string): RegistryRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM blueprints
      WHERE author = ? AND name = ?
      ORDER BY created_at DESC
    `);

    const results = stmt.all(author, name) as any[];
    return results.map((r) => this.mapRecord(r));
  }

  search(query: SearchQuery): RegistryRecord[] {
    let sql = `
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM blueprints
      WHERE is_stable = 1 AND is_flagged = 0
    `;
    const params: any[] = [];

    if (query.author) {
      sql += ` AND author = ?`;
      params.push(query.author);
    }

    if (query.q) {
      const searchTerm = `%${query.q}%`;
      sql += ` AND (name LIKE ? OR description LIKE ?)`;
      params.push(searchTerm, searchTerm);
    }

    if (query.tags) {
      const tagList = query.tags.split(",").map((t) => t.trim());
      const placeholders = tagList.map(() => "?").join(",");
      sql += ` AND (`;
      for (let i = 0; i < tagList.length; i++) {
        if (i > 0) sql += ` OR`;
        sql += ` tags LIKE ?`;
        params.push(`%${tagList[i]}%`);
      }
      sql += `)`;
    }

    if (query.sort === 'name') {
      sql += ` ORDER BY name ASC`;
    } else {
      sql += ` ORDER BY created_at DESC`;
    }

    if (query.offset) {
      sql += ` OFFSET ?`;
      params.push(query.offset);
    }

    if (query.limit) {
      sql += ` LIMIT ?`;
      params.push(query.limit);
    }

    const stmt = this.db.prepare(sql);
    const results = stmt.all(...params) as any[];
    return results.map((r) => this.mapRecord(r));
  }

  getAllTags(): string[] {
    const stmt = this.db.prepare(`
      SELECT tags FROM blueprints WHERE is_stable = 1 AND is_flagged = 0
    `);
    const results = stmt.all() as any[];
    const allTags = new Set<string>();

    for (const row of results) {
      const tags = JSON.parse(row.tags);
      if (Array.isArray(tags)) {
        tags.forEach(tag => allTags.add(tag));
      }
    }

    return Array.from(allTags).sort();
  }

  getTrending(limit: number): RegistryRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM blueprints
      WHERE is_stable = 1 AND is_flagged = 0
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const results = stmt.all(limit) as any[];
    return results.map((r) => this.mapRecord(r));
  }

  getAuthorBlueprints(author: string): RegistryRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM blueprints
      WHERE author = ? AND is_stable = 1 AND is_flagged = 0
      ORDER BY created_at DESC
    `);

    const results = stmt.all(author) as any[];
    return results.map((r) => this.mapRecord(r));
  }

  exists(author: string, name: string, version: string): boolean {
    const stmt = this.db.prepare(
      `SELECT 1 FROM blueprints WHERE author = ? AND name = ? AND version = ? LIMIT 1`
    );
    return stmt.get(author, name, version) !== null;
  }

  private mapRecord(row: any): RegistryRecord {
    return {
      id: row.id,
      author: row.author,
      name: row.name,
      version: row.version,
      description: row.description,
      tags: JSON.parse(row.tags),
      is_stable: row.is_stable === 1,
      is_flagged: row.is_flagged === 1,
      flag_reason: row.flag_reason,
      checksum: row.checksum,
      bundle_path: row.bundle_path,
      manifest_json: row.manifest_json,
      created_at: row.created_at,
    };
  }

  insertScan(blueprintId: number, result: ScanResult): void {
    const stmt = this.db.prepare(`
      INSERT INTO security_scans (blueprint_id, scan_status, findings_json, scanned_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(
      blueprintId,
      result.scan_status,
      JSON.stringify(result.findings),
      result.scanned_at
    );
  }

  getScan(blueprintId: number): ScanResult | null {
    const stmt = this.db.prepare(`
      SELECT scan_status, findings_json, scanned_at FROM security_scans
      WHERE blueprint_id = ?
      ORDER BY scanned_at DESC
      LIMIT 1
    `);
    const row = stmt.get(blueprintId) as any;
    if (!row) return null;
    return {
      scan_status: row.scan_status,
      findings: JSON.parse(row.findings_json),
      scanned_at: row.scanned_at,
    };
  }

  recordPublish(author: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO publish_rate_limits (author, published_at)
      VALUES (?, datetime('now'))
    `);
    stmt.run(author);
  }

  countRecentPublishes(author: string, windowSeconds: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM publish_rate_limits
      WHERE author = ? AND published_at > datetime('now', '-' || ? || ' seconds')
    `);
    const row = stmt.get(author, windowSeconds) as any;
    return row?.count ?? 0;
  }

  flagBlueprint(id: number, reason: string): void {
    const stmt = this.db.prepare(`
      UPDATE blueprints
      SET is_flagged = 1, flag_reason = ?
      WHERE id = ?
    `);
    stmt.run(reason, id);
  }

  upsertUser(github_id: string, username: string, email?: string, avatar_url?: string): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (github_id, username, email, avatar_url)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(github_id) DO UPDATE SET email = COALESCE(?, email), avatar_url = COALESCE(?, avatar_url), last_login = datetime('now')
      RETURNING id, github_id, username, email, email_verified, avatar_url, bio, website, created_at, last_login
    `);
    const result = stmt.get(github_id, username, email || null, avatar_url || null, email || null, avatar_url || null) as any;
    return {
      id: result.id,
      github_id: result.github_id,
      username: result.username,
      email: result.email,
      email_verified: result.email_verified === 1,
      avatar_url: result.avatar_url,
      bio: result.bio,
      website: result.website,
      created_at: result.created_at,
      last_login: result.last_login,
    };
  }

  getUser(id: number): User | null {
    const stmt = this.db.prepare(`
      SELECT id, github_id, username, email, email_verified, avatar_url, bio, website, created_at, last_login
      FROM users WHERE id = ?
    `);
    const result = stmt.get(id) as any;
    if (!result) return null;
    return {
      id: result.id,
      github_id: result.github_id,
      username: result.username,
      email: result.email,
      email_verified: result.email_verified === 1,
      avatar_url: result.avatar_url,
      bio: result.bio,
      website: result.website,
      created_at: result.created_at,
      last_login: result.last_login,
    };
  }

  getUserByUsername(username: string): User | null {
    const stmt = this.db.prepare(`
      SELECT id, github_id, username, email, email_verified, avatar_url, bio, website, created_at, last_login
      FROM users WHERE username = ?
    `);
    const result = stmt.get(username) as any;
    if (!result) return null;
    return {
      id: result.id,
      github_id: result.github_id,
      username: result.username,
      email: result.email,
      email_verified: result.email_verified === 1,
      avatar_url: result.avatar_url,
      bio: result.bio,
      website: result.website,
      created_at: result.created_at,
      last_login: result.last_login,
    };
  }

  updateUser(id: number, bio?: string, website?: string): User | null {
    const stmt = this.db.prepare(`
      UPDATE users SET bio = COALESCE(?, bio), website = COALESCE(?, website)
      WHERE id = ?
      RETURNING id, github_id, username, email, email_verified, avatar_url, bio, website, created_at, last_login
    `);
    const result = stmt.get(bio || null, website || null, id) as any;
    if (!result) return null;
    return {
      id: result.id,
      github_id: result.github_id,
      username: result.username,
      email: result.email,
      email_verified: result.email_verified === 1,
      avatar_url: result.avatar_url,
      bio: result.bio,
      website: result.website,
      created_at: result.created_at,
      last_login: result.last_login,
    };
  }

  toggleStar(user_id: number, blueprint_author: string, blueprint_name: string): boolean {
    const isStarred = this.isStarredBy(user_id, blueprint_author, blueprint_name);
    if (isStarred) {
      const stmt = this.db.prepare(`
        DELETE FROM stars WHERE user_id = ? AND blueprint_author = ? AND blueprint_name = ?
      `);
      stmt.run(user_id, blueprint_author, blueprint_name);
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO stars (user_id, blueprint_author, blueprint_name)
        VALUES (?, ?, ?)
      `);
      stmt.run(user_id, blueprint_author, blueprint_name);
    }
    return !isStarred;
  }

  getStarCount(blueprint_author: string, blueprint_name: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM stars WHERE blueprint_author = ? AND blueprint_name = ?
    `);
    const result = stmt.get(blueprint_author, blueprint_name) as any;
    return result?.count ?? 0;
  }

  isStarredBy(user_id: number, blueprint_author: string, blueprint_name: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM stars WHERE user_id = ? AND blueprint_author = ? AND blueprint_name = ? LIMIT 1
    `);
    return stmt.get(user_id, blueprint_author, blueprint_name) !== null;
  }

  upsertReview(user_id: number, blueprint_author: string, blueprint_name: string, rating: number, body?: string): Review {
    this.db.prepare(`
      INSERT INTO reviews (user_id, blueprint_author, blueprint_name, rating, body)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, blueprint_author, blueprint_name) DO UPDATE SET rating = ?, body = COALESCE(?, body)
    `).run(user_id, blueprint_author, blueprint_name, rating, body || null, rating, body || null);

    // Fetch the review back with user info
    const stmt = this.db.prepare(`
      SELECT r.id, u.username, u.avatar_url, r.rating, r.body, r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ? AND r.blueprint_author = ? AND r.blueprint_name = ?
    `);
    const result = stmt.get(user_id, blueprint_author, blueprint_name) as any;
    return {
      id: result.id,
      username: result.username,
      avatar_url: result.avatar_url,
      rating: result.rating,
      body: result.body,
      created_at: result.created_at,
    };
  }

  getReviews(blueprint_author: string, blueprint_name: string): Review[] {
    const stmt = this.db.prepare(`
      SELECT r.id, u.username, u.avatar_url, r.rating, r.body, r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.blueprint_author = ? AND r.blueprint_name = ?
      ORDER BY r.created_at DESC
    `);
    const results = stmt.all(blueprint_author, blueprint_name) as any[];
    return results.map(r => ({
      id: r.id,
      username: r.username,
      avatar_url: r.avatar_url,
      rating: r.rating,
      body: r.body,
      created_at: r.created_at,
    }));
  }

  getAvgRating(blueprint_author: string, blueprint_name: string): number | null {
    const stmt = this.db.prepare(`
      SELECT AVG(rating) as avg FROM reviews WHERE blueprint_author = ? AND blueprint_name = ?
    `);
    const result = stmt.get(blueprint_author, blueprint_name) as any;
    return result?.avg ? parseFloat(result.avg) : null;
  }

  incrementInstallCount(blueprint_author: string, blueprint_name: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO install_counts (blueprint_author, blueprint_name, count) VALUES (?, ?, 1)
      ON CONFLICT(blueprint_author, blueprint_name) DO UPDATE SET count = count + 1
    `);
    stmt.run(blueprint_author, blueprint_name);
  }

  getInstallCount(blueprint_author: string, blueprint_name: string): number {
    const stmt = this.db.prepare(`
      SELECT count FROM install_counts WHERE blueprint_author = ? AND blueprint_name = ?
    `);
    const result = stmt.get(blueprint_author, blueprint_name) as any;
    return result?.count ?? 0;
  }

  getNotificationPrefs(user_id: number): { email_on_star: boolean; email_on_review: boolean; email_on_new_version: boolean } | null {
    const stmt = this.db.prepare(`
      SELECT email_on_star, email_on_review, email_on_new_version FROM notification_prefs WHERE user_id = ?
    `);
    const result = stmt.get(user_id) as any;
    if (!result) return null;
    return {
      email_on_star: result.email_on_star === 1,
      email_on_review: result.email_on_review === 1,
      email_on_new_version: result.email_on_new_version === 1,
    };
  }

  upsertNotificationPrefs(user_id: number, email_on_star: boolean, email_on_review: boolean, email_on_new_version: boolean): void {
    const stmt = this.db.prepare(`
      INSERT INTO notification_prefs (user_id, email_on_star, email_on_review, email_on_new_version)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET email_on_star = ?, email_on_review = ?, email_on_new_version = ?
    `);
    stmt.run(
      user_id, email_on_star ? 1 : 0, email_on_review ? 1 : 0, email_on_new_version ? 1 : 0,
      email_on_star ? 1 : 0, email_on_review ? 1 : 0, email_on_new_version ? 1 : 0
    );
  }
}
