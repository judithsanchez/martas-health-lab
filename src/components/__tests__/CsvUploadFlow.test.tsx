import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock URL.createObjectURL for JSDOM
if (typeof window !== "undefined") {
    window.URL.createObjectURL = vi.fn(() => "mock-url");
}

import CsvUploadFlow from "../CsvUploadFlow";
import * as csvActions from "@/lib/actions/csv-upload";
import * as clientActions from "@/lib/actions/clients";
import * as persistActions from "@/lib/actions/persist-csv";

vi.mock("@/lib/actions/csv-upload", () => ({
    uploadCsv: vi.fn(),
}));
vi.mock("@/lib/actions/clients", () => ({
    getClients: vi.fn(),
    createClient: vi.fn(),
}));
vi.mock("@/lib/actions/persist-csv", () => ({
    persistPerRowAssignments: vi.fn(),
}));

describe("CsvUploadFlow", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (clientActions.getClients as any).mockResolvedValue([{ id: 1, name: "Marta", username: "marta" }]);
    });

    it("should render upload state initially", () => {
        render(<CsvUploadFlow />);
        expect(screen.getByText(/Assign Measurements/i)).toBeDefined();
        expect(screen.getByText(/Choose file or drag & drop/i)).toBeDefined();
    });

    it("should transition to identify step after successful upload", async () => {
        (csvActions.uploadCsv as any).mockResolvedValue({
            success: true,
            records: [{ number: "100", age: "40" }],
            message: "Success"
        });

        render(<CsvUploadFlow />);

        const file = new File(["number,age\n100,40"], "test.csv", { type: "text/csv" });
        const input = screen.getByLabelText(/Choose file or drag & drop/i);

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/Identify Clients/i)).toBeDefined();
            expect(screen.getByText(/Found 1 records/i)).toBeDefined();
        });
    });

    it("should allow assigning an existing client to a row", async () => {
        (csvActions.uploadCsv as any).mockResolvedValue({
            success: true,
            records: [{ number: "100", age: "40" }],
            message: "Success"
        });

        render(<CsvUploadFlow />);

        fireEvent.change(screen.getByLabelText(/Choose file or drag & drop/i), {
            target: { files: [new File([], "test.csv")] }
        });

        await waitFor(() => screen.getByText(/Identify Clients/i));

        // Use data-testid for robust row finding
        const row = screen.getByTestId("csv-row");
        const select = within(row).getByRole("combobox");

        fireEvent.change(select, { target: { value: "1" } });
        expect((select as HTMLSelectElement).value).toBe("1");
    });

    it("should support registering a new client inline", async () => {
        (csvActions.uploadCsv as any).mockResolvedValue({
            success: true,
            records: [{ number: "100", age: "40" }],
            message: "Success"
        });

        render(<CsvUploadFlow />);

        fireEvent.change(screen.getByLabelText(/Choose file or drag & drop/i), {
            target: { files: [new File([], "test.csv")] }
        });

        await waitFor(() => screen.getByText(/Identify Clients/i));

        const row = screen.getByTestId("csv-row");
        const select = within(row).getByRole("combobox");

        // Select "new"
        fireEvent.change(select, { target: { value: "new" } });

        // Verify inputs appear
        const nameInput = screen.getByPlaceholderText("Name");
        const usernameInput = screen.getByPlaceholderText("Username");

        fireEvent.change(nameInput, { target: { value: "New Guy" } });
        fireEvent.change(usernameInput, { target: { value: "newguy" } });

        expect((nameInput as HTMLInputElement).value).toBe("New Guy");
        expect((usernameInput as HTMLInputElement).value).toBe("newguy");
    });

    it("should support bulk assignment via 'Apply to All'", async () => {
        (csvActions.uploadCsv as any).mockResolvedValue({
            success: true,
            records: [{ number: "100", age: "40" }, { number: "101", age: "40" }],
            message: "Success"
        });

        render(<CsvUploadFlow />);

        fireEvent.change(screen.getByLabelText(/Choose file or drag & drop/i), {
            target: { files: [new File([], "test.csv")] }
        });

        await waitFor(() => screen.getByText(/Identify Clients/i));

        const bulkSelect = screen.getByTestId("bulk-select");
        fireEvent.change(bulkSelect, { target: { value: "1" } });

        // Verify all rows have inherited this client
        const rows = screen.getAllByTestId("csv-row");
        rows.forEach(row => {
            const select = within(row).getByRole("combobox");
            expect((select as HTMLSelectElement).value).toBe("1");
        });
    });

    it("should show success state after persisting assignments", async () => {
        (csvActions.uploadCsv as any).mockResolvedValue({
            success: true,
            records: [{ number: "100", age: "40" }],
            message: "Success"
        });
        (persistActions.persistPerRowAssignments as any).mockResolvedValue(undefined);

        render(<CsvUploadFlow />);

        fireEvent.change(screen.getByLabelText(/Choose file or drag & drop/i), {
            target: { files: [new File([], "test.csv")] }
        });

        await waitFor(() => screen.getByText(/Identify Clients/i));

        const bulkSelect = screen.getByTestId("bulk-select");
        fireEvent.change(bulkSelect, { target: { value: "1" } });

        fireEvent.click(screen.getByText(/Persist All Data/i));

        await waitFor(() => {
            expect(screen.getByText(/Data Imported!/i)).toBeDefined();
        });
    });
});
