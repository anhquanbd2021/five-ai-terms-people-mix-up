import test from 'node:test';
import assert from 'node:assert/strict';
import { tryShip, PROTOTYPE_ARTIFACT, HARDENED_ARTIFACT, LEARNING_GATES, DELIVERY_GATES } from '../public/gates.mjs';

test('the prototype artifact passes the learning stage', () => {
  const res = tryShip(PROTOTYPE_ARTIFACT, 'prototype');
  assert.equal(res.shipped, true);
  assert.deepEqual(res.required, LEARNING_GATES);
});

test('the same prototype is blocked at the production stage', () => {
  const res = tryShip(PROTOTYPE_ARTIFACT, 'production');
  assert.equal(res.shipped, false);
  assert.deepEqual(res.failed, DELIVERY_GATES);
  assert.equal(res.failed.length, 4);
});

test('the hardened artifact ships to production', () => {
  const res = tryShip(HARDENED_ARTIFACT, 'production');
  assert.equal(res.shipped, true);
  assert.deepEqual(res.failed, []);
});

test('unknown stages throw instead of shipping', () => {
  assert.throws(() => tryShip(PROTOTYPE_ARTIFACT, 'staging-ish'));
});
