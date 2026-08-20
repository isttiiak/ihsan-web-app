/**
 * AI companion service — ENCOURAGEMENT & PERSONALIZATION ONLY.
 *
 * Hard product rule (Istiak): the AI may motivate, personalize, summarize and
 * reflect on feelings — it may NEVER be a source of religious evidence. It must
 * not cite or invent a hadith/āyah number, a chain, or a grade; must not issue
 * any ruling (ḥalāl/ḥarām/fatwa) or claim authenticity; and must redirect all
 * such questions to qualified scholars and the app's own verified references.
 *
 * Provider: GROQ ONLY (free tier, fast, verified). Model changed Aug 2026 from
 * deprecated llama-3.3-70b-versatile to openai/gpt-oss-120b (with gpt-oss-20b
 * as fallback). Gemini was dropped long ago (429 on first call).
 *
 * Free tier limits (Aug 2026): 30 RPM, 1K RPD, 8K TPM, 200K TPD.
 * All features cache aggressively on the client (localStorage keyed by time
 * period) so a typical user makes 1-3 calls per week.
 */

interface Provider {
  name: string;
  url: string;
  key: string | undefined;
  model: string;
}

function providers(): Provider[] {
  const key = process.env.GROQ_API_KEY;
  if (!key) return [];
  return [
    {
      name: 'groq-120b',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key,
      model: 'openai/gpt-oss-120b',
    },
    {
      name: 'groq-20b',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      key,
      model: 'openai/gpt-oss-20b',
    },
  ];
}

export const AI_AVAILABLE = (): boolean => !!process.env.GROQ_API_KEY;

/** The immutable guardrail prepended to every system prompt. */
const GUARDRAIL = `You are "Naseeh", the gentle worship companion inside Ihsan, a Muslim habit app.
Your ONLY job is to ENCOURAGE, PERSONALIZE and warmly reflect. Follow these ABSOLUTE rules:
1. NEVER quote, cite, number, or invent a hadith, a Qur'an verse reference, an isnād/chain, or a grading (sahih/hasan/da'if). No "the Prophet said", no surah:ayah citations.
2. NEVER give a religious ruling or verdict — nothing is to be called halal, haram, obligatory, sinful, valid or invalid by you. You do not issue fatwa.
3. NEVER claim anything is authentic, weak, true or false in religion.
4. If asked for evidence, a ruling, or "is this true", warmly decline and point the person to qualified scholars and to Ihsan's own verified references (which link to quran.com / sunnah.com).
5. Speak like a kind, sincere friend — short, warm, humble, never preachy, never a shaykh. 2-4 sentences unless asked otherwise.
6. Do not produce long Arabic supplication text (the app has verified ones already).
Stay strictly within encouragement and personal reflection.`;

