import { Database } from "bun:sqlite";
import type { RegistryRecord, SearchQuery } from "./types";

export interface IDatabase {
  init(): void;
  insertSubstrate(
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
      CREATE TABLE IF NOT EXISTS substrates (
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
      CREATE INDEX IF NOT EXISTS idx_substrates_author_name ON substrates(author, name);
      CREATE INDEX IF NOT EXISTS idx_substrates_stable ON substrates(is_stable);
    `);
  }

  insertSubstrate(
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
      INSERT INTO substrates (author, name, version, description, tags, checksum, bundle_path, manifest_json, is_stable)
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
      FROM substrates
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
      FROM substrates
      WHERE author = ? AND name = ? AND version = ?
      LIMIT 1
    `);

    const result = stmt.get(author, name, version) as any;
    return result ? this.mapRecord(result) : null;
  }

  getVersions(author: string, name: string): RegistryRecord[] {
    const stmt = this.db.prepare(`
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM substrates
      WHERE author = ? AND name = ?
      ORDER BY created_at DESC
    `);

    const results = stmt.all(author, name) as any[];
    return results.map((r) => this.mapRecord(r));
  }

  search(query: SearchQuery): RegistryRecord[] {
    let sql = `
      SELECT id, author, name, version, description, tags, is_stable, is_flagged, flag_reason, checksum, bundle_path, manifest_json, created_at
      FROM substrates
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

    sql += ` ORDER BY created_at DESC`;
    if (query.limit) {
      sql += ` LIMIT ?`;
      params.push(query.limit);
    }

    const stmt = this.db.prepare(sql);
    const results = stmt.all(...params) as any[];
    return results.map((r) => this.mapRecord(r));
  }

  exists(author: string, name: string, version: string): boolean {
    const stmt = this.db.prepare(
      `SELECT 1 FROM substrates WHERE author = ? AND name = ? AND version = ? LIMIT 1`
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
}
