/** Installation of a Minecraft version (shared by all instances with that version). */
export type InstallStage = 'metadata' | 'game' | 'java';

export interface InstallProgress {
  stage: InstallStage;
  completedBytes: number;
  totalBytes: number;
  completedFiles: number;
  totalFiles: number;
}

/** Why an installation failed; the UI shows a translated text for each reason. */
export type InstallFailure = 'disk-space' | 'network' | 'other';

export type InstallState =
  | { status: 'not-installed' }
  | { status: 'installing'; progress: InstallProgress }
  | { status: 'installed' }
  | { status: 'failed'; reason: InstallFailure; detail: string };

export interface InstallStateEvent {
  versionId: string;
  state: InstallState;
}
