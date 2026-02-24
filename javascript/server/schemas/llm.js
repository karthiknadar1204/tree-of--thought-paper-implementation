import { z } from 'zod';

/** Valid verdicts from the evaluate step */
export const EvaluateVerdictSchema = z.enum(['sure', 'maybe', 'impossible']);
export const DEFAULT_VERDICT = 'maybe';

/** One proposed step: expression string and numeric result */
export const ProposeStepSchema = z.object({
  expression: z.string().min(1),
  result: z.number(),
});

/** Full propose response: up to 5 steps */
export const ProposeResponseSchema = z.object({
  steps: z.array(ProposeStepSchema).max(5),
});

/**
 * Parse raw evaluate response into a validated verdict.
 * Tries first word, then substring match; defaults to DEFAULT_VERDICT.
 */
export function parseVerdict(raw) {
  const s = (raw ?? '').toLowerCase().trim();
  const firstWord = s.split(/\s+/)[0] ?? '';
  const parsed = EvaluateVerdictSchema.safeParse(firstWord);
  if (parsed.success) return parsed.data;
  if (s.includes('sure')) return 'sure';
  if (s.includes('impossible')) return 'impossible';
  return DEFAULT_VERDICT;
}

/**
 * Parse raw propose response (JSON or line-based) into validated steps.
 * Returns array of { expression, result }; invalid entries are skipped.
 */
export function parseProposeResponse(raw) {
  const text = (raw ?? '').trim();
  const steps = [];

  // Try JSON first
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0]);
      const parsed = ProposeResponseSchema.safeParse(data);
      if (parsed.success) return parsed.data.steps;
    } catch {
      // Fall through to line-based
    }
  }

  // Line-based: "expr = result"
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.includes('=') && l.length > 5);

  for (const line of lines.slice(0, 5)) {
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const expression = line.slice(0, eqIdx).trim();
    const resultStr = line.slice(eqIdx + 1).trim();
    const result = Number(resultStr);
    if (expression.length === 0 || resultStr === '' || !Number.isFinite(result))
      continue;
    const step = ProposeStepSchema.safeParse({ expression, result });
    if (step.success) steps.push(step.data);
  }

  return steps;
}

/** Zod-reinforced parser for propose responses: raw LLM string → validated steps array. Use as parseResponse in ask(). */
export function validateProposeResponse(raw) {
  const steps = parseProposeResponse(raw);
  return z.array(ProposeStepSchema).parse(steps);
}

/** Zod-reinforced parser for evaluate responses: raw LLM string → validated verdict. Use as parseResponse in ask(). */
export function validateVerdictResponse(raw) {
  const verdict = parseVerdict(raw);
  return EvaluateVerdictSchema.parse(verdict);
}
