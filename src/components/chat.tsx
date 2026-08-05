"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, MessageSquareText, SendHorizontal, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const suggestions = [
  "Summarize the main ideas",
  "Explain the most important concept",
  "Create 5 practice questions",
  "Quiz me with one question",
];

export function ChatView({ documentId }: { documentId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function send(content?: string) {
    const text = (content ?? input).trim();
    if (!text || loading) return;

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, messages: history }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Chat request failed. Try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              assistantText += delta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: "assistant", content: assistantText };
                return next;
              });
            }
          } catch {
            // ignore incomplete JSON frames
          }
        }
      }

      if (!assistantText.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Hmm, I did not get a response. Please try again.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error ? err.message : "Something went wrong. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div
        ref={scrollRef}
        className="nice-scroll flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-lg">
              <MessageSquareText className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Ask anything about this document
              </h2>
              <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                Answers are grounded in the notes you uploaded.
              </p>
            </div>
            <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs font-medium text-zinc-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-brand-700 dark:hover:bg-brand-950 dark:hover:text-brand-300"
                >
                  <Sparkles className="mb-1 h-3 w-3 text-brand-500 dark:text-brand-400" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
                  message.role === "user"
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm border border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
                )}
              >
                {message.role === "assistant" ? (
                  message.content ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-zinc-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking…
                    </div>
                  )
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about your notes…"
            className="nice-scroll max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="h-10 w-10 shrink-0 p-0"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          StudyAI may make mistakes — always verify important facts.
        </p>
      </div>
    </div>
  );
}
