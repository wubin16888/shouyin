// POST /api/ai/chat — AI 助手（兼容 OpenRouter 和 ZAI）
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `你是门店管理系统的智能助手，帮助用户解答软件使用问题、查询参数说明。
系统包含：收银系统、出品系统、财务查询、系统维护。
回答要简洁实用，用中文。`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return fail("缺少 messages");
    }

    // 用 OpenRouter 免费 API（不需要 z-ai-sdk）
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      // 如果 OpenRouter 失败，尝试 z-ai-sdk
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default;
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 800,
        });
        const reply = completion.choices?.[0]?.message?.content || "抱歉，我没理解。";
        return ok({ reply });
      } catch (zaiErr) {
        return fail(`AI 请求失败: ${errText.slice(0, 200)}`);
      }
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "抱歉，我没理解。";
    return ok({ reply });
  } catch (e) {
    return fail(parseError(e));
  }
}
