export const getCreativeWritingProposePrompt = (seedSentences, paragraphs) => {
  const seed = seedSentences.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const soFar = paragraphs.length
    ? paragraphs.map((p, i) => `Paragraph ${i + 1}:\n${p}`).join('\n\n')
    : '(none yet)';
  return `
Seed sentences (use as inspiration or theme):
${seed}

Story so far:
${soFar}

Propose up to 5 possible next paragraphs. Each paragraph should be 2–4 sentences and continue the story coherently.

Respond with JSON only (no markdown):
{"steps":[{"content":"Your first proposed paragraph here."},{"content":"Second option."}, ...]}

Use at most 5 steps.
`;
};

export const getCreativeWritingEvaluatePrompt = (seedSentences, paragraphs) => {
  const seed = seedSentences.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const soFar = paragraphs.map((p, i) => `Paragraph ${i + 1}:\n${p}`).join('\n\n');
  return `
Seed sentences:
${seed}

Story so far:
${soFar}

How likely is this to become a coherent, complete creative piece?

Reply with exactly one word: sure, maybe, or impossible.
`;
};
