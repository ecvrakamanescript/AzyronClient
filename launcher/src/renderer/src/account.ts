/** The signed-in Minecraft account as the UI needs it. */
export interface Account {
  name: string;
}

/**
 * Placeholder until the Microsoft sign-in exists (step 2.7, after Mojang has approved
 * the client ID): nobody is signed in, so the game cannot be started.
 */
export function useAccount(): Account | null {
  return null;
}
