// Lab 2 — loop vs. goal.
// The loop is the mechanism; the goal is the stop condition it evaluates.
// Run the same task with and without a goal predicate and measure what the
// missing stop condition costs.

export const ITERATION_COST_USD = 0.02; // illustrative per-iteration token/tool cost

// Each iteration completes one unit of work toward task.target. A goal is a
// predicate over the state — the loop checks it after every iteration. No
// goal means "runs until the budget cap" — i.e. until you notice.
export function runLoop({ task, goal = null, maxIterations = 25, costPerIteration = ITERATION_COST_USD }) {
  const state = { progress: 0, iterations: 0 };
  const trace = [];
  while (state.iterations < maxIterations) {
    state.iterations++;
    state.progress++;
    trace.push({ iteration: state.iterations, progress: state.progress, target: task.target });
    if (goal && goal(state)) {
      return {
        iterations: state.iterations,
        progress: state.progress,
        goalMet: true,
        stoppedReason: 'goal',
        wastedIterations: Math.max(0, state.iterations - task.target),
        costUsd: +(state.iterations * costPerIteration).toFixed(2),
        trace,
      };
    }
  }
  return {
    iterations: state.iterations,
    progress: state.progress,
    goalMet: false,
    stoppedReason: 'budget-cap',
    wastedIterations: Math.max(0, state.iterations - task.target),
    costUsd: +(state.iterations * costPerIteration).toFixed(2),
    trace,
  };
}

export const COLLECT_CITATIONS = { name: 'collect citations', unit: 'citation', target: 3 };
export const citationGoal = state => state.progress >= COLLECT_CITATIONS.target;
