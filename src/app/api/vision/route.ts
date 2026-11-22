import { NextRequest, NextResponse } from "next/server";
import { inspectSkyOrReportImage } from "@/lib/gemini";
import { TelemetrySnapshot } from "@/types/air-quality";

const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
]);

const MAX_PAYLOAD_BASE64_LENGTH = 15 * 1024 * 1024; // 15MB limit

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
                { status: 400, headers: { "X-Content-Type-Options": "nosniff" } }
            );
        }

        // Validate MIME type
        const normalizedMime = mimeType.toLowerCase().trim();
        if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
            return NextResponse.json(
                { error: "Unsupported image type. Allowed: JPEG, PNG, WebP, SVG, GIF." },
                { status: 415, headers: { "X-Content-Type-Options": "nosniff" } }
            );
        }

        // Validate payload size bounds
        if (imageBase64.length > MAX_PAYLOAD_BASE64_LENGTH) {
            return NextResponse.json(
                { error: "Payload exceeds 15MB limit." },
                { status: 413, headers: { "X-Content-Type-Options": "nosniff" } }
            );
        }

        const result = await inspectSkyOrReportImage(imageBase64, normalizedMime, telemetry);
        return NextResponse.json(
            { result },
            { headers: { "X-Content-Type-Options": "nosniff" } }
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Vision inspection failed.";
        return NextResponse.json(
            { error: message },
            { status: 500, headers: { "X-Content-Type-Options": "nosniff" } }
        );
    }
}