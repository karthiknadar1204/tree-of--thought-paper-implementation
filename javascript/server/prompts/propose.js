export const getProposePrompt = (numbers) => `
Current numbers: [${numbers.join(', ')}]

Propose up to 5 next steps toward reaching 24. Each step must use at least two numbers from the current set with + - * / and produce a single result.

Respond with JSON only, in this exact format (no markdown, no extra text):
{"steps":[{"expression":"4 * 6","result":24},{"expression":"24 - 5","result":19}, ...]}

Rules:
- "expression": arithmetic using only the current numbers and + - * /
- "result": the numeric result (number type)
- Use at most 5 steps
`;
