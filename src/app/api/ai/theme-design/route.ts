// POST /api/ai/theme-design — AI 主题设计师
import ZAI from "z-ai-web-dev-sdk";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return fail("请描述你想要的风格");

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `你是专业的 UI 配色设计师。根据用户描述生成 KTV/门店管理系统的房态配色方案。

必须返回纯 JSON（不要 markdown，不要多余文字），格式：
{
  "name": "主题名称（4-8字）",
  "description": "简短描述",
  "bgColor": "#hex（页面背景色）",
  "cardBg": "#hex（卡片背景色）",
  "textColor": "#ffffff 或 #1e293b",
  "colors": {
    "idle": "#hex（空闲状态色）",
    "reserved": "#hex（预订色）",
    "seated": "#hex（带位色）",
    "in_use": "#hex（使用中色）",
    "checkout": "#hex（结账中色）",
    "cleaning": "#hex（清扫色）",
    "maintenance": "#hex（维修色）"
  },
  "tips": "配色使用建议（一句话）"
}

要求：
- 颜色用 #hex 格式
- 空闲用绿色系，使用中用红色系，结账中用黄色系
- 其他状态根据整体风格搭配
- 背景色要深色（暗色主题）或浅色（亮色主题）
- 文字颜色与背景对比度高
- 配色要协调美观，符合用户描述的风格`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || "";
    // 尝试提取 JSON
    let parsed: any = null;
    try {
      // 去掉可能的 markdown 代码块
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      // 尝试提取 JSON 块
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
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
