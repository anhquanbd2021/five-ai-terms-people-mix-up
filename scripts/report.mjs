// Side-by-side report: run every lab both ways and price the wrong pick.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PAIRS } from '../public/pairs.mjs';
import { POLICY_DOCS, POLICY_UPDATE, DEMO_TURNS } from '../public/fixtures.mjs';
import { createDocStore, fineTune, buildRag, ask, isStale, TRAINING_BILL_USD, RETRAIN_LAG_DAYS } from '../public/freshness.mjs';
import { runLoop, COLLECT_CITATIONS, citationGoal, ITERATION_COST_USD } from '../public/loop.mjs';
import { measure } from '../public/harness.mjs';
import { runConversation } from '../public/memory.mjs';
import { tryShip, PROTOTYPE_ARTIFACT, HARDENED_ARTIFACT } from '../public/gates.mjs';
import { classifyNeed } from '../public/decision.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const needs = JSON.parse(await readFile(`${root}examples/needs.json`, 'utf8'));

console.log('Term Cost Lab — five pairs, wrong side first\n');

// ── 1. RAG vs fine-tuning ────────────────────────────────────────────────
console.log('1 · RAG vs fine-tuning — "what is the enterprise refund window?"');
const store = createDocStore(POLICY_DOCS);
const tuned = fineTune(store);
const rag = buildRag(store);
const before = { ft: ask(tuned, 'refund-policy'), rag: ask(rag, 'refund-policy') };
console.log(`   before update — fine-tuned: "${before.ft.text}" | RAG: "${before.rag.text}"`);
store.update(POLICY_UPDATE.id, POLICY_UPDATE.text);
const after = { ft: ask(tuned, 'refund-policy'), rag: ask(rag, 'refund-policy') };
console.log(`   policy updated to v${store.get('refund-policy').version} (${POLICY_UPDATE.text})`);
console.log(`   after update  — fine-tuned: "${after.ft.text}"  [${isStale(tuned, store, 'refund-policy') ? 'STALE' : 'fresh'}]`);
console.log(`                   RAG:        "${after.rag.text}"  [${isStale(rag, store, 'refund-policy') ? 'STALE' : 'fresh'}]`);
console.log(`   cost — fine-tune bill $${TRAINING_BILL_USD.toLocaleString()} + ~${RETRAIN_LAG_DAYS}d retrain lag per doc change | RAG bill $${rag.billUsd}`);
const tunedJson = fineTune(createDocStore(POLICY_DOCS), { behaviour: { formats: ['json'] } });
const ragJson = ask(rag, 'refund-policy', { format: 'json' });
console.log(`   the pair cuts both ways — "answer as JSON": fine-tune honoured=${ask(tunedJson, 'refund-policy', { format: 'json' }).formatHonoured}, RAG honoured=${ragJson.formatHonoured}`);

console.log('\n   examples/needs.json — team picks scored by the classifier:');
for (const n of needs) {
  const correct = classifyNeed(n.need);
  const mark = n.picked === correct ? ' ok ' : 'WRONG';
  console.log(`   ${mark}  ${n.team.padEnd(19)} picked ${n.picked.padEnd(9)} correct: ${correct.padEnd(9)} — ${n.need}`);
}

// ── 2. Loop vs goal ──────────────────────────────────────────────────────
console.log('\n2 · loop vs goal — "collect citations until you have 3"');
const withGoal = runLoop({ task: COLLECT_CITATIONS, goal: citationGoal });
const without = runLoop({ task: COLLECT_CITATIONS });
console.log(`   with goal:    stopped at iteration ${withGoal.iterations} (${withGoal.stoppedReason}) — $${withGoal.costUsd}`);
console.log(`   without goal: stopped at iteration ${without.iterations} (${without.stoppedReason}) — $${without.costUsd}, ${without.wastedIterations} wasted iterations @ $${ITERATION_COST_USD}/iter`);

// ── 3. Prompt vs harness ─────────────────────────────────────────────────
console.log('\n3 · prompt vs harness — 200 calls against a 60%-flaky model');
const m = measure(200, 7);
console.log(`   raw prompt: ${m.rawOk}/${m.trials} valid answers`);
console.log(`   harness:    ${m.harnessOk}/${m.trials} valid (${m.repaired} salvaged by repair, mean ${m.meanAttempts} attempts/call)`);

// ── 4. Context vs memory ─────────────────────────────────────────────────
console.log('\n4 · context vs memory — "terse bullet points" stated at turn 1, probed at turn 9');
const noMem = runConversation({ turns: DEMO_TURNS });
const withMem = runConversation({ turns: DEMO_TURNS, useMemory: true });
const stuffed = runConversation({ turns: DEMO_TURNS, fullContext: true });
console.log(`   window-only:  recalled=${noMem.results[0].recalled} — fact scrolled out of the ${noMem.window}-turn window; billed ${noMem.billedTokens} tok`);
console.log(`   memory:       recalled=${withMem.results[0].recalled} via ${withMem.results[0].via}; billed ${withMem.billedTokens} tok`);
console.log(`   full-context: recalled=${stuffed.results[0].recalled} but billed ${stuffed.billedTokens} tok — the whole history, every call`);

// ── 5. Prototype vs production ───────────────────────────────────────────
console.log('\n5 · prototype vs production — same artifact, two stages');
const protoShip = tryShip(PROTOTYPE_ARTIFACT, 'prototype');
const protoProd = tryShip(PROTOTYPE_ARTIFACT, 'production');
const hardenedProd = tryShip(HARDENED_ARTIFACT, 'production');
console.log(`   ${PROTOTYPE_ARTIFACT.name} → prototype stage:  shipped=${protoShip.shipped}`);
console.log(`   ${PROTOTYPE_ARTIFACT.name} → production stage: shipped=${protoProd.shipped}, missing: ${protoProd.failed.join(', ')}`);
console.log(`   ${HARDENED_ARTIFACT.name} → production stage: shipped=${hardenedProd.shipped}`);

console.log('\nPairs covered: ' + PAIRS.map(p => `${p.a} vs ${p.b}`).join(' · '));
