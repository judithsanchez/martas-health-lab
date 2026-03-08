"use client";

import { useState, useEffect } from "react";
import { uploadCsv, CsvRecord } from "@/lib/actions/csv-upload";
import { getClients } from "@/lib/actions/clients";
import { persistPerRowAssignments, RowAssignment } from "@/lib/actions/persist-csv";
import { calculateBMI, calculateBMR, calculateAge } from "@/lib/utils/health-calculations";

export default function CsvUploadFlow({ preselectedClientId }: { preselectedClientId?: number }) {
    const [step, setStep] = useState<"upload" | "identify" | "success">("upload");
    const [assignments, setAssignments] = useState<RowAssignment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [existingClients, setExistingClients] = useState<any[]>([]);

    const isInvalidDate = (dateStr: string) => {
        if (!dateStr) return true;
        const d = new Date(dateStr);
        return isNaN(d.getTime());
    };

    const hasInvalidDates = assignments.some(a => isInvalidDate(a.record.date));

    // Real-time recalculation for a specific assignment
    const recalculateRecord = (record: any, client: any) => {
        const w = parseFloat(record.weight);
        const h = parseFloat(record.height) || client?.height;
        const f = parseFloat(record.fatPercent);
        const gender = client?.gender || 'female';
        const age = calculateAge(client?.birthday);

        const updates: any = {};

        // 1. BMI
        if (!isNaN(w) && !isNaN(h) && h > 0) {
            updates.bmi = parseFloat((w / ((h / 100) ** 2)).toFixed(1));
        }

        // 2. Bone Mass (Heuristic)
        let currentBone = parseFloat(record.boneMass);
        if (!isNaN(w)) {
            if (gender === 'female') {
                if (w < 50) currentBone = 1.95;
                else if (w <= 75) currentBone = 2.40;
                else currentBone = 2.95;
            } else {
                if (w < 65) currentBone = 2.66;
                else if (w <= 95) currentBone = 3.29;
                else currentBone = 3.69;
            }
            updates.boneMass = currentBone;
        }

        // 3. Muscle Mass
        if (!isNaN(w) && !isNaN(f) && !isNaN(currentBone)) {
            const fatMass = w * (f / 100);
            updates.muscleMass = parseFloat((w - fatMass - currentBone).toFixed(2));
        }

        // 4. BMR
        if (!isNaN(w) && !isNaN(h) && !isNaN(age)) {
            updates.bmr = calculateBMR(w, h, age, gender).value;
        }

        // 5. Metabolic Age
        if (!isNaN(f) && !isNaN(age)) {
            const targetFat = gender === 'female' ? 23 : 15;
            let metAge = age + (f - targetFat) * 0.5;
            metAge = Math.max(12, Math.min(age + 15, Math.max(age - 15, metAge)));
            updates.metabolicAge = Math.round(metAge);
        }

        return { ...record, ...updates };
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadCsv(formData);

            if (result.success && result.data) {
                // Initialize assignments for each row
                const initialAssignments: RowAssignment[] = result.data.map((record: CsvRecord) => ({
                    record,
                    clientId: preselectedClientId || undefined,
                }));
                setAssignments(initialAssignments);

                // Load existing clients
                const clients = await getClients();
                setExistingClients(clients);

                setStep("identify");
            } else {
                setError(result.message || "Error al procesar el archivo");
            }
        } catch (err: any) {
            setError(err.message || "Error al subir el CSV");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyToAll = (clientId?: number) => {
        if (!clientId) return;
        const client = existingClients.find(c => c.id === clientId);
        setAssignments(prev => prev.map(a => ({
            ...a,
            clientId,
            newClient: undefined,
            record: recalculateRecord(a.record, client)
        })));
    };

    const updateAssignment = (index: number, updates: Partial<RowAssignment>) => {
        setAssignments(prev => {
            const next = [...prev];
            let current = { ...next[index], ...updates };

            // If we updated the record or the clientId, trigger recalculation
            if (updates.record || updates.clientId) {
                const client = existingClients.find(c => c.id === (current.clientId || next[index].clientId));
                current.record = recalculateRecord(current.record, client);
            }

            next[index] = current;
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
                throw new Error("Por favor asigne todas las filas a un cliente o registre uno nuevo.");
            }

            await persistPerRowAssignments(assignments);
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Error al guardar los datos");
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
                <h2 className="text-2xl font-bold text-green-700 mb-2">¡Datos Importados!</h2>
                <p className="text-green-600 mb-6 font-medium">Se procesaron con éxito {assignments.length} registros.</p>
                <button
                    onClick={() => setStep("upload")}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-sm"
                >
                    Subir Nuevo Archivo
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

            {hasInvalidDates && (
                <div className="mb-6 p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="font-bold">Fechas Inválidas Detectadas</p>
                        <p className="opacity-80">Algunos registros tienen fechas que no se pudieron analizar correctamente. Puedes corregirlas a continuación.</p>
                    </div>
                </div>
            )}

            {step === "upload" && (
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Asignar Mediciones</h2>
                    <p className="text-slate-500 mb-8 text-center max-w-sm">Selecciona un archivo CSV para comenzar a asignar datos de medición a tus clientes.</p>

                    <label className="w-full relative flex flex-col items-center px-4 py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-all group">
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-700">Elige un archivo o arrastra y suelta</span>
                        <span className="text-xs text-slate-400 mt-2">Compatible con exportaciones .csv y .xlsx (Excel) de Tanita</span>
                        <input type="file" className="hidden" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileUpload} disabled={loading} />
                    </label>

                    {loading && <div className="mt-6 flex items-center gap-3 text-slate-500 animate-pulse">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        <span className="text-sm font-medium">Analizando CSV...</span>
                    </div>}
                </div>
            )}

            {step === "identify" && (
                <div className="flex flex-col gap-6">
                    <header className="flex items-center justify-between border-b pb-6 border-slate-100">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Identificar Clientes</h2>
                            <p className="text-sm text-slate-500 mt-1">Se encontraron {assignments.length} registros. Asigna cada uno a un cliente.</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Aplicar a todos:</span>
                                <select
                                    data-testid="bulk-select"
                                    className="text-xs font-medium border-slate-200 rounded-lg focus:ring-slate-900 focus:border-slate-900 p-2 pr-8 bg-slate-50 outline-none"
                                    onChange={(e) => handleApplyToAll(parseInt(e.target.value))}
                                    defaultValue={preselectedClientId || ""}
                                >
                                    <option value="" disabled>Seleccionar Cliente...</option>
                                    {existingClients.map(c => <option key={c.id} value={c.id}>{c.name} (@{c.username})</option>)}
                                </select>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Leyenda:</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    <span className="text-[10px] font-semibold text-slate-600">Entrada</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                    <span className="text-[10px] font-semibold text-slate-600">Calculado</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {assignments.map((assignment, idx) => (
                            <div key={idx} data-testid="csv-row" className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start justify-between gap-6">
                                        {/* Date Editor */}
                                        <div className={`p-3 rounded-xl border-2 transition-all min-w-[150px] ${isInvalidDate(assignment.record.date) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                                            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Fecha de Medición</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    className={`flex-1 text-sm font-bold bg-transparent border-none p-0 focus:ring-0 ${isInvalidDate(assignment.record.date) ? 'text-red-600' : 'text-slate-800'}`}
                                                    value={(() => {
                                                        const d = new Date(assignment.record.date);
                                                        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : "";
                                                    })()}
                                                    onChange={(e) => {
                                                        const nextRecord = { ...assignment.record, date: e.target.value };
                                                        updateAssignment(idx, { record: nextRecord });
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Identification Controls */}
                                        <div className="flex-1 space-y-3">
                                            <select
                                                className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-slate-900 focus:border-slate-900 block p-3 shadow-sm outline-none"
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
                                                <option value="">Elegir Cliente Existente...</option>
                                                {existingClients.map((client) => (
                                                    <option key={client.id} value={client.id}>{client.name} (@{client.username})</option>
                                                ))}
                                                <option value="new">+ Registrar Nuevo Cliente</option>
                                            </select>

                                            {assignment.newClient && (
                                                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <input
                                                        placeholder="Nombre"
                                                        className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                                                        value={assignment.newClient.name}
                                                        onChange={(e) => updateAssignment(idx, { newClient: { ...assignment.newClient!, name: e.target.value } })}
                                                    />
                                                    <input
                                                        placeholder="Usuario (ej: marta_f)"
                                                        className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-slate-900 outline-none"
                                                        value={assignment.newClient.username}
                                                        onChange={(e) => updateAssignment(idx, { newClient: { ...assignment.newClient!, username: e.target.value } })}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Data Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {[
                                            { key: 'weight', label: 'Peso (kg)', type: 'number', step: '0.1', cat: 'in' },
                                            { key: 'fatPercent', label: 'Body Fat %', type: 'number', step: '0.1', cat: 'in' },
                                            { key: 'visceralFat', label: 'Grasa Visc.', type: 'number', step: '0.5', cat: 'in' },
                                            { key: 'waterPercent', label: 'Agua %', type: 'number', step: '0.1', cat: 'in' },
                                            { key: 'physiqueRatingScale', label: 'Cuerpo', type: 'number', step: '1', cat: 'in' },

                                            { key: 'muscleMass', label: 'Músculo (kg)', type: 'number', step: '0.1', cat: 'calc' },
                                            { key: 'boneMass', label: 'Hueso (kg)', type: 'number', step: '0.1', cat: 'calc' },
                                            { key: 'metabolicAge', label: 'Edad Met.', type: 'number', step: '1', cat: 'calc' },
                                            { key: 'bmi', label: 'IMC', type: 'number', step: '0.1', cat: 'calc' },
                                            { key: 'bmr', label: 'BMR (kcal)', type: 'number', step: '1', cat: 'calc' },
                                        ].map((field) => {
                                            const val = assignment.record[field.key];
                                            const isCalc = field.cat === 'calc';

                                            return (
                                                <div
                                                    key={field.key}
                                                    className={`px-2 py-1.5 rounded-xl border-2 transition-all ${isCalc
                                                        ? 'bg-purple-50 border-purple-100 focus-within:border-purple-300'
                                                        : 'bg-blue-50 border-blue-100 focus-within:border-blue-300'
                                                        }`}
                                                >
                                                    <label className={`text-[9px] font-black uppercase mb-0.5 block ${isCalc ? 'text-purple-400' : 'text-blue-400'}`}>
                                                        {field.label}
                                                    </label>
                                                    <input
                                                        type={field.type}
                                                        step={field.step}
                                                        className="w-full text-xs font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-800 outline-none"
                                                        value={val ?? ""}
                                                        onChange={(e) => {
                                                            const nextRecord = { ...assignment.record, [field.key]: e.target.value === "" ? null : parseFloat(e.target.value) };
                                                            updateAssignment(idx, { record: nextRecord });
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Segmental Sections */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Grasa Segmental %</h4>
                                            <div className="grid grid-cols-5 gap-2">
                                                {[
                                                    { key: 'fatArmLeft', label: 'B.Izq' },
                                                    { key: 'fatArmRight', label: 'B.Der' },
                                                    { key: 'fatTrunk', label: 'Tronco' },
                                                    { key: 'fatLegLeft', label: 'P.Izq' },
                                                    { key: 'fatLegRight', label: 'P.Der' },
                                                ].map(f => (
                                                    <div key={f.key} className="px-2 py-1.5 rounded-lg border bg-white shadow-sm">
                                                        <label className="text-[8px] font-bold text-slate-400 uppercase block leading-tight">{f.label}</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            className="w-full text-[11px] font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-800"
                                                            value={assignment.record[f.key] ?? ""}
                                                            onChange={(e) => {
                                                                const nextRecord = { ...assignment.record, [f.key]: e.target.value === "" ? null : parseFloat(e.target.value) };
                                                                updateAssignment(idx, { record: nextRecord });
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Músculo Segmental (kg)</h4>
                                            <div className="grid grid-cols-5 gap-2">
                                                {[
                                                    { key: 'muscleArmLeft', label: 'B.Izq' },
                                                    { key: 'muscleArmRight', label: 'B.Der' },
                                                    { key: 'muscleTrunk', label: 'Tronco' },
                                                    { key: 'muscleLegLeft', label: 'P.Izq' },
                                                    { key: 'muscleLegRight', label: 'P.Der' },
                                                ].map(f => (
                                                    <div key={f.key} className="px-2 py-1.5 rounded-lg border bg-white shadow-sm">
                                                        <label className="text-[8px] font-bold text-slate-400 uppercase block leading-tight">{f.label}</label>
                                                        <input
                                                            type="number" step="0.1"
                                                            className="w-full text-[11px] font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-800"
                                                            value={assignment.record[f.key] ?? ""}
                                                            onChange={(e) => {
                                                                const nextRecord = { ...assignment.record, [f.key]: e.target.value === "" ? null : parseFloat(e.target.value) };
                                                                updateAssignment(idx, { record: nextRecord });
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
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
                            Empezar de Nuevo
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 shadow-lg shadow-slate-200 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                        >
                            {loading ? "Procesando..." : "Guardar Todos los Datos"}
                        </button>
                    </footer>
                </div>
            )}
        </div>
    );
}
