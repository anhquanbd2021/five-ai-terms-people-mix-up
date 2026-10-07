import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocStore, fineTune, buildRag, ask, isStale, TRAINING_BILL_USD } from '../public/freshness.mjs';
import { POLICY_DOCS, POLICY_UPDATE } from '../public/fixtures.mjs';

test('fine-tuned snapshot and RAG agree before any doc update', () => {
  const store = createDocStore(POLICY_DOCS);
  const tuned = fineTune(store);
  const rag = buildRag(store);
  assert.equal(ask(tuned, 'refund-policy').text, ask(rag, 'refund-policy').text);
});

test('after a doc update the fine-tuned model goes stale; RAG stays fresh', () => {
  const store = createDocStore(POLICY_DOCS);
  const tuned = fineTune(store);
  const rag = buildRag(store);
  store.update(POLICY_UPDATE.id, POLICY_UPDATE.text);

  const ftAnswer = ask(tuned, 'refund-policy');
  const ragAnswer = ask(rag, 'refund-policy');
  assert.equal(isStale(tuned, store, 'refund-policy'), true);
  assert.equal(isStale(rag, store, 'refund-policy'), false);
  assert.equal(ftAnswer.text, 'Enterprise refunds are approved within 30 days of invoice.');
  assert.equal(ragAnswer.text, POLICY_UPDATE.text);
  assert.equal(ftAnswer.version, 1);
  assert.equal(ragAnswer.version, 2);
});

test('fine-tuning carries a training bill; RAG does not', () => {
  const store = createDocStore(POLICY_DOCS);
  assert.equal(fineTune(store).billUsd, TRAINING_BILL_USD);
  assert.equal(buildRag(store).billUsd, 0);
});

test('the pair cuts both ways: only fine-tuning can supply new behaviour', () => {
  const store = createDocStore(POLICY_DOCS);
  const tunedJson = fineTune(store, { behaviour: { formats: ['json'] } });
  const rag = buildRag(store);
  const ft = ask(tunedJson, 'refund-policy', { format: 'json' });
  const rg = ask(rag, 'refund-policy', { format: 'json' });
  assert.equal(ft.formatHonoured, true);
  assert.deepEqual(JSON.parse(ft.text), { answer: 'Enterprise refunds are approved within 30 days of invoice.' });
  assert.equal(rg.formatHonoured, false);
});

test('every fine-tuned doc in the snapshot freezes its train-time version', () => {
  const store = createDocStore(POLICY_DOCS);
  const tuned = fineTune(store);
  store.update('sla', 'P1 tickets get a first response within 15 minutes.');
  assert.equal(ask(tuned, 'sla').text, 'P1 tickets get a first response within 1 business hour.');
  assert.equal(isStale(tuned, store, 'sla'), true);
  assert.equal(isStale(tuned, store, 'pricing'), false);
});
