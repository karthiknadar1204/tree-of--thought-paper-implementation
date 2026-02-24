import { ask } from './llm.js';
import { getCreativeWritingProposePrompt, getCreativeWritingEvaluatePrompt } from '../prompts/creativeWriting.js';
import { validateCreativeWritingProposeResponse, validateVerdictResponse } from '../schemas/llm.js';

const LOG_PREFIX = '[ToT-CW]';

const TARGET_PARAGRAPHS = 3;

async function generateNextThoughts(state) {
  if (state.paragraphs.length >= TARGET_PARAGRAPHS) return [];

  const prompt = getCreativeWritingProposePrompt(state.seedSentences, state.paragraphs);
  const steps = await ask(prompt, {
    temperature: 0.9,
    max_tokens: 400,
    parseResponse: validateCreativeWritingProposeResponse,
  });

  const thoughts = [];
  for (const { content } of steps) {
    if (!content || !content.trim()) continue;
    const paragraphs = [...state.paragraphs, content.trim()];
    thoughts.push({
      thought: content.trim().slice(0, 60) + (content.length > 60 ? '...' : ''),
      paragraphs,
      seedSentences: state.seedSentences,
      path: [...state.path, `P${paragraphs.length}`],
    });
  }

  if (thoughts.length > 0) {
    console.log(`${LOG_PREFIX}   Branches created (${thoughts.length}):`);
    thoughts.forEach((t, i) => {
      console.log(`${LOG_PREFIX}      ${i + 1}. ${t.thought}`);
    });
  }
  return thoughts;
}

async function evaluateState(state) {
  const prompt = getCreativeWritingEvaluatePrompt(state.seedSentences, state.paragraphs);
  return ask(prompt, {
    temperature: 0.2,
    max_tokens: 20,
    parseResponse: validateVerdictResponse,
  });
}

export async function solveCreativeWriting(seedSentences, beam = 5, maxDepth = 4) {
  let frontier = [
    {
      paragraphs: [],
      seedSentences: [...seedSentences],
      path: [],
      depth: 0,
    },
  ];

  let bestPartial = null;
  let bestLength = -1;
  let round = 0;

  console.log(`${LOG_PREFIX} ═══════════════════════════════════════`);
  console.log(`${LOG_PREFIX} Creative Writing — ${seedSentences.length} seed sentences  beam=${beam}  maxDepth=${maxDepth}`);
  console.log(`${LOG_PREFIX} ═══════════════════════════════════════`);

  while (frontier.length > 0) {
    round += 1;
    const currentLevel = frontier.slice(0, beam);
    frontier = frontier.slice(beam);

    console.log(`\n${LOG_PREFIX} ┌── ROUND ${round} (expanding ${currentLevel.length} state(s)) ──`);

    for (const state of currentLevel) {
      if (state.paragraphs.length >= TARGET_PARAGRAPHS) {
        const verdict = await evaluateState(state);
        if (verdict === 'sure') {
          console.log(`${LOG_PREFIX} ✓ SOLUTION: ${state.paragraphs.length} paragraphs complete`);
          return {
            success: true,
            solution: state.paragraphs.join('\n\n'),
            steps: state.paragraphs.length,
          };
        }
      }

      if (state.depth >= maxDepth) {
        console.log(`${LOG_PREFIX}   (skip: max depth) paragraphs=${state.paragraphs.length}`);
        continue;
      }

      console.log(`${LOG_PREFIX} ── Expanding (depth ${state.depth}, ${state.paragraphs.length} paragraphs)`);
      const children = await generateNextThoughts(state);

      for (const child of children) {
        const verdict = await evaluateState(child);
        const verdictIcon = verdict === 'sure' ? '✓' : verdict === 'impossible' ? '✗' : '?';
        console.log(`${LOG_PREFIX}   Evaluate: "${child.thought}"  →  ${verdictIcon} ${verdict}`);

        if (verdict === 'impossible') {
          console.log(`${LOG_PREFIX}      → pruned (impossible)`);
          continue;
        }

        frontier.push({ ...child, depth: state.depth + 1 });
        console.log(`${LOG_PREFIX}      → added to frontier`);

        if (verdict === 'sure' && child.paragraphs.length > bestLength) {
          bestPartial = child;
          bestLength = child.paragraphs.length;
          console.log(`${LOG_PREFIX}      → new best partial (${child.paragraphs.length} paragraphs)`);
        }
      }
    }

    console.log(`${LOG_PREFIX} Frontier size: ${frontier.length}`);
    frontier.sort((a, b) => b.paragraphs.length - a.paragraphs.length);
  }

  console.log(`\n${LOG_PREFIX} No full solution; frontier exhausted.`);
  if (bestPartial) {
    console.log(`${LOG_PREFIX} Best partial: ${bestPartial.paragraphs.length} paragraphs`);
    return {
      success: false,
      solution: bestPartial.paragraphs.join('\n\n') + `\n\n(best partial → ${bestPartial.paragraphs.length} paragraphs)`,
      steps: bestPartial.paragraphs.length,
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
