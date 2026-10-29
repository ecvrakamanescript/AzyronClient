import { useEffect, useState } from 'react';
import type { InstallState } from '../../shared/install';

/**
 * Installation state per version: loaded once for the given versions and then
 * updated by every event from the main process.
 */
export function useInstallStates(versionIds: readonly string[]): Record<string, InstallState> {
  const [states, setStates] = useState<Record<string, InstallState>>({});
  // A stable key, so the effect only runs again when the set of versions changes.
  const key = [...new Set(versionIds)].sort().join('\n');

  useEffect(() => {
    let active = true;
    const ids = key ? key.split('\n') : [];
    const unsubscribe = window.azyron.install.onStateChange(({ versionId, state }) => {
      setStates((previous) => ({ ...previous, [versionId]: state }));
    });
    if (ids.length > 0) {
      void window.azyron.install.getStates(ids).then((loaded) => {
        // Events that arrived meanwhile are newer than the loaded states.
        if (active) setStates((previous) => ({ ...loaded, ...previous }));
      });
    }
    return () => {
      active = false;
      unsubscribe();
    };
  }, [key]);

  return states;
}
