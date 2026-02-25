
import { describe, it, expect } from "vitest";
import { TanitaParser } from "../tanita-parser";

describe("TanitaParser", () => {
    describe("Happy Path", () => {
        it("should parse a standard row with all metrics", () => {
            // ~0;2 (cm), ~1;2 (kg)
            const row = ["~0", "2", "~1", "2", "DT", "01/01/2024", "Wk", "60.5", "FW", "20"];
            const result = TanitaParser.parseRawRow(row);
            expect(result).toMatchObject({
                date: "2024-01-01",
                weight: 60.5,
                fatPercent: 20
            });
        });

        it("should handle European date format (DD/MM/YYYY)", () => {
            // 25th of February 2024
            const row = ["DT", "25/02/2024", "Wk", "70"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.date).toBe("2024-02-25");
        });

        it("should handle US date format (MM/DD/YYYY)", () => {
            // February 25th 2024
            const row = ["DT", "02/25/2024", "Wk", "70"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.date).toBe("2024-02-25");
        });

        it("should handle unit conversion from Imperial to Metric", () => {
            // ~0;1 (inches? assume 1 is Imperial), ~1;1 (lbs? assume 1 is Imperial)
            // Weight: 100 lbs -> ~45.36 kg
            // Height: 70 inches -> ~177.8 cm
            const row = ["~0", "1", "~1", "1", "Wk", "100", "Hm", "70", "DT", "01/01/2024"];
            const result = TanitaParser.parseRawRow(row);

            expect(result.weight).toBeCloseTo(45.3592, 4);
            expect(result.height).toBeCloseTo(177.8, 1);
        });

        it("should parse segmental data correctly", () => {
            const row = ["DT", "01/01/2024", "Fr", "20", "Fl", "21", "FR", "22", "FL", "23", "FT", "24"];
            const result = TanitaParser.parseRawRow(row);
            expect(result).toMatchObject({
                fatArmRight: 20,
                fatArmLeft: 21,
                fatLegRight: 22,
                fatLegLeft: 23,
                fatTrunk: 24
            });
        });

        it("should parse localized time formats accurately", () => {
            // "7:00:34?a. m." -> 07:00:34
            const row = ["Ti", "7:00:34?a. m.", "DT", "01/01/2024"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.timeRaw).toBe("07:00:34");

            // "10:30:00?p. m." -> 22:30:00
            const row2 = ["Ti", "10:30:00?p. m."];
            const result2 = TanitaParser.parseRawRow(row2);
            expect(result2.timeRaw).toBe("22:30:00");

            // "12:00:00?a. m." -> 00:00:00 (Midnight)
            const row3 = ["Ti", "12:00:00?a. m."];
            const result3 = TanitaParser.parseRawRow(row3);
            expect(result3.timeRaw).toBe("00:00:00");

            // "12:30:00?p. m." -> 12:30:00 (Noon)
            const row4 = ["Ti", "12:30:00?p. m."];
            const result4 = TanitaParser.parseRawRow(row4);
            expect(result4.timeRaw).toBe("12:30:00");
        });

        it("should map gender integers to strings", () => {
            const rowMale = ["GE", "1"];
            const resultMale = TanitaParser.parseRawRow(rowMale);
            expect(resultMale.gender).toBe("male");

            const rowFemale = ["GE", "2"];
            const resultFemale = TanitaParser.parseRawRow(rowFemale);
            expect(resultFemale.gender).toBe("female");
        });
    });

    describe("Edge Cases & Garbage Handling", () => {
        it("should return empty object for empty row", () => {
            const result = TanitaParser.parseRawRow([]);
            expect(result).toEqual({});
        });

        it("should ignore incomplete tag-value pairs", () => {
            // "Wk" tag without value at the end
            const row = ["DT", "01/01/2024", "Wk"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.date).toBe("2024-01-01");
            expect(result.weight).toBeUndefined();
        });

        it("should handle unknown tags gracefully", () => {
            const row = ["UNKNOWN", "123", "DT", "01/01/2024"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.date).toBe("2024-01-01");
            // Unknown tag should be ignored, not crash
            expect(Object.keys(result)).not.toContain("UNKNOWN");
        });

        it("should handle non-numeric values for numeric fields gracefully", () => {
            // Weight should be a number, but got "NaN" or garbage
            const row = ["Wk", "NotANumber", "DT", "01/01/2024"];
            const result = TanitaParser.parseRawRow(row);
            // parseFloat("NotANumber") -> NaN
            expect(result.weight).toBeNaN();
        });

        it("should parse simple valid date even with surrounding garbage in date string if handled", () => {
            // current implementation expects clean DD/MM/YYYY or similar parts
            // If we pass garbage date format, it might return original string or fall through
            const row = ["DT", "NotADate"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.date).toBe("NotADate"); // Fallback behavior
        });

        it("should handle duplicate tags by overwriting (last wins)", () => {
            const row = ["Wk", "60", "Wk", "65", "DT", "01/01/2024"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.weight).toBe(65);
        });

        it("should handle ambiguous dates by defaulting to a standard (currently MM/DD if both <= 12)", () => {
            // 05/06/2024 -> Could be June 5th or May 6th.
            // Our current logic defaults to MM/DD if no part is > 12.
            const row = ["DT", "05/06/2024"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.date).toBe("2024-05-06");
        });

        it("should handle single digit parts with padding", () => {
            const row = ["DT", "1/2/2024"];
            const result = TanitaParser.parseRawRow(row);
            expect(result.date).toBe("2024-01-02");
        });
    });
});
