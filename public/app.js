import { PAIRS } from '/pairs.mjs';
import { POLICY_DOCS, POLICY_UPDATE, DEMO_TURNS } from '/fixtures.mjs';
import { createDocStore, fineTune, buildRag, ask, isStale, TRAINING_BILL_USD } from '/freshness.mjs';
import { runLoop, COLLECT_CITATIONS, citationGoal, ITERATION_COST_USD } from '/loop.mjs';
import { makeRng, callPromptOnce, callHarness } from '/harness.mjs';
import { runConversation } from '/memory.mjs';
import { tryShip, PROTOTYPE_ARTIFACT, HARDENED_ARTIFACT, STAGES } from '/gates.mjs';

const $ = id => document.getElementById(id);

// ── pairs table ──────────────────────────────────────────────────────────
const body = $('pairs-body');
for (const p of PAIRS) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td>${p.a} <span class="muted">vs.</span> ${p.b}</td><td>${p.confusion}</td><td class="danger-text">${p.failure}</td><td class="try">${p.test}</td>`;
  body.appendChild(tr);
}

// ── lab 1: RAG vs fine-tuning ────────────────────────────────────────────
const store = createDocStore(POLICY_DOCS);
const tuned = fineTune(store, { behaviour: { formats: ['json'] } });
const rag = buildRag(store);

function renderDocs() {
  const ol = $('doc-list');
  ol.innerHTML = '';
  for (const id of store.ids()) {
    const d = store.get(id);
    const li = document.createElement('li');
    li.className = 'result info';
    li.innerHTML = `<strong>${d.title}</strong> <span class="badge">v${d.version}</span><p>${d.text}</p>`;
    ol.appendChild(li);
  }
}
renderDocs();

function showAnswers(ftRes, ragRes, note) {
  $('ft-answer').textContent = ftRes.text;
  $('rag-answer').textContent = ragRes.text;
  const stale = isStale(tuned, store, 'refund-policy');
  $('ft-meta').textContent = `snapshot v${ftRes.version} · bill $${TRAINING_BILL_USD.toLocaleString()}${stale ? ' · STALE vs live store' : ''}`;
  $('rag-meta').textContent = `live store v${ragRes.version} · bill $0 · ${ragRes.formatHonoured ? 'format ok' : 'prose only — behaviour not trainable by retrieval'}`;
  $('ft-card').classList.toggle('stale', stale);
  $('ft-card').classList.toggle('fresh', !stale);
  $('rag-card').classList.add('fresh');
  $('freshness-badge').textContent = stale ? 'DIVERGED' : 'in sync';
  $('freshness-badge').className = `badge ${stale ? 'fail' : 'pass'}`;
  $('freshness-note').textContent = note;
}

$('run-freshness').addEventListener('click', () => {
  store.update(POLICY_UPDATE.id, $('update-text').value);
  renderDocs();
  showAnswers(
    ask(tuned, 'refund-policy'),
    ask(rag, 'refund-policy'),
    'The docs moved; the frozen snapshot did not. Every further update is a retrain-or-stale decision.',
  );
});

$('run-format').addEventListener('click', () => {
  showAnswers(
    ask(tuned, 'refund-policy', { format: 'json' }),
    ask(rag, 'refund-policy', { format: 'json' }),
    'New behaviour is the legitimate fine-tune: the tuned model honours its trained JSON format; RAG reads the same doc but can only answer in prose.',
  );
});

// ── lab 2: loop vs goal ──────────────────────────────────────────────────
$('run-loop').addEventListener('click', () => {
  const useGoal = $('use-goal').checked;
  const res = runLoop({ task: COLLECT_CITATIONS, goal: useGoal ? citationGoal : null });
  $('loop-badge').textContent = res.stoppedReason === 'goal' ? `goal met · $${res.costUsd}` : `budget cap · $${res.costUsd}`;
  $('loop-badge').className = `badge ${res.stoppedReason === 'goal' ? 'pass' : 'warn'}`;
  $('loop-meter').style.width = `${(res.iterations / 25) * 100}%`;
  const ul = $('loop-trace');
  ul.innerHTML = '';
  for (const t of res.trace) {
    const li = document.createElement('li');
    li.className = t.progress <= COLLECT_CITATIONS.target ? 'done' : 'wasted';
    li.textContent = `iter ${String(t.iteration).padStart(2, '0')} — ${COLLECT_CITATIONS.unit} ${t.progress} collected${t.progress > COLLECT_CITATIONS.target ? '  (past the finish line)' : ''}`;
    ul.appendChild(li);
  }
  $('loop-note').textContent = res.stoppedReason === 'goal'
    ? `Stopped itself at iteration ${res.iterations} — the goal was a check the loop could evaluate.`
    : `${res.iterations} iterations, ${res.wastedIterations} of them wasted at $${ITERATION_COST_USD}/iter. Nothing inside the loop knew what "done" meant — the cap was the only stop.`;
});

// ── lab 3: prompt vs harness ─────────────────────────────────────────────
$('run-harness').addEventListener('click', () => {
  const trials = Math.max(10, Math.min(2000, Number($('trials').value) || 200));
  const rawRng = makeRng(7);
  const harnessRng = makeRng(7);
  let rawOk = 0; let harnessOk = 0; let repaired = 0; let attempts = 0;
  for (let i = 0; i < trials; i++) {
    if (callPromptOnce(rawRng).ok) rawOk++;
    const h = callHarness(harnessRng);
    if (h.ok) harnessOk++;
    if (h.notes.includes('repaired')) repaired++;
    attempts += h.attempts;
  }
  $('raw-score').textContent = `${rawOk}/${trials}`;
  $('harness-score').textContent = `${harnessOk}/${trials}`;
  $('raw-meter').style.width = `${(rawOk / trials) * 100}%`;
  $('harness-meter').style.width = `${(harnessOk / trials) * 100}%`;
  $('harness-badge').textContent = `${Math.round((harnessOk / trials) * 100)}% vs ${Math.round((rawOk / trials) * 100)}%`;
  $('harness-badge').className = 'badge pass';
  $('harness-note').textContent = `Same model, same seed. The harness salvaged ${repaired} wrapped outputs by repair and absorbed the truncated ones in ${(attempts / trials).toFixed(2)} mean attempts per call.`;
});

// ── lab 4: context vs memory ─────────────────────────────────────────────
$('run-memory').addEventListener('click', () => {
  const mode = document.querySelector('input[name="mem-mode"]:checked').value;
  const res = runConversation({
    turns: DEMO_TURNS,
    useMemory: mode === 'memory',
    fullContext: mode === 'full',
  });
  const fact = res.results[0];
  $('memory-result').textContent = fact.recalled
    ? `recalled "${fact.value}" — via ${fact.via}`
    : `forgotten — turn ${fact.statedAtTurn} scrolled out of the ${res.window}-turn window`;
  $('memory-badge').textContent = fact.recalled ? 'recalled' : 'forgotten';
  $('memory-badge').className = `badge ${fact.recalled ? 'pass' : 'fail'}`;
  const maxBilled = DEMO_TURNS.length * 120 * DEMO_TURNS.length;
  $('memory-meter').style.width = `${Math.min(100, (res.billedTokens / maxBilled) * 100)}%`;
  $('memory-note').textContent = `Billed ${res.billedTokens} context tokens across the conversation (illustrative: 120/turn + 20/stored note). ${mode === 'full' ? 'Recall worked — you paid for the whole history on every call.' : mode === 'memory' ? 'The note persists while the window stays small.' : 'No write-down step means the fact only lives as long as the window.'}`;
});

// ── lab 5: prototype vs production ───────────────────────────────────────
$('run-gates').addEventListener('click', () => {
  const artifact = $('artifact').value === 'hardened' ? HARDENED_ARTIFACT : PROTOTYPE_ARTIFACT;
  const stage = $('stage').value;
  const res = tryShip(artifact, stage);
  const ol = $('gates-list');
  ol.innerHTML = '';
  for (const g of res.required) {
    const li = document.createElement('li');
    const ok = !res.failed.includes(g);
    li.className = `result ${ok ? 'pass' : 'fail'}`;
    li.innerHTML = `<strong>${g}</strong><p>${ok ? 'passed' : 'missing'}</p>`;
    ol.appendChild(li);
  }
  $('gates-badge').textContent = res.shipped ? 'SHIPPED' : 'BLOCKED';
  $('gates-badge').className = `badge ${res.shipped ? 'pass' : 'fail'}`;
  $('gates-note').textContent = res.shipped
    ? `${artifact.name} cleared ${STAGES[stage].label}: ${res.required.length} gates.`
    : `${artifact.name} is missing ${res.failed.length} delivery gate(s) — it proved the idea, it hasn't earned delivery.`;
});
