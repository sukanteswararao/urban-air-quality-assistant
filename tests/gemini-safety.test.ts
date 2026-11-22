import { describe, it, expect } from "vitest";

describe("Air Quality Advice Schema & Fallback Contract", () => {
    const mockAdvice = {
        summary: "Severe winter inversion has trapped particulate matter near ground level.",
        safeOutdoorWindow: "1:00 PM – 3:30 PM",
        maskRecommendation: "Well-fitted N95 / FFP2 respirator with tight seal",
        childrenElderlyNote: "Keep infants and seniors indoors with filtered air",
        dailyRoutines: [
            {
                time: "Early Morning (6:00 - 8:30 AM)",
                activity: "Replace outdoor run with indoor yoga or resistance training",
                reason: "Temperature inversion traps vehicular exhaust at ground level",
                impactScore: 8,
            },
        ],
        indoorHacks: [
            {
                title: "Wet Towel Window Sill Barrier",
                description: "Place damp towels on window crevices to capture draft particulates",
                effectivenessPercent: 35,
                cost: "Free",
                difficulty: "Easy",
            },
        ],
        sustainableAlternatives: [
            {
                currentHabit: "Solo car commute in peak rush hour",
                betterAlternative: "Metro transit or carpool off-peak",
                co2ReductionKg: 3.8,
                explanation: "Prevents direct tailpipe VOC and NO2 accumulation",
            },
        ],
    };

    it("conforms to the expected telemetry advisory interface", () => {
        expect(mockAdvice.summary).toBeTruthy();
        expect(mockAdvice.safeOutdoorWindow).toBeTruthy();
        expect(mockAdvice.maskRecommendation).toBeTruthy();
        expect(mockAdvice.dailyRoutines).toBeInstanceOf(Array);
        expect(mockAdvice.dailyRoutines.length).toBeGreaterThan(0);
        expect(mockAdvice.indoorHacks).toBeInstanceOf(Array);
        expect(mockAdvice.sustainableAlternatives).toBeInstanceOf(Array);
    });

    it("ensures daily routine impact scores are within valid 1-10 range", () => {
        mockAdvice.dailyRoutines.forEach((routine) => {
            expect(routine.impactScore).toBeGreaterThanOrEqual(1);
            expect(routine.impactScore).toBeLessThanOrEqual(10);
        });
    });

    it("ensures indoor hacks specify valid cost categories", () => {
        mockAdvice.indoorHacks.forEach((hack) => {
            expect(["Free", "Low", "Medium", "High"]).toContain(hack.cost);
            expect(hack.effectivenessPercent).toBeGreaterThan(0);
        });
    });
});
