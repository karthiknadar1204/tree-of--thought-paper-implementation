import { ask } from './llm.js';
import { getProposePrompt } from '../prompts/propose.js';
import { getEvaluatePrompt } from '../prompts/evaluate.js';
import { validateProposeResponse, validateVerdictResponse } from '../schemas/llm.js';

const LOG_PREFIX = '[ToT]';

/** Short description of a state for logging */
function stateLabel(state) {
  const pathStr = state.path.length ? ` → ${state.path.join(' → ')}` : '';
  return `[${state.numbers.join(', ')}]${pathStr}`;
}

/** Remove from a copy of state.numbers one instance per number used in the expression (multiset). */
function remainingAfterStep(stateNumbers, expression) {
  const usedTokens = expression.match(/-?\d+(\.\d+)?/g) || [];
  const remaining = [...stateNumbers];
  for (const t of usedTokens) {
    const num = Number(t);
    const idx = remaining.findIndex((n) => n === num);
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining;
}

async function generateNextThoughts(state) {
  if (state.numbers.length <= 1) {
    return [];
  }

  const prompt = getProposePrompt(state.numbers);
  const steps = await ask(prompt, {
    temperature: 0.9,
    max_tokens: 180,
    parseResponse: validateProposeResponse,
  });
  const thoughts = [];

  for (const { expression, result } of steps) {
    if (!Number.isFinite(result)) continue;

    const remaining = remainingAfterStep(state.numbers, expression);
    const numbers = [...remaining, result].sort((a, b) => a - b);
    thoughts.push({
      thought: expression,
      numbers,
      path: [...state.path, `${expression} = ${result}`],
    });
  }

  if (thoughts.length > 0) {
    console.log(`${LOG_PREFIX}   Branches created (${thoughts.length}):`);
    thoughts.forEach((t, i) => {
      console.log(`${LOG_PREFIX}      ${i + 1}. ${t.thought} = ${t.path[t.path.length - 1].split(' = ')[1]}  →  remaining: [${t.numbers.join(', ')}]`);
    });
  }

  return thoughts;
}

async function evaluateState(state) {
  if (state.numbers.length === 1) {
    return state.numbers[0] === 24 ? 'sure' : 'impossible';
  }

  const prompt = getEvaluatePrompt(state.numbers);
  return ask(prompt, {
    temperature: 0.2,
    max_tokens: 20,
    parseResponse: validateVerdictResponse,
  });
}

export async function solveGameOf24(inputNumbers, beam = 5, maxDepth = 4) {
  let frontier = [
    {
      numbers: [...inputNumbers].sort((a, b) => a - b),
      path: [],
      depth: 0,
    },
  ];

  let bestPartial = null;
  let bestLength = Infinity;
  let round = 0;

  console.log(`${LOG_PREFIX} ═══════════════════════════════════════`);
  console.log(`${LOG_PREFIX} Game of 24 — input: [${inputNumbers.join(', ')}]  beam=${beam}  maxDepth=${maxDepth}`);
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════`);

  while (frontier.length > 0) {
    round += 1;
    const currentLevel = frontier.slice(0, beam);
    frontier = frontier.slice(beam);

    console.log(`\n${LOG_PREFIX} ┌── ROUND ${round} (expanding ${currentLevel.length} state(s)) ──`);

    for (const state of currentLevel) {
      // Solution found
      if (state.numbers.length === 1 && state.numbers[0] === 24) {
        console.log(`${LOG_PREFIX} ✓ SOLUTION FOUND: ${state.path.join(' → ')}`);
        return {
          success: true,
          solution: state.path.join('\n'),
          steps: state.path.length,
        };
      }

      if (state.depth >= maxDepth) {
        console.log(`${LOG_PREFIX}   (skip: max depth reached) ${stateLabel(state)}`);
        continue;
      }

      console.log(`${LOG_PREFIX} ── Expanding state (depth ${state.depth}): ${stateLabel(state)}`);
      const children = await generateNextThoughts(state);

      for (const child of children) {
        const verdict = await evaluateState(child);
        const verdictIcon = verdict === 'sure' ? '✓' : verdict === 'impossible' ? '✗' : '?';

        const stepResult = child.path[child.path.length - 1].split(' = ')[1];
        console.log(`${LOG_PREFIX}   Evaluate: "${child.thought} = ${stepResult}"  →  [${child.numbers.join(', ')}]  →  ${verdictIcon} ${verdict}`);

        if (verdict === 'impossible') {
          console.log(`${LOG_PREFIX}      → pruned (impossible)`);
          continue;
        }

        frontier.push({
          ...child,
          depth: state.depth + 1,
        });
        console.log(`${LOG_PREFIX}      → added to frontier`);

        if (verdict === 'sure' && child.numbers.length < bestLength) {
          bestPartial = child;
          bestLength = child.numbers.length;
          console.log(`${LOG_PREFIX}      → new best partial (${child.numbers.length} number(s) left)`);
        }
      }
    }

    console.log(`${LOG_PREFIX} Frontier size: ${frontier.length} (sorted by remaining numbers)`);

    frontier.sort((a, b) => a.numbers.length - b.numbers.length);
  }

  // Fallback: best partial
  console.log(`\n${LOG_PREFIX} No full solution; frontier exhausted.`);
  if (bestPartial) {
    console.log(`${LOG_PREFIX} Best partial: ${bestPartial.path.join(' → ')}  →  remaining [${bestPartial.numbers.join(', ')}]`);
    return {
      success: false,
      solution: bestPartial.path.join('\n') + `\n\n(best partial → ${bestPartial.numbers.join(', ')})`,
      steps: bestPartial.path.length,
      partial: true,
    };
  }

  console.log(`${LOG_PREFIX} No solution found within budget.`);
  return {
    success: false,
    solution: 'No solution found within budget',
    steps: 0,
  };
}