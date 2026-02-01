
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRecord, updateRecord, deleteRecord } from "../records";
import { db } from "@/lib/db";
import { measurements } from "@/lib/db/schema";

vi.mock("@/lib/db", () => ({
    db: {
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 100, weight: 70 }])),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([{ id: 100, weight: 72 }])),
                })),
            })),
        })),
        delete: vi.fn(() => ({
            where: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 100 }])),
            })),
        })),
    },
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

describe("record actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("createRecord should insert and return new record", async () => {
        const data = { clientId: 1, date: "2024-01-01", weight: 70 };
        // @ts-ignore
        const result = await createRecord(data);
        expect(result).toEqual({ id: 100, weight: 70 });
        expect(db.insert).toHaveBeenCalledWith(measurements);
    });

    it("updateRecord should update and return record", async () => {
        const data = { weight: 72 };
        // @ts-ignore
        const result = await updateRecord(100, data);
        expect(result).toEqual({ id: 100, weight: 72 });
        expect(db.update).toHaveBeenCalled();
    });

    it("deleteRecord should delete and return record", async () => {
        // @ts-ignore
        const result = await deleteRecord(100);
        expect(result).toEqual({ id: 100 });
        expect(db.delete).toHaveBeenCalled();
    });
});
