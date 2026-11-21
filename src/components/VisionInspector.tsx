"use client";

import { useState } from "react";
import { Camera, Eye, Loader2, AlertCircle } from "lucide-react";
import { TelemetrySnapshot, VisionInspectionResult } from "@/types/air-quality";

interface VisionInspectorProps {
    telemetry: TelemetrySnapshot;
}

function getHazeEmoji(level: string): string {
    switch (level) {
        case "Clear": return "☀️";
        case "Light Haze": return "🌤️";
        case "Moderate Smog": return "🌫️";
        case "Dense Particulate Haze": return "😶‍🌫️";
        default: return "🌥️";
    }
}

function getVisibilityStars(score: number): string {
    const full = Math.min(Math.round(score / 2), 5);
    return "★".repeat(full) + "☆".repeat(5 - full);
}

export function VisionInspector({ telemetry }: VisionInspectorProps) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<VisionInspectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setLoading(true);
        setResult(null);

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const dataUrl = String(reader.result);
                setPreview(dataUrl);
                const base64 = dataUrl.split(",")[1];

                const res = await fetch("/api/vision", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        imageBase64: base64,
                        mimeType: file.type || "image/jpeg",
                        telemetry,
                    }),
                });

                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Inspection failed");
                setResult(json.result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not analyze the image.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-full">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-violet-500" />
                        <h3 className="text-base font-semibold text-slate-800">📸 Snap & Check</h3>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        Upload a photo of your sky — AI will check if it matches the sensor data
                    </p>
                </div>

                <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload</span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>

            {!preview && !loading && (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                    <Camera className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-400">
                        Take a photo of the sky outside your window
                    </p>
                    <p className="mt-1 text-xs text-slate-300">JPG, PNG, or WebP</p>
                </div>
            )}

            {loading && (
                <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing your sky photo...</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {result && (
                <div className="space-y-3">
                    {preview && (
                        <img
                            src={preview}
                            alt="Your sky photo"
                            className="h-28 w-full rounded-xl border border-slate-100 object-cover"
                        />
                    )}

                    <div className="rounded-xl bg-slate-50 p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{getHazeEmoji(result.detectedHazeLevel)}</span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {result.detectedHazeLevel}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Visibility</p>
                                <p className="text-sm text-amber-500 tracking-wider">
                                    {getVisibilityStars(result.visualVisibilityScore)}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs leading-relaxed text-slate-500">{result.telemetryCorrelation}</p>

                        <div className="flex flex-wrap gap-1">
                            {result.visualCues.map((cue, idx) => (
                                <span
                                    key={idx}
                                    className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500"
                                >
                                    {cue}
                                </span>
                            ))}
                        </div>

                        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                            <span className="font-medium">💡 Tip: </span>
                            {result.immediatePrecaution}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
