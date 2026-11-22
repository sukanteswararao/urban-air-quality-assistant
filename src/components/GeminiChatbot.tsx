"use client";

import { useEffect, useRef, useState } from "react";
import {
    Loader2,
    Send,
    Sparkles,
    Copy,
    Check,
    RotateCcw,
    Baby,
    Bike,
    Home,
    Shield,
    Bot,
    User,
    ChevronDown,
    Minimize2,
    Maximize2,
} from "lucide-react";
import { TelemetrySnapshot, UserProfile } from "@/types/air-quality";

interface GeminiChatbotProps {
    telemetry: TelemetrySnapshot;
    profile: UserProfile;
    isFloating?: boolean;
    onClose?: () => void;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

const QUICK_STARTERS = [
    {
        icon: <Bike className="h-3.5 w-3.5 text-blue-500" />,
        text: "Is it safe to run or exercise outside today?",
    },
    {
        icon: <Baby className="h-3.5 w-3.5 text-rose-500" />,
        text: "Can children and seniors safely go to the park this evening?",
    },
    {
        icon: <Home className="h-3.5 w-3.5 text-amber-500" />,
        text: "What hour should I open windows to ventilate my house?",
    },
    {
        icon: <Shield className="h-3.5 w-3.5 text-emerald-500" />,
        text: "Which N95 mask is best for two-wheeler traffic commute?",
    },
];

// Helper to format basic markdown-style text nicely
function FormattedMessage({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <div className="space-y-1.5 leading-relaxed text-xs">
            {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={lIdx} className="h-1" />;

                // Bullet points
                if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
                    const content = trimmed.replace(/^[\*\-•]\s*/, "");
                    return (
                        <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                            <span className="text-emerald-500 font-bold shrink-0">&bull;</span>
                            <span>{renderFormattedInline(content)}</span>
                        </div>
                    );
                }

                // Numbered lists
                if (/^\d+\.\s/.test(trimmed)) {
                    const match = trimmed.match(/^(\d+\.)\s*(.*)$/);
                    if (match) {
                        return (
                            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                                <span className="font-semibold text-slate-500 text-[11px] shrink-0">
                                    {match[1]}
                                </span>
                                <span>{renderFormattedInline(match[2])}</span>
                            </div>
                        );
                    }
                }

                return <p key={lIdx}>{renderFormattedInline(trimmed)}</p>;
            })}
        </div>
    );
}

function renderFormattedInline(str: string) {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-bold text-slate-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
}

export function GeminiChatbot({
    telemetry,
    profile,
    isFloating = false,
    onClose,
}: GeminiChatbotProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: `Hello! I am your **Google Gemini Air Quality Copilot** for **${telemetry.city.name}**.\n\nCurrent telemetry shows **US AQI ${telemetry.current.usAqi}** with **PM2.5 at ${telemetry.current.pm25} µg/m³**.\n\nAsk me about outdoor safety windows, mask recommendations, indoor purifier setups, or commute tips!`,
            timestamp: "Just now",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const prevCityRef = useRef<string>(telemetry.city.name);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Reset when city changes
    useEffect(() => {
        if (prevCityRef.current !== telemetry.city.name) {
            prevCityRef.current = telemetry.city.name;
            setMessages([
                {
                    role: "assistant",
                    content: `Switched location to **${telemetry.city.name}**.\n\nLive telemetry: **AQI ${telemetry.current.usAqi}** | **PM2.5: ${telemetry.current.pm25} µg/m³**.\n\nHow can I help protect your family today?`,
                    timestamp: "Just now",
                },
            ]);
        }
    }, [telemetry.city.name, telemetry.current.usAqi, telemetry.current.pm25]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function sendMessage(textToSend: string) {
        const trimmed = textToSend.trim();
        if (!trimmed || loading) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const userMsg: Message = { role: "user", content: trimmed, timestamp: timeStr };
        const updatedHistory = [...messages, userMsg];

        setMessages(updatedHistory);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/copilot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: trimmed,
                    telemetry,
                    profile,
                    history: updatedHistory.map((m) => ({ role: m.role, content: m.content })),
                }),
            });
            const data = await res.json();
            const replyTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: res.ok ? data.reply : data.error || "Unable to compute reply at this moment.",
                    timestamp: replyTimeStr,
                },
            ]);
        } catch {
            const replyTimeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `In **${telemetry.city.name}**, current US AQI is **${telemetry.current.usAqi}** with PM2.5 at **${telemetry.current.pm25} µg/m³**. For your profile, we recommend avoiding high-exertion outdoor activities during morning hours and keeping living spaces filtered.`,
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
        <div
            className={`flex flex-col bg-white overflow-hidden transition-all ${
                isFloating
                    ? "h-full w-full"
                    : "rounded-3xl border border-slate-200/90 shadow-sm h-[560px]"
            }`}
        >
            {/* Header: Google Gemini Branding */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 shadow-md">
                        <Sparkles className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold tracking-tight text-white">
                                Gemini AI Air Quality Chatbot
                            </h3>
                            <span className="rounded-full bg-blue-500/30 border border-blue-400/40 px-2 py-0.5 text-[9px] font-bold text-blue-200 uppercase tracking-wider">
                                GEMINI 3.5
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                            Grounded in {telemetry.city.name} &bull; Live AQI {telemetry.current.usAqi}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() =>
                            setMessages([
                                {
                                    role: "assistant",
                                    content: `Conversation refreshed. How can Gemini help you navigate **${telemetry.city.name}'s** air quality today?`,
                                    timestamp: "Just now",
                                },
                            ])
                        }
                        className="rounded-xl p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                        title="Reset conversation"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                        >
                            <Minimize2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Starters Carousel / Pill Bar */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Quick Ask:
                </span>
                {QUICK_STARTERS.map((item, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(item.text)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 whitespace-nowrap hover:border-indigo-300 hover:bg-indigo-50/40 transition shrink-0 shadow-2xs disabled:opacity-50"
                    >
                        {item.icon}
                        <span>{item.text}</span>
                    </button>
                ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5 bg-[#FAFBFD]/60">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${
                            msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        {msg.role === "assistant" && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xs mt-0.5">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        )}

                        <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}>
                            <div
                                className={`group relative rounded-3xl p-4 text-xs ${
                                    msg.role === "user"
                                        ? "bg-slate-900 text-white shadow-xs rounded-tr-xs"
                                        : "border border-slate-200/90 bg-white text-slate-800 shadow-2xs rounded-tl-xs"
                                }`}
                            >
                                <FormattedMessage text={msg.content} />

                                {msg.role === "assistant" && (
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(msg.content, idx)}
                                        className="absolute bottom-2 right-2 rounded-lg bg-slate-50 p-1 text-slate-400 opacity-0 group-hover:opacity-100 shadow-xs border border-slate-200 transition hover:text-slate-700"
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
                            <span className="mt-1 px-1.5 text-[10px] text-slate-400">
                                {msg.timestamp}
                            </span>
                        </div>

                        {msg.role === "user" && (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shadow-xs mt-0.5">
                                <User className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xs">
                            <Sparkles className="h-4 w-4 animate-spin" />
                        </div>
                        <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-2xs flex items-center gap-2">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                            <span>Gemini is analyzing {telemetry.city.name} sensor readings...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(input);
                }}
                className="border-t border-slate-100 p-4 bg-white"
            >
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask Gemini about ${telemetry.city.name}'s air quality...`}
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none shadow-2xs"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-3 text-white shadow-md transition hover:opacity-90 disabled:opacity-40"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
