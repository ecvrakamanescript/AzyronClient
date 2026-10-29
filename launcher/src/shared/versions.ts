/** Minecraft versions the launcher offers: releases and snapshots from 1.21 on. */
export type VersionType = 'release' | 'snapshot';

export interface VersionSummary {
  id: string;
  type: VersionType;
  /** ISO date of the release, e.g. 2026-09-15T10:00:00+00:00. */
  releaseTime: string;
}

export interface VersionList {
  latestRelease: string | null;
  latestSnapshot: string | null;
  /** Newest first. Snapshots only if they were requested. */
  versions: VersionSummary[];
  /** True if Mojang could not be reached and the saved list is shown. */
  offline: boolean;
}

/** Oldest supported version (phase 2); 1.8.9 follows in its own phase. */
export const OLDEST_SUPPORTED_VERSION = '1.21';
