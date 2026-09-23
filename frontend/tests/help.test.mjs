// Coverage contract for /help, README.md and the localized key lines:
// slash.ts is the single source of truth for the command list, and
// lib/helpKeys.ts is the single source of truth for the key combos. If a
// command or a combo is added in one place and forgotten in the others,
// these fail.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { builtinSlashCommands, commandUsage } from '../src/lib/slash.ts';
import { buildHelpText, helpCommandNames } from '../src/lib/help.ts';
import { helpKeyTokens, helpKeyTokenList } from '../src/lib/helpKeys.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const enDict = () => readFileSync(join(repoRoot, 'ui/frontend/src/lib/i18n.svelte.ts'), 'utf8');
const readme = () => readFileSync(join(repoRoot, 'README.md'), 'utf8');

const helpArgs = (keyLines = ['Global: Ctrl+T · Ctrl+E · Ctrl+G', 'Composer: Enter · Shift+Enter · ↑/↓ · Tab · Shift+Tab']) =>
  ({
    title: 'Commands:',
    keyLines,
    pluginTitle: 'Plugin commands:',
    plugins: [],
    describe: (_name, fallback) => fallback,
  });

test('/help lists every non-alias built-in command exactly once, with usage', () => {
  const text = buildHelpText(helpArgs());
  const cmds = helpCommandNames();
  assert.ok(cmds.length > 10, 'registry looks empty: ' + cmds.length);
  for (const c of cmds) {
    const expected = `/${c.name}${commandUsage(c)}`;
    assert.ok(text.includes(expected), `/help is missing ${expected}`);
  }
  // Aliases resolve through slashCompletion, so listing them would just
  // double the page — assert they are NOT rendered as their own rows.
  for (const c of builtinSlashCommands().filter((c) => c.aliasOf)) {
    const row = `  /${c.name}${commandUsage(c)}`;
    assert.ok(!text.includes(row), `/help lists the alias /${c.name} separately`);
  }
});

test('/help renders the key lines and plugin commands', () => {
  const text = buildHelpText({
    ...helpArgs(['Global: Ctrl+T', 'Composer: Enter']),
    plugins: [{ name: 'weather-look', description: 'look up a forecast', component: 'weather' }],
  });
  assert.ok(text.includes('Global: Ctrl+T'));
  assert.ok(text.includes('Composer: Enter'));
  assert.ok(text.includes('Plugin commands:'));
  assert.ok(text.includes('/weather-look — look up a forecast (weather)'));
});

test('every documented key combo appears in all three locales of /help', () => {
  // help.keys + help.input exist in en, zh and zh-TW: a token used by one
  // scope must therefore occur at least three times across those lines.
  const helpLines = enDict()
    .split('\n')
    .filter((l) => /"(help\.(keys|input))":/.test(l));
  assert.equal(helpLines.length, 6, 'expected help.keys+help.input in 3 locales');
  const haystack = helpLines.join('\n');
  for (const token of helpKeyTokenList) {
    const count = helpLines.filter((l) => l.includes(token)).length;
    assert.ok(count >= 3, `key "${token}" missing from ${3 - count} locale(s): ${haystack}`);
  }
});

test('README.md documents every built-in slash command', () => {
  const text = readme();
  for (const c of helpCommandNames()) {
    assert.ok(text.includes(`/${c.name}`), `README.md does not mention /${c.name}`);
  }
});

test('README.md documents every key combo', () => {
  const text = readme();
  for (const tokens of helpKeyTokens) {
    for (const token of tokens) {
      assert.ok(text.includes(token), `README.md does not mention the key combo ${tokens.join(' / ')}`);
    }
  }
});
