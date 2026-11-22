"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Baby,
    Bike,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Compass,
    Droplets,
    Eye,
    Globe,
    Heart,
    Home,
    Info,
    Leaf,
    Lightbulb,
    MapPin,
    MessageCircle,
    Navigation,
    Search,
    Shield,
    ShieldCheck,
    Sparkles,
    Sun,
    TreePine,
    Users,
    Wind,
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
import { GeminiChatbot } from "./GeminiChatbot";
import { TelemetryCopilot } from "./TelemetryCopilot";

const PROFILES: { id: UserProfile; title: string; subtitle: string; icon: React.ReactNode }[] = [
    {
        id: "general_commuter",
        title: "Daily Commuter",
        subtitle: "Work & School Transit",
        icon: <Heart className="h-4 w-4 text-emerald-600" />,
    },
    {
        id: "outdoor_athlete",
        title: "Fitness & Runner",
        subtitle: "Outdoor Training",
        icon: <Bike className="h-4 w-4 text-blue-600" />,
    },
    {
        id: "respiratory_sensitive",
        title: "Asthma & Sensitive",
        subtitle: "Allergies & Bronchitis",
        icon: <Shield className="h-4 w-4 text-amber-600" />,
    },
    {
        id: "elderly_caregiver",
        title: "Child & Elder Care",
        subtitle: "Infants, Kids & Seniors",
        icon: <Baby className="h-4 w-4 text-rose-600" />,
    },
];

interface AqiMeta {
    level: string;
    verdict: string;
    badgeBg: string;
    badgeText: string;
    strokeColor: string;
    ambientBg: string;
    gaugePercent: number;
}

