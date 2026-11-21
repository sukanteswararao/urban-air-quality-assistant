"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Cloud,
    Heart,
    Home,
    Leaf,
    MapPin,
    MessageCircle,
    Search,
    Shield,
    Sun,
    TreePine,
    Wind,
    Clock,
    AlertCircle,
    Baby,
    Bike,
    ArrowRight,
    Lightbulb,
    ChevronDown,
    Globe,
    Navigation,
    X,
} from "lucide-react";
import {
    AirQualityAdvice,
    CityLocation,
    TelemetrySnapshot,
    UserProfile,
} from "@/types/air-quality";
import {
    fetchAirQualityTelemetry,
    FEATURED_CITIES,
    CITY_GROUPS,
    searchCities,
    reverseGeocode,
} from "@/lib/open-meteo";
import { PollutantChart } from "./PollutantChart";
import { VisionInspector } from "./VisionInspector";
import { TelemetryCopilot } from "./TelemetryCopilot";

const PROFILES: { id: UserProfile; label: string; icon: React.ReactNode }[] = [
    { id: "general_commuter", label: "Working Parent", icon: <Heart className="h-3.5 w-3.5" /> },
    { id: "outdoor_athlete", label: "Fitness Lover", icon: <Bike className="h-3.5 w-3.5" /> },
    { id: "respiratory_sensitive", label: "Asthma/Allergy", icon: <Shield className="h-3.5 w-3.5" /> },
    { id: "elderly_caregiver", label: "Elder/Child Care", icon: <Baby className="h-3.5 w-3.5" /> },
];

