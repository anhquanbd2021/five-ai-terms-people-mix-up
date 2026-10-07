import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { classifyNeed } from '../public/decision.mjs';
import { NEEDS } from '../public/fixtures.mjs';
import { PAIRS } from '../public/pairs.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const needsFile = JSON.parse(await readFile(`${root}examples/needs.json`, 'utf8'));

test('browser NEEDS fixture stays in sync with examples/needs.json', () => {
  assert.deepEqual(NEEDS, needsFile);
});

test('classifier: changing facts → rag', () => {
  assert.equal(classifyNeed('Answers must reflect the refund policy updated this morning'), 'rag');
  assert.equal(classifyNeed('Search answers over the company wiki that changes weekly'), 'rag');
  assert.equal(classifyNeed('Knows the new pricing sheet released this week'), 'rag');
  assert.equal(classifyNeed('Answers questions about current events from a live feed'), 'rag');
});

test('classifier: new behaviour → finetune', () => {
  assert.equal(classifyNeed('Always respond in a terse military tone'), 'finetune');
  assert.equal(classifyNeed("Formats every filing in the regulator's JSON schema"), 'finetune');
});

test('exactly three of the six example teams picked the wrong tool', () => {
  const wrong = needsFile.filter(n => n.picked !== classifyNeed(n.need));
  assert.equal(wrong.length, 3);
  assert.deepEqual(wrong.map(n => n.team).sort(), ['sales-copilot', 'support-bot', 'voice-assistant']);
});

test('the pairs table covers all five confusions and each names its lab', () => {
  assert.equal(PAIRS.length, 5);
  for (const p of PAIRS) {
    assert.ok(p.confusion && p.failure && p.test && p.lab, `${p.id} is incomplete`);
  }
});
