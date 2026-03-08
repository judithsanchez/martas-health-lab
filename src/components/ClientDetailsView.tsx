"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteRecord } from "@/lib/actions/records";
import { RecordForm } from "@/components/RecordForm";
import { formatDate, calculateAge } from "@/lib/utils/date-utils";
import CsvUploadFlow from "@/components/CsvUploadFlow";
import { FileUp, Plus, X, User, Ruler, Activity, Calendar, Hash } from "lucide-react";

export default function ClientDetailsView({ client, measurements }: { client: any, measurements: any[] }) {
    const router = useRouter();
    const [editingRecord, setEditingRecord] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

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
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {client.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                            <span>•</span>
                            <span>Nivel Actividad {client.activityLevel?.toString() ?? '-'}</span>
                            <span>•</span>
                            <span>{client.height ? `${client.height} cm` : 'Sin Altura'}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsImporting(true)}
                            className="px-6 py-3 bg-white text-plum border border-slate-200 rounded-xl hover:bg-slate-50 transition font-bold shadow-sm flex items-center gap-2"
                        >
                            <FileUp size={18} className="text-sage" />
                            <span>Importar desde Archivo</span>
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-6 py-3 bg-plum text-cream rounded-xl hover:bg-slate-800 transition font-bold shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            <Plus size={18} />
                            <span>Entrada Manual</span>
                        </button>
                    </div>
                </div>
                {/* Basic Information Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <User size={14} className="text-sage" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Género</span>
                        </div>
                        <p className="font-bold text-plum capitalize">{client.gender === 'female' ? 'Femenino' : client.gender === 'male' ? 'Masculino' : 'Otro'}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Calendar size={14} className="text-sage" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Edad</span>
                        </div>
                        <p className="font-bold text-plum">{calculateAge(client.birthday) ?? '-'} años</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Ruler size={14} className="text-sage" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Altura</span>
                        </div>
                        <p className="font-bold text-plum">{client.height ? `${client.height} cm` : '-'}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Activity size={14} className="text-sage" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Actividad</span>
                        </div>
                        <p className="font-bold text-plum">Nivel {client.activityLevel?.toString() ?? '-'}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Hash size={14} className="text-sage" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Sesiones/Sem</span>
                        </div>
                        <p className="font-bold text-plum">{client.sessionsPerWeek?.toString() ?? '3'}</p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Calendar size={14} className="text-sage" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Inicio</span>
                        </div>
                        <p className="font-bold text-plum text-sm">{formatDate(client.startDate)}</p>
                    </div>
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
                                                    {formatDate(record.date)}
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
                {/* Import Modal */}
                {isImporting && (
                    <div className="fixed inset-0 bg-plum/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
                            <button
                                onClick={() => {
                                    setIsImporting(false);
                                    router.refresh();
                                }}
                                className="absolute top-6 right-6 p-2 h-10 w-10 hover:bg-gray-100 rounded-full transition-colors z-50 flex items-center justify-center text-gray-400"
                            >
                                <X size={24} />
                            </button>
                            <div className="p-8 pb-4">
                                <h3 className="text-2xl font-bold text-plum mb-1">Importación desde Archivo</h3>
                                <p className="text-gray-500 text-sm">Carga un archivo CSV o Excel exportado de Tanita para {client.name}.</p>
                            </div>
                            <div className="p-2 overflow-hidden">
                                <CsvUploadFlow preselectedClientId={client.id} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
