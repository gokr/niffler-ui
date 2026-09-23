/** Generate the /help body. Split out of Chat.svelte so the rendering is
 * unit-testable: the command list itself comes from slash.ts (so /help can
 * never go stale), the descriptions are localized by the caller's callback,
 * and the key lines are supplied already localized. */

import { builtinSlashCommands, commandUsage, type SlashCommand } from './slash.ts';

export interface HelpPluginCommand {
  name: string;
  description?: string;
  component?: string;
}

export interface HelpTextArgs {
  /** Localized heading above the built-in commands, e.g. "Commands:". */
  title: string;
  /** Localized key-combo lines (one per line of output), already translated —
   * their tokens come from helpKeys.ts so /help and README.md agree. */
  keyLines: string[];
  /** Localized heading above plugin commands, e.g. "Plugin commands:". */
  pluginTitle: string;
  /** Plugin slash commands currently registered on the bus. */
  plugins: HelpPluginCommand[];
  /** Localized description lookup: (name, English fallback) -> text. */
  describe: (name: string, fallback: string) => string;
}

export function buildHelpText(a: HelpTextArgs): string {
  const lines = [a.title];
  for (const c of builtinSlashCommands()) {
    if (c.aliasOf) continue;
    lines.push(`  /${c.name}${commandUsage(c)} — ${a.describe(c.name, c.description ?? '')}`);
  }
  if (a.keyLines.length > 0) lines.push('', ...a.keyLines);
  if (a.plugins.length > 0) {
    lines.push('', a.pluginTitle);
    for (const c of a.plugins) {
      lines.push(`  /${c.name}${c.description ? ' — ' + c.description : ''}${c.component ? ` (${c.component})` : ''}`);
    }
  }
  return lines.join('\n');
}

/** The built-in commands /help lists, aliases collapsed — exported so tests
 * can assert the rendered text against this list. */
export function helpCommandNames(): SlashCommand[] {
  return builtinSlashCommands().filter((c) => !c.aliasOf);
}
