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
            return { data: [{ wrong: "data" }], meta: { fields: ["wrong"] } };
        } else {
            return { data: [{ number: "10", age: "20" }], meta: { fields: ["number", "age"] } };
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
        const fileContent = "number,age\n10,20\n";
        const file = new File([fileContent], "test.csv", { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

        const result = await uploadCsv(formData);

        expect(result.data).toEqual([{ number: "10", age: "20" }]);
        expect(fs.writeFileSync).toHaveBeenCalled();
        expect(result.fileName).toContain("test.csv");
    });

    it("should throw error if file is missing", async () => {
        const formData = new FormData();
        await expect(uploadCsv(formData)).rejects.toThrow("No file uploaded");
    });

    it("should throw error if required headers are missing", async () => {
        const fileContent = "wrong,headers\n10,20\n";
        const file = new File([fileContent], "test.csv", { type: "text/csv" });
        const formData = new FormData();
        formData.append("file", file);

        vi.mocked(fs.existsSync).mockReturnValue(true);

        await expect(uploadCsv(formData)).rejects.toThrow("Missing required headers: number, age");
    });
});
