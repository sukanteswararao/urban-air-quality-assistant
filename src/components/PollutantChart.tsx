"use client";

import { useState } from "react";
import { HourlyPoint } from "@/types/air-quality";

interface PollutantChartProps {
    hourly: HourlyPoint[];
}

type MetricKey = "usAqi" | "pm25" | "pm10" | "no2";

const METRIC_META: Record<MetricKey, { label: string; unit: string; stroke: string; fill: string }> = {
    usAqi: { label: "AQI", unit: "index", stroke: "#22c55e", fill: "#22c55e" },
    pm25: { label: "PM2.5", unit: "µg/m³", stroke: "#f59e0b", fill: "#f59e0b" },
    pm10: { label: "PM10", unit: "µg/m³", stroke: "#38bdf8", fill: "#38bdf8" },
    no2: { label: "NO₂", unit: "µg/m³", stroke: "#f43f5e", fill: "#f43f5e" },
};

export function PollutantChart({ hourly }: PollutantChartProps) {
    const [metric, setMetric] = useState<MetricKey>("usAqi");
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    if (!hourly.length) return null;

    const meta = METRIC_META[metric];
    const values = hourly.map((h) => h[metric]);
    const maxVal = Math.max(...values, 10);
    const minVal = Math.min(...values, 0);
    const span = Math.max(maxVal - minVal, 1);

    const width = 680;
    const height = 190;
    const padX = 32;
    const padY = 24;

    const points = hourly.map((pt, idx) => {
        const x = padX + (idx / Math.max(hourly.length - 1, 1)) * (width - padX * 2);
        const y = height - padY - ((pt[metric] - minVal) / span) * (height - padY * 2);
        return { x, y, pt };
    });

    const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaPath = `M ${points[0].x},${height - padY} L ${points
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" L ")} L ${points[points.length - 1].x},${height - padY} Z`;

    const activePoint = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-base font-semibold text-slate-800">📊 Air Quality Over 24 Hours</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-700">
                            {activePoint.pt[metric]}
                        </span>
                        <span className="text-xs text-slate-400">{meta.unit}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                            {activePoint.pt.time}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                    {(Object.keys(METRIC_META) as MetricKey[]).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setMetric(key)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                metric === key
                                    ? "bg-white text-slate-700 shadow-sm"
                                    : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {METRIC_META[key].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-48 w-full min-w-[480px] select-none"
                    onMouseLeave={() => setHoverIdx(null)}
                >
                    <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={meta.fill} stopOpacity="0.15" />
                            <stop offset="100%" stopColor={meta.fill} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y = padY + ratio * (height - padY * 2);
                        const val = Math.round(maxVal - ratio * span);
                        return (
                            <g key={idx}>
                                <line
                                    x1={padX}
                                    x2={width - padX}
                                    y1={y}
                                    y2={y}
                                    stroke="#e2e8f0"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={4}
                                    y={y + 3}
                                    fill="#94a3b8"
                                    fontSize="9"
                                    fontFamily="system-ui"
                                >
                                    {val}
                                </text>
                            </g>
                        );
                    })}

                    {/* Area + Line */}
                    <path d={areaPath} fill="url(#chartFill)" />
                    <polyline
                        fill="none"
                        stroke={meta.stroke}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polyline}
                    />

                    {/* Points and labels */}
                    {points.map((p, idx) => (
                        <g key={p.pt.time}>
                            {idx % 4 === 0 && (
                                <text
                                    x={p.x}
                                    y={height - 4}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="9"
                                    fontFamily="system-ui"
                                >
                                    {p.pt.time}
                                </text>
                            )}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoverIdx === idx ? 5 : 2.5}
                                fill={hoverIdx === idx ? meta.stroke : "#ffffff"}
                                stroke={meta.stroke}
                                strokeWidth={hoverIdx === idx ? 2 : 1.5}
                            />
                            <rect
                                x={p.x - width / hourly.length / 2}
                                y={0}
                                width={width / hourly.length}
                                height={height}
                                fill="transparent"
                                className="cursor-crosshair"
                                onMouseEnter={() => setHoverIdx(idx)}
                            />
                        </g>
                    ))}

                    {/* Hover indicator line */}
                    {hoverIdx !== null && (
                        <line
                            x1={points[hoverIdx].x}
                            x2={points[hoverIdx].x}
                            y1={padY}
                            y2={height - padY}
                            stroke={meta.stroke}
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            opacity="0.4"
                        />
                    )}
                </svg>
            </div>
        </div>
    );
}
