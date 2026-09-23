/** Read a complete store kind/prefix without mistaking the first 1000-row page
 * for the transcript. Cursors belong to the store, not to array offsets. */
export async function listAllMessages(
  send: (component: string, tool: string, args: Record<string, unknown>) => Promise<any>,
  sessionId: string,
): Promise<any[]> {
  const items: any[] = [];
  let after = '';
  const seen = new Set<string>();
  while (true) {
    const page = await send('store', 'list', {
      kind: 'message', idPrefix: sessionId + ':', limit: 1000,
      ...(after ? { after } : {}),
    });
    items.push(...(page.items ?? []));
    if (!page.hasMore) return items;
    const next = page.nextAfter;
    if (typeof next !== 'string' || !next || seen.has(next)) {
      throw new Error('store list returned a missing or repeated cursor');
    }
    seen.add(next);
    after = next;
  }
}
