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
        if (confirm("Are you sure you want to delete this measurement?")) {
            await deleteRecord(id);
            router.refresh();
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/clients" className="text-slate-500 hover:text-slate-700 text-sm">
                                ← Back to Clients
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900">{client.name} {client.lastname}</h1>
                        <div className="flex gap-4 text-slate-600 mt-1 text-sm">
                            <span>@{client.username}</span>
                            <span>•</span>
                            <span>{client.activityLevel ? `Activity Lvl ${client.activityLevel}` : 'No Activity Level'}</span>
                            <span>•</span>
                            <span>{client.height ? `${client.height} cm` : 'No Height'}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
                    >
                        + Add Record
                    </button>
                </div>

                {/* Measurements Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h2 className="font-semibold text-slate-700">Measurement History</h2>
                        <span className="text-xs text-slate-500">{measurements.length} Records</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4 border-b">Date</th>
                                    <th className="p-4 border-b">Weight</th>
                                    <th className="p-4 border-b">Fat %</th>
                                    <th className="p-4 border-b">Muscle</th>
                                    <th className="p-4 border-b">Visceral</th>
                                    <th className="p-4 border-b">Met. Age</th>
                                    <th className="p-4 border-b text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {measurements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
                                            No measurements recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    measurements.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50 transition">
                                            <td className="p-4 text-slate-900 font-medium">
                                                {new Date(record.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-slate-600">{record.weight} kg</td>
                                            <td className="p-4 text-slate-600">{record.fatPercent}%</td>
                                            <td className="p-4 text-slate-600">{record.muscleMass} kg</td>
                                            <td className="p-4 text-slate-600">{record.visceralFat}</td>
                                            <td className="p-4 text-slate-600">{record.metabolicAge}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => setEditingRecord(record)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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
