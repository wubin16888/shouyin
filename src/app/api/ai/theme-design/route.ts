// POST /api/ai/theme-design — AI 主题设计师（自由发挥版）
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
          content: `你是顶级的 UI/UX 视觉设计师，擅长根据用户的自然语言描述生成完整的界面视觉方案。

你可以自由发挥创意，但要确保返回的 JSON 格式正确。根据用户描述，设计一套完整的主题。

必须返回纯 JSON（不要 markdown 代码块，不要多余文字），格式如下：

{
  "name": "主题名称（2-6字）",
  "description": "一句话描述设计理念",
  "bgColor": "#hex 页面背景色",
  "cardBg": "#hex 卡片/面板背景色",
  "cardBgGradient": "linear-gradient(...) 或 null（卡片渐变背景，如果用户说渐变就用）",
  "textColor": "#hex 主文字颜色",
  "textMuted": "#hex 次要文字颜色（比主文字暗）",
  "borderColor": "#hex 边框颜色",
  "borderRadius": "数字（圆角大小px，如12或16或20）",
  "boxShadow": "CSS box-shadow值（卡片阴影，如 '0 4px 20px rgba(0,0,0,0.3)'）",
  "glowEffect": "CSS box-shadow值（光感效果，如果用户说'光感''发光'就加，如 '0 0 15px rgba(255,215,0,0.3)'，否则 null）",
  "headerBg": "#hex 或 linear-gradient(...) 顶栏背景",
  "sidebarBg": "#hex 侧边栏背景",
  "accentColor": "#hex 强调色（按钮/链接/选中态）",
  "colors": {
    "idle": "#hex 空闲状态色",
    "reserved": "#hex 预订色",
    "seated": "#hex 带位色",
    "in_use": "#hex 使用中色",
    "checkout": "#hex 结账中色",
    "cleaning": "#hex 清扫色",
    "maintenance": "#hex 维修色"
  },
  "roomShadow": "CSS box-shadow（房台色块的阴影/光感，如 '0 0 20px rgba(5,150,105,0.4)'）",
  "roomBorder": "CSS border 值（房台边框，如 '2px solid rgba(255,255,255,0.1)'）",
  "roomHover": "CSS transform+shadow（房台悬停效果，如 'scale(1.05) translateY(-2px)'）",
  "fontFamily": "字体（如 'sans-serif' 或 null）",
  "tips": "设计说明（告诉用户你做了什么特别的设计）"
}

设计原则：
- 根据用户的描述自由发挥，不要拘泥于固定模式
- 如果用户说"光感""发光""霓虹"，在 glowEffect 和 roomShadow 加发光效果
- 如果用户说"渐变"，在 cardBgGradient 和 headerBg 用渐变
- 如果用户说"圆角""柔和"，borderRadius 用大值（16-24）
- 如果用户说"扁平""硬朗"，borderRadius 用小值（4-8）
- 配色要协调，对比度要够
- 空闲用绿色系，使用中用红色系，这是固定的
- 其他颜色根据风格自由搭配
- 一定要回应用户的具体需求，不要忽略任何细节`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "";
    let parsed: any = null;
    try {
      const clean = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
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
