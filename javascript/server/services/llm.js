import openai from '../config/openai.js';

/**
 * Call the LLM. Optionally reinforce response shape with a Zod-backed parser.
 * @param {string} prompt
 * @param {number | object} [temperatureOrOptions=0.7] - Temperature (number) or options object.
 * @param {number} [max_tokens=300] - Used when second arg is temperature.
 * @param {(raw: string) => unknown} [options.parseResponse] - Parse and validate raw content (e.g. with Zod); return value when provided.
 * @returns {Promise<string | unknown>} Raw string, or parsed result when parseResponse is provided.
 */
export async function ask(prompt, temperatureOrOptions = 0.7, max_tokens = 300) {
  const options =
    typeof temperatureOrOptions === 'object' && temperatureOrOptions !== null
      ? temperatureOrOptions
      : { temperature: temperatureOrOptions, max_tokens };
  const {
    temperature = 0.7,
    max_tokens: maxTok = 300,
    parseResponse,
  } = options;
  const max_tokensFinal = options.max_tokens ?? maxTok;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise math reasoning assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: max_tokensFinal,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';

    if (parseResponse) {
      return parseResponse(raw);
    }
    return raw;
  } catch (err) {
    console.error('LLM error:', err.message);
    if (parseResponse) throw err;
    return '';
  }
}