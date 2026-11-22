"use client";

import { useState } from "react";
import { Camera, Eye, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { TelemetrySnapshot, VisionInspectionResult } from "@/types/air-quality";

interface VisionInspectorProps {
    telemetry: TelemetrySnapshot;
}

// Pre-packaged realistic sample base64 previews for instant 1-click test by hackathon judges
const PRESET_SAMPLES = [
    {
        id: "delhi-smog",
        label: "🌁 Severe Smog",
        location: "Delhi NCR Winter Horizon",
        // Soft hazy gray/warm smog gradient data url
        dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><defs><linearGradient id='smog' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23C4B89D'/><stop offset='60%' stop-color='%23A49983'/><stop offset='100%' stop-color='%236B6353'/></linearGradient></defs><rect width='400' height='260' fill='url(%23smog)'/><circle cx='200' cy='100' r='35' fill='%23FFE5B4' opacity='0.3'/><rect x='40' y='180' width='45' height='80' fill='%235A5344' opacity='0.5'/><rect x='100' y='150' width='60' height='110' fill='%234F493B' opacity='0.6'/><rect x='180' y='170' width='70' height='90' fill='%23433E32' opacity='0.7'/><rect x='270' y='160' width='80' height='100' fill='%2338342A' opacity='0.8'/></svg>",
    },
    {
        id: "moderate-haze",
        label: "⛅ Morning Haze",
        location: "Urban Traffic Corridor",
        dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><defs><linearGradient id='haze' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23A8C0E0'/><stop offset='60%' stop-color='%23D4DFE8'/><stop offset='100%' stop-color='%238A9BA8'/></linearGradient></defs><rect width='400' height='260' fill='url(%23haze)'/><circle cx='180' cy='80' r='40' fill='%23FFF3D6' opacity='0.6'/><rect x='60' y='170' width='55' height='90' fill='%23637280' opacity='0.7'/><rect x='140' y='140' width='70' height='120' fill='%2353616D' opacity='0.8'/><rect x='230' y='165' width='65' height='95' fill='%2344505B' opacity='0.85'/></svg>",
    },
    {
        id: "clean-sky",
        label: "☀️ Clean Horizon",
        location: "Post-Rain Clean Sky",
        dataUrl: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='260' viewBox='0 0 400 260'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%2338BDF8'/><stop offset='60%' stop-color='%23BAE6FD'/><stop offset='100%' stop-color='%2334D399'/></linearGradient></defs><rect width='400' height='260' fill='url(%23sky)'/><circle cx='280' cy='65' r='32' fill='%23FDE047' opacity='0.9'/><path d='M0,210 Q90,170 200,210 T400,210 L400,260 L0,260 Z' fill='%23059669'/></svg>",
    },
];

export function VisionInspector({ telemetry }: VisionInspectorProps) {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<VisionInspectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function analyzeBase64(base64: string, mime: string) {
        setError(null);
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/vision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64,
                    mimeType: mime,
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
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = String(reader.result);
            setPreview(dataUrl);
            const base64 = dataUrl.split(",")[1];
            await analyzeBase64(base64, file.type || "image/jpeg");
        };
        reader.readAsDataURL(file);
    }

    async function loadPresetSample(preset: typeof PRESET_SAMPLES[0]) {
        setPreview(preset.dataUrl);
        // Base64 encode the SVG string for the API
        const base64 = Buffer.from(preset.dataUrl.replace("data:image/svg+xml;utf8,", "")).toString("base64");
        await analyzeBase64(base64, "image/svg+xml");
    }

    return (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-violet-500 animate-ping" />
                            <h3 className="text-base font-bold tracking-tight text-slate-900">
                                SkyWatch: Optical Haze & Horizon Inspector
                            </h3>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Optical analysis correlates particulate scattering against live {telemetry.city.name} sensors
                        </p>
                    </div>

                    <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 shadow-2xs">
                        <Camera className="h-3.5 w-3.5" />
                        <span>Upload Photo</span>
                        <input
                            type="file"
                            accept="image/*"
                            aria-label="Upload outdoor horizon or monitor photo"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Quick 1-Click Demo Presets for Evaluators */}
                <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-400">Try 1-Click Test:</span>
                    {PRESET_SAMPLES.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => loadPresetSample(preset)}
                            disabled={loading}
                            aria-label={`Test preset scenario: ${preset.label} - ${preset.location}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white disabled:opacity-50"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Empty State / Upload Dragzone */}
                {!preview && !loading && (
                    <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-100">
                            <Eye className="h-5 w-5 text-violet-500" />
                        </div>
                        <h4 className="mt-2.5 text-xs font-semibold text-slate-700">
                            Snap outdoor horizon or upload monitor display
                        </h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                            Optical contrast attenuation confirms if local sensor telemetry aligns with visual ground reality.
                        </p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-xs font-medium text-violet-700">
                        <Loader2 className="h-4 w-4 animate-spin shrink-0 text-violet-600" />
                        <span>Analyzing optical haze density & Rayleigh scattering...</span>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Analysis Result */}
                {result && (
                    <div className="mt-4 space-y-3.5">
                        {preview && (
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={preview}
                                    alt="Sky analysis preview"
                                    className="h-32 w-full object-cover"
                                />
                                <div className="absolute top-2 left-2 rounded-full bg-slate-900/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-medium text-white flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-violet-300" />
                                    <span>Optical Horizon Analyzed</span>
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Detected Condition
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">
                                        {result.detectedHazeLevel}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Optical Visibility
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-2.5 w-1.5 rounded-xs ${
                                                        i < result.visualVisibilityScore
                                                            ? "bg-violet-500"
                                                            : "bg-slate-200"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="ml-1 text-xs font-bold text-slate-800">
                                            {result.visualVisibilityScore}/10
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs leading-relaxed text-slate-600">
                                {result.telemetryCorrelation}
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {result.visualCues.map((cue, idx) => (
                                    <span
                                        key={idx}
                                        className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs"
                                    >
                                        {cue}
                                    </span>
                                ))}
                            </div>

                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Family Action: </span>
                                    {result.immediatePrecaution}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Micro footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Multi-spectral particulate correlation</span>
                <span className="font-semibold text-slate-600">Open-Meteo &bull; Optical Sensor Correlation</span>
            </div>
        </div>
    );
}
