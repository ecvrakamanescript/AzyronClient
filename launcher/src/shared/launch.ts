/** Result of checking whether an instance could start (the game itself is not started). */
export interface LaunchCheck {
  /** Version file, all game files and the Java runtime are present, and Java starts. */
  filesReady: boolean;
  /** Number of files that are missing or have the wrong size. */
  missingFiles: number;
  /** Version reported by the instance's Java runtime, or null if it does not start. */
  javaVersion: string | null;
  /** Start command (executable and arguments) with a placeholder account and no access token. */
  commandPreview: string[];
}
