/** Every keyboard combo the UI documents, as verbatim tokens: the composer,
 * the global display cycles and the approval prompt. /help renders these
 * through the localized `help.keys` / `help.input` lines, README.md's
 * "Keyboard shortcuts" table lists the same tokens, and
 * tests/help.test.mjs fails if either side drops one.
 *
 * Each inner array is one shortcut (one combo can be spelled "Enter / Esc"
 * or "Tab / Shift+Tab"); every token must appear in each locale's line. */

export const helpKeyTokens: readonly (readonly string[])[] = [
  ['Enter', 'Esc'], // composer: send (Esc also dismisses completion first)
  ['Shift+Enter'], // composer: newline without sending
  ['↑', '↓'], // composer: command history
  ['Tab', 'Shift+Tab'], // composer: open slash completion / cycle candidates
  ['Ctrl+T'], // global: reasoning display
  ['Ctrl+E'], // global: tool card display
  ['Ctrl+G'], // global: thinking effort
  ['Enter', 'Esc'], // approval prompt: approve / deny
];

/** Flat token list, de-duplicated, for coverage assertions. */
export const helpKeyTokenList: readonly string[] = [
  ...new Set(helpKeyTokens.flat()),
];
