"use client";

import { useEffect, useRef, useState } from "react";
import {
    Loader2,
    Send,
    MessageCircle,
    X,
    Sparkles,
    Copy,
    Check,
    Baby,
    HeartPulse,
    Home,
    Shield,
} from "lucide-react";
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
    timestamp: string;
}

const CATEGORY_PROMPTS = [
    {
        icon: <Baby className="h-3.5 w-3.5 text-pink-500" />,
        label: "For Children",
        prompt: "Is it safe for my 6-year-old child to play outdoors in the park this evening?",
    },
    {
        icon: <HeartPulse className="h-3.5 w-3.5 text-rose-500" />,
        label: "Workout Window",
        prompt: "When is the lowest pollution window today for a brisk outdoor jog?",
    },
    {
        icon: <Home className="h-3.5 w-3.5 text-blue-500" />,
        label: "Home Ventilation",
        prompt: "Should I open my balcony windows today to air out the living room, and at what hour?",
    },
    {
        icon: <Shield className="h-3.5 w-3.5 text-emerald-500" />,
        label: "Mask Choice",
        prompt: "Will a simple cloth mask protect me on a 30-minute two-wheeler commute, or do I need an N95?",
    },
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
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
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

        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [...prev, { role: "user", content: trimmed, timestamp: timeStr }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: trimmed, telemetry, profile }),
            });
            const data = await res.json();
            const replyTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: res.ok ? data.reply : data.error || "Something went wrong.",
                    timestamp: replyTimeStr,
                },
            ]);
        } catch {
            const replyTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Network issue contacting atmospheric copilot. Please try again in a moment.",
                    timestamp: replyTimeStr,
                },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function copyToClipboard(text: string, idx: number) {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" onClick={onClose}>
            <div
                className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-250"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/60">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 shadow-sm text-white">
                            <Sparkles className="h-4.5 w-4.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h2 className="text-sm font-bold tracking-tight text-slate-900">
                                    BreatheSafe Copilot
                                </h2>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    LIVE
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Grounded in {telemetry.city.name} sensor data &bull; AQI {telemetry.current.usAqi}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Messages Body */}
                <div className="flex-1 space-y-4 overflow-y-auto p-6">
                    {messages.length === 0 && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                                <p className="text-xs font-semibold text-emerald-950">
                                    👋 Namaste! I am your family&apos;s environmental co-pilot for{" "}
                                    <strong className="text-emerald-900">{telemetry.city.name}</strong>.
                                </p>
                                <p className="mt-1 text-xs text-emerald-800/80 leading-relaxed">
                                    Ask me anything about daily commute safety, indoor cooking ventilation, school commute tips, or elder care.
                                </p>
                            </div>

                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-1">
                                Quick Family Questions:
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {CATEGORY_PROMPTS.map((item, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => sendQuestion(item.prompt)}
                                        className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-2xs group"
                                    >
                                        <div className="mt-0.5 rounded-lg bg-slate-50 p-1 border border-slate-100 group-hover:bg-white">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                {item.label}
                                            </span>
                                            <span className="text-xs text-slate-700 font-medium leading-relaxed block mt-0.5">
                                                {item.prompt}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                        >
                            <div
                                className={`group relative max-w-[88%] rounded-3xl p-4 text-xs leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-slate-900 text-white shadow-xs"
                                        : "border border-slate-200/80 bg-slate-50/80 text-slate-800 shadow-2xs"
                                }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>

                                {msg.role === "assistant" && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(msg.content, idx)}
                                        className="absolute bottom-2 right-2 rounded-lg bg-white p-1 text-slate-400 opacity-0 group-hover:opacity-100 shadow-xs border border-slate-200 transition hover:text-slate-700"
                                        title="Copy response"
                                    >
                                        {copiedIdx === idx ? (
                                            <Check className="h-3 w-3 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <span className="mt-1 px-2 text-[10px] text-slate-400">
                                {msg.timestamp}
                            </span>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                            <span>Computing atmospheric advice with Gemini 3.5...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendQuestion(input);
                    }}
                    className="border-t border-slate-100 p-4 bg-slate-50/50"
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Ask about ${telemetry.city.name}'s air today...`}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none shadow-2xs"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 p-3 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
