import { Router } from "express";
import OpenAI from "openai";

const router = Router();

// Optional AI suggestion endpoint
router.post("/suggest", async (req, res) => {
  try {
    const { userSummary } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    // If no key, return static suggestions
    if (!apiKey) {
      return res.json({
        ok: true,
        ai: false,
        suggestions: [
          "SubhanAllah (33x)",
          "Alhamdulillah (33x)",
          "Allahu Akbar (34x) before sleep",
        ],
        motivation:
          "MashaAllah! Keep going and may Allah increase you in remembrance.",
      });
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `User summary: ${
      userSummary || "N/A"
    }\nSuggest 3 concise dhikr phrases (no explanations) and one short motivational line. Reply in JSON with keys suggestions (array) and motivation (string).`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant focused on Islamic dhikr suggestions.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices?.[0]?.message?.content || "";
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      data = {
        suggestions: [
          "SubhanAllah (33x)",
          "Alhamdulillah (33x)",
          "Allahu Akbar (34x) before sleep",
        ],
        motivation:
          "MashaAllah! Keep going and may Allah increase you in remembrance.",
      };
    }

    res.json({ ok: true, ai: true, ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "AI error" });
  }
});

export default router;
