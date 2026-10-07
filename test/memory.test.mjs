import test from 'node:test';
import assert from 'node:assert/strict';
import { runConversation, CONTEXT_WINDOW_TURNS } from '../public/memory.mjs';
import { DEMO_TURNS } from '../public/fixtures.mjs';

test('a window-only context forgets the turn-1 fact by turn 9', () => {
  const res = runConversation({ turns: DEMO_TURNS });
  const fact = res.results.find(r => r.key === 'style');
  assert.equal(fact.recalled, false);
  assert.ok(DEMO_TURNS.length - fact.statedAtTurn >= CONTEXT_WINDOW_TURNS);
});

test('a memory store recalls the same fact at the same turn', () => {
  const res = runConversation({ turns: DEMO_TURNS, useMemory: true });
  const fact = res.results.find(r => r.key === 'style');
  assert.equal(fact.recalled, true);
  assert.equal(fact.via, 'memory');
  assert.equal(res.memoryEntries, 1);
});

test('stuffing the full history recalls too — but bills more tokens', () => {
  const full = runConversation({ turns: DEMO_TURNS, fullContext: true });
  const mem = runConversation({ turns: DEMO_TURNS, useMemory: true });
  assert.equal(full.results[0].recalled, true);
  assert.ok(full.billedTokens > mem.billedTokens,
    `expected full-context (${full.billedTokens}) > memory (${mem.billedTokens})`);
});

test('context bills grow every turn without memory; memory adds a small constant', () => {
  const windowed = runConversation({ turns: DEMO_TURNS });
  assert.deepEqual(
    windowed.billedPerTurn.slice(-2).map(t => t / 120),
    [CONTEXT_WINDOW_TURNS, CONTEXT_WINDOW_TURNS],
    'window caps at 4 turns billed per call',
  );
});
