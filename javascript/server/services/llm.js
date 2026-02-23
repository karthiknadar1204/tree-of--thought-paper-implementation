import openai from '../config/openai.js';

export async function ask(prompt, temperature = 0.7, max_tokens = 300) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise math reasoning assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('LLM error:', err.message);
    return '';
  }
}