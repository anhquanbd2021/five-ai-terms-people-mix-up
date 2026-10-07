// Shared fixtures for the Term Cost Lab. NEEDS mirrors examples/needs.json —
// a test asserts they stay in sync (the browser cannot read examples/).
export const POLICY_DOCS = [
  { id: 'refund-policy', title: 'Refund policy', text: 'Enterprise refunds are approved within 30 days of invoice.' },
  { id: 'sla', title: 'Support SLA', text: 'P1 tickets get a first response within 1 business hour.' },
  { id: 'pricing', title: 'Pricing', text: 'Team plan is $20 per seat per month, billed annually.' },
];

export const POLICY_UPDATE = {
  id: 'refund-policy',
  text: 'Enterprise refunds are approved within 14 days of invoice.',
};

export const DEMO_TURNS = [
  { speaker: 'user', text: 'One thing first: I prefer terse answers — bullet points, no preamble.', fact: { key: 'style', value: 'terse bullet points' } },
  { speaker: 'assistant', text: 'Noted.' },
  { speaker: 'user', text: 'Summarize last night\'s deploy.' },
  { speaker: 'assistant', text: 'Deploy 4.2 shipped at 02:10, rolled back at 02:40.' },
  { speaker: 'user', text: 'Why the rollback?' },
  { speaker: 'assistant', text: 'A migration failed on the billing table.' },
  { speaker: 'user', text: 'Open a follow-up ticket for that.' },
  { speaker: 'assistant', text: 'Done — ticket #4811.' },
  { speaker: 'user', text: 'Now write the incident summary for the team.' },
];

export const NEEDS = [
  { team: 'support-bot', need: 'Answers must reflect the refund policy updated this morning', picked: 'finetune' },
  { team: 'docs-search', need: 'Search answers over the company wiki that changes weekly', picked: 'rag' },
  { team: 'voice-assistant', need: 'Always respond in a terse military tone', picked: 'rag' },
  { team: 'sales-copilot', need: 'Knows the new pricing sheet released this week', picked: 'finetune' },
  { team: 'compliance-drafter', need: 'Formats every filing in the regulator\'s JSON schema', picked: 'finetune' },
  { team: 'news-bot', need: 'Answers questions about current events from a live feed', picked: 'rag' },
];
