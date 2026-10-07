// The five term pairs from the article — each with the confusion it causes
// and the one-line test that separates the terms. Pure data; shared by the
// browser UI, the CLI report, and the tests.
export const PAIRS = [
  {
    id: 'rag-finetune',
    a: 'RAG',
    b: 'fine-tuning',
    confusion: '"Teach the model our docs" — treating a knowledge problem as a training problem.',
    failure: 'facts freeze at train time; every doc update is a retrain-or-stale decision',
    test: 'New facts → RAG. New behaviour → fine-tune.',
    lab: 'freshness',
  },
  {
    id: 'loop-goal',
    a: 'loop',
    b: 'goal',
    confusion: '"The agent is running" — motion mistaken for progress.',
    failure: 'the loop burns tokens and tool calls until the budget cap, because nothing defines done',
    test: 'What does "done" look like as a check the loop itself can evaluate?',
    lab: 'loop',
  },
  {
    id: 'prompt-harness',
    a: 'prompt',
    b: 'harness',
    confusion: '"The prompt works" — one good completion mistaken for a reliable pipeline.',
    failure: 'a demo-grade flake rate ships to production, and nobody retries',
    test: 'Run it 100 times and count failures — then ask who retries.',
    lab: 'harness',
  },
  {
    id: 'context-memory',
    a: 'context',
    b: 'memory',
    confusion: '"It remembers" — reading this call mistaken for writing it down for later.',
    failure: 'early facts scroll out of the window; or the whole history is stuffed into every call',
    test: 'Will it know this next session, or did it just scroll out of the window?',
    lab: 'memory',
  },
  {
    id: 'prototype-production',
    a: 'prototype',
    b: 'production',
    confusion: '"It works" — a learning artifact mistaken for a delivery vehicle.',
    failure: 'it ships to real users with no evals, no rollback, no monitoring',
    test: 'Which gates does it pass — learning gates or delivery gates?',
    lab: 'gates',
  },
];
