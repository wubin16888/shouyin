// POST /api/ai/chat — AI 智能助手（KTV 经营问答）
// 使用 z-ai-web-dev-sdk，无需 API KEY

import ZAI from "z-ai-web-dev-sdk";
import { ok, fail, parseError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `你是 KTV 经营管理系统的智能助手，专门帮助老板和经理分析经营数据、提供决策建议。

你可以帮助：
1. 经营数据分析（今日营收、开房率、消费趋势）
2. 赠送策略建议（什么时候该做活动、赠送多少）
3. 提成核算咨询
4. 库存预警判断
5. 排班建议
6. 会员营销建议

回答要简洁实用，用中文，必要时用表格或列表。如果用户问的是具体经营数据，可以提示他们去"财务查询"模块查看实时数据。`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return fail("缺少 messages");
    }

    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || "抱歉，我没理解，请再说一遍。";
    return ok({ reply });
  } catch (e) {
    return fail(parseError(e));
  }
}
