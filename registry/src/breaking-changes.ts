import type { HyleManifest, DepEntry, ModelConfig } from "../../../cli/src/manifest";

export interface BreakingChange {
  severity: "breaking" | "warning";
  category:
    | "model_change"
    | "dependency_removed"
    | "dependency_downgrade"
    | "files_removed"
    | "provider_change"
    | "extends_changed";
  detail: string;
}

function compareModels(oldModel: ModelConfig, newModel: ModelConfig, modelType: string): BreakingChange[] {
  const changes: BreakingChange[] = [];

  if (oldModel.provider !== newModel.provider) {
    changes.push({
      severity: "breaking",
      category: "provider_change",
      detail: `${modelType}: provider changed from "${oldModel.provider}" to "${newModel.provider}"`,
    });
  }

  if (oldModel.model !== newModel.model) {
    changes.push({
      severity: "breaking",
      category: "model_change",
      detail: `${modelType}: model changed from "${oldModel.model}" to "${newModel.model}"`,
    });
  }

  return changes;
}

function compareDeps(oldDeps: DepEntry[] | undefined, newDeps: DepEntry[] | undefined): BreakingChange[] {
  const changes: BreakingChange[] = [];
  const oldMap = new Map((oldDeps ?? []).map((d) => [d.name, d]));
  const newMap = new Map((newDeps ?? []).map((d) => [d.name, d]));

  // Check for removed dependencies
  for (const [name, oldDep] of oldMap) {
    if (!newMap.has(name)) {
      changes.push({
        severity: "breaking",
        category: "dependency_removed",
        detail: `Dependency removed: "${name}@${oldDep.version}"`,
      });
    } else {
      const newDep = newMap.get(name)!;
      // Check for version downgrade (simple semver check)
      if (newDep.version < oldDep.version) {
        changes.push({
          severity: "warning",
          category: "dependency_downgrade",
          detail: `Dependency downgraded: "${name}" from "${oldDep.version}" to "${newDep.version}"`,
        });
      }
    }
  }

  return changes;
}

function compareFileLists(
  oldFiles: string[] | undefined,
  newFiles: string[] | undefined,
  category: string
): BreakingChange[] {
  const changes: BreakingChange[] = [];
  const oldSet = new Set(oldFiles ?? []);
  const newSet = new Set(newFiles ?? []);

  // Find removed files
  const removed: string[] = [];
  for (const file of oldSet) {
    if (!newSet.has(file)) {
      removed.push(file);
    }
  }

  if (removed.length > 0) {
    changes.push({
      severity: "warning",
      category: "files_removed",
      detail: `${category}: removed ${removed.length} file(s): ${removed.slice(0, 3).join(", ")}${removed.length > 3 ? "..." : ""}`,
    });
  }

  return changes;
}

export function detectBreakingChanges(oldManifest: HyleManifest, newManifest: HyleManifest): BreakingChange[] {
  const changes: BreakingChange[] = [];

  // Check model changes
  if (oldManifest.models.primary && newManifest.models.primary) {
    changes.push(...compareModels(oldManifest.models.primary, newManifest.models.primary, "primary model"));
  }

  if (oldManifest.models.secondary && newManifest.models.secondary) {
    changes.push(...compareModels(oldManifest.models.secondary, newManifest.models.secondary, "secondary model"));
  }

  // Check dependency changes
  changes.push(...compareDeps(oldManifest.dependencies, newManifest.dependencies));

  // Check file list changes
  changes.push(...compareFileLists(oldManifest.ontology, newManifest.ontology, "ontology"));
  changes.push(...compareFileLists(oldManifest.craft, newManifest.craft, "craft"));
  changes.push(...compareFileLists(oldManifest.identities, newManifest.identities, "identities"));
  changes.push(...compareFileLists(oldManifest.ethics, newManifest.ethics, "ethics"));

  // Check extends field change
  if (oldManifest.extends !== newManifest.extends) {
    changes.push({
      severity: "breaking",
      category: "extends_changed",
      detail: `extends field changed from "${oldManifest.extends ?? "(none)"}" to "${newManifest.extends ?? "(none)"}""`,
    });
  }

  return changes;
}
