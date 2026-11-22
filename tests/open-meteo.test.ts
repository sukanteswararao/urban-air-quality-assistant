import { describe, it, expect } from "vitest";
import { FEATURED_CITIES, CITY_GROUPS } from "../src/lib/open-meteo";

describe("Geographical & City Dataset Validation", () => {
    it("contains essential featured cities with valid coordinates", () => {
        expect(FEATURED_CITIES.length).toBeGreaterThanOrEqual(5);

        FEATURED_CITIES.forEach((city) => {
            expect(city.name).toBeDefined();
            expect(city.country).toBeDefined();
            expect(typeof city.latitude).toBe("number");
            expect(typeof city.longitude).toBe("number");
            expect(city.latitude).toBeGreaterThanOrEqual(-90);
            expect(city.latitude).toBeLessThanOrEqual(90);
            expect(city.longitude).toBeGreaterThanOrEqual(-180);
            expect(city.longitude).toBeLessThanOrEqual(180);
        });
    });

    it("contains comprehensive regional city groups covering high-smog zones", () => {
        expect(CITY_GROUPS.length).toBeGreaterThanOrEqual(4);

        const groupNames = CITY_GROUPS.map((g) => g.region);
        expect(groupNames).toContain("North India");
        expect(groupNames).toContain("South India");
        expect(groupNames).toContain("West India");
        expect(groupNames).toContain("East India");
        expect(groupNames).toContain("World — Most Polluted");
        expect(groupNames).toContain("World — Cleanest");
    });

    it("ensures all grouped cities have non-empty identifiers and valid names", () => {
        let totalCities = 0;
        CITY_GROUPS.forEach((group) => {
            expect(group.cities.length).toBeGreaterThan(0);
            group.cities.forEach((city) => {
                totalCities++;
                expect(city.id).toBeDefined();
                expect(city.name.trim().length).toBeGreaterThan(0);
                expect(city.country.trim().length).toBeGreaterThan(0);
            });
        });
        expect(totalCities).toBeGreaterThanOrEqual(30);
    });
});
