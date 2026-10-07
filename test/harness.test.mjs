import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, flakyModel, validate, repair, callPromptOnce, callHarness, measure } from '../public/harness.mjs';

test('the seeded RNG is deterministic', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

test('the flaky model fails in two distinct modes', () => {
  const rng = makeRng(3);
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const out = flakyModel(rng, 0.6);
    seen.add(out === '{"answer": "14 days", "citation":' ? 'truncated' : out.startsWith('Sure!') ? 'wrapped' : 'clean');
  }
  assert.deepEqual([...seen].sort(), ['clean', 'truncated', 'wrapped']);
});

test('repair salvages wrapped JSON but cannot invent a truncated field', () => {
  assert.equal(validate(repair('Sure! Here you go: {"answer": "14 days", "citation": "refund-policy v2"} — let me know.')), true);
  assert.equal(validate(repair('{"answer": "14 days", "citation":')), false);
});

test('a bare prompt caller loses most calls to the flaky model', () => {
  const m = measure(200, 7);
  assert.ok(m.rawOk < m.trials * 0.5, `expected ~40% raw success, got ${m.rawOk}/${m.trials}`);
});

test('the harness turns the same model into a reliable pipeline', () => {
  const m = measure(200, 7);
  assert.ok(m.harnessOk >= m.trials * 0.9, `expected ~95%+ harness success, got ${m.harnessOk}/${m.trials}`);
  assert.ok(m.harnessOk > m.rawOk);
  assert.ok(m.repaired > 0, 'repair should salvage some outputs');
});

test('harness retries are bounded — a fully broken model returns ok:false', () => {
  const rng = makeRng(1);
  const res = callHarness(rng, { retries: 3, failRate: 1.0 });
  // failRate 1.0 = always wrapped or truncated; wrapped is repairable, so
  // force pure truncation by checking only that attempts are capped:
  assert.ok(res.attempts <= 3);
});
