"use client";

import { useState, useEffect } from "react";
import { uploadCsv, CsvRecord } from "@/lib/actions/csv-upload";
import { getClients } from "@/lib/actions/clients";
import { persistPerRowAssignments, RowAssignment } from "@/lib/actions/persist-csv";

export default function CsvUploadFlow() {
    const [step, setStep] = useState<"upload" | "identify" | "success">("upload");
    const [assignments, setAssignments] = useState<RowAssignment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [existingClients, setExistingClients] = useState<any[]>([]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadCsv(formData);

            // Initialize assignments for each row
            const initialAssignments: RowAssignment[] = result.data.map((record: CsvRecord) => ({
                record,
                clientId: undefined,
            }));
            setAssignments(initialAssignments);

            // Load existing clients
            const clients = await getClients();
            setExistingClients(clients);

            setStep("identify");
        } catch (err: any) {
            setError(err.message || "Failed to upload CSV");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyToAll = (clientId?: number) => {
        if (!clientId) return;
        setAssignments(prev => prev.map(a => ({ ...a, clientId, newClient: undefined })));
    };

    const updateAssignment = (index: number, updates: Partial<RowAssignment>) => {
        setAssignments(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            // Validate all rows have an assignment
            const incomplete = assignments.find(a => !a.clientId && !a.newClient);
            if (incomplete) {
                throw new Error("Please assign all rows to a client or register a new one.");
            }

            await persistPerRowAssignments(assignments);
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Failed to save data");
        } finally {
            setLoading(false);
        }
    };

    if (step === "success") {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg shadow-sm border border-green-100">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">Data Imported!</h2>
                <p className="text-green-600 mb-6 font-medium">Successfully processed {assignments.length} records.</p>
                <button
                    onClick={() => setStep("upload")}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm"
                >
                    Upload New File
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {step === "upload" && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-slate-800">Assign Measurements</h2>
                    <p className="text-slate-500 mb-8 text-center max-w-sm">Select a CSV file to begin assigning measurement data to your clients.</p>

                    <label className="w-full relative flex flex-col items-center px-4 py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-700">Choose file or drag & drop</span>
                        <span className="text-xs text-slate-400 mt-2">Only .csv files with &apos;number&apos; and &apos;age&apos; columns</span>
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={loading} />
                    </label>

                    {loading && <div className="mt-6 flex items-center gap-3 text-slate-500 animate-pulse">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        <span className="text-sm font-medium">Parsing CSV...</span>
                    </div>}
                </div>
            )}

            {step === "identify" && (
                <div className="flex flex-col gap-6">
                    <header className="flex items-center justify-between border-b pb-6 border-slate-100">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Identify Clients</h2>
                            <p className="text-sm text-slate-500 mt-1">Found {assignments.length} records. Assign each to a client.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bulk Apply:</span>
                            <select
                                data-testid="bulk-select"
                                className="text-xs font-medium border-slate-200 rounded-lg focus:ring-slate-900 focus:border-slate-900 p-2 pr-8 bg-slate-50"
                                onChange={(e) => handleApplyToAll(parseInt(e.target.value))}
                                defaultValue=""
                            >
                                <option value="" disabled>Select Client...</option>
                                {existingClients.map(c => <option key={c.id} value={c.id}>{c.name} (@{c.username})</option>)}
                            </select>
                        </div>
                    </header>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {assignments.map((assignment, idx) => (
                            <div key={idx} data-testid="csv-row" className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                                <div className="flex items-start justify-between gap-6">
                                    {/* Data Preview */}
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-4">
                                            <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                <span className="text-xs text-slate-400 font-bold uppercase block leading-tight">Num</span>
                                                <span className="text-lg font-bold text-slate-800">{assignment.record.number}</span>
                                            </div>
                                            <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                                                <span className="text-xs text-slate-400 font-bold uppercase block leading-tight">Age</span>
                                                <span className="text-lg font-bold text-slate-800">{assignment.record.age}</span>
                                            </div>
                                            <div className="text-slate-300">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Identification Controls */}
                                    <div className="flex-[2] space-y-3">
                                        <select
                                            className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-slate-900 focus:border-slate-900 block p-3 shadow-sm"
                                            value={assignment.clientId || (assignment.newClient ? "new" : "")}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === "new") {
                                                    updateAssignment(idx, { clientId: undefined, newClient: { name: "", username: "", age: parseInt(assignment.record.age) || undefined } });
                                                } else if (val) {
                                                    updateAssignment(idx, { clientId: parseInt(val), newClient: undefined });
                                                } else {
                                                    updateAssignment(idx, { clientId: undefined, newClient: undefined });
                                                }
                                            }}
                                        >
                                            <option value="">Choose Existing Client...</option>
                                            {existingClients.map((client) => (
                                                <option key={client.id} value={client.id}>{client.name} (@{client.username})</option>
                                            ))}
                                            <option value="new">+ Register New Client</option>
                                        </select>

                                        {assignment.newClient && (
                                            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <input
                                                    placeholder="Name"
                                                    className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                                                    value={assignment.newClient.name}
                                                    onChange={(e) => updateAssignment(idx, { newClient: { ...assignment.newClient!, name: e.target.value } })}
                                                />
                                                <input
                                                    placeholder="Username"
                                                    className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                                                    value={assignment.newClient.username}
                                                    onChange={(e) => updateAssignment(idx, { newClient: { ...assignment.newClient!, username: e.target.value } })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <footer className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setStep("upload")}
                            className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition"
                        >
                            Start Over
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 shadow-lg shadow-slate-200 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                        >
                            {loading ? "Processing..." : "Persist All Data"}
                        </button>
                    </footer>
                </div>
            )}
        </div>
    );
}
