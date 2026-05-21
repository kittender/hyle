import type { IDatabase } from "../db";
import type { Badge, ScanResult } from "../types";

export function computeAllBadges(
  author: string,
  name: string,
  db: IDatabase,
  scanResult?: ScanResult
): Badge[] {
  const badges: Badge[] = [];

  // Security badges
  if (scanResult) {
    if (scanResult.scan_status === "clean") {
      badges.push({
        type: "security_scanned",
        label: "Security Scanned",
        variant: "success",
      });
    } else if (scanResult.scan_status === "warning") {
      badges.push({
        type: "security_warning",
        label: "Security Warning",
        variant: "warning",
      });
    } else if (scanResult.scan_status === "flagged") {
      badges.push({
        type: "security_flagged",
        label: "Security Flagged",
        variant: "danger",
      });
    }
  }

  // Verified badge: reserved for official authors
  if (author === "hyle-org" || author === "anthropic") {
    badges.push({
      type: "verified",
      label: "Verified Author",
      variant: "info",
    });
  }

  // Popular badge: 1000+ stars
  const starCount = db.getStarCount(author, name);
  if (starCount >= 1000) {
    badges.push({
      type: "popular",
      label: "Popular",
      variant: "info",
    });
  }

  // Community badge: 100+ stars AND 4+ avg rating
  const avgRating = db.getAvgRating(author, name);
  if (starCount >= 100 && avgRating >= 4) {
    badges.push({
      type: "community",
      label: "Community Loved",
      variant: "info",
    });
  }

  return badges;
}
