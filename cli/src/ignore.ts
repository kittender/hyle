import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { isMatch } from "micromatch";

export class IgnorePatterns {
  patterns: string[];

  constructor(patterns: string[] = []) {
    this.patterns = patterns
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith("#"));
  }

  static loadFromPath(path: string): IgnorePatterns {
    if (!existsSync(path)) return new IgnorePatterns();
    const content = readFileSync(path, "utf8");
    return new IgnorePatterns(content.split("\n"));
  }

  matches(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, "/");
    for (let pattern of this.patterns) {
      const normalizedPattern = pattern.replace(/\\/g, "/");

      // Direct match
      if (isMatch(normalized, normalizedPattern)) {
        return true;
      }

      // Directory match (ends with /)
      if (normalizedPattern.endsWith("/") && normalized.startsWith(normalizedPattern)) {
        return true;
      }

      // Gitignore-style: single-level patterns should also match in subdirs
      if (!normalizedPattern.includes("/") && !normalizedPattern.includes("**")) {
        // Try matching with **/pattern for patterns without path separators
        if (isMatch(normalized, `**/${normalizedPattern}`)) {
          return true;
        }
      }
    }
    return false;
  }
}
