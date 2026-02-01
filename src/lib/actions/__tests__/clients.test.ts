import { describe, it, expect, vi, beforeEach } from "vitest";
import { getClients, createClient, getClientByUsername } from "../clients";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";

vi.mock("@/lib/db", () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve([{ id: 1, name: "Test", username: "testuser" }])),
                })),
                then: vi.fn((resolve) => resolve([{ id: 1, name: "Test" }])),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 1, name: "Test" }])),
            })),
        })),
    },
}));

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
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
});
