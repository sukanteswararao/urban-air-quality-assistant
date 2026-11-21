import { NextRequest, NextResponse } from "next/server";
import { inspectSkyOrReportImage } from "@/lib/gemini";
import { TelemetrySnapshot } from "@/types/air-quality";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { imageBase64, mimeType, telemetry } = body as {
            imageBase64?: string;
            mimeType?: string;
            telemetry?: TelemetrySnapshot;
        };

        if (!imageBase64 || !mimeType || !telemetry) {
            return NextResponse.json(
                { error: "Image data, mimeType, and city telemetry are required." },
                { status: 400 }
            );
        }

        const result = await inspectSkyOrReportImage(imageBase64, mimeType, telemetry);
        return NextResponse.json({ result });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Vision inspection failed.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}