function getAqiInfo(aqi: number): { emoji: string; label: string; color: string; bg: string; border: string } {
    if (aqi <= 50) return { emoji: "😊", label: "Good", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
    if (aqi <= 100) return { emoji: "🙂", label: "Moderate", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" };
    if (aqi <= 150) return { emoji: "😷", label: "Unhealthy for Sensitive", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
    if (aqi <= 200) return { emoji: "😟", label: "Unhealthy", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
    if (aqi <= 300) return { emoji: "🤢", label: "Very Unhealthy", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" };
    return { emoji: "☠️", label: "Hazardous", color: "text-rose-900", bg: "bg-rose-50", border: "border-rose-200" };
}

function getDifficultyColor(d: string): string {
    switch (d) {
        case "Easy": return "bg-green-100 text-green-700";
        case "Medium": return "bg-amber-100 text-amber-700";
        case "Advanced": return "bg-purple-100 text-purple-700";
        default: return "bg-slate-100 text-slate-600";
    }
}

function getCostColor(c: string): string {
    switch (c) {
        case "Free": return "bg-emerald-100 text-emerald-700";
        case "Low": return "bg-blue-100 text-blue-700";
        case "Medium": return "bg-orange-100 text-orange-700";
        default: return "bg-slate-100 text-slate-600";
    }
}

export function AirQualityDashboard({
    initialTelemetry,
}: {
    initialTelemetry: TelemetrySnapshot;
}) {
    const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(initialTelemetry);
    const [profile, setProfile] = useState<UserProfile>("general_commuter");
    const [advice, setAdvice] = useState<AirQualityAdvice | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
    const [searching, setSearching] = useState(false);
    const [copilotOpen, setCopilotOpen] = useState(false);
    const [cityBrowserOpen, setCityBrowserOpen] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);

    const fetchAdvice = useCallback(
        async (snap: TelemetrySnapshot, selectedProfile: UserProfile) => {
            setAnalyzing(true);
            setAnalysisError(null);
            try {
                const res = await fetch("/api/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ telemetry: snap, profile: selectedProfile }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Analysis failed");
                setAdvice(data.analysis);
            } catch (err) {
                setAnalysisError(
                    err instanceof Error ? err.message : "Could not get air quality advice."
                );
            } finally {
                setAnalyzing(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchAdvice(telemetry, profile);
    }, [telemetry, profile, fetchAdvice]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setCopilotOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    async function handleCitySearch(val: string) {
        setQuery(val);
        if (val.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const results = await searchCities(val);
            setSearchResults(results);
        } finally {
            setSearching(false);
        }
    }

    async function selectCity(city: CityLocation) {
        setQuery("");
        setSearchResults([]);
        setCityBrowserOpen(false);
        const snap = await fetchAirQualityTelemetry(city);
        setTelemetry(snap);
    }

    async function detectMyLocation() {
        if (!navigator.geolocation) return;
        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const city = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                    if (city) {
                        const snap = await fetchAirQualityTelemetry(city);
                        setTelemetry(snap);
                    }
                } finally {
                    setDetectingLocation(false);
                }
            },
            () => setDetectingLocation(false),
            { timeout: 8000 }
        );
    }

    const c = telemetry.current;
    const aqiInfo = getAqiInfo(c.usAqi);

    return (
        <div className="min-h-screen pb-8">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
                            <Wind className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold tracking-tight text-slate-800">
                                BreatheSafe
                            </h1>
                            <p className="text-[11px] text-slate-400">
                                Your Family&apos;s Air Quality Guide
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* City Search */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => handleCitySearch(e.target.value)}
                                placeholder="Search any city worldwide..."
                                className="w-52 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 transition focus:border-blue-300 focus:bg-white focus:outline-none sm:w-64"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg sm:w-80">
                                    {searchResults.map((city) => (
                                        <button
                                            key={`${city.id}-${city.latitude}`}
                                            type="button"
                                            onClick={() => selectCity(city)}
                                            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="font-medium text-slate-700">{city.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 ml-2 truncate">
                                                {[city.admin1, city.country].filter(Boolean).join(", ")}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {searching && (
                                <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">...</span>
                            )}
                        </div>

                        {/* Ask BreatheSafe Button */}
                        <button
                            type="button"
                            onClick={() => setCopilotOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:from-emerald-600 hover:to-teal-600 hover:shadow"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Ask BreatheSafe</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl space-y-5 px-4 pt-5 sm:px-6">
                {/* City Chips + Browse All + Detect Location + Profile */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {/* Detect Location */}
                        <button
                            type="button"
                            onClick={detectMyLocation}
                            disabled={detectingLocation}
                            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                        >
                            <Navigation className={`h-3 w-3 ${detectingLocation ? "animate-spin" : ""}`} />
                            {detectingLocation ? "Detecting..." : "My Location"}
                        </button>

                        {/* Featured City Chips */}
                        {FEATURED_CITIES.map((city) => {
                            const active = city.id === telemetry.city.id && city.name === telemetry.city.name;
                            return (
                                <button
                                    key={`${city.id}-${city.name}`}
                                    type="button"
                                    onClick={() => selectCity(city)}
                                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                        active
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                    }`}
                                >
                                    <MapPin className="h-3 w-3" />
                                    {city.name}
                                </button>
                            );
                        })}

                        {/* Browse All Cities */}
                        <button
                            type="button"
                            onClick={() => setCityBrowserOpen(!cityBrowserOpen)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            <Globe className="h-3 w-3" />
                            Browse All
                            <ChevronDown className={`h-3 w-3 transition ${cityBrowserOpen ? "rotate-180" : ""}`} />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-xs text-slate-400">I am a:</span>
                        {PROFILES.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setProfile(p.id)}
                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                    profile === p.id
                                        ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                }`}
                            >
                                {p.icon}
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Expandable City Browser */}
                {cityBrowserOpen && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-500" />
                                <h2 className="text-base font-semibold text-slate-800">Browse All Cities</h2>
                                <span className="text-xs text-slate-400">or search any city above</span>
                            </div>
                            <button type="button" onClick={() => setCityBrowserOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {CITY_GROUPS.map((group) => (
                                <div key={group.region}>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                                        {group.region}
                                    </h3>
                                    <div className="flex flex-wrap gap-1">
                                        {group.cities.map((city) => (
                                            <button
                                                key={`${city.id}-${city.name}-${city.latitude}`}
                                                type="button"
                                                onClick={() => selectCity(city)}
                                                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                                                    city.name === telemetry.city.name
                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                                }`}
                                            >
                                                {city.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main AQI Card */}
                <section className={`rounded-2xl border ${aqiInfo.border} ${aqiInfo.bg} p-6 shadow-sm`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-5xl">{aqiInfo.emoji}</span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <MapPin className={`h-4 w-4 ${aqiInfo.color}`} />
                                    <span className="text-sm font-medium text-slate-600">
                                        {telemetry.city.name}, {telemetry.city.country}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className={`text-4xl font-bold ${aqiInfo.color}`}>
                                        {c.usAqi}
                                    </span>
                                    <span className="text-sm text-slate-500">AQI</span>
                                </div>
                                <p className={`mt-0.5 text-sm font-medium ${aqiInfo.color}`}>
                                    {aqiInfo.label}
                                </p>
                            </div>
                        </div>

                        {/* Pollutant Quick Stats */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                            {[
                                { label: "PM2.5", value: c.pm25, unit: "µg/m³", icon: <Cloud className="h-3.5 w-3.5 text-amber-500" /> },
                                { label: "PM10", value: c.pm10, unit: "µg/m³", icon: <Wind className="h-3.5 w-3.5 text-sky-500" /> },
                                { label: "NO₂", value: c.no2, unit: "µg/m³", icon: <AlertCircle className="h-3.5 w-3.5 text-rose-500" /> },
                                { label: "O₃", value: c.o3, unit: "µg/m³", icon: <Sun className="h-3.5 w-3.5 text-violet-500" /> },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-1.5">
                                    {item.icon}
                                    <div>
                                        <p className="text-xs text-slate-500">{item.label}</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {item.value} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {advice && !analyzing && (
                        <p className="mt-4 text-sm leading-relaxed text-slate-600 border-t border-slate-200/60 pt-3">
                            {advice.summary}
                        </p>
                    )}
                </section>

                {/* Loading Skeleton */}
                {analyzing && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
                            <p className="text-sm text-slate-500">BreatheSafe is analyzing air quality for your profile...</p>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />
                            <div className="h-20 w-full animate-pulse rounded-lg bg-slate-50" />
                            <div className="h-20 w-full animate-pulse rounded-lg bg-slate-50" />
                        </div>
                    </div>
                )}

                {/* Error */}
                {analysisError && (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{analysisError}</span>
                    </div>
                )}

                {!analyzing && advice && (
                    <>
                        {/* Safety Highlights Bar */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <Clock className="h-5 w-5 text-emerald-500" />
                                <div>
                                    <p className="text-xs text-slate-400">Best Time for Outdoors</p>
                                    <p className="text-sm font-semibold text-slate-700">{advice.safeOutdoorWindow}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <Shield className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-xs text-slate-400">Mask Advice</p>
                                    <p className="text-sm font-semibold text-slate-700">{advice.maskRecommendation}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <Baby className="h-5 w-5 text-pink-500" />
                                <div>
                                    <p className="text-xs text-slate-400">Children & Elderly</p>
                                    <p className="text-sm font-semibold text-slate-700">{advice.childrenElderlyNote}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            {/* Daily Routine Guide */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sun className="h-5 w-5 text-amber-500" />
                                    <h2 className="text-base font-semibold text-slate-800">Your Daily Routine Guide</h2>
                                </div>
                                <div className="space-y-3">
                                    {advice.dailyRoutines.map((tip, idx) => (
                                        <div key={idx} className="flex gap-3 rounded-xl bg-slate-50 p-3.5">
                                            <div className="flex flex-col items-center">
                                                <span className="rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 whitespace-nowrap">
                                                    {tip.time}
                                                </span>
                                                <div className="mt-2 flex flex-col items-center gap-0.5">
                                                    {Array.from({ length: 10 }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`h-1 w-3 rounded-full ${
                                                                i < tip.impactScore ? "bg-emerald-400" : "bg-slate-200"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700">{tip.activity}</p>
                                                <p className="mt-1 text-xs leading-relaxed text-slate-500">{tip.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Indoor Air Quality Hacks */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Home className="h-5 w-5 text-blue-500" />
                                    <h2 className="text-base font-semibold text-slate-800">Indoor Air Quality Hacks</h2>
                                </div>
                                <div className="space-y-3">
                                    {advice.indoorHacks.map((hack, idx) => (
                                        <div key={idx} className="rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50/50 to-slate-50/50 p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-amber-400 shrink-0" />
                                                    <h3 className="text-sm font-semibold text-slate-700">{hack.title}</h3>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                                    {hack.effectivenessPercent}% effective
                                                </span>
                                            </div>
                                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500 ml-6">{hack.description}</p>
                                            <div className="mt-2 flex gap-2 ml-6">
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getDifficultyColor(hack.difficulty)}`}>
                                                    {hack.difficulty}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getCostColor(hack.cost)}`}>
                                                    {hack.cost}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sustainable Alternatives */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Leaf className="h-5 w-5 text-green-500" />
                                <h2 className="text-base font-semibold text-slate-800">Switch to Sustainable</h2>
                                <span className="ml-auto text-xs text-slate-400">Small changes, big impact</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {advice.sustainableAlternatives.map((alt, idx) => (
                                    <div key={idx} className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50/60 to-emerald-50/30 p-4">
                                        <div className="flex items-center gap-2 text-xs flex-wrap">
                                            <span className="rounded-md bg-red-100 px-2 py-1 text-red-600 line-through">
                                                {alt.currentHabit}
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-slate-400" />
                                            <span className="rounded-md bg-green-100 px-2 py-1 font-medium text-green-700">
                                                {alt.betterAlternative}
                                            </span>
                                        </div>
                                        <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{alt.explanation}</p>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <TreePine className="h-3.5 w-3.5 text-green-500" />
                                            <span className="text-xs font-semibold text-green-700">
                                                Save {alt.co2ReductionKg} kg CO₂/day
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {/* Chart + Vision Side by Side */}
                <div className="grid gap-5 lg:grid-cols-7">
                    <div className="lg:col-span-4">
                        <PollutantChart hourly={telemetry.hourly} />
                    </div>
                    <div className="lg:col-span-3">
                        <VisionInspector telemetry={telemetry} />
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-slate-200/80 pt-5 text-center">
                    <p className="text-xs text-slate-400">
                        Built with 💚 for Hack2Skill Hackathon &bull; Powered by Google Gemini &bull; Air data from Open-Meteo
                    </p>
                </footer>
            </main>

            <TelemetryCopilot
                open={copilotOpen}
                onClose={() => setCopilotOpen(false)}
                telemetry={telemetry}
                profile={profile}
            />
        </div>
    );
}
