// 模块：AI 经营助手 — KTV 智能问答与经营建议
// 调用 api.aiChat(messages) 一次性返回（非流式）

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Trophy,
  BarChart3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const QUICK_QUESTIONS = [
  { icon: TrendingUp, label: "今日经营如何？", color: "text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10" },
  { icon: Trophy, label: "哪个经理提成最高？", color: "text-amber-300 border-amber-500/30 hover:bg-amber-500/10" },
  { icon: BarChart3, label: "本周营业趋势分析", color: "text-sky-300 border-sky-500/30 hover:bg-sky-500/10" },
  { icon: AlertTriangle, label: "库存预警建议", color: "text-rose-300 border-rose-500/30 hover:bg-rose-500/10" },
];

const WELCOME_TIP =
  "你好！我是 AI 经营助手。你可以问我关于今日经营数据、经理提成、营业趋势、库存预警、营销策略等问题。需要查看精确数字时，请使用左侧「财务查询」模块。";

export function AiAssistantModule() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME_TIP, ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed, ts: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const apiMessages = newMessages
        .filter((m) => !(m.role === "assistant" && m.content === WELCOME_TIP))
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await api.aiChat(apiMessages);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, ts: Date.now() },
      ]);
    } catch (e) {
      toast({ title: "AI 助手请求失败", description: String(e), variant: "destructive" });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，AI 助手暂时不可用，请稍后重试。",
          ts: Date.now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [messages, sending, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "assistant", content: WELCOME_TIP, ts: Date.now() }]);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col" style={{ minHeight: "calc(100vh - 160px)" }}>
      {/* 顶部标题 */}
      <div className="relative px-5 md:px-8 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5">
              <Sparkles className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-50 tracking-tight">
                  AI 经营助手
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20">
                  <Bot className="h-3 w-3 mr-1" />
                  智能问答
                </Badge>
              </div>
              <p className="mt-1.5 text-sm text-slate-400">
                智能问答，经营建议 — 营业数据分析、提成核算、库存预警、营销策略
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" /> 清空
          </Button>
        </div>
      </div>

      {/* 快捷问题 */}
      {messages.length <= 1 && (
        <div className="px-5 md:px-8 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            快捷问题
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.label}
                  onClick={() => send(q.label)}
                  disabled={sending}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border bg-slate-800/40 px-3 py-1.5 text-xs transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed",
                    q.color,
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}

        {sending && (
          <div className="flex items-start gap-3 max-w-[85%]">
            <div className="rounded-full bg-emerald-500/15 border border-emerald-500/30 h-9 w-9 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-slate-800 border border-slate-700/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                <span>AI 思考中</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t border-slate-800 bg-slate-900/80 backdrop-blur p-3 md:p-4">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题，按 Enter 发送..."
            disabled={sending}
            className="bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500/50 h-11"
          />
          <Button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 h-11 px-4 gap-1.5 shrink-0"
          >
            {sending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">发送</span>
          </Button>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-600 text-center">
          AI 回答基于通用知识，精确经营数据请以「财务查询」模块为准
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      {/* 头像 */}
      <div
        className={cn(
          "rounded-full h-9 w-9 flex items-center justify-center shrink-0 border",
          isUser
            ? "bg-sky-500/15 border-sky-500/30"
            : "bg-emerald-500/15 border-emerald-500/30",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-sky-300" />
        ) : (
          <Bot className="h-4 w-4 text-emerald-300" />
        )}
      </div>

      {/* 气泡 */}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap break-words text-sm leading-relaxed",
          isUser
            ? "bg-emerald-600 text-white rounded-tr-sm"
            : "bg-slate-800 border border-slate-700/60 text-slate-100 rounded-tl-sm",
        )}
      >
        {msg.content}
      </div>
    </div>
  );
}
