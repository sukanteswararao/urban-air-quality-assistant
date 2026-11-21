import { NextRequest, NextResponse } from "next/server";
import { generateAirQualityAdvice } from "@/lib/gemini";
import { TelemetrySnapshot, UserProfile } from "@/types/air-quality";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const telemetry = body.telemetry as TelemetrySnapshot | undefined;
        const profile = (body.profile as UserProfile) ?? "general_commuter";

        if (!telemetry || !telemetry.city) {
            return NextResponse.json({ error: "Missing telemetry payload." }, { status: 400 });
        }

        const analysis = await generateAirQualityAdvice(telemetry, profile);
        return NextResponse.json({ analysis });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to analyze air quality.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
