import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';

const STATIC_SUGGESTIONS = {
  suggestions: [
    'SubhanAllah (33x)',
    'Alhamdulillah (33x)',
    'Allahu Akbar (34x) before sleep',
  ],
  motivation: 'MashaAllah! Keep going and may Allah increase you in remembrance.',
};

export const suggestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userSummary } = req.body as { userSummary?: string };
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      res.json({ ok: true, ai: false, ...STATIC_SUGGESTIONS });
      return;
    }

    const openai = new OpenAI({ apiKey });
    const prompt = `User summary: ${userSummary ?? 'N/A'}\nSuggest 3 concise dhikr phrases (no explanations) and one short motivational line. Reply in JSON with keys suggestions (array) and motivation (string).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant focused on Islamic dhikr suggestions.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices?.[0]?.message?.content ?? '';
    let data: { suggestions?: string[]; motivation?: string };
    try {
      data = JSON.parse(content) as { suggestions?: string[]; motivation?: string };
    } catch {
      data = STATIC_SUGGESTIONS;
    }

    res.json({ ok: true, ai: true, ...data });
  } catch (err) {
    next(err);
  }
};
