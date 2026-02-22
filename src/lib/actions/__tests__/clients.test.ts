import { describe, it, expect, vi, beforeEach } from "vitest";
import { getClients, createClient, getClientByUsername, updateClient, toggleClientStatus, deleteClient } from "../clients";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";

vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn((fields) => ({
            from: vi.fn(() => ({
                leftJoin: vi.fn(() => ({
                    orderBy: vi.fn(() => Promise.resolve([])), // for getMeasurements
                })),
                where: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve([{ id: 1, name: "Test", username: "testuser" }])),
                })),
                limit: vi.fn(() => Promise.resolve([{ id: 1 }])), // for existing check
                then: vi.fn((resolve) => resolve([{ id: 1, name: "Test" }])),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 1, name: "Test" }])),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([{ id: 1, name: "Updated" }])),
                })),
            })),
        })),
        delete: vi.fn(() => ({
            where: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 1 }])),
            })),
        })),
    },
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
    Logger: {
        info: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe("client actions", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("getClients should return all clients", async () => {
        const result = await getClients();
        expect(result).toEqual([{ id: 1, name: "Test" }]);
        expect(db.select).toHaveBeenCalled();
    });

    it("createClient should insert and return new client", async () => {
        const data = { name: "New", username: "newuser" };
        const result = await createClient(data);
        expect(result).toEqual({ id: 1, name: "Test" });
        expect(db.insert).toHaveBeenCalledWith(clients);
    });

    it("getClientByUsername should find client by username", async () => {
        const result = await getClientByUsername("testuser");
        expect(result).toEqual({ id: 1, name: "Test", username: "testuser" });
    });

    it("updateClient should update and return client", async () => {
        const data = { name: "Updated" };
        // @ts-ignore
        const result = await updateClient(1, data);
        expect(result).toEqual({ id: 1, name: "Updated" });
        expect(db.update).toHaveBeenCalled();
    });

    it("toggleClientStatus should update status", async () => {
        // @ts-ignore
        const result = await toggleClientStatus(1, false);
        expect(result).toEqual({ id: 1, name: "Updated" });
        expect(db.update).toHaveBeenCalled();
    });

    // Mocking existing records check is tricky with the current generic mock. 
    // We configured select().from().where().limit() to return [{id: 1}].
    // This simulates "records exist", so deleteClient SHOULD fail.
    it("deleteClient should fail if records exist", async () => {
        // @ts-ignore
        await expect(deleteClient(1)).rejects.toThrow("Cannot delete client with existing records");
    });
});
