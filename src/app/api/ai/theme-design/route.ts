// POST /api/ai/theme-design — AI 主题设计师（兼容 OpenRouter）
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return fail("请描述你想要的风格");

    const systemPrompt = `你是顶级的 UI/UX 视觉设计师。根据用户描述生成完整的界面视觉方案。
必须返回纯 JSON（不要 markdown 代码块），格式：
{
  "name": "主题名称（2-6字）",
  "description": "一句话描述",
  "bgColor": "#hex",
  "cardBg": "#hex",
  "textColor": "#hex",
  "colors": {
    "idle": "#hex", "reserved": "#hex", "seated": "#hex",
    "in_use": "#hex", "checkout": "#hex", "cleaning": "#hex", "maintenance": "#hex"
  },
  "borderColor": "#hex",
  "borderRadius": 16,
  "boxShadow": "CSS值",
  "glowEffect": "CSS值或null",
  "headerBg": "#hex或gradient",
  "sidebarBg": "#hex",
  "accentColor": "#hex",
  "roomShadow": "CSS值",
  "roomBorder": "CSS值",
  "tips": "设计说明"
}
空闲用绿色系，使用中用红色系。`;

    // 用 OpenRouter
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 800,
      }),
    });

    let content = "";
    if (res.ok) {
      const data = await res.json();
      content = data.choices?.[0]?.message?.content || "";
    } else {
      // 回退到 z-ai-sdk
      try {
        const ZAI = (await import("z-ai-web-dev-sdk")).default;
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.9,
          max_tokens: 800,
        });
        content = completion.choices?.[0]?.message?.content || "";
      } catch (zaiErr) {
        return fail("AI 服务暂时不可用，请稍后重试");
      }
    }

    // 提取 JSON
    let parsed: any = null;
    try {
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }
    }

    if (!parsed || !parsed.colors) {
      return fail("AI 返回格式异常，请重试");
    }

    return ok(parsed);
  } catch (e) {
    return fail(parseError(e));
  }
}