async function callProvider(p: Provider, system: string, user: string, maxTokens = 600): Promise<string | null> {
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
        max_tokens: maxTokens,
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

/** Try each provider in order with a fully-formed system prompt. */
async function completeRaw(system: string, user: string, maxTokens = 600): Promise<{ text: string; provider: string } | null> {
  for (const p of providers()) {
    const text = await callProvider(p, system, user, maxTokens);
    if (text && text.trim()) return { text: text.trim(), provider: p.name };
  }
  return null;
}

/** Encouragement path — always prefixed with the immutable guardrail. */
async function complete(system: string, user: string, maxTokens = 600): Promise<{ text: string; provider: string } | null> {
  return completeRaw(`${GUARDRAIL}\n\n${system}`, user, maxTokens);
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

// ── Feature 2: weekly worship recap ──────────────────────────────────────────
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

// ── Feature 3: comeback nudge after time away ────────────────────────────────
export interface NudgeResult { message: string; ai: boolean; provider?: string }

export async function getComebackNudge(input: { daysAway: number; bestStreak?: number }): Promise<NudgeResult> {
  const out = await complete(
    `The user has been away from their worship tracking for a few days and just opened the app again. Write ONE short, warm welcome-back line (max 2 sentences). Make returning feel easy and shame-free — suggest the SMALLEST possible next step (a single āyah, one dhikr, one prayer logged). Never guilt them, never mention "streak loss" as a failure. Reply ONLY as JSON: {"message": string}.`,
    `Days away: ${input.daysAway}. Their best run ever: ${input.bestStreak ?? 0} days.`,
    220
  );
  const fallback = `${input.daysAway} days away — and you came back. Start tiny today: one āyah, or one dhikr. That's enough.`;
  if (!out) return { message: fallback, ai: false };
  const parsed = parseLoose<{ message?: string }>(out.text);
  return { message: parsed?.message ? String(parsed.message) : fallback, ai: !!parsed?.message, provider: out.provider };
}

// ── Feature 4: mood-aware comfort (Rayhanah) ─────────────────────────────────
export async function getMoodComfort(input: { moods: string[]; symptoms?: string[] }): Promise<NudgeResult> {
  const out = await complete(
    `A Muslim woman logged how she feels today during her cycle. Write ONE gentle, comforting line (max 2 sentences) that acknowledges EXACTLY the feelings she named — warm, sisterly, never clinical, never preachy. If she named several, hold them together. Do NOT give medical advice, do NOT give any ruling, do NOT cite anything. Reply ONLY as JSON: {"message": string}.`,
    `She feels: ${input.moods.join(', ') || 'unspecified'}${input.symptoms?.length ? `. Body: ${input.symptoms.join(', ')}` : ''}.`,
    220
  );
  const fallback = 'Whatever today feels like, you are still held and still beloved to Allah. Be gentle with yourself.';
  if (!out) return { message: fallback, ai: false };
  const parsed = parseLoose<{ message?: string }>(out.text);
  return { message: parsed?.message ? String(parsed.message) : fallback, ai: !!parsed?.message, provider: out.provider };
}

// ── Feature 5: streak coaching (milestones & recovery) ───────────────────────
export interface CoachResult { message: string; tip: string; ai: boolean; provider?: string }

export async function getStreakCoaching(input: {
  event: 'milestone' | 'break';
  streakDays?: number;
  feature: string;
  bestStreak?: number;
}): Promise<CoachResult> {
  const isMilestone = input.event === 'milestone';
  const out = await complete(
    isMilestone
      ? `The user just hit a ${input.streakDays}-day streak in their ${input.feature} tracking. Write ONE warm celebratory "message" (max 2 sentences) and ONE practical "tip" for keeping the momentum (1 sentence). No hadith, no ruling. Reply ONLY as JSON: {"message": string, "tip": string}.`
      : `The user's ${input.feature} streak just broke after ${input.streakDays ?? 0} days. Their best ever: ${input.bestStreak ?? 0} days. Write ONE shame-free, encouraging "message" (max 2 sentences — this is a restart, not a failure) and ONE tiny "tip" for getting back (1 sentence, smallest possible action). Reply ONLY as JSON: {"message": string, "tip": string}.`,
    `${input.feature} streak ${isMilestone ? 'milestone' : 'break'}: ${input.streakDays ?? 0} days. Best ever: ${input.bestStreak ?? 0}.`,
    300
  );
  const fallback: CoachResult = isMilestone
    ? { message: `${input.streakDays} days — masha'Allah, your consistency is beautiful.`, tip: 'Same time, same place — rhythm outlasts willpower.', ai: false }
    : { message: `Streaks end — but you showed up for ${input.streakDays ?? 0} days, and that counted.`, tip: 'Just one today. One dhikr, one āyah, one prayer logged. That restarts everything.', ai: false };
  if (!out) return fallback;
  const parsed = parseLoose<{ message?: string; tip?: string }>(out.text);
  if (!parsed?.message || !parsed.tip) return fallback;
  return { message: String(parsed.message), tip: String(parsed.tip), ai: true, provider: out.provider };
}

// ── Feature 6: fasting companion (daily encouragement during fasts) ──────────
export interface FastingCompanionResult { message: string; ai: boolean; provider?: string }

export async function getFastingCompanion(input: {
  period: 'morning' | 'evening';
  fastType: string;
  dayNumber?: number;
}): Promise<FastingCompanionResult> {
  const isMorning = input.period === 'morning';
  const out = await complete(
    isMorning
      ? `A Muslim is starting their fast today (${input.fastType}${input.dayNumber ? `, day ${input.dayNumber}` : ''}). Write ONE short, gentle morning "message" (max 2 sentences) — a warm focus for the day, a feeling to carry. Not a du'a (the app has verified ones). No hadith citation, no ruling. Reply ONLY as JSON: {"message": string}.`
      : `A Muslim is nearing iftar after fasting today (${input.fastType}${input.dayNumber ? `, day ${input.dayNumber}` : ''}). Write ONE short, warm evening "message" (max 2 sentences) — acknowledgement of the effort, gentle anticipation. Not a du'a. No hadith, no ruling. Reply ONLY as JSON: {"message": string}.`,
    `Fasting: ${input.fastType}, ${isMorning ? 'just starting' : 'near iftar'}. Day ${input.dayNumber ?? 1}.`,
    220
  );
  const fallback: FastingCompanionResult = isMorning
    ? { message: 'A new day of fasting begins — you chose this closeness to Allah. Let every quiet moment today be a conversation with Him.', ai: false }
    : { message: 'The end is near — you carried this day with patience. Soon the reward of breaking your fast, and every hungry moment counted.', ai: false };
  if (!out) return fallback;
  const parsed = parseLoose<{ message?: string }>(out.text);
  return { message: parsed?.message ? String(parsed.message) : fallback.message, ai: !!parsed?.message, provider: out.provider };
}

// ── Feature 7: activity pattern analysis ─────────────────────────────────────
export interface InsightResult { insights: string[]; headline: string; ai: boolean; provider?: string }

export async function getActivityInsight(stats: Record<string, unknown>): Promise<InsightResult> {
  const out = await complete(
    `You are given a user's worship activity data for the past month (salat, dhikr, Quran, fasting). Analyze the patterns and write:
- ONE short "headline" (max 1 sentence) summarizing the overall picture
- 2-3 "insights" (each 1 sentence) about patterns you notice: which days are strong, what's growing, what dropped, any notable rhythm

Be warm and specific — name the actual numbers you see. No hadith, no ruling, no guilt. Reply ONLY as JSON: {"headline": string, "insights": string[]}.`,
    `Monthly activity data (JSON): ${JSON.stringify(stats).slice(0, 1200)}`,
    500
  );
  const fallback: InsightResult = {
    headline: 'Your month had its own rhythm — every day you showed up mattered.',
    insights: ['Look at your strongest days and keep protecting that time.', 'Small consistency beats occasional bursts — the quiet days add up too.'],
    ai: false,
  };
  if (!out) return fallback;
  const parsed = parseLoose<{ headline?: string; insights?: string[] }>(out.text);
  if (!parsed?.headline || !parsed.insights?.length) return fallback;
  return {
    headline: String(parsed.headline),
    insights: parsed.insights.slice(0, 4).map(String),
    ai: true,
    provider: out.provider,
  };
}
