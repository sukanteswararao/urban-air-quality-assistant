import { NextRequest, NextResponse } from "next/server";
import { askTelemetryCopilot } from "@/lib/gemini";
import { TelemetrySnapshot, UserProfile } from "@/types/air-quality";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, telemetry, profile } = body as {
            question?: string;
            telemetry?: TelemetrySnapshot;
            profile?: UserProfile;
        };

        if (!question || !telemetry) {
            return NextResponse.json({ error: "Question and telemetry are required." }, { status: 400 });
        }

        const reply = await askTelemetryCopilot(
            question,
            telemetry,
            profile ?? "general_commuter"
        );
        return NextResponse.json({ reply });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Copilot request failed.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}