import { env } from '../config/env.js';

export async function generateContent(system, contents, json = false) {
  if (!env.geminiApiKey || /placeholder|your_.*_key/i.test(env.geminiApiKey)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] }, contents,
        generationConfig: { temperature: 0.3, ...(json ? { responseMimeType: 'application/json' } : {}) }
      }),
      signal: controller.signal
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
