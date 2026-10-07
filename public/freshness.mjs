// Lab 1 — RAG vs. fine-tuning, the expensive pair.
// A doc store versions every update. A "fine-tuned" model freezes a snapshot
// of the docs at train time (and carries a training bill). RAG reads the
// store at answer time. The same question, before and after an update, shows
// the divergence — and the behaviour flag shows where fine-tuning is the
// RIGHT pick, because retrieval can change what a model reads but not how
// it behaves.

export const TRAINING_BILL_USD = 24000; // illustrative single fine-tune run
export const RETRAIN_LAG_DAYS = 14;     // illustrative queue time for a retrain

export function createDocStore(docs) {
  const store = new Map();
  let updates = 0;
  for (const { id, title, text } of docs) {
    store.set(id, { id, title, text, version: 1 });
  }
  return {
    get: id => store.get(id),
    ids: () => [...store.keys()],
    get updates() { return updates; },
    update(id, text) {
      const doc = store.get(id);
      if (!doc) throw new Error(`unknown doc: ${id}`);
      store.set(id, { ...doc, text, version: doc.version + 1 });
      updates++;
    },
  };
}

// Fine-tuning snapshots today's docs into the model — and invoices you.
// `behaviour.formats` models a *behavioural* change baked into the weights
// (e.g. always answer as JSON): the legitimate use of fine-tuning.
export function fineTune(store, { behaviour = null } = {}) {
  const snapshot = new Map();
  for (const id of store.ids()) snapshot.set(id, { ...store.get(id) });
  return { kind: 'fine-tuned', snapshot, behaviour, billUsd: TRAINING_BILL_USD };
}

// RAG keeps no copy — it reads the live store every call.
export function buildRag(store) {
  return { kind: 'rag', store, billUsd: 0 };
}

// ask(system, docId, {format}) — `format` is a *behaviour* the caller wants.
// RAG honours 'prose' only: retrieval changes what the model reads, not how
// it writes. A fine-tuned model honours whatever formats were trained in.
export function ask(system, docId, { format = 'prose' } = {}) {
  if (system.kind === 'rag') {
    const doc = system.store.get(docId);
    if (!doc) throw new Error(`unknown doc: ${docId}`);
    return {
      source: 'retrieval',
      version: doc.version,
      formatHonoured: format === 'prose', // RAG can't change how the model writes
      text: doc.text,                     // it answers in prose either way
    };
  }
  const doc = system.snapshot.get(docId);
  if (!doc) throw new Error(`unknown doc: ${docId}`);
  const honoured = format === 'prose' || (system.behaviour?.formats ?? []).includes(format);
  return {
    source: 'frozen-snapshot',
    version: doc.version,
    formatHonoured: honoured,
    text: honoured && format === 'json' ? JSON.stringify({ answer: doc.text }) : doc.text,
  };
}

// The model cannot see its own staleness — this check exists for the lab's
// report and UI, comparing the frozen snapshot against the live store.
export function isStale(system, store, docId) {
  if (system.kind === 'rag') return false;
  return system.snapshot.get(docId).version !== store.get(docId).version;
}
