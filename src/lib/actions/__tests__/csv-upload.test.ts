import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadCsv } from "../csv-upload";
import fs from "fs";
import path from "path";

vi.mock("fs", () => ({
    default: {
        existsSync: vi.fn(),
        writeFileSync: vi.fn(),
    },
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
}));

vi.mock("papaparse", () => {
    const parseMock = vi.fn((csv) => {
        if (typeof csv === 'string' && csv.includes("wrong")) {
            // Return data that parsing will result in empty object or missing date/weight
            // e.g. ["XX", "val"] where XX is unknown tag
            return { data: [["XX", "val"]] };
        } else {
            // Valid Tanita row: ~0 (unit cm) -> Wk (weight) -> DT (date)
            // ~0;2;Wk;60;DT;01/01/2020
            return { data: [["~0", "2", "Wk", "60", "DT", "01/01/2020"]] };
        }
    });

    return {
        parse: parseMock,
        default: { parse: parseMock },
    };
});

describe("uploadCsv", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should parse valid CSV and storage it", async () => {
        const fileContent = "some,content\n";
        const file = new File([fileContent], "test.csv", { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

        const result = await uploadCsv(formData);

        // We expect weight: 60 (numeric) and date: "2020-01-01" from our mocked parser logic
        // The mock parser returns: ["~0", "2", "Wk", "60", "DT", "01/01/2020"]
        // TanitaParser.parseRawRow will yield { weight: 60, date: '2020-01-01' }
        // Note: The mock parser logic (TanitaParser) is real here? No, we import it.
        // Wait, csv-upload uses the REAL TanitaParser. 
        // Our mock is just for 'papaparse'.

        expect(result.data[0]).toMatchObject({ weight: 60, date: "2020-01-01" });
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(result.fileName).toContain("test.csv");
    });

    it("should throw error if file is missing", async () => {
        const formData = new FormData();
        await expect(uploadCsv(formData)).rejects.toThrow("No file uploaded");
    });

    it("should throw error if no valid data found (wrong format)", async () => {
        const fileContent = "wrong,headers\nXX,val\n";
        const file = new File([fileContent], "test.csv", { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);

        // The parser filters out records without date/weight.
        // Our mock returns data with unknown tags, so result will be empty.
        // And csv-upload throws "No data found in CSV" or "No valid measurement data found in CSV".
        await expect(uploadCsv(formData)).rejects.toThrow(/No (valid measurement )?data found/);
    });
});
