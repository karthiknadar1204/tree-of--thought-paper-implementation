export const getEvaluatePrompt = (numbers) => `
Numbers left: ${numbers.join(', ')}

How likely are we to reach exactly 24 from here?

Answer with **one word only**:

sure       ← almost certain we can reach 24 soon
maybe      ← possible, but uncertain
impossible ← clearly cannot reach 24

Reply with exactly one word: sure, maybe, or impossible.
`;