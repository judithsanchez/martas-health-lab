"use client";

import { useState, useEffect } from "react";
import { createRecord, updateRecord, type MeasurementData } from "@/lib/actions/records";
import { calculateBMI, calculateBMR, calculateAge } from "@/lib/utils/health-calculations";

type RecordFormProps = {
    clientId: number;
    client: any;
    record?: { id: number } & Partial<MeasurementData>;
    onClose: () => void;
    onSuccess: () => void;
};

export function RecordForm({ clientId, client, record, onClose, onSuccess }: RecordFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        date: record?.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        weight: record?.weight?.toString() || "",
        height: record?.height?.toString() || client?.height?.toString() || "",
        fatPercent: record?.fatPercent?.toString() || "",
        muscleMass: record?.muscleMass?.toString() || "",
        waterPercent: record?.waterPercent?.toString() || "",
        boneMass: record?.boneMass?.toString() || "",
        visceralFat: record?.visceralFat?.toString() || "",
        metabolicAge: record?.metabolicAge?.toString() || "",
        bmr: record?.bmr?.toString() || "",
        physiqueRatingScale: record?.physiqueRatingScale?.toString() || "",
        waist: record?.waist?.toString() || "",
        bmi: record?.bmi?.toString() || "",
        // Segmental Fat
        fatArmRight: record?.fatArmRight?.toString() || "",
        fatArmLeft: record?.fatArmLeft?.toString() || "",
        fatLegRight: record?.fatLegRight?.toString() || "",
        fatLegLeft: record?.fatLegLeft?.toString() || "",
        fatTrunk: record?.fatTrunk?.toString() || "",
        // Segmental Muscle
        muscleArmRight: record?.muscleArmRight?.toString() || "",
        muscleArmLeft: record?.muscleArmLeft?.toString() || "",
        muscleLegRight: record?.muscleLegRight?.toString() || "",
        muscleLegLeft: record?.muscleLegLeft?.toString() || "",
        muscleTrunk: record?.muscleTrunk?.toString() || "",
        notes: record?.notes || "",
    });

    // Real-time recalculation
    useEffect(() => {
        const w = parseFloat(formData.weight);
        const h = parseFloat(formData.height);
        const f = parseFloat(formData.fatPercent);
        const gender = client?.gender || 'female';
        const age = calculateAge(client?.birthday);

        const updates: any = {};

        // 1. BMI
        if (!isNaN(w) && !isNaN(h) && h > 0) {
            updates.bmi = (w / ((h / 100) ** 2)).toFixed(1);
        }

        // 2. Bone Mass (Heuristic if not present)
        let currentBone = parseFloat(formData.boneMass);
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
            updates.boneMass = currentBone.toString();
        }

        // 3. Muscle Mass (Weight - FatMass - BoneMass)
        if (!isNaN(w) && !isNaN(f) && !isNaN(currentBone)) {
            const fatMass = w * (f / 100);
            updates.muscleMass = (w - fatMass - currentBone).toFixed(2);
        }

        // 4. BMR
        if (!isNaN(w) && !isNaN(h) && !isNaN(age)) {
            updates.bmr = calculateBMR(w, h, age, gender).value.toString();
        }

        // 5. Metabolic Age
        if (!isNaN(f) && !isNaN(age)) {
            const targetFat = gender === 'female' ? 23 : 15;
            let metAge = age + (f - targetFat) * 0.5;
            // Bounds check same as backend logic
            metAge = Math.max(12, Math.min(age + 15, Math.max(age - 15, metAge)));
            updates.metabolicAge = Math.round(metAge).toString();
        }

        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.weight, formData.height, formData.fatPercent, client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const num = (val: string) => val === "" ? undefined : parseFloat(val);

            const data: MeasurementData = {
                clientId,
                date: formData.date,
                weight: num(formData.weight) || 0,
                height: num(formData.height),
                fatPercent: num(formData.fatPercent),
                muscleMass: num(formData.muscleMass),
                waterPercent: num(formData.waterPercent),
                boneMass: num(formData.boneMass),
                visceralFat: num(formData.visceralFat),
                bmr: num(formData.bmr),
                metabolicAge: num(formData.metabolicAge),
                physiqueRatingScale: num(formData.physiqueRatingScale),
                waist: num(formData.waist),
                bmi: num(formData.bmi),
                fatArmRight: num(formData.fatArmRight),
                fatArmLeft: num(formData.fatArmLeft),
                fatLegRight: num(formData.fatLegRight),
                fatLegLeft: num(formData.fatLegLeft),
                fatTrunk: num(formData.fatTrunk),
                muscleArmRight: num(formData.muscleArmRight),
                muscleArmLeft: num(formData.muscleArmLeft),
                muscleLegRight: num(formData.muscleLegRight),
                muscleLegLeft: num(formData.muscleLegLeft),
                muscleTrunk: num(formData.muscleTrunk),
                notes: formData.notes,
            };

            if (record?.id) {
                await updateRecord(record.id, data);
            } else {
                await createRecord(data);
            }
            onSuccess();
        } catch (e: any) {
            setError(e.message || "Ocurrió un error al guardar");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">{record ? "Editar Registro" : "Nuevo Registro"}</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-slate-800">General y Composición Corporal</h3>
                            <div className="flex items-center gap-4 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Fecha *</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Peso (kg) *</label>
                                <input type="number" step="0.1" name="weight" required value={formData.weight} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Altura (cm)</label>
                                <input type="number" step="0.1" name="height" value={formData.height} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Body Fat %</label>
                                <input type="number" step="0.1" name="fatPercent" value={formData.fatPercent} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-purple-500 uppercase">Muscle (kg)</label>
                                <input type="number" step="0.1" name="muscleMass" value={formData.muscleMass} onChange={handleChange} className="w-full p-2 border rounded bg-purple-50/30 border-purple-100 focus:border-purple-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Water %</label>
                                <input type="number" step="0.1" name="waterPercent" value={formData.waterPercent} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-purple-500 uppercase">Bone (kg)</label>
                                <input type="number" step="0.1" name="boneMass" value={formData.boneMass} onChange={handleChange} className="w-full p-2 border rounded bg-purple-50/30 border-purple-100 focus:border-purple-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Visceral Fat</label>
                                <input type="number" step="0.5" name="visceralFat" value={formData.visceralFat} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-purple-500 uppercase">Metabolic Age</label>
                                <input type="number" name="metabolicAge" value={formData.metabolicAge} onChange={handleChange} className="w-full p-2 border rounded bg-purple-50/30 border-purple-100 focus:border-purple-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-purple-500 uppercase">BMR (kcal)</label>
                                <input type="number" name="bmr" value={formData.bmr} onChange={handleChange} className="w-full p-2 border rounded bg-purple-50/30 border-purple-100 focus:border-purple-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Physique Rating</label>
                                <input type="number" name="physiqueRatingScale" value={formData.physiqueRatingScale} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Waist (cm)</label>
                                <input type="number" step="0.1" name="waist" value={formData.waist} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/30 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-purple-500 uppercase">BMI</label>
                                <input type="number" step="0.1" name="bmi" value={formData.bmi} onChange={handleChange} className="w-full p-2 border rounded bg-purple-50/30 border-purple-100 focus:border-purple-300 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Segmental Fat */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 border-b pb-2">Grasa Segmental %</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Brazo Izq</label>
                                <input type="number" step="0.1" name="fatArmLeft" value={formData.fatArmLeft} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Brazo Der</label>
                                <input type="number" step="0.1" name="fatArmRight" value={formData.fatArmRight} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Tronco</label>
                                <input type="number" step="0.1" name="fatTrunk" value={formData.fatTrunk} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Pierna Izq</label>
                                <input type="number" step="0.1" name="fatLegLeft" value={formData.fatLegLeft} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Pierna Der</label>
                                <input type="number" step="0.1" name="fatLegRight" value={formData.fatLegRight} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Segmental Muscle */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-slate-800 border-b pb-2">Músculo Segmental (kg)</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Brazo Izq</label>
                                <input type="number" step="0.1" name="muscleArmLeft" value={formData.muscleArmLeft} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Brazo Der</label>
                                <input type="number" step="0.1" name="muscleArmRight" value={formData.muscleArmRight} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Tronco</label>
                                <input type="number" step="0.1" name="muscleTrunk" value={formData.muscleTrunk} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Pierna Izq</label>
                                <input type="number" step="0.1" name="muscleLegLeft" value={formData.muscleLegLeft} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase">Pierna Der</label>
                                <input type="number" step="0.1" name="muscleLegRight" value={formData.muscleLegRight} onChange={handleChange} className="w-full p-2 border rounded bg-blue-50/20 border-blue-100 focus:border-blue-300 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition shadow-md active:scale-95"
                        >
                            {loading ? "Guardando..." : "Guardar Medición"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
