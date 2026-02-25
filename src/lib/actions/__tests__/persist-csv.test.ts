import { describe, it, expect, vi, beforeEach } from "vitest";
import { persistPerRowAssignments } from "../persist-csv";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
    db: {
        transaction: vi.fn((cb) => cb({
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    returning: vi.fn(() => [{ id: 99 }]),
                    run: vi.fn(() => ({ changes: 1, lastInsertRowid: 99 })),
                })),
            })),
        })),
    },
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("../../logger", () => ({
    logger: {
        info: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe("persistPerRowAssignments", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should process mixed assignments within a transaction", async () => {
        const assignments = [
            { clientId: 1, record: { number: "80", age: "25" } },
            { newClient: { name: "New", username: "new" }, record: { number: "81", age: "25" } },
        ];

        await persistPerRowAssignments(assignments);

        expect(db.transaction).toHaveBeenCalled();
    });
});
