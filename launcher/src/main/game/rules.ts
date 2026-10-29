// Rules in Mojang's version files decide which libraries and arguments apply to which
// system: without rules everything applies; otherwise the last matching rule wins.

export interface Rule {
  action: 'allow' | 'disallow';
  os?: { name?: string; arch?: string; version?: string };
  features?: Record<string, boolean>;
}

/** Processor architectures the launcher supports on Windows. */
export type WindowsArch = 'x64' | 'arm64' | 'x86';

export interface RuleEnvironment {
  arch: WindowsArch;
  /** Windows version as in os.release(), e.g. 10.0.19044. */
  osVersion: string;
  /** Launcher features such as has_custom_resolution; missing ones count as false. */
  features: Record<string, boolean>;
}

/** Maps Node's process.arch to the architectures in Mojang's data. */
export function toWindowsArch(arch: string): WindowsArch {
  if (arch === 'arm64') return 'arm64';
  if (arch === 'ia32') return 'x86';
  return 'x64';
}

function ruleMatches(rule: Rule, env: RuleEnvironment): boolean {
  if (rule.os) {
    if (rule.os.name !== undefined && rule.os.name !== 'windows') return false;
    // Mojang uses "x86" for 32-bit systems only.
    if (rule.os.arch !== undefined && rule.os.arch !== env.arch) return false;
    if (rule.os.version !== undefined) {
      try {
        if (!new RegExp(rule.os.version).test(env.osVersion)) return false;
      } catch {
        return false;
      }
    }
  }
  if (rule.features) {
    for (const [feature, expected] of Object.entries(rule.features)) {
      if ((env.features[feature] ?? false) !== expected) return false;
    }
  }
  return true;
}

export function rulesAllow(rules: readonly Rule[] | undefined, env: RuleEnvironment): boolean {
  if (!rules || rules.length === 0) {
    return true;
  }
  let allowed = false;
  for (const rule of rules) {
    if (ruleMatches(rule, env)) {
      allowed = rule.action === 'allow';
    }
  }
  return allowed;
}
