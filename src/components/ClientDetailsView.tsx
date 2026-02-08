"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteRecord } from "@/lib/actions/records";
import { RecordForm } from "@/components/RecordForm";

export default function ClientDetailsView({ client, measurements }: { client: any, measurements: any[] }) {
    const router = useRouter();
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    async function handleDelete(id: number) {
        if (confirm("¿Estás seguro de que quieres eliminar esta medición?")) {
            await deleteRecord(id);
            router.refresh();
        }
    }

    return (
        <main className="min-h-screen bg-cream p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Link href="/" className="text-sage hover:text-plum transition-colors text-sm font-medium flex items-center gap-1">
                                ← Volver al Panel
                            </Link>
                        </div>
                        <h1 className="text-4xl font-bold text-plum">{client.name} {client.lastname}</h1>
                        <div className="flex flex-wrap gap-4 text-slate-500 mt-2 text-sm items-center">
                            <span className="bg-white px-2 py-1 rounded shadow-sm">@{client.username}</span>
                            <span>•</span>
                            <span>Nivel Actividad {client.activityLevel?.toString() ?? '-'}</span>
                            <span>•</span>
                            <span>{client.height ? `${client.height} cm` : 'Sin Altura'}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-3 bg-plum text-cream rounded-lg hover:bg-slate-800 transition font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                        <span>+</span> Añadir Registro
                    </button>
                </div>

                {/* Measurements Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
                        <h2 className="text-xl font-bold text-plum">Historial de Mediciones</h2>
                        <span className="px-3 py-1 bg-sage/10 text-sage rounded-full text-xs font-bold uppercase tracking-wider">{measurements.length} Registros</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-cream text-plum uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="p-5 border-b border-slate-100">Fecha</th>
                                    <th className="p-5 border-b border-slate-100">Peso</th>
                                    <th className="p-5 border-b border-slate-100">BMI</th>
                                    <th className="p-5 border-b border-slate-100">% Grasa</th>
                                    <th className="p-5 border-b border-slate-100">Músculo</th>
                                    <th className="p-5 border-b border-slate-100">Masa Ósea</th>
                                    <th className="p-5 border-b border-slate-100">Visceral</th>
                                    <th className="p-5 border-b border-slate-100">DCI (kcal)</th>
                                    <th className="p-5 border-b border-slate-100">Edad Met.</th>
                                    <th className="p-5 border-b border-slate-100 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {measurements.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center text-slate-400">
                                            No hay mediciones registradas todavía. Añade una para empezar.
                                        </td>
                                    </tr>
                                ) : (
                                    measurements.map((record) => {
                                        const formatValue = (val: any) => {
                                            if (typeof val === 'number') return val.toFixed(1);
                                            return val ?? '-';
                                        };

                                        return (
                                            <tr key={record.id} className="hover:bg-cream/30 transition duration-150 group">
                                                <td className="p-5 text-slate-800 font-semibold group-hover:text-plum transition-colors whitespace-nowrap">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-5 text-slate-600 font-medium">{formatValue(record.weight)} kg</td>
                                                <td className="p-5 text-slate-600">{formatValue(record.bmi)}</td>
                                                <td className="p-5 text-slate-600">{formatValue(record.fatPercent)}%</td>
                                                <td className="p-5 text-slate-600">{formatValue(record.muscleMass)} kg</td>
                                                <td className="p-5 text-slate-600">{formatValue(record.boneMass)} kg</td>
                                                <td className="p-5 text-slate-600">{record.visceralFat}</td>
                                                <td className="p-5 text-slate-600">{record.dciKcal}</td>
                                                <td className="p-5 text-slate-600">{record.metabolicAge}</td>
                                                <td className="p-5 text-right space-x-2 whitespace-nowrap">
                                                    <Link
                                                        href={`/clients/${client.id}/reports/${record.id}`}
                                                        className="px-3 py-1 bg-gold text-plum rounded-lg text-xs font-bold hover:bg-white transition shadow-sm inline-block"
                                                    >
                                                        Ver Reporte
                                                    </Link>
                                                    <button
                                                        onClick={() => setEditingRecord(record)}
                                                        className="text-sage hover:text-plum text-sm font-semibold transition-colors px-2"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        className="text-red-400 hover:text-red-600 text-sm font-semibold transition-colors px-2"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Record Modal */}
                {(isCreating || editingRecord) && (
                    <RecordForm
                        clientId={client.id}
                        record={editingRecord}
                        onClose={() => {
                            setIsCreating(false);
                            setEditingRecord(null);
                        }}
                        onSuccess={() => {
                            setIsCreating(false);
                            setEditingRecord(null);
                            router.refresh();
                        }}
                    />
                )}
            </div>
        </main>
    );
}
