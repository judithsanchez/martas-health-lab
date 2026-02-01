"use client";

import { useState } from "react";
import { uploadCsv, CsvRecord } from "@/lib/actions/csv-upload";
import { getClients, createClient, getClientByUsername } from "@/lib/actions/clients";
import { persistMeasurements } from "@/lib/actions/persist-csv";

export default function CsvUploadFlow() {
    const [step, setStep] = useState<"upload" | "identify" | "success">("upload");
    const [csvData, setCsvData] = useState<CsvRecord[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [existingClients, setExistingClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");

    // New Client State
    const [newClient, setNewClient] = useState({
        name: "",
        username: "",
        age: "",
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadCsv(formData);
            setCsvData(result.data);

            // Load existing clients for the next step
            const clients = await getClients();
            setExistingClients(clients);

            setStep("identify");
        } catch (err: any) {
            setError(err.message || "Failed to upload CSV");
        } finally {
            setLoading(false);
        }
    };

    const handleIdentify = async () => {
        setLoading(true);
        setError(null);
        try {
            let clientId: number;

            if (selectedClientId === "new") {
                if (!newClient.name || !newClient.username) {
                    throw new Error("Name and username are required for new clients");
                }
                const client = await createClient({
                    name: newClient.name,
                    username: newClient.username,
                    age: parseInt(newClient.age) || undefined,
                });
                clientId = client.id;
            } else if (selectedClientId) {
                clientId = parseInt(selectedClientId);
            } else {
                throw new Error("Please select a client or create a new one");
            }

            await persistMeasurements(clientId, csvData);
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Failed to process data");
        } finally {
            setLoading(false);
        }
    };

    if (step === "success") {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-green-700 mb-4">Success!</h2>
                <p className="text-green-600 mb-6">The CSV data has been assigned and saved.</p>
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full bg-white divide-y divide-gray-200 rounded-md">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {csvData.slice(0, 5).map((row, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.age}</td>
                                </tr>
                            ))}
                            {csvData.length > 5 && (
                                <tr>
                                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                                        ... and {csvData.length - 5} more records
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <button
                    onClick={() => setStep("upload")}
                    className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
                >
                    Upload Another
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                    {error}
                </div>
            )}

            {step === "upload" && (
                <div className="flex flex-col items-center">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">Upload Measurement CSV</h2>
                    <label className="w-full flex flex-col items-center px-4 py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition">
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-600">Click to select or drag and drop</span>
                        <span className="text-xs text-gray-400 mt-1">Accepts CSV files with 'number' and 'age' columns</span>
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={loading} />
                    </label>
                    {loading && <p className="mt-4 text-sm text-gray-500 animate-pulse">Processing file...</p>}
                </div>
            )}

            {step === "identify" && (
                <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-gray-800">Assign Measurements</h2>
                    <div className="space-y-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                        Parsed <strong>{csvData.length}</strong> records from the file.
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">Select Client</label>
                        <select
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                        >
                            <option value="">Choose a client...</option>
                            {existingClients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name} (@{client.username})
                                </option>
                            ))}
                            <option value="new">+ Register New Client</option>
                        </select>
                    </div>

                    {selectedClientId === "new" && (
                        <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <h3 className="text-sm font-bold text-gray-700">New Client Details</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    placeholder="Full Name"
                                    className="p-2 border rounded-md text-sm"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                />
                                <input
                                    placeholder="Username (e.g. judithsanchez)"
                                    className="p-2 border rounded-md text-sm"
                                    value={newClient.username}
                                    onChange={(e) => setNewClient({ ...newClient, username: e.target.value })}
                                />
                                <input
                                    placeholder="Age"
                                    type="number"
                                    className="p-2 border rounded-md text-sm"
                                    value={newClient.age}
                                    onChange={(e) => setNewClient({ ...newClient, age: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-4">
                        <button
                            onClick={() => setStep("upload")}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleIdentify}
                            disabled={loading || (!selectedClientId)}
                            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition"
                        >
                            {loading ? "Saving..." : "Save Data"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
