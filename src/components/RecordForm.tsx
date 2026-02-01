"use client";

import { useState } from "react";
import { createRecord, updateRecord, type MeasurementData } from "@/lib/actions/records";

type RecordFormProps = {
    clientId: number;
    record?: { id: number } & Partial<MeasurementData>;
    onClose: () => void;
    onSuccess: () => void;
};

export function RecordForm({ clientId, record, onClose, onSuccess }: RecordFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            // Helper to parse nullable number
            const num = (name: string) => {
                const val = formData.get(name);
                return val ? parseFloat(val as string) : undefined;
            };

            const data: MeasurementData = {
                clientId,
                date: formData.get("date") as string,
                weight: num("weight") || 0, // required field
                height: num("height"),
                fatPercent: num("fatPercent"),
                muscleMass: num("muscleMass"),
                waterPercent: num("waterPercent"),
                boneMass: num("boneMass"),
                visceralFat: num("visceralFat"),
                dciKcal: num("dciKcal"),
                bmr: num("bmr"),
                metabolicAge: num("metabolicAge"),
                physiqueRatingScale: num("physiqueRatingScale"),
                bodyType: num("bodyType"),

                // Segmental Fat
                fatArmRight: num("fatArmRight"),
                fatArmLeft: num("fatArmLeft"),
                fatLegRight: num("fatLegRight"),
                fatLegLeft: num("fatLegLeft"),
                fatTrunk: num("fatTrunk"),

                // Segmental Muscle
                muscleArmRight: num("muscleArmRight"),
                muscleArmLeft: num("muscleArmLeft"),
                muscleLegRight: num("muscleLegRight"),
                muscleLegLeft: num("muscleLegLeft"),
                muscleTrunk: num("muscleTrunk"),

                notes: formData.get("notes") as string,
            };

            if (record?.id) {
                await updateRecord(record.id, data);
            } else {
                await createRecord(data);
            }
            onSuccess();
        } catch (e: any) {
            setError(e.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">{record ? "Edit Record" : "New Record"}</h2>
                </div>

                <form action={handleSubmit} className="p-6 space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 border-b pb-2">General & Body Composition</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Date *</label>
                                <input type="date" name="date" required defaultValue={record?.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg) *</label>
                                <input type="number" step="0.1" name="weight" required defaultValue={record?.weight} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Height (cm)</label>
                                <input type="number" step="0.1" name="height" defaultValue={record?.height ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Body Fat %</label>
                                <input type="number" step="0.1" name="fatPercent" defaultValue={record?.fatPercent ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Muscle (kg)</label>
                                <input type="number" step="0.1" name="muscleMass" defaultValue={record?.muscleMass ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Water %</label>
                                <input type="number" step="0.1" name="waterPercent" defaultValue={record?.waterPercent ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Bone (kg)</label>
                                <input type="number" step="0.1" name="boneMass" defaultValue={record?.boneMass ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Visceral Fat</label>
                                <input type="number" step="0.5" name="visceralFat" defaultValue={record?.visceralFat ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Metabolic Age</label>
                                <input type="number" name="metabolicAge" defaultValue={record?.metabolicAge ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">BMR (kcal)</label>
                                <input type="number" name="bmr" defaultValue={record?.bmr ?? ""} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Physique Rating</label>
                                <input type="number" name="physiqueRatingScale" defaultValue={record?.physiqueRatingScale ?? ""} className="w-full p-2 border rounded" />
                            </div>
                        </div>
                    </div>

                    {/* Segmental Fat */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 border-b pb-2">Segmental Fat %</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">L Arm</label>
                                <input type="number" step="0.1" name="fatArmLeft" defaultValue={record?.fatArmLeft ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">R Arm</label>
                                <input type="number" step="0.1" name="fatArmRight" defaultValue={record?.fatArmRight ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Trunk</label>
                                <input type="number" step="0.1" name="fatTrunk" defaultValue={record?.fatTrunk ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">L Leg</label>
                                <input type="number" step="0.1" name="fatLegLeft" defaultValue={record?.fatLegLeft ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">R Leg</label>
                                <input type="number" step="0.1" name="fatLegRight" defaultValue={record?.fatLegRight ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                        </div>
                    </div>

                    {/* Segmental Muscle */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 border-b pb-2">Segmental Muscle (kg)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">L Arm</label>
                                <input type="number" step="0.1" name="muscleArmLeft" defaultValue={record?.muscleArmLeft ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">R Arm</label>
                                <input type="number" step="0.1" name="muscleArmRight" defaultValue={record?.muscleArmRight ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Trunk</label>
                                <input type="number" step="0.1" name="muscleTrunk" defaultValue={record?.muscleTrunk ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">L Leg</label>
                                <input type="number" step="0.1" name="muscleLegLeft" defaultValue={record?.muscleLegLeft ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">R Leg</label>
                                <input type="number" step="0.1" name="muscleLegRight" defaultValue={record?.muscleLegRight ?? ""} className="w-full p-2 border rounded bg-slate-50" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Measurement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
