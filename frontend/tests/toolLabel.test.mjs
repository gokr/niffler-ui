import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toolLabel } from '../src/lib/toolLabel.ts';

test('compact gateway labels show the targeted component or tool', () => {
  assert.equal(toolLabel('discover', { component: 'fabric', query: 'batch' }), 'discover(fabric)');
  assert.equal(toolLabel('discover', { tools: ['skill_load'] }), 'discover(skill_load)');
  assert.equal(toolLabel('invoke', { tool: 'fetch', arguments: { url: 'https://example.org' } }), 'invoke(fetch)');
  assert.equal(toolLabel('invoke', { tool: 'git.git_status' }), 'invoke(git.git_status)');
});

test('missing or ambiguous target falls back to the real tool name', () => {
  assert.equal(toolLabel('discover', { query: 'build' }), 'discover');
  assert.equal(toolLabel('discover', { tools: ['read', 'write'] }), 'discover');
  assert.equal(toolLabel('invoke', { tool: '' }), 'invoke');
  assert.equal(toolLabel('invoke', null), 'invoke');
  assert.equal(toolLabel('invoke', { tool: 42 }), 'invoke');
  assert.equal(toolLabel('bash', { command: 'echo hi' }), 'bash');
  assert.equal(toolLabel(undefined, {}), 'tool');
});
