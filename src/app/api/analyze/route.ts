import { NextRequest, NextResponse } from "next/server";
import { generateAirQualityAdvice } from "@/lib/gemini";
import { TelemetrySnapshot, UserProfile } from "@/types/air-quality";

const ALLOWED_PROFILES: UserProfile[] = [
    "general_commuter",
    "outdoor_athlete",
    "respiratory_sensitive",
    "elderly_caregiver",
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const telemetry = body.telemetry as TelemetrySnapshot | undefined;
        let profile = body.profile as UserProfile | undefined;

        if (!telemetry || !telemetry.city) {
            return NextResponse.json(
                { error: "Invalid request: missing telemetry or city data." },
                { status: 400, headers: { "X-Content-Type-Options": "nosniff" } }
            );
        }

        // Sanitize and whitelist profile
        if (!profile || !ALLOWED_PROFILES.includes(profile)) {
            profile = "general_commuter";
        }

        const analysis = await generateAirQualityAdvice(telemetry, profile);
        return NextResponse.json(
            { analysis },
            { headers: { "X-Content-Type-Options": "nosniff" } }
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to analyze air quality.";
        return NextResponse.json(
            { error: message },
            { status: 500, headers: { "X-Content-Type-Options": "nosniff" } }
        );
    }
}
