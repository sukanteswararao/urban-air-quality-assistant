"use client";

import { useState } from "react";
import { HourlyPoint } from "@/types/air-quality";
import { Clock, TrendingUp, TrendingDown, Info } from "lucide-react";

interface PollutantChartProps {
    hourly: HourlyPoint[];
    selectedHourIdx?: number | null;
    onSelectHour?: (idx: number) => void;
}

type MetricKey = "usAqi" | "pm25" | "pm10" | "no2";

const METRIC_META: Record<
    MetricKey,
    { label: string; full: string; unit: string; stroke: string; fill: string; whoLimit?: number }
> = {
    usAqi: { label: "US AQI", full: "Air Quality Index", unit: "AQI", stroke: "#059669", fill: "#10b981", whoLimit: 50 },
    pm25: { label: "PM2.5", full: "Fine Particulate Matter", unit: "µg/m³", stroke: "#d97706", fill: "#f59e0b", whoLimit: 15 },
    pm10: { label: "PM10", full: "Coarse Inhalable Dust", unit: "µg/m³", stroke: "#0284c7", fill: "#38bdf8", whoLimit: 45 },
    no2: { label: "NO₂", full: "Nitrogen Dioxide (Vehicular)", unit: "µg/m³", stroke: "#e11d48", fill: "#f43f5e", whoLimit: 25 },
};

