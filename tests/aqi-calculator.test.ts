import { describe, it, expect } from "vitest";

// Re-usable helper matching the production logic
export function getAqiCategory(aqi: number) {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous Smog";
}

export function calculateWhoPm25Ratio(pm25: number, limit = 15): number {
    return parseFloat((pm25 / limit).toFixed(1));
}

export function calculateShieldPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.min(Math.round((completed / total) * 85), 85);
}

describe("Air Quality Index (AQI) Classification", () => {
    it("should classify AQI <= 50 as Good", () => {
        expect(getAqiCategory(0)).toBe("Good");
        expect(getAqiCategory(25)).toBe("Good");
        expect(getAqiCategory(50)).toBe("Good");
    });

    it("should classify AQI 51-100 as Moderate", () => {
        expect(getAqiCategory(51)).toBe("Moderate");
        expect(getAqiCategory(75)).toBe("Moderate");
        expect(getAqiCategory(100)).toBe("Moderate");
    });

    it("should classify AQI 101-150 as Unhealthy for Sensitive Groups", () => {
        expect(getAqiCategory(101)).toBe("Unhealthy for Sensitive Groups");
        expect(getAqiCategory(135)).toBe("Unhealthy for Sensitive Groups");
        expect(getAqiCategory(150)).toBe("Unhealthy for Sensitive Groups");
    });

    it("should classify AQI 151-200 as Unhealthy", () => {
        expect(getAqiCategory(151)).toBe("Unhealthy");
        expect(getAqiCategory(180)).toBe("Unhealthy");
        expect(getAqiCategory(200)).toBe("Unhealthy");
    });

    it("should classify AQI 201-300 as Very Unhealthy", () => {
        expect(getAqiCategory(201)).toBe("Very Unhealthy");
        expect(getAqiCategory(260)).toBe("Very Unhealthy");
        expect(getAqiCategory(300)).toBe("Very Unhealthy");
    });

    it("should classify AQI > 300 as Hazardous Smog", () => {
        expect(getAqiCategory(301)).toBe("Hazardous Smog");
        expect(getAqiCategory(450)).toBe("Hazardous Smog");
        expect(getAqiCategory(999)).toBe("Hazardous Smog");
    });
});

describe("WHO PM2.5 Guideline Comparisons", () => {
    it("correctly calculates multiples against WHO 15 µg/m³ 24h standard", () => {
        expect(calculateWhoPm25Ratio(15)).toBe(1.0);
        expect(calculateWhoPm25Ratio(30)).toBe(2.0);
        expect(calculateWhoPm25Ratio(150)).toBe(10.0);
        expect(calculateWhoPm25Ratio(315)).toBe(21.0);
    });

    it("handles clean air below WHO threshold", () => {
        expect(calculateWhoPm25Ratio(7.5)).toBe(0.5);
    });
});

describe("Family Air Shield Protection Metric", () => {
    it("calculates 0% when no tasks are completed", () => {
        expect(calculateShieldPercentage(0, 4)).toBe(0);
    });

    it("scales proportionally and caps at maximum baseline of 85%", () => {
        expect(calculateShieldPercentage(2, 4)).toBe(43);
        expect(calculateShieldPercentage(4, 4)).toBe(85);
        expect(calculateShieldPercentage(10, 4)).toBe(85);
    });
});
