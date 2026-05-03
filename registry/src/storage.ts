import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface IStorage {
  init(): Promise<void>;
  storeBundleblob(key: string, data: Uint8Array): Promise<string>;
  retrieveBundle(key: string): Promise<Uint8Array>;
  bundleExists(key: string): Promise<boolean>;
}

export class LocalStorage implements IStorage {
  private basePath: string;

  constructor(basePath: string = "./bundles") {
    this.basePath = basePath;
  }

  async init(): Promise<void> {
    await mkdir(this.basePath, { recursive: true });
  }

  async storeBundle(key: string, data: Uint8Array): Promise<string> {
    const filePath = join(this.basePath, key);
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, data);
    return filePath;
  }

  async retrieveBundle(key: string): Promise<Uint8Array> {
    const filePath = join(this.basePath, key);
    return await readFile(filePath);
  }

  async bundleExists(key: string): Promise<boolean> {
    const filePath = join(this.basePath, key);
    try {
      return existsSync(filePath);
    } catch {
      return false;
    }
  }
}
