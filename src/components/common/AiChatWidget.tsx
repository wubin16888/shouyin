// AI 助手浮窗 — 可嵌入任何模块，回答软件使用问题

"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function AiChatWidget({
  title = "AI 助手",
  systemPrompt,
  buttonColor = "bg-violet-600 hover:bg-violet-500",
}: {
  title?: string;
  systemPrompt?: string;
  buttonColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultPrompt = `你是这个门店管理系统的助手。帮助用户解答软件使用问题、查询参数说明。
系统包含：收银系统、出品系统、财务查询、系统维护（营业参数/物品管理/口味/赠送规则/人事/出品点/房台设置/计时计费/主题市场/打印模板）。
回答要简洁实用，用中文。`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt || defaultPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg.content },
          ],
        }),
      });
      const body = await res.json();
      const reply = body.data?.reply || "抱歉，我没理解，请再说一遍。";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "网络错误，请重试" }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <>
      {/* 浮动按钮 */}
      <Button
        onClick={() => setOpen(!open)}
        className={cn("fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg gap-0 p-0", buttonColor)}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>

      {/* 聊天窗口 */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          {/* 标题栏 */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20">
              <Bot className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">{title}</div>
              <div className="text-[10px] text-slate-500">问我软件怎么用</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)} className="ml-auto h-7 w-7 text-slate-400">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 消息区 */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                你好！问我任何关于系统使用的问题
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {["怎么开台？", "怎么设置房台？", "怎么改密码？", "怎么切换行业？"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-violet-300"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  m.role === "user" ? "bg-emerald-600/20" : "bg-violet-600/20",
                )}>
                  {m.role === "user" ? <User className="h-4 w-4 text-emerald-400" /> : <Bot className="h-4 w-4 text-violet-400" />}
                </div>
                <div className={cn(
                  "rounded-xl px-3 py-2 text-sm max-w-[260px] break-words",
                  m.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-100 border border-slate-700",
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/20">
                  <Bot className="h-4 w-4 text-violet-400" />
                </div>
                <div className="rounded-xl px-3 py-2 text-sm bg-slate-800 text-slate-400 border border-slate-700">
                  思考中...
                </div>
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="输入问题..."
              className="bg-slate-800 border-slate-700 text-slate-100 flex-1"
            />
            <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="bg-violet-600 hover:bg-violet-500 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
