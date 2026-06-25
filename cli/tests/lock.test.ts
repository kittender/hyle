import { expect, test, describe } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as yaml from "js-yaml";
import { readLock, writeLock, upsertLockEntry, type LockEntry } from "../src/lock";

function makeTmpDir(): string {
	return mkdtempSync(join(tmpdir(), "hyle-lock-test-"));
}

describe("lock", () => {
	test("readLock: no file → returns empty array", () => {
		const dir = makeTmpDir();
		try {
			const entries = readLock(dir);
			expect(entries).toEqual([]);
		} finally {
			rmSync(dir, { recursive: true });
		}
	});

	test("writeLock: creates hyle.lock with YAML format", () => {
		const dir = makeTmpDir();
		try {
			const entries: LockEntry[] = [
				{
					name: "test-blueprint",
					author: "test-author",
					version: "1.0.0",
					bundle_checksum: "abc123",
					pulled_at: "2026-05-20T10:00:00Z",
					files: [{ path: "CLAUDE.md", checksum: "def456" }],
				},
			];

			writeLock(dir, entries);

			const content = readFileSync(join(dir, "hyle.lock"), "utf-8");
			const parsed = yaml.load(content);
			expect(Array.isArray(parsed)).toBe(true);
			expect((parsed as LockEntry[])[0].name).toBe("test-blueprint");
		} finally {
			rmSync(dir, { recursive: true });
		}
	});

	test("upsertLockEntry: adds new entry", () => {
		const dir = makeTmpDir();
		try {
			const entry: LockEntry = {
				name: "new-blueprint",
				author: "new-author",
				version: "1.0.0",
				bundle_checksum: "checksum1",
				pulled_at: "2026-05-20T10:00:00Z",
				files: [],
			};

			upsertLockEntry(dir, entry);

			const entries = readLock(dir);
			expect(entries.length).toBe(1);
			expect(entries[0].name).toBe("new-blueprint");
		} finally {
			rmSync(dir, { recursive: true });
		}
	});

	test("upsertLockEntry: replaces existing entry by author+name", () => {
		const dir = makeTmpDir();
		try {
			const entry1: LockEntry = {
				name: "blueprint",
				author: "author",
				version: "1.0.0",
				bundle_checksum: "checksum1",
				pulled_at: "2026-05-20T10:00:00Z",
				files: [],
			};

			const entry2: LockEntry = {
				name: "blueprint",
				author: "author",
				version: "2.0.0",
				bundle_checksum: "checksum2",
				pulled_at: "2026-05-20T11:00:00Z",
				files: [],
			};

			upsertLockEntry(dir, entry1);
			upsertLockEntry(dir, entry2);

			const entries = readLock(dir);
			expect(entries.length).toBe(1);
			expect(entries[0].version).toBe("2.0.0");
		} finally {
			rmSync(dir, { recursive: true });
		}
	});

	test("upsertLockEntry: preserves other entries", () => {
		const dir = makeTmpDir();
		try {
			const entry1: LockEntry = {
				name: "blueprint1",
				author: "author1",
				version: "1.0.0",
				bundle_checksum: "checksum1",
				pulled_at: "2026-05-20T10:00:00Z",
				files: [],
			};

			const entry2: LockEntry = {
				name: "blueprint2",
				author: "author2",
				version: "1.0.0",
				bundle_checksum: "checksum2",
				pulled_at: "2026-05-20T10:00:00Z",
				files: [],
			};

			upsertLockEntry(dir, entry1);
			upsertLockEntry(dir, entry2);

			const entries = readLock(dir);
			expect(entries.length).toBe(2);
			expect(entries.some((e) => e.name === "blueprint1")).toBe(true);
			expect(entries.some((e) => e.name === "blueprint2")).toBe(true);
		} finally {
			rmSync(dir, { recursive: true });
		}
	});

	test("upsertLockEntry: extends_from persists through write/read", () => {
		const dir = makeTmpDir();
		try {
			const entry: LockEntry = {
				name: "child-blueprint",
				author: "acme",
				version: "1.0.0",
				bundle_checksum: "checksum1",
				pulled_at: "2026-05-20T10:00:00Z",
				extends_from: "alice/parent-blueprint@2.0.0",
				files: [],
			};

			upsertLockEntry(dir, entry);

			const entries = readLock(dir);
			expect(entries[0].extends_from).toBe("alice/parent-blueprint@2.0.0");
		} finally {
			rmSync(dir, { recursive: true });
		}
	});

	test("upsertLockEntry: extends_from absent when not set", () => {
		const dir = makeTmpDir();
		try {
			const entry: LockEntry = {
				name: "blueprint",
				author: "author",
				version: "1.0.0",
				bundle_checksum: "checksum1",
				pulled_at: "2026-05-20T10:00:00Z",
				files: [],
			};

			upsertLockEntry(dir, entry);

			const entries = readLock(dir);
			expect(entries[0].extends_from).toBeUndefined();
		} finally {
			rmSync(dir, { recursive: true });
		}
	});
});
