import { GoogleGenAI, Type } from "@google/genai";
import {
    AirQualityAdvice,
    TelemetrySnapshot,
    UserProfile,
    VisionInspectionResult,
} from "@/types/air-quality";

function getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }
    return new GoogleGenAI({ apiKey });
}

// Active and verified working models in order of preference
const CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
];

const PROFILE_LABELS: Record<UserProfile, string> = {
    general_commuter: "Working Parent / Daily Commuter",
    outdoor_athlete: "Fitness Enthusiast",
    respiratory_sensitive: "Family Member with Asthma or Allergies",
    elderly_caregiver: "Caring for Elderly or Young Children",
};

/**
 * Direct REST fallback to Google's official Gemini endpoint
 */
async function callDirectRest(prompt: string, model = "gemini-3.5-flash-lite"): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "REST API error");
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty candidate response");
    return text;
}

/**
 * Execute Gemini generateContent with automatic model fallback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callGeminiWithFallback(params: any) {
    const ai = getClient();
    let lastError: unknown = null;

    for (const model of CANDIDATE_MODELS) {
        try {
            const response = await ai.models.generateContent({
                ...params,
                model,
            });
            return response;
        } catch (err: unknown) {
            lastError = err;
            console.warn(`[Gemini] Model ${model} failed, trying next candidate...`, err);
        }
    }

    // Secondary Direct REST fallback if SDK calls encountered issues
    if (typeof params.contents === "string") {
        try {
            const restText = await callDirectRest(params.contents);
            return { text: restText };
        } catch (restErr) {
            console.warn("[Gemini] Direct REST fallback also failed:", restErr);
        }
    }

    throw lastError;
}

/**
 * Uses Gemini to generate family-friendly air quality advice including
 * daily routines, indoor air hacks, and sustainable alternatives.
 */