function getAqiMeta(aqi: number): AqiMeta {
    if (aqi <= 50) {
        return {
            level: "Good",
            verdict: "Clean, fresh atmospheric conditions. Safe for all outdoor recreation.",
            badgeBg: "bg-emerald-50 border-emerald-200",
            badgeText: "text-emerald-800",
            strokeColor: "#10B981",
            ambientBg: "from-emerald-50/70 via-teal-50/30 to-transparent",
            gaugePercent: Math.min((aqi / 300) * 100, 100),
        };
    }
    if (aqi <= 100) {
        return {
            level: "Moderate",
            verdict: "Acceptable quality; unusually sensitive individuals may feel slight airway irritation.",
            badgeBg: "bg-amber-50 border-amber-200",
            badgeText: "text-amber-800",
            strokeColor: "#F59E0B",
            ambientBg: "from-amber-50/60 via-orange-50/20 to-transparent",
            gaugePercent: Math.min((aqi / 300) * 100, 100),
        };
    }
    if (aqi <= 150) {
        return {
            level: "Unhealthy for Sensitive",
            verdict: "Children, asthma sufferers & seniors should limit prolonged outdoor exertion.",
            badgeBg: "bg-orange-50 border-orange-200",
            badgeText: "text-orange-800",
            strokeColor: "#F97316",
            ambientBg: "from-orange-50/60 via-amber-50/20 to-transparent",
            gaugePercent: Math.min((aqi / 300) * 100, 100),
        };
    }
    if (aqi <= 200) {
        return {
            level: "Unhealthy Smog",
            verdict: "Everyone will begin to feel airway effects. Wear N95 outdoors & filter indoor air.",
            badgeBg: "bg-rose-50 border-rose-200",
            badgeText: "text-rose-800",
            strokeColor: "#E11D48",
            ambientBg: "from-rose-50/60 via-red-50/20 to-transparent",
            gaugePercent: Math.min((aqi / 300) * 100, 100),
        };
    }
    if (aqi <= 300) {
        return {
            level: "Very Unhealthy",
            verdict: "Health alert: serious risk of respiratory symptoms in the general population.",
            badgeBg: "bg-purple-50 border-purple-200",
            badgeText: "text-purple-800",
            strokeColor: "#9333EA",
            ambientBg: "from-purple-50/60 via-rose-50/20 to-transparent",
            gaugePercent: Math.min((aqi / 300) * 100, 100),
        };
    }
    return {
        level: "Hazardous Smog",
        verdict: "Emergency atmospheric conditions. Keep all family members in filtered indoor spaces.",
        badgeBg: "bg-rose-100 border-rose-300",
        badgeText: "text-rose-950",
        strokeColor: "#881337",
        ambientBg: "from-rose-100/70 via-stone-50/30 to-transparent",
        gaugePercent: 100,
    };
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

    // City selection & geocoding
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
    const [searching, setSearching] = useState(false);
    const [cityBrowserOpen, setCityBrowserOpen] = useState(false);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [copilotOpen, setCopilotOpen] = useState(false);

    // Interactive Family Air Shield Checklist State
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({
        0: true,
        1: true,
    });

    // Interactive Community Impact Slider State
    const [familyCount, setFamilyCount] = useState<number>(500);

    // Indoor hacks filter
    const [hackFilter, setHackFilter] = useState<"All" | "Free" | "Low">("All");

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
                    err instanceof Error ? err.message : "Could not retrieve air quality advice."
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
    const aqiMeta = getAqiMeta(c.usAqi);

    // Calculated ratio against WHO 24h recommended limit for PM2.5 (15 µg/m³)
    const whoRatio = (c.pm25 / 15).toFixed(1);

    // Dynamic shield protection percentage calculation
    const totalShieldTasks = advice ? advice.dailyRoutines.length : 4;
    const completedTasks = Object.values(checkedItems).filter(Boolean).length;
    const shieldPercent = Math.min(Math.round((completedTasks / totalShieldTasks) * 85), 85);

    // Filtered hacks
    const filteredHacks = (advice?.indoorHacks || []).filter((h) => {
        if (hackFilter === "All") return true;
        return h.cost === hackFilter;
    });

    return (
        <div className="min-h-screen pb-16 selection:bg-emerald-500/20">
            {/* Top Atmospheric Ambient Glow (Living dynamic backdrop) */}
            <div
                className={`pointer-events-none fixed top-0 left-0 right-0 h-[480px] bg-gradient-to-b ${aqiMeta.ambientBg} transition-colors duration-1000 -z-10`}
            />

            {/* Top Navigation Bar with Frosted Glassmorphism */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    {/* Brand Identity */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-sm text-white">
                            <Wind className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold tracking-tight text-slate-900">
                                    BreatheSafe
                                </span>
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    VAYU AI
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Community Atmospheric Intelligence & Family Health
                            </p>
                        </div>
                    </div>

                    {/* Global City Search & Copilot Trigger */}
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => handleCitySearch(e.target.value)}
                                placeholder="Search any city worldwide..."
                                className="w-48 sm:w-64 rounded-2xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none shadow-2xs"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl sm:w-80 z-50">
                                    {searchResults.map((city) => (
                                        <button
                                            key={`${city.id}-${city.latitude}`}
                                            type="button"
                                            onClick={() => selectCity(city)}
                                            className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition hover:bg-slate-50"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="font-semibold text-slate-800 truncate">
                                                    {city.name}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-400 ml-2 shrink-0">
                                                {[city.admin1, city.country].filter(Boolean).join(", ")}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {searching && (
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 animate-pulse">
                                    ...
                                </span>
                            )}
                        </div>

                        {/* Ask Gemini AI Button */}
                        <button
                            type="button"
                            onClick={() => setCopilotOpen(true)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-98"
                        >
                            <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
                            <span className="hidden sm:inline">Ask Gemini AI</span>
                            <kbd className="hidden rounded bg-white/20 px-1 py-0.5 text-[10px] text-white font-mono sm:inline">
                                ⌘K
                            </kbd>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
                {/* City Preset Chips & GPS Detection Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            onClick={detectMyLocation}
                            disabled={detectingLocation}
                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                        >
                            <Navigation
                                className={`h-3 w-3 ${detectingLocation ? "animate-spin" : ""}`}
                            />
                            {detectingLocation ? "Locating..." : "My Location"}
                        </button>

                        {FEATURED_CITIES.map((city) => {
                            const active = city.name === telemetry.city.name;
                            return (
                                <button
                                    key={city.id}
                                    type="button"
                                    onClick={() => selectCity(city)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                        active
                                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-2xs"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                    }`}
                                >
                                    <MapPin className="h-3 w-3 text-slate-400" />
                                    {city.name}
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setCityBrowserOpen(!cityBrowserOpen)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <Globe className="h-3 w-3 text-slate-400" />
                            Browse All 60+ Cities
                            <ChevronDown
                                className={`h-3 w-3 transition ${cityBrowserOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                    </div>

                    {/* Live Timestamp & Lat/Lon Indicator */}
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live Sensor Snapshot &bull; {telemetry.city.name}</span>
                    </div>
                </div>

                {/* Expandable Regional City Browser */}
                {cityBrowserOpen && (
                    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Regional City Directory & Benchmark Air Basins
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Select any metro or high-smog district across India and the globe
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCityBrowserOpen(false)}
                                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {CITY_GROUPS.map((group) => (
                                <div key={group.region}>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                        {group.region}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.cities.map((city) => (
                                            <button
                                                key={`${city.id}-${city.name}`}
                                                type="button"
                                                onClick={() => selectCity(city)}
                                                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                                                    city.name === telemetry.city.name
                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                                                        : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300 hover:bg-white"
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

                {/* Lifestyle Profile Switcher Pills */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Select Family Member Profile:
                        </span>
                        <span className="text-xs text-slate-400">
                            Customizes exposure thresholds & health actions
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PROFILES.map((p) => {
                            const isSelected = profile === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setProfile(p.id)}
                                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                                        isSelected
                                            ? "border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-xs"
                                            : "border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white text-slate-600"
                                    }`}
                                >
                                    <div
                                        className={`mt-0.5 rounded-xl p-2 ${
                                            isSelected ? "bg-emerald-50" : "bg-slate-100"
                                        }`}
                                    >
                                        {p.icon}
                                    </div>
                                    <div>
                                        <p
                                            className={`text-xs font-bold ${
                                                isSelected ? "text-slate-900" : "text-slate-700"
                                            }`}
                                        >
                                            {p.title}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {p.subtitle}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* THE HERO: Atmospheric Status, Circular Gauge & Instant Family Verdict */}
                <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
                    <div className="grid gap-8 lg:grid-cols-12 items-center">
                        {/* Left 5 Cols: Tactile Circular AQI Meter & WHO ratio */}
                        <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6">
                            {/* Circular SVG Arc Gauge */}
                            <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
                                <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                                    {/* Background Track */}
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="48"
                                        className="stroke-slate-100"
                                        strokeWidth="10"
                                        fill="none"
                                    />
                                    {/* Filled Value Arc */}
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="48"
                                        stroke={aqiMeta.strokeColor}
                                        strokeWidth="10"
                                        strokeDasharray={301.6}
                                        strokeDashoffset={301.6 - (301.6 * aqiMeta.gaugePercent) / 100}
                                        strokeLinecap="round"
                                        fill="none"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                {/* Center Value Text */}
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                                        {c.usAqi}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        US AQI
                                    </span>
                                </div>
                            </div>

                            {/* Label & WHO Benchmark Pill */}
                            <div className="text-center sm:text-left space-y-2">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-bold ${aqiMeta.badgeBg} ${aqiMeta.badgeText}`}
                                    >
                                        {aqiMeta.level}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {telemetry.city.name}, {telemetry.city.country}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
                                    {aqiMeta.verdict}
                                </p>
                                {/* WHO Guideline Comparison Banner */}
                                <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                    <Activity className="h-3 w-3 text-amber-600" />
                                    <span>
                                        PM2.5 is <strong className="text-slate-900">{whoRatio}×</strong> WHO Safe 24h Guideline
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right 7 Cols: Detailed Pollutant Matrix */}
                        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                {
                                    label: "PM2.5 Fine",
                                    value: c.pm25,
                                    unit: "µg/m³",
                                    icon: <Wind className="h-4 w-4 text-amber-500" />,
                                    sub: "WHO max: 15",
                                },
                                {
                                    label: "PM10 Coarse",
                                    value: c.pm10,
                                    unit: "µg/m³",
                                    icon: <Droplets className="h-4 w-4 text-sky-500" />,
                                    sub: "WHO max: 45",
                                },
                                {
                                    label: "NO₂ Combustion",
                                    value: c.no2,
                                    unit: "µg/m³",
                                    icon: <AlertCircle className="h-4 w-4 text-rose-500" />,
                                    sub: "Traffic exhaust",
                                },
                                {
                                    label: "O₃ Ground Ozone",
                                    value: c.o3,
                                    unit: "µg/m³",
                                    icon: <Sun className="h-4 w-4 text-violet-500" />,
                                    sub: `UV Index: ${c.uvIndex}`,
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500">
                                            {item.label}
                                        </span>
                                        {item.icon}
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold tracking-tight text-slate-900">
                                            {item.value}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-400">
                                            {item.unit}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[10px] text-slate-400 font-medium">
                                        {item.sub}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Executive Summary for the User's Profile */}
                    {advice && !analyzing && (
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                                    Vayu AI Assessment for {PROFILES.find((p) => p.id === profile)?.title}:
                                </span>
                                <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                                    {advice.summary}
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* "CAN I DO THIS RIGHT NOW?" — 4 INSTANT PRACTICAL FAMILY DECISION TILES */}
                {advice && !analyzing && (
                    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Clock className="h-4 w-4 text-emerald-600" />
                                <span>Safest Outdoor Window</span>
                            </div>
                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {advice.safeOutdoorWindow}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Solar heating expands boundary layer; smog disperses midday.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <ShieldCheck className="h-4 w-4 text-blue-600" />
                                <span>Mask Specification</span>
                            </div>
                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {advice.maskRecommendation}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Cloth masks do not filter fine PM2.5; tight facial seal required.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Baby className="h-4 w-4 text-rose-600" />
                                <span>Kids & Elder Protocol</span>
                            </div>
                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {advice.childrenElderlyNote}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Smaller bronchial passages absorb higher particulate per kg body weight.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <Home className="h-4 w-4 text-amber-600" />
                                <span>Home Ventilation</span>
                            </div>
                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {c.usAqi > 150 ? "Keep Windows Sealed" : "Open 1:00 PM – 3:30 PM"}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                Close all road-facing balconies before early morning and evening traffic rush.
                            </p>
                        </div>
                    </section>
                )}

                {/* SKELETON LOADING STATE */}
                {analyzing && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                            <p className="text-sm font-semibold text-slate-700">
                                Vayu AI is synthesizing real-time atmospheric readings for {telemetry.city.name}...
                            </p>
                        </div>
                        <div className="mt-4 space-y-3">
                            <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-100" />
                            <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-50" />
                            <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-50" />
                        </div>
                    </div>
                )}

                {analysisError && (
                    <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{analysisError}</span>
                    </div>
                )}

                {/* MAIN CONTENT SPLIT: 24h Pollutant Curve + SkyWatch Multimodal Vision */}
                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <PollutantChart hourly={telemetry.hourly} />
                    </div>
                    <div className="lg:col-span-5">
                        <VisionInspector telemetry={telemetry} />
                    </div>
                </div>

                {/* GEMINI CHATBOT AI SECTION (PROMINENT DEDICATED INLINE CHAT) */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xs">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold tracking-tight text-slate-900">
                                    Google Gemini Air Quality Chatbot AI
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                    Ask anything &bull; Grounded in live {telemetry.city.name} sensor telemetry
                                </p>
                            </div>
                        </div>
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[10px] font-bold text-blue-800 flex items-center gap-1.5 shadow-2xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Gemini 3.5 Active
                        </span>
                    </div>

                    <GeminiChatbot telemetry={telemetry} profile={profile} />
                </section>

                {/* GAMIFIED "FAMILY AIR SHIELD" CHECKLIST */}
                {advice && !analyzing && (
                    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                                        Today&apos;s Family Air Shield Checklist
                                    </h3>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Tap tasks as you complete them to increase your home&apos;s particulate protection score
                                </p>
                            </div>

                            {/* Live Shield Progress Bar */}
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                                        <span>Exposure Shield:</span>
                                        <span className="font-bold text-emerald-700 ml-2">
                                            {shieldPercent}% Protected
                                        </span>
                                    </div>
                                    <div className="h-2 w-40 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                                            style={{ width: `${shieldPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Checklist Items */}
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            {advice.dailyRoutines.map((tip, idx) => {
                                const isChecked = !!checkedItems[idx];
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                            setCheckedItems((prev) => ({
                                                ...prev,
                                                [idx]: !prev[idx],
                                            }))
                                        }
                                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                                            isChecked
                                                ? "border-emerald-300 bg-emerald-50/40"
                                                : "border-slate-200 bg-slate-50/60 hover:border-slate-300"
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                                                isChecked
                                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                                    : "border-slate-300 bg-white"
                                            }`}
                                        >
                                            {isChecked && <Check className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                    {tip.time}
                                                </span>
                                                <span className="text-[10px] font-semibold text-emerald-700">
                                                    +{tip.impactScore * 2}% Shield
                                                </span>
                                            </div>
                                            <p
                                                className={`mt-1.5 text-xs font-bold ${
                                                    isChecked
                                                        ? "text-slate-800 line-through decoration-slate-400"
                                                        : "text-slate-900"
                                                }`}
                                            >
                                                {tip.activity}
                                            </p>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                                                {tip.reason}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* INDOOR AIR QUALITY HACKS (MAGAZINE FILTERABLE LAYOUT) */}
                {advice && !analyzing && (
                    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-amber-500" />
                                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                                        Evidence-Backed Indoor Air Hacks
                                    </h3>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Zero-cost routines & budget filtration tricks to drop indoor particulate counts
                                </p>
                            </div>

                            {/* Cost Filter Tabs */}
                            <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                                {(["All", "Free", "Low"] as const).map((filterVal) => (
                                    <button
                                        key={filterVal}
                                        type="button"
                                        onClick={() => setHackFilter(filterVal)}
                                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                            hackFilter === filterVal
                                                ? "bg-white text-slate-900 shadow-xs"
                                                : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        {filterVal === "All"
                                            ? "All Hacks"
                                            : filterVal === "Free"
                                            ? "Zero-Cost (₹0)"
                                            : "Budget (< ₹500)"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Hacks Grid */}
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {filteredHacks.map((hack, idx) => (
                                <div
                                    key={idx}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-xs"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                                {hack.effectivenessPercent}% PM Reduction
                                            </span>
                                            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                                {hack.cost}
                                            </span>
                                        </div>
                                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                                            {hack.title}
                                        </h4>
                                        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                                            {hack.description}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                                        <span>Difficulty:</span>
                                        <span className="font-bold text-slate-800">
                                            {hack.difficulty}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* SUSTAINABLE ALTERNATIVES & NEIGHBORHOOD COLLECTIVE IMPACT CALCULATOR */}
                {advice && !analyzing && (
                    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Leaf className="h-5 w-5 text-emerald-600" />
                                    <h3 className="text-base font-bold tracking-tight text-slate-900">
                                        Switch to Sustainable & Community Multiplier
                                    </h3>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Direct habit swaps showing personal CO₂ prevention and community smog reduction
                                </p>
                            </div>
                        </div>

                        {/* Individual Swaps Cards */}
                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            {advice.sustainableAlternatives.map((alt, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-teal-50/20 to-white p-5"
                                >
                                    <div className="flex flex-col gap-1 text-xs">
                                        <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                                            <span className="line-through">{alt.currentHabit}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-700 font-bold mt-1">
                                            <ArrowRight className="h-3 w-3 shrink-0" />
                                            <span>{alt.betterAlternative}</span>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-xs leading-relaxed text-slate-600">
                                        {alt.explanation}
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between">
                                        <span className="text-[11px] font-medium text-slate-500">
                                            Individual Savings:
                                        </span>
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">
                                            {alt.co2ReductionKg} kg CO₂ / day
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Interactive Neighborhood Multiplier Slider */}
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Collective Community Impact Simulator
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                                        What if {familyCount.toLocaleString()} families in {telemetry.city.name} make these swaps?
                                    </h4>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="50"
                                        max="5000"
                                        step="50"
                                        value={familyCount}
                                        onChange={(e) => setFamilyCount(Number(e.target.value))}
                                        className="h-2 w-36 sm:w-48 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                    />
                                    <span className="text-xs font-bold text-slate-800 shrink-0 w-16 text-right">
                                        {familyCount} homes
                                    </span>
                                </div>
                            </div>

                            {/* Collective Savings Metrics */}
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center">
                                    <span className="text-2xl font-extrabold text-emerald-700">
                                        {((familyCount * 3.8 * 30) / 1000).toFixed(1)} tons
                                    </span>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                        CO₂ Prevented / Month
                                    </p>
                                    <p className="text-[10px] text-slate-400">Avoided vehicle tailpipe emissions</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center">
                                    <span className="text-2xl font-extrabold text-blue-700">
                                        {(familyCount * 0.12 * 30).toFixed(0)} kg
                                    </span>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                        Toxic PM2.5 Kept from Air
                                    </p>
                                    <p className="text-[10px] text-slate-400">Direct neighborhood air clearing</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-3.5 text-center">
                                    <span className="text-2xl font-extrabold text-amber-700">
                                        {Math.round((familyCount * 3.8 * 365) / 22).toLocaleString()}
                                    </span>
                                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                        Trees Equivalent Clean Air
                                    </p>
                                    <p className="text-[10px] text-slate-400">Annual carbon sequestration</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* FOOTER: HACKATHON CREDIT & SENSOR CITATIONS */}
                <footer className="mt-12 pt-8 border-t border-slate-200/80 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                        BreatheSafe &bull; Created for Hack2Skill Hackathon &bull; Powered by Google Gemini GenAI
                    </p>
                    <p className="text-[11px] text-slate-400">
                        Atmospheric surface data from Open-Meteo European Meteorological Service &bull; WHO 2021 Global Air Quality Guidelines
                    </p>
                </footer>
            </main>

            {/* Floating Quick Action Trigger on Bottom Right */}
            <button
                type="button"
                onClick={() => setCopilotOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-3 text-xs font-bold text-white shadow-2xl hover:opacity-95 transition active:scale-95 group cursor-pointer border border-white/20"
            >
                <Sparkles className="h-4 w-4 text-white animate-spin" />
                <span>Gemini Chatbot AI</span>
                <span className="hidden sm:inline bg-white/20 rounded px-1.5 py-0.5 text-[10px] font-mono">⌘K</span>
            </button>

            {/* Floating Gemini Chatbot Overlay Window */}
            {copilotOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
                    onClick={() => setCopilotOpen(false)}
                >
                    <div
                        className="w-full sm:w-[460px] h-[600px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom sm:slide-in-from-right duration-250"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GeminiChatbot
                            telemetry={telemetry}
                            profile={profile}
                            isFloating={true}
                            onClose={() => setCopilotOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
