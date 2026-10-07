# Term Cost Lab — companion demo

Interactive lab for the article *Five AI Terms People Mix Up — and What Each
Confusion Costs*. Five simulators, one per term pair — pick the wrong side
and watch the failure: a stale fine-tuned snapshot, a loop that burns to its
budget cap, a bare prompt flaking in production, a preference scrolling out
of the context window, a prototype blocked by delivery gates.

Zero dependencies — Node 20+ only. The simulators are plain ES modules shared
by the browser UI, the CLI report, and the test suite.

## Five labs

| Lab | What it proves |
|---|---|
| **Freshness** (RAG vs fine-tuning) | `fineTune(store)` freezes a doc snapshot and charges a training bill. After `store.update()`, the tuned model answers the old policy while RAG answers the new one. The same lab shows the reverse: ask for `json` output and only the tuned model honours it — new *behaviour* is the legitimate fine-tune. |
| **Loop vs goal** | `runLoop({goal})` stops itself at 3 citations; without the predicate the identical loop runs to the 25-iteration cap — 22 wasted iterations. |
| **Prompt vs harness** | A seeded model fails 60% of calls (wrapped prose or truncated JSON). A bare `JSON.parse` caller lands ~40% success; the harness (repair + retry + validate) lands ~95%+. |
| **Context vs memory** | A turn-1 preference scrolls out of a 4-turn window by turn 9. Stuffing full history recalls it but bills the whole conversation every turn; a memory store recalls it for 20 tokens. |
| **Prototype vs production** | `tryShip()` applies the stage's gate list: the weekend prototype ships the learning stage and is blocked on four delivery gates (evals, rollback, monitoring, access control). |

Plus `decision.mjs` — a keyword classifier scoring the six team picks in
`examples/needs.json` (three of them picked the wrong tool).

## Run it

```text
npm start       # serve the lab on :3000
npm test        # simulators + classifier + server
npm run scan    # side-by-side report across all five labs
npm run check   # both
```

## Honest limits

- Models are deterministic fakes: the flaky model is a seeded RNG, the
  fine-tuned model is a frozen snapshot. Real systems fail in more colors —
  these five are the common ones.
- Dollar figures ($24,000 training bill, $0.02/iteration, 120 tokens/turn)
  are illustrative constants, not benchmarks — the point is which side of the
  pair the cost lands on.
- `classifyNeed()` is keyword scoring for the examples table — real
  RAG-vs-fine-tune decisions also weigh data volume, latency, privacy, and
  eval requirements.
- The context window is modelled as a hard 4-turn cut; real context degrades
  gradually. Memory is modelled as perfect key-value recall; real memory
  retrieval can miss.
- Four delivery gates is a teaching list — real production readiness is
  longer.

This is an educational demo, not production infrastructure.
