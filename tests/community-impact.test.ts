import { describe, it, expect } from "vitest";

export function calculateCommunityImpact(familyCount: number) {
    const co2TonsMonth = parseFloat(((familyCount * 3.8 * 30) / 1000).toFixed(1));
    const pm25KgMonth = Math.round(familyCount * 0.12 * 30);
    const treesEquivalent = Math.round((familyCount * 3.8 * 365) / 22);

    return {
        co2TonsMonth,
        pm25KgMonth,
        treesEquivalent,
    };
}

describe("Community Collective Impact Simulator", () => {
    it("computes accurate baseline metrics for 50 families", () => {
        const impact = calculateCommunityImpact(50);
        expect(impact.co2TonsMonth).toBe(5.7);
        expect(impact.pm25KgMonth).toBe(180);
        expect(impact.treesEquivalent).toBe(3152);
    });

    it("computes accurate scaled metrics for 500 families", () => {
        const impact = calculateCommunityImpact(500);
        expect(impact.co2TonsMonth).toBe(57.0);
        expect(impact.pm25KgMonth).toBe(1800);
        expect(impact.treesEquivalent).toBe(31523);
    });

    it("computes accurate scaled metrics for 5000 families", () => {
        const impact = calculateCommunityImpact(5000);
        expect(impact.co2TonsMonth).toBe(570.0);
        expect(impact.pm25KgMonth).toBe(18000);
        expect(impact.treesEquivalent).toBe(315227);
    });

    it("ensures all calculations return non-negative positive values for positive inputs", () => {
        const impact = calculateCommunityImpact(100);
        expect(impact.co2TonsMonth).toBeGreaterThan(0);
        expect(impact.pm25KgMonth).toBeGreaterThan(0);
        expect(impact.treesEquivalent).toBeGreaterThan(0);
    });
});
