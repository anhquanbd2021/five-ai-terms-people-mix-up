// Lab 4 — context vs. memory.
// Context is the sliding window of turns the model can read *this call*.
// Memory is what the system deliberately writes down for later calls.
// Three modes show both failures: window-only forgets early facts; stuffing
// the full history recalls them but the token bill grows every turn; memory
// keeps the window small and the facts permanent.

export const CONTEXT_WINDOW_TURNS = 4;
export const TOKENS_PER_TURN = 120;   // illustrative turn size
export const TOKENS_PER_MEMORY = 20;  // a stored note is small and stable

export function runConversation({ turns, useMemory = false, fullContext = false, window = CONTEXT_WINDOW_TURNS }) {
  const effectiveWindow = fullContext ? turns.length : window;
  const memory = new Map();
  const billed = [];

  turns.forEach((turn, i) => {
    if (useMemory && turn.fact) memory.set(turn.fact.key, turn.fact.value);
    const windowStart = Math.max(0, i + 1 - effectiveWindow);
    const contextSize = (i + 1 - windowStart) * TOKENS_PER_TURN;
    billed.push(contextSize + memory.size * TOKENS_PER_MEMORY);
  });

  const facts = turns.filter(t => t.fact).map(t => t.fact);
  const lastIndex = turns.length - 1;
  const results = facts.map(fact => {
    const statedAt = turns.findIndex(t => t.fact === fact);
    const inWindow = lastIndex - statedAt < effectiveWindow;
    const recalled = useMemory ? memory.get(fact.key) === fact.value : inWindow;
    return {
      key: fact.key,
      value: fact.value,
      statedAtTurn: statedAt + 1,
      recalled,
      via: useMemory ? 'memory' : inWindow ? 'context window' : null,
    };
  });

  return {
    results,
    billedTokens: billed.reduce((a, b) => a + b, 0),
    billedPerTurn: billed,
    window: effectiveWindow,
    memoryEntries: memory.size,
  };
}
