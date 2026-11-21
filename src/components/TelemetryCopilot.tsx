"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, MessageCircle, X } from "lucide-react";
import { TelemetrySnapshot, UserProfile } from "@/types/air-quality";

interface TelemetryCopilotProps {
    open: boolean;
    onClose: () => void;
    telemetry: TelemetrySnapshot;
    profile: UserProfile;
}

interface Message {
    role: "user" | "assistant";
    content: string;
}

const SUGGESTED_PROMPTS = [
    "Is it safe to take my kids to the park today?",
    "What can I do to improve air at home right now?",
    "Should I wear a mask for my morning commute?",
    "What's the best time for outdoor exercise today?",
];

export function TelemetryCopilot({
    open,
    onClose,
    telemetry,
    profile,
}: TelemetryCopilotProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([]);
    }, [telemetry.city.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!open) return null;

    async function sendQuestion(q: string) {
        const trimmed = q.trim();
        if (!trimmed || loading) return;

        setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: trimmed, telemetry, profile }),
            });
            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: res.ok ? data.reply : data.error || "Something went wrong.",
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Network error — please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[2px]" onClick={onClose}>
            <div
                className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
                            <MessageCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Ask BreatheSafe</h2>
                            <p className="text-[11px] text-slate-400">
                                {telemetry.city.name} · AQI {telemetry.current.usAqi}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                    {messages.length === 0 && (
                        <div className="space-y-3">
                            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                                <p className="text-sm text-slate-600">
                                    👋 Hi! I&apos;m BreatheSafe, your air quality assistant for{" "}
                                    <strong className="text-slate-700">{telemetry.city.name}</strong>.
                                    Ask me anything about the air today!
                                </p>
                            </div>
                            <p className="text-xs text-slate-400 pl-1">Try asking:</p>
                            <div className="space-y-2">
                                {SUGGESTED_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => sendQuestion(prompt)}
                                        className="block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50/50"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === "user"
                                    ? "ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                    : "mr-auto border border-slate-100 bg-slate-50 text-slate-700"
                            }`}
                        >
                            {msg.content}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                            <span>BreatheSafe is thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendQuestion(input);
                    }}
                    className="border-t border-slate-100 p-4"
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Ask about ${telemetry.city.name} air quality...`}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 transition focus:border-emerald-300 focus:bg-white focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-2.5 text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