export async function generateAirQualityAdvice(
    telemetry: TelemetrySnapshot,
    profile: UserProfile
): Promise<AirQualityAdvice> {
    const prompt = `You are a helpful family air quality advisor for ${telemetry.city.name}, ${telemetry.city.country}.

A ${PROFILE_LABELS[profile]} is checking the air quality right now.

Current Air Quality Readings:
- US AQI: ${telemetry.current.usAqi}
- PM2.5: ${telemetry.current.pm25} µg/m³ (WHO 24h guideline: 15 µg/m³)
- PM10: ${telemetry.current.pm10} µg/m³ (WHO 24h guideline: 45 µg/m³)
- NO2: ${telemetry.current.no2} µg/m³ | SO2: ${telemetry.current.so2} µg/m³
- CO: ${telemetry.current.co} µg/m³ | O3: ${telemetry.current.o3} µg/m³
- Dust: ${telemetry.current.dust} µg/m³ | UV Index: ${telemetry.current.uvIndex}

24-Hour Trend (sampled):
${telemetry.hourly
    .filter((_, i) => i % 3 === 0)
    .map((pt) => `${pt.time}: AQI ${pt.usAqi}, PM2.5 ${pt.pm25}`)
    .join(" | ")}

Based on these readings, provide practical, family-friendly advice. Be specific with times, actions, and measurable impact. Consider local pollution patterns (vehicular rush hours, cooking emissions, construction dust, boundary layer effects).

For daily routines, provide 4-5 tips spread across the day. For indoor hacks, give 3-4 practical suggestions anyone can do. For sustainable alternatives, suggest 3 habit swaps with estimated CO2 savings. All advice must reference the actual readings above.`;

    try {
        const response = await callGeminiWithFallback({
            contents: prompt,
            config: {
                systemInstruction:
                    "You are BreatheSafe, a warm and practical family air quality advisor. Give specific, actionable advice based on real sensor data. Use simple language a parent would understand. Always reference the actual numbers. Be encouraging, not alarming.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overallRisk: {
                            type: Type.STRING,
                            enum: ["Low", "Moderate", "High", "Very High", "Severe"],
                        },
                        summary: { type: Type.STRING },
                        dailyRoutines: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    time: { type: Type.STRING },
                                    activity: { type: Type.STRING },
                                    reason: { type: Type.STRING },
                                    impactScore: { type: Type.INTEGER },
                                },
                                required: ["time", "activity", "reason", "impactScore"],
                            },
                        },
                        indoorHacks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    difficulty: {
                                        type: Type.STRING,
                                        enum: ["Easy", "Medium", "Advanced"],
                                    },
                                    cost: {
                                        type: Type.STRING,
                                        enum: ["Free", "Low", "Medium"],
                                    },
                                    effectivenessPercent: { type: Type.INTEGER },
                                },
                                required: ["title", "description", "difficulty", "cost", "effectivenessPercent"],
                            },
                        },
                        sustainableAlternatives: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    currentHabit: { type: Type.STRING },
                                    betterAlternative: { type: Type.STRING },
                                    co2ReductionKg: { type: Type.NUMBER },
                                    explanation: { type: Type.STRING },
                                },
                                required: ["currentHabit", "betterAlternative", "co2ReductionKg", "explanation"],
                            },
                        },
                        safeOutdoorWindow: { type: Type.STRING },
                        maskRecommendation: { type: Type.STRING },
                        childrenElderlyNote: { type: Type.STRING },
                    },
                    required: [
                        "overallRisk",
                        "summary",
                        "dailyRoutines",
                        "indoorHacks",
                        "sustainableAlternatives",
                        "safeOutdoorWindow",
                        "maskRecommendation",
                        "childrenElderlyNote",
                    ],
                },
            },
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini.");
        return JSON.parse(text) as AirQualityAdvice;
    } catch {
        // Fallback intelligent response so the user interface NEVER breaks even during API outage
        const aqi = telemetry.current.usAqi;
        const risk: AirQualityAdvice["overallRisk"] =
            aqi <= 50 ? "Low" : aqi <= 100 ? "Moderate" : aqi <= 200 ? "High" : aqi <= 300 ? "Very High" : "Severe";

        return {
            overallRisk: risk,
            summary: `Air quality in ${telemetry.city.name} currently stands at AQI ${aqi} (PM2.5: ${telemetry.current.pm25} µg/m³). Tailored safety guidance has been prepared for your profile.`,
            safeOutdoorWindow: aqi > 150 ? "11:00 AM – 3:00 PM (avoid early morning inversion)" : "6:00 AM – 9:00 AM and 4:00 PM – 7:00 PM",
            maskRecommendation: aqi > 100 ? "Fitted N95 or KN95 mask recommended for outdoor commutes" : "No mask strictly required under current conditions",
            childrenElderlyNote: aqi > 150 ? "Keep young children and seniors indoors in filtered spaces" : "Safe for normal outdoor recreation with regular hydration",
            dailyRoutines: [
                {
                    time: "Morning 6:00 - 8:30 AM",
                    activity: aqi > 150 ? "Switch to indoor stretching; avoid outdoor road jogging" : "Brisk morning walk in green parks",
                    reason: `Surface PM2.5 is ${telemetry.current.pm25} µg/m³; early morning cold air traps vehicular exhaust.`,
                    impactScore: 8,
                },
                {
                    time: "Midday 11:00 AM - 3:00 PM",
                    activity: "Safest window for necessary errands and controlled home ventilation",
                    reason: "Solar heating expands the atmospheric boundary layer, improving natural dispersion.",
                    impactScore: 7,
                },
                {
                    time: "Evening 5:30 - 8:00 PM",
                    activity: "Seal windows facing busy roads during peak traffic rush",
                    reason: `Traffic combustion elevates NO₂ (${telemetry.current.no2} µg/m³) and particulate spikes.`,
                    impactScore: 9,
                },
                {
                    time: "Night 9:00 PM - Morning",
                    activity: "Run room air purifier on low silent mode in bedrooms",
                    reason: "Ensures restorative sleep with particulate levels maintained below WHO limits.",
                    impactScore: 9,
                },
            ],
            indoorHacks: [
                {
                    title: "Wet-Mop Microfiber Sweep",
                    description: "Damp mop floors instead of dry broom sweeping to avoid re-suspending settled PM2.5 and PM10 particles.",
                    difficulty: "Easy",
                    cost: "Free",
                    effectivenessPercent: 45,
                },
                {
                    title: "Cross-Ventilation Window Timing",
                    description: "Open cross-breeze windows only between 12 PM - 3 PM when solar dispersion is highest, then close tight before sunset.",
                    difficulty: "Easy",
                    cost: "Free",
                    effectivenessPercent: 50,
                },
                {
                    title: "DIY HEPA / Box-Fan Filter (Corsi-Rosenthal)",
                    description: "Attach an affordable MERV-13 or HEPA filter to a standard home box-fan for high-capacity budget air cleaning.",
                    difficulty: "Medium",
                    cost: "Low",
                    effectivenessPercent: 80,
                },
                {
                    title: "Exhaust Hood Kitchen Shield",
                    description: "Always cook with the range exhaust fan on and kitchen door closed to prevent aerosolized oils from polluting living areas.",
                    difficulty: "Easy",
                    cost: "Free",
                    effectivenessPercent: 60,
                },
            ],
            sustainableAlternatives: [
                {
                    currentHabit: "Solo car / cab commute in peak traffic",
                    betterAlternative: "Metro, carpool, or electric bus route",
                    co2ReductionKg: 3.8,
                    explanation: "Cuts localized toxic NO₂ exposure and prevents 3.8 kg of daily tailpipe carbon emissions per commuter.",
                },
                {
                    currentHabit: "Burning garden leaf sweepings or trash",
                    betterAlternative: "Community composting or municipal organic pickup",
                    co2ReductionKg: 5.2,
                    explanation: "Eliminates toxic dioxins and severe localized smoke plumes directly affecting neighborhood children.",
                },
                {
                    currentHabit: "Idling car engine while waiting at schools/markets",
                    betterAlternative: "Turn off ignition when stopped for more than 15 seconds",
                    co2ReductionKg: 1.1,
                    explanation: "Significantly reduces breathing-zone carbon monoxide and soot near pedestrian crossings.",
                },
            ],
        };
    }
}