function getAqiContext(aqi: number): { label: string; advice: string; color: string } {
    if (aqi <= 50) return { label: "Clean Air Window", advice: "Ideal for outdoor running, ventilating bedrooms, and outdoor school sports.", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (aqi <= 100) return { label: "Moderate Haze", advice: "Acceptable for most; unusually sensitive individuals should watch for cough.", color: "text-amber-700 bg-amber-50 border-amber-200" };
    if (aqi <= 150) return { label: "Sensitive Groups Alert", advice: "Children & asthma patients should avoid prolonged outdoor exertion.", color: "text-orange-700 bg-orange-50 border-orange-200" };
    if (aqi <= 200) return { label: "Unhealthy Smog Peak", advice: "Wear N95 during commute. Keep road-facing windows sealed tight.", color: "text-rose-700 bg-rose-50 border-rose-200" };
    return { label: "Severe Smog Inversion", advice: "Avoid all outdoor exercise. Run HEPA air purifiers inside living areas.", color: "text-purple-700 bg-purple-50 border-purple-200" };
}

export function PollutantChart({ hourly, selectedHourIdx, onSelectHour }: PollutantChartProps) {
    const [metric, setMetric] = useState<MetricKey>("usAqi");
    const [localHoverIdx, setLocalHoverIdx] = useState<number | null>(null);

    if (!hourly || hourly.length === 0) return null;

    const activeIdx = localHoverIdx ?? selectedHourIdx ?? Math.min(8, hourly.length - 1);
    const activePoint = hourly[activeIdx] || hourly[0];
    const meta = METRIC_META[metric];

    const values = hourly.map((h) => h[metric]);
    const maxVal = Math.max(...values, meta.whoLimit ? meta.whoLimit * 1.5 : 50);
    const minVal = Math.min(...values, 0);
    const span = Math.max(maxVal - minVal, 1);

    // Peak & Best hours
    const peakHour = hourly.reduce((max, cur) => (cur[metric] > max[metric] ? cur : max), hourly[0]);
    const bestHour = hourly.reduce((min, cur) => (cur[metric] < min[metric] ? cur : min), hourly[0]);

    const width = 720;
    const height = 210;
    const padX = 36;
    const padY = 28;

    const points = hourly.map((pt, idx) => {
        const x = padX + (idx / Math.max(hourly.length - 1, 1)) * (width - padX * 2);
        const y = height - padY - ((pt[metric] - minVal) / span) * (height - padY * 2);
        return { x, y, pt, idx };
    });

    const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaPath = `M ${points[0].x},${height - padY} L ${points
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" L ")} L ${points[points.length - 1].x},${height - padY} Z`;

    const activePtCoord = points[activeIdx] || points[0];
    const context = getAqiContext(activePoint.usAqi);

    return (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
            {/* Header with Metric Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-base font-bold tracking-tight text-slate-900">
                            24-Hour Atmospheric Curve & Planner
                        </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Scrub across hours to identify clean outdoor windows vs. traffic smog peaks
                    </p>
                </div>

                {/* Metric Selector Pills */}
                <div className="flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1">
                    {(Object.keys(METRIC_META) as MetricKey[]).map((key) => {
                        const m = METRIC_META[key];
                        const isSelected = metric === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setMetric(key)}
                                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                    isSelected
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {m.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Quick Stats: Current Scrub Value + Peak + Best Window */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>Scrub Time: {activePoint.time}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                            {activePoint[metric]}
                        </span>
                        <span className="text-xs font-medium text-slate-400">{meta.unit}</span>
                    </div>
                    <span className={`inline-block mt-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${context.color}`}>
                        {context.label}
                    </span>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <TrendingDown className="h-3.5 w-3.5" />
                        <span>Clearest Window</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                        {bestHour.time} — {bestHour[metric]} {meta.unit}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Safest window for errands & fresh air</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>Peak Smog Inversion</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                        {peakHour.time} — {peakHour[metric]} {meta.unit}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Avoid road-facing ventilation</p>
                </div>
            </div>

            {/* SVG Chart Area */}
            <div className="mt-5 overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-52 w-full min-w-[540px] select-none"
                    onMouseLeave={() => setLocalHoverIdx(null)}
                >
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={meta.stroke} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={meta.stroke} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 0.33, 0.66, 1].map((ratio, idx) => {
                        const y = padY + ratio * (height - padY * 2);
                        const val = Math.round(maxVal - ratio * span);
                        return (
                            <g key={idx}>
                                <line
                                    x1={padX}
                                    x2={width - padX}
                                    y1={y}
                                    y2={y}
                                    stroke="#F1F5F9"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={4}
                                    y={y + 3}
                                    fill="#94A3B8"
                                    fontSize="10"
                                    fontFamily="sans-serif"
                                    fontWeight="500"
                                >
                                    {val}
                                </text>
                            </g>
                        );
                    })}

                    {/* WHO Recommended Guideline benchmark dashed line if applicable */}
                    {meta.whoLimit && meta.whoLimit < maxVal && (
                        <g>
                            {(() => {
                                const whoY = height - padY - ((meta.whoLimit - minVal) / span) * (height - padY * 2);
                                return (
                                    <>
                                        <line
                                            x1={padX}
                                            x2={width - padX}
                                            y1={whoY}
                                            y2={whoY}
                                            stroke="#10b981"
                                            strokeWidth="1.5"
                                            strokeDasharray="6 4"
                                        />
                                        <text
                                            x={width - padX}
                                            y={whoY - 5}
                                            textAnchor="end"
                                            fill="#059669"
                                            fontSize="9"
                                            fontWeight="600"
                                        >
                                            WHO 24h Safe Limit ({meta.whoLimit} {meta.unit})
                                        </text>
                                    </>
                                );
                            })()}
                        </g>
                    )}

                    {/* Area fill under curve */}
                    <path d={areaPath} fill="url(#chartGradient)" />

                    {/* Polyline curve */}
                    <polyline
                        fill="none"
                        stroke={meta.stroke}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polyline}
                    />

                    {/* Vertical indicator guideline */}
                    {activePtCoord && (
                        <line
                            x1={activePtCoord.x}
                            x2={activePtCoord.x}
                            y1={padY}
                            y2={height - padY}
                            stroke={meta.stroke}
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            opacity="0.6"
                        />
                    )}

                    {/* Time ticks and interactive click zones */}
                    {points.map((p, idx) => (
                        <g key={p.pt.time}>
                            {idx % 4 === 0 && (
                                <text
                                    x={p.x}
                                    y={height - 6}
                                    textAnchor="middle"
                                    fill="#64748B"
                                    fontSize="10"
                                    fontWeight="500"
                                >
                                    {p.pt.time}
                                </text>
                            )}

                            {/* Dot on point */}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={activeIdx === idx ? 6 : 2.5}
                                fill={activeIdx === idx ? meta.stroke : "#FFFFFF"}
                                stroke={meta.stroke}
                                strokeWidth={activeIdx === idx ? 3 : 1.5}
                                className="transition-all duration-150"
                            />

                            {/* Full vertical invisible hit rect for smooth scrub */}
                            <rect
                                x={p.x - width / hourly.length / 2}
                                y={0}
                                width={width / hourly.length}
                                height={height}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => {
                                    setLocalHoverIdx(idx);
                                    if (onSelectHour) onSelectHour(idx);
                                }}
                                onClick={() => {
                                    setLocalHoverIdx(idx);
                                    if (onSelectHour) onSelectHour(idx);
                                }}
                            />
                        </g>
                    ))}
                </svg>
            </div>

            {/* Contextual Recommendation for the Selected Scrub Hour */}
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-700">
                <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold text-slate-900">{activePoint.time} Outlook: </span>
                    <span className="text-slate-600">{context.advice}</span>
                </div>
            </div>
        </div>
    );
}
