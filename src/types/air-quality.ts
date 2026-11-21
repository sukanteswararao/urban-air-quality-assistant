export interface CityLocation {
    id: number;
    name: string;
    country: string;
    admin1?: string;
    latitude: number;
    longitude: number;
}

export interface HourlyPoint {
    time: string;
    usAqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
}

export interface TelemetrySnapshot {
    city: CityLocation;
    timestamp: string;
    current: {
        usAqi: number;
        pm25: number;
        pm10: number;
        no2: number;
        so2: number;
        co: number;
        o3: number;
        dust: number;
        uvIndex: number;
    };
    hourly: HourlyPoint[];
}

export type UserProfile =
    | "general_commuter"
    | "outdoor_athlete"
    | "respiratory_sensitive"
    | "elderly_caregiver";

export interface DailyRoutineTip {
    time: string;
    activity: string;
    reason: string;
    impactScore: number;
}

export interface IndoorHack {
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Advanced";
    cost: "Free" | "Low" | "Medium";
    effectivenessPercent: number;
}

export interface SustainableAlt {
    currentHabit: string;
    betterAlternative: string;
    co2ReductionKg: number;
    explanation: string;
}

export interface AirQualityAdvice {
    overallRisk: "Low" | "Moderate" | "High" | "Very High" | "Severe";
    summary: string;
    dailyRoutines: DailyRoutineTip[];
    indoorHacks: IndoorHack[];
    sustainableAlternatives: SustainableAlt[];
    safeOutdoorWindow: string;
    maskRecommendation: string;
    childrenElderlyNote: string;
}

export interface VisionInspectionResult {
    visualVisibilityScore: number;
    detectedHazeLevel: "Clear" | "Light Haze" | "Moderate Smog" | "Dense Particulate Haze";
    visualCues: string[];
    telemetryCorrelation: string;
    immediatePrecaution: string;
}
