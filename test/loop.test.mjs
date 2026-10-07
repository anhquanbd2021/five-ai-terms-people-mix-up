import test from 'node:test';
import assert from 'node:assert/strict';
import { runLoop, COLLECT_CITATIONS, citationGoal, ITERATION_COST_USD } from '../public/loop.mjs';

test('a loop with a goal stops itself at the target', () => {
  const res = runLoop({ task: COLLECT_CITATIONS, goal: citationGoal });
  assert.equal(res.iterations, COLLECT_CITATIONS.target);
  assert.equal(res.goalMet, true);
  assert.equal(res.stoppedReason, 'goal');
  assert.equal(res.wastedIterations, 0);
  assert.equal(res.costUsd, +(COLLECT_CITATIONS.target * ITERATION_COST_USD).toFixed(2));
});

test('a loop without a goal burns to the budget cap', () => {
  const res = runLoop({ task: COLLECT_CITATIONS });
  assert.equal(res.iterations, 25);
  assert.equal(res.goalMet, false);
  assert.equal(res.stoppedReason, 'budget-cap');
  assert.equal(res.wastedIterations, 22);
  assert.equal(res.costUsd, +(25 * ITERATION_COST_USD).toFixed(2));
});

test('the goal is what makes the difference — same loop, same task', () => {
  const withGoal = runLoop({ task: COLLECT_CITATIONS, goal: citationGoal });
  const without = runLoop({ task: COLLECT_CITATIONS });
  assert.ok(withGoal.costUsd < without.costUsd);
  assert.equal(without.progress - withGoal.progress, without.wastedIterations);
});

test('a goal that is never true still gets stopped by the cap', () => {
  const res = runLoop({ task: COLLECT_CITATIONS, goal: () => false, maxIterations: 5 });
  assert.equal(res.iterations, 5);
  assert.equal(res.stoppedReason, 'budget-cap');
});
