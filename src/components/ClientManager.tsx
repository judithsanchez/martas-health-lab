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
    const [searchTerm, setSearchTerm] = useState("");

    const filteredClients = clients.filter(client => {
        const term = searchTerm.toLowerCase();
        return client.name.toLowerCase().includes(term) ||
            (client.lastname && client.lastname.toLowerCase().includes(term)) ||
            (client.username && client.username.toLowerCase().includes(term));
    });

    async function handleToggleStatus(id: number, currentStatus: boolean) {
        if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this client?`)) {
            await toggleClientStatus(id, !currentStatus);
            router.refresh();
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
        <main>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-plum">Manage Clients</h1>
                    <p className="text-plum/60 mt-1">{clients.length} Total Clients</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link
                        href="/"
                        className="flex-1 md:flex-none px-6 py-3 border border-plum/10 text-plum rounded-2xl hover:bg-white hover:shadow-md transition font-medium text-center"
                    >
                        Dashboard
                    </Link>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex-1 md:flex-none px-6 py-3 bg-gold text-plum rounded-2xl hover:bg-white hover:shadow-xl transition font-bold shadow-md"
                    >
                        + New Client
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-8 shadow-xl border border-gray-100">
                {/* Search Bar */}
                <div className="mb-6 md:mb-8 max-w-md">
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 pl-6 pr-4 py-4 rounded-2xl border border-transparent focus:border-gold focus:ring-0 outline-none transition-all placeholder:text-gray-400 text-plum"
                    />
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden space-y-4">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-cream flex items-center justify-center text-plum font-bold shadow-inner border border-sage/10 shrink-0">
                                    {client.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-plum text-lg">{client.name} {client.lastname}</div>
                                    <div className="text-gray-400 text-xs font-medium">@{client.username}</div>
                                </div>
                                <span className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {client.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div className="bg-white p-3 rounded-xl">
                                    <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">Sessions/Wk</span>
                                    <span className="font-bold text-plum">{client.sessionsPerWeek || '-'}</span>
                                </div>
                                <div className="bg-white p-3 rounded-xl">
                                    <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">Start Date</span>
                                    <span className="font-bold text-plum">{client.startDate || '-'}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingClient(client)}
                                    className="flex-1 py-2 text-sm font-bold text-plum bg-white rounded-xl border border-gray-200 hover:border-gold hover:text-gold transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(client.id, client.isActive)}
                                    className="flex-1 py-2 text-sm font-medium text-gray-500 bg-white rounded-xl border border-gray-200 hover:text-plum transition-colors"
                                >
                                    {client.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id)}
                                    className="px-4 py-2 text-sm font-bold text-red-500 bg-white rounded-xl border border-gray-200 hover:bg-red-50 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="py-4 pl-4 font-bold text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">Client</th>
                                <th className="py-4 font-bold text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">Status</th>
                                <th className="py-4 font-bold text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">Sessions/Wk</th>
                                <th className="py-4 font-bold text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100">Start Date</th>
                                <th className="py-4 pr-4 font-bold text-xs uppercase tracking-widest text-gray-400 border-b border-gray-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="py-6 pl-4">
                                        <Link href={`/clients/${client.id}`} className="flex items-center gap-4 group-hover:translate-x-1 transition-transform">
                                            <div className="w-12 h-12 rounded-2xl bg-cream flex items-center justify-center text-plum font-bold shadow-inner border border-sage/10">
                                                {client.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-plum text-lg">{client.name} {client.lastname}</div>
                                                <div className="text-gray-400 text-xs font-medium">@{client.username}</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="py-6">
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {client.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-6 text-plum font-medium">{client.sessionsPerWeek || '-'}</td>
                                    <td className="py-6 text-plum font-medium">{client.startDate || '-'}</td>
                                    <td className="py-6 pr-4 text-right space-x-3">
                                        <button
                                            onClick={() => setEditingClient(client)}
                                            className="text-plum/70 hover:text-gold font-bold text-sm transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(client.id, client.isActive)}
                                            className="text-gray-400 hover:text-plum font-medium text-sm transition-colors"
                                        >
                                            {client.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            className="text-red-400 hover:text-red-600 font-medium text-sm transition-colors ml-2"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredClients.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            No clients found matching &quot;{searchTerm}&quot;
                        </div>
                    )}
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
