/**
 * AI companion service — ENCOURAGEMENT & PERSONALIZATION ONLY.
 *
 * Hard product rule (Istiak): the AI may motivate, personalize, summarize and
 * reflect on feelings — it may NEVER be a source of religious evidence. It must
 * not cite or invent a hadith/āyah number, a chain, or a grade; must not issue
 * any ruling (ḥalāl/ḥarām/fatwa) or claim authenticity; and must redirect all
 * such questions to qualified scholars and the app's own verified references.
 *
 * Providers (free tiers): Groq (primary — fast, working) then Google Gemini
 * (fallback). If neither answers, a warm static fallback is returned so the UI
 * never breaks.
 */

interface Provider {
  name: string;
  url: string;
  key: string | undefined;
  model: string;
}

// Groq first (verified working); Gemini second (OpenAI-compatible endpoint).
function providers(): Provider[] {
  return [
    {
      name: 'groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key: process.env.GROQ_API_KEY,
      model: 'llama-3.3-70b-versatile',
    },
    {
      name: 'gemini',
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      key: process.env.GEMINI_API_KEY,
      model: 'gemini-2.0-flash',
    },
  ].filter((p) => !!p.key);
}

export const AI_AVAILABLE = (): boolean => providers().length > 0;

/** The immutable guardrail prepended to every system prompt. */
const GUARDRAIL = `You are "Rafiq", the gentle worship companion inside Ihsan, a Muslim habit app.
Your ONLY job is to ENCOURAGE, PERSONALIZE and warmly reflect. Follow these ABSOLUTE rules:
1. NEVER quote, cite, number, or invent a hadith, a Qur'an verse reference, an isnād/chain, or a grading (sahih/hasan/da'if). No "the Prophet said", no surah:ayah citations.
2. NEVER give a religious ruling or verdict — nothing is to be called halal, haram, obligatory, sinful, valid or invalid by you. You do not issue fatwa.
3. NEVER claim anything is authentic, weak, true or false in religion.
4. If asked for evidence, a ruling, or "is this true", warmly decline and point the person to qualified scholars and to Ihsan's own verified references (which link to quran.com / sunnah.com).
5. Speak like a kind, sincere friend — short, warm, humble, never preachy, never a shaykh. 2-4 sentences unless asked otherwise.
6. Do not produce long Arabic supplication text (the app has verified ones already).
Stay strictly within encouragement and personal reflection.`;

async function callProvider(p: Provider, system: string, user: string): Promise<string | null> {
  try {
    const res = await fetch(p.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
      body: JSON.stringify({
        model: p.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[ai] ${p.name} responded ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[ai] ${p.name} error`, (e as Error).message);
    return null;
  }
}

/** Try each provider in order; returns the first non-empty completion. */
async function complete(system: string, user: string): Promise<{ text: string; provider: string } | null> {
  for (const p of providers()) {
    const text = await callProvider(p, `${GUARDRAIL}\n\n${system}`, user);
    if (text && text.trim()) return { text: text.trim(), provider: p.name };
  }
  return null;
}

/** Parse a JSON object out of a model reply, tolerating ```json fences / prose. */
function parseLoose<T>(raw: string): T | null {
  try {
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// ── Feature 1: personalized dhikr / habit encouragement ──────────────────────
export interface SuggestResult { suggestions: string[]; motivation: string; ai: boolean; provider?: string }

const STATIC_SUGGEST: SuggestResult = {
  suggestions: ['SubhanAllah wa bihamdihi', 'Astaghfirullah', 'La ilaha illallah'],
  motivation: 'A little, kept up with love, is beloved. Take one small step today — you are not behind.',
  ai: false,
};

export async function getSuggestions(userSummary: string): Promise<SuggestResult> {
  const out = await complete(
    `The user shares a short summary of their worship habits. Suggest exactly 3 short dhikr PHRASES (names only, transliteration, no translation, no references) that suit them, and ONE warm motivational sentence tailored to them. Reply ONLY as JSON: {"suggestions": string[3], "motivation": string}.`,
    `My worship summary: ${userSummary || 'a Muslim building daily dhikr, salah, Quran and fasting habits'}`
  );
  if (!out) return STATIC_SUGGEST;
  const parsed = parseLoose<{ suggestions?: string[]; motivation?: string }>(out.text);
  if (!parsed?.suggestions?.length || !parsed.motivation) return STATIC_SUGGEST;
  return {
    suggestions: parsed.suggestions.slice(0, 3).map(String),
    motivation: String(parsed.motivation),
    ai: true,
    provider: out.provider,
  };
}

// ── Feature 2: reflect on an āyah (feelings/meaning, NOT tafsir authority) ────
export interface ReflectResult { reflection: string; ai: boolean; provider?: string }

export async function getReflection(input: { surah: number; ayah: number; text: string }): Promise<ReflectResult> {
  const out = await complete(
    `The user is reading one āyah of the Qur'an (an approved English translation is given). Offer a SHORT, heartfelt personal reflection (2-4 sentences) on what its meaning might stir in a believer's heart today — gratitude, hope, humility, calm. Do NOT explain it as tafsir, do NOT say "scholars say", do NOT add any reference or ruling. Just a gentle, human reflection. Reply ONLY as JSON: {"reflection": string}.`,
    `Āyah ${input.surah}:${input.ayah} (translation): "${input.text}"`
  );
  if (!out) {
    return { reflection: 'Sit with these words for a moment — let them soften the heart. Even a slow, sincere reading is a meeting with your Lord.', ai: false };
  }
  const parsed = parseLoose<{ reflection?: string }>(out.text);
  if (!parsed?.reflection) {
    // Some models reply in plain prose — accept it as the reflection.
    return { reflection: out.text.slice(0, 600), ai: true, provider: out.provider };
  }
  return { reflection: String(parsed.reflection), ai: true, provider: out.provider };
}

// ── Feature 3: weekly worship recap ──────────────────────────────────────────
export interface WeeklyResult { summary: string; encouragement: string; ai: boolean; provider?: string }

export async function getWeeklySummary(stats: Record<string, unknown>): Promise<WeeklyResult> {
  const out = await complete(
    `You are given the user's worship numbers for the past week (prayers, dhikr, Quran āyāt, fasting, streaks). Write a warm, non-judgmental recap: ONE short "summary" sentence naming what went well, and ONE short "encouragement" sentence for the week ahead. Celebrate effort, never shame gaps. No references, no rulings. Reply ONLY as JSON: {"summary": string, "encouragement": string}.`,
    `This week's numbers (JSON): ${JSON.stringify(stats).slice(0, 800)}`
  );
  if (!out) {
    return {
      summary: 'You showed up this week — every remembrance counted.',
      encouragement: 'Keep it gentle and steady; small and constant is the way.',
      ai: false,
    };
  }
  const parsed = parseLoose<{ summary?: string; encouragement?: string }>(out.text);
  if (!parsed?.summary || !parsed.encouragement) {
    return { summary: out.text.slice(0, 300), encouragement: 'Keep going — steadily and with love.', ai: true, provider: out.provider };
  }
  return {
    summary: String(parsed.summary),
    encouragement: String(parsed.encouragement),
    ai: true,
    provider: out.provider,
  };
}