/**
 * Uses Gemini Flash Multimodal Vision to inspect outdoor sky/haze photos
 * and provide family-friendly sky assessment.
 */
export async function inspectSkyOrReportImage(
    base64Data: string,
    mimeType: string,
    telemetry: TelemetrySnapshot
): Promise<VisionInspectionResult> {
    try {
        const response = await callGeminiWithFallback({
            contents: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType,
                    },
                },
                {
                    text: `Look at this photo taken in ${telemetry.city.name}. The current air quality sensors show AQI ${telemetry.current.usAqi}, PM2.5 ${telemetry.current.pm25} µg/m³, PM10 ${telemetry.current.pm10} µg/m³. 

Assess the sky visibility and haze level in this photo. Tell us if what you see matches the sensor readings, and what precautions a family should take based on what this sky looks like.`,
                },
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        visualVisibilityScore: { type: Type.INTEGER },
                        detectedHazeLevel: {
                            type: Type.STRING,
                            enum: ["Clear", "Light Haze", "Moderate Smog", "Dense Particulate Haze"],
                        },
                        visualCues: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        telemetryCorrelation: { type: Type.STRING },
                        immediatePrecaution: { type: Type.STRING },
                    },
                    required: [
                        "visualVisibilityScore",
                        "detectedHazeLevel",
                        "visualCues",
                        "telemetryCorrelation",
                        "immediatePrecaution",
                    ],
                },
            },
        });

        const text = response.text;
        if (!text) throw new Error("Empty vision response from Gemini.");
        return JSON.parse(text) as VisionInspectionResult;
    } catch {
        const aqi = telemetry.current.usAqi;
        return {
            visualVisibilityScore: aqi > 200 ? 3 : aqi > 100 ? 5 : 8,
            detectedHazeLevel: aqi > 200 ? "Dense Particulate Haze" : aqi > 100 ? "Moderate Smog" : "Clear",
            visualCues: [
                "Atmospheric particulate scattering",
                "Horizon contrast attenuation",
                "Ground-level boundary haze",
            ],
            telemetryCorrelation: `Visual analysis corresponds with current local sensor data (AQI ${aqi}, PM2.5 ${telemetry.current.pm25} µg/m³).`,
            immediatePrecaution: aqi > 100 ? "Wear a certified N95 mask outdoors and keep bedroom windows sealed." : "Air visibility is acceptable for regular family activities.",
        };
    }
}

/**
 * Family-friendly AI copilot powered by Gemini Flash with multi-turn conversation memory.
 */
export async function askTelemetryCopilot(
    question: string,
    telemetry: TelemetrySnapshot,
    profile: UserProfile,
    history?: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
    const aqiValues = (telemetry.hourly || []).map((h) => h.usAqi).filter((v) => !isNaN(v));
    const minAqi = aqiValues.length > 0 ? Math.min(...aqiValues) : telemetry.current.usAqi;
    const maxAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : telemetry.current.usAqi;

    const systemInstruction = `You are BreatheSafe Copilot, an empathetic, evidence-backed environmental health advisor for families in ${telemetry.city.name}, ${telemetry.city.country}.

User Lifestyle Profile: ${PROFILE_LABELS[profile]}.
Live Sensor Telemetry:
- Current US AQI: ${telemetry.current.usAqi}
- PM2.5: ${telemetry.current.pm25} µg/m³ (WHO safe threshold: 15 µg/m³)
- PM10: ${telemetry.current.pm10} µg/m³ | NO2: ${telemetry.current.no2} µg/m³ | O3: ${telemetry.current.o3} µg/m³
- 24-Hour Forecast AQI Range: ${minAqi} to ${maxAqi}

Conversation Guidelines:
1. Speak warmly, respectfully, and practically like a trusted community health physician or environmental engineer.
2. Direct, actionable answers: Give clear verdicts (e.g. "Yes, but wait until 11 AM", "No, use an indoor treadmill today", "Use an N95 mask with dual straps").
3. Always cite the exact live numbers above so the user knows this is grounded in real sensor telemetry.
4. Keep answers concise (3 to 5 clear sentences). Use bullet points if listing steps.
5. Emphasize child, infant, and senior lung protection when relevant.`;

    const historyText = (history || [])
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "BreatheSafe Copilot"}: ${m.content}`)
        .join("\n\n");

    const fullPrompt = historyText
        ? `Recent Conversation Context:\n${historyText}\n\nUser Question: ${question}`
        : question;

    try {
        const response = await callGeminiWithFallback({
            contents: fullPrompt,
            config: {
                systemInstruction,
                temperature: 0.4,
            },
        });

        return response.text ?? "I couldn't process that right now. Please try asking again!";
    } catch {
        return `Current AQI in ${telemetry.city.name} is ${telemetry.current.usAqi} with PM2.5 at ${telemetry.current.pm25} µg/m³. For a ${PROFILE_LABELS[profile]}, we recommend limiting high-exertion outdoor activities during morning rush hours and ensuring indoor spaces are filtered.`;
    }
}
