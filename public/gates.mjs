// Lab 5 — prototype vs. production.
// A prototype is an artifact for learning; production is a promise to
// deliver. tryShip() applies the gate list for the stage you pick — the same
// artifact passes the learning stage and fails delivery.

export const LEARNING_GATES = ['runs-once', 'answers-the-question'];
export const DELIVERY_GATES = ['evals-pass', 'rollback-plan', 'monitoring', 'access-control'];

export const STAGES = {
  prototype: { label: 'prototype (learning stage)', required: LEARNING_GATES },
  production: { label: 'production (delivery stage)', required: [...LEARNING_GATES, ...DELIVERY_GATES] },
};

export function tryShip(artifact, stage) {
  const def = STAGES[stage];
  if (!def) throw new Error(`unknown stage: ${stage}`);
  const failed = def.required.filter(g => !artifact.gates.includes(g));
  return { stage, artifact: artifact.name, shipped: failed.length === 0, required: def.required, failed };
}

export const PROTOTYPE_ARTIFACT = {
  name: 'weekend prototype',
  gates: ['runs-once', 'answers-the-question'],
};

export const HARDENED_ARTIFACT = {
  name: 'hardened build',
  gates: ['runs-once', 'answers-the-question', 'evals-pass', 'rollback-plan', 'monitoring', 'access-control'],
};
