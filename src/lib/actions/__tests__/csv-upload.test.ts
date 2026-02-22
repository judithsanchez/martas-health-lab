import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadCsv } from "../csv-upload";
import fs from "fs";
import * as XLSX from "xlsx";

vi.mock("fs", () => ({
    default: {
        existsSync: vi.fn(),
        writeFileSync: vi.fn(),
        mkdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
}));

vi.mock("xlsx", () => {
    return {
        read: vi.fn(),
        utils: {
            sheet_to_json: vi.fn(),
        },
    };
});

vi.mock("../logger", () => ({
    Logger: {
        info: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe("uploadCsv", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should parse valid file and storage it", async () => {
        const fileContent = "some,content\n";
        const file = new File([fileContent], "test.csv", { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

        const mockWorkbook = {
            SheetNames: ["Sheet1"],
            Sheets: { "Sheet1": {} }
        };
        vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
        // Valid Tanita data: ~0;2;Wk;60;DT;01/01/2020
        vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
            ["~0", "2", "Wk", "60", "DT", "01/01/2020"]
        ]);

        const result = await uploadCsv(formData);

        expect(result.success).toBe(true);
        if (result.success && result.records) {
            expect(result.records[0]).toMatchObject({ weight: 60, date: "2020-01-01" });
        }
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(XLSX.read).toHaveBeenCalled();
    });

    it("should return error if file is missing", async () => {
        const formData = new FormData();
        const result = await uploadCsv(formData);
        expect(result.success).toBe(false);
        expect(result.message).toBe("No file uploaded");
    });

    it("should throw error if no valid data found", async () => {
        const fileContent = "wrong,headers\nXX,val\n";
        const file = new File([fileContent], "test.csv", { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);

        const mockWorkbook = { SheetNames: ["S1"], Sheets: { "S1": {} } };
        vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
        vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([["XX", "val"]]); // No date/weight

        const result = await uploadCsv(formData);
        expect(result.success).toBe(false);
        expect(result.message).toContain("No valid data found");
    });
});
