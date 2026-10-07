// The one-line test, mechanized: does the need mention changing *facts*
// (retrieval problem) or model *behaviour* (fine-tuning problem)?
// Deliberately simple keyword scoring — it exists to score the examples
// table, not to be a production classifier.
const FACT_WORDS = [
  'fact', 'facts', 'updated', 'update', 'change', 'changes', 'changed',
  'policy', 'pricing', 'docs', 'document', 'documents', 'knowledge',
  'current', 'this week', 'this morning', 'latest', 'wiki', 'feed', 'live',
];
const BEHAVIOUR_WORDS = [
  'tone', 'style', 'format', 'formats', 'behave', 'behaviour', 'behavior',
  'always respond', 'voice', 'json', 'concise', 'personality', 'schema',
];

export function classifyNeed(text) {
  const lower = text.toLowerCase();
  const factScore = FACT_WORDS.filter(w => lower.includes(w)).length;
  const behaviourScore = BEHAVIOUR_WORDS.filter(w => lower.includes(w)).length;
  return behaviourScore > factScore ? 'finetune' : 'rag';
}
