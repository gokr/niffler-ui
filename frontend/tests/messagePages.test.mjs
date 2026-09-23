import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listAllMessages } from '../src/lib/messagePages.ts';

test('loads every message page in order, using the store cursor', async () => {
  const calls = [];
  const send = async (component, tool, args) => {
    calls.push({ component, tool, args });
    return calls.length === 1
      ? { items: [{ id: 's:000000' }], hasMore: true, nextAfter: 's:000000' }
      : { items: [{ id: 's:000001' }], hasMore: false };
  };
  assert.deepEqual(await listAllMessages(send, 's'), [{ id: 's:000000' }, { id: 's:000001' }]);
  assert.deepEqual(calls, [
    { component: 'store', tool: 'list', args: { kind: 'message', idPrefix: 's:', limit: 1000 } },
    { component: 'store', tool: 'list', args: { kind: 'message', idPrefix: 's:', limit: 1000, after: 's:000000' } },
  ]);
});

test('refuses broken pagination instead of looping forever or showing partial history', async () => {
  for (const cursor of [undefined, '', 'same']) {
    let calls = 0;
    await assert.rejects(listAllMessages(async () => {
      calls++;
      return { items: [], hasMore: true, nextAfter: cursor === 'same' ? 'same' : cursor };
    }, 's'));
    assert.ok(calls <= 2);
  }
});
