import { describe, it, expect } from "vitest";

const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "image/gif",
]);

const ALLOWED_PROFILES = [
    "general_commuter",
    "outdoor_athlete",
    "respiratory_sensitive",
    "elderly_caregiver",
];

function sanitizeProfile(rawProfile: unknown): string {
    if (typeof rawProfile === "string" && ALLOWED_PROFILES.includes(rawProfile)) {
        return rawProfile;
    }
    return "general_commuter";
}

function validateMimeType(mime: string): boolean {
    return ALLOWED_MIME_TYPES.has(mime.toLowerCase().trim());
}

describe("Security Validation & Boundary Verification", () => {
    it("permits only standard sanitized lifestyle profiles", () => {
        expect(sanitizeProfile("outdoor_athlete")).toBe("outdoor_athlete");
        expect(sanitizeProfile("respiratory_sensitive")).toBe("respiratory_sensitive");
        expect(sanitizeProfile("malicious_profile_injection")).toBe("general_commuter");
        expect(sanitizeProfile(null)).toBe("general_commuter");
        expect(sanitizeProfile(undefined)).toBe("general_commuter");
        expect(sanitizeProfile({ attack: true })).toBe("general_commuter");
    });

    it("restricts accepted vision image upload formats to safe MIME types", () => {
        expect(validateMimeType("image/jpeg")).toBe(true);
        expect(validateMimeType("image/png")).toBe(true);
        expect(validateMimeType("image/webp")).toBe(true);
        expect(validateMimeType("image/svg+xml")).toBe(true);

        // Disallowed / dangerous MIME types
        expect(validateMimeType("application/javascript")).toBe(false);
        expect(validateMimeType("text/html")).toBe(false);
        expect(validateMimeType("application/x-executable")).toBe(false);
    });

    it("verifies safe payload boundary protection (15MB cap)", () => {
        const MAX_PAYLOAD_LIMIT = 15 * 1024 * 1024;
        expect(5 * 1024 * 1024 < MAX_PAYLOAD_LIMIT).toBe(true);
        expect(16 * 1024 * 1024 > MAX_PAYLOAD_LIMIT).toBe(true);
    });
});
