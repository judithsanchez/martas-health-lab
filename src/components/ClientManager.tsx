"use client";

import { useState } from "react";
import { toggleClientStatus, deleteClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/ClientForm";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Client List Component
export default function ClientManager({ clients }: { clients: any[] }) {
    const router = useRouter();
    const [editingClient, setEditingClient] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    async function handleToggleStatus(id: number, currentStatus: boolean) {
        if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this client?`)) {
            await toggleClientStatus(id, !currentStatus);
            router.refresh(); // Refresh server data
        }
    }

    async function handleDelete(id: number) {
        if (confirm("Are you sure? This cannot be done if the client has records (archive instead).")) {
            try {
                await deleteClient(id);
                router.refresh();
            } catch (e: any) {
                alert(e.message);
            }
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Manage Clients</h1>
                        <p className="text-slate-500">{clients.length} Total Clients</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/"
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition"
                        >
                            Dashboard
                        </Link>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium shadow-sm"
                        >
                            + New Client
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4 border-b">Client</th>
                                <th className="p-4 border-b">Status</th>
                                <th className="p-4 border-b">Sessions/Wk</th>
                                <th className="p-4 border-b">Start Date</th>
                                <th className="p-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <Link href={`/clients/${client.id}`} className="block">
                                            <span className="font-bold text-slate-900 text-lg hover:text-blue-600 transition">
                                                {client.name} {client.lastname}
                                            </span>
                                            <div className="text-slate-400 text-sm">@{client.username}</div>
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {client.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600">{client.sessionsPerWeek || '-'}</td>
                                    <td className="p-4 text-slate-600">{client.startDate || '-'}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => setEditingClient(client)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(client.id, client.isActive)}
                                            className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                                        >
                                            {client.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modals */}
                {(isCreating || editingClient) && (
                    <ClientForm
                        client={editingClient}
                        onClose={() => {
                            setIsCreating(false);
                            setEditingClient(null);
                        }}
                        onSuccess={() => {
                            setIsCreating(false);
                            setEditingClient(null);
                            router.refresh();
                        }}
                    />
                )}
            </div>
        </main>
    );
}
