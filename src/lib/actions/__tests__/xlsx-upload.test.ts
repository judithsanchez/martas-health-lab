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

describe("uploadCsv with XLSX", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should parse valid XLSX and return data", async () => {
        const fileContent = "binary-data";
        const file = new File([fileContent], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);

        const mockWorkbook = {
            SheetNames: ["Sheet1"],
            Sheets: {
                "Sheet1": {}
            }
        };
        vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any);
        // Valid Tanita data in array format: ~0;2;Wk;60;DT;01/01/2020
        vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
            ["~0", "2", "Wk", "60", "DT", "01/01/2020"]
        ]);

        const result = await uploadCsv(formData);

        expect(XLSX.read).toHaveBeenCalled();
        expect(result.data[0]).toMatchObject({ weight: 60, date: "2020-01-01" });
        expect(result.fileName).toContain("test.xlsx");
    });

    it("should fallback to CSV for unknown extensions", async () => {
        const fileContent = "~0,2,Wk,70,DT,02/02/2022";
        const file = new File([fileContent], "test.txt", { type: "text/plain" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);

        const result = await uploadCsv(formData);

        expect(XLSX.read).not.toHaveBeenCalled();
        expect(result.data[0]).toMatchObject({ weight: 70, date: "2022-02-02" });
    });
});
