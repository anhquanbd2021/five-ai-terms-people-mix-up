// Lab 3 — prompt vs. harness.
// The same flaky model is called two ways: a bare prompt (JSON.parse the raw
// output) vs. a harness that validates, repairs, and retries. Seeded RNG
// keeps every run reproducible for tests and the CLI report.

export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOOD = '{"answer": "14 days", "citation": "refund-policy v2"}';

// Two failure modes at a combined failRate:
//  - 'wrapped': the model wraps valid JSON in chatty prose (repairable —
//    extract the {...} substring)
//  - 'truncated': the output is cut mid-token (not repairable — retry)
export function flakyModel(rng, failRate = 0.6) {
  const r = rng();
  if (r < failRate / 2) {
    return `Sure! Here you go: ${GOOD} — let me know if you need anything else.`;
  }
  if (r < failRate) {
    return '{"answer": "14 days", "citation":';
  }
  return GOOD;
}

export function validate(text) {
  try {
    const parsed = JSON.parse(text);
    return Boolean(parsed.answer) && Boolean(parsed.citation);
  } catch {
    return false;
  }
}

// Salvage pass before burning another model call: pull the JSON object out
// of surrounding prose. Cannot invent a missing field — a truncated object
// stays invalid.
export function repair(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
}

export function callPromptOnce(rng, opts) {
  const text = flakyModel(rng, opts?.failRate);
  return { ok: validate(text), text };
}

export function callHarness(rng, { retries = 3, failRate } = {}) {
  const notes = [];
  for (let attempt = 1; attempt <= retries; attempt++) {
    const raw = flakyModel(rng, failRate);
    if (validate(raw)) {
      notes.push('valid');
      return { ok: true, attempts: attempt, text: raw, notes };
    }
    const repaired = repair(raw);
    if (validate(repaired)) {
      notes.push('repaired');
      return { ok: true, attempts: attempt, text: repaired, notes };
    }
    notes.push('invalid');
  }
  return { ok: false, attempts: retries, text: null, notes };
}

// Side-by-side trial: same seeded model for both callers.
export function measure(trials = 200, seed = 7, { retries = 3, failRate = 0.6 } = {}) {
  const rawRng = makeRng(seed);
  const harnessRng = makeRng(seed);
  let rawOk = 0;
  let harnessOk = 0;
  let harnessAttempts = 0;
  let repaired = 0;
  for (let i = 0; i < trials; i++) {
    if (callPromptOnce(rawRng, { failRate }).ok) rawOk++;
    const h = callHarness(harnessRng, { retries, failRate });
    if (h.ok) harnessOk++;
    if (h.notes.includes('repaired')) repaired++;
    harnessAttempts += h.attempts;
  }
  return {
    trials,
    failRate,
    rawOk,
    harnessOk,
    repaired,
    meanAttempts: +(harnessAttempts / trials).toFixed(2),
  };
}
