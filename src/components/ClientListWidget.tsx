"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { type ClientWithLatestMeasurement } from "@/lib/actions/clients";

export function ClientListWidget({ clients }: { clients: ClientWithLatestMeasurement[] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredClients = clients.filter(client => {
        const fullName = `${client.name} ${client.lastname || ''}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) ||
            client.email?.toLowerCase().includes(search) ||
            client.name.toLowerCase().includes(search) ||
            (client.lastname && client.lastname.toLowerCase().includes(search));
    });

    return (
        <section className="space-y-6">
            <h3 className="text-2xl font-bold px-4 text-plum">Usuarios en Seguimiento ✨</h3>

            {/* Search Filter */}
            <div className="px-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl shadow-sm border border-transparent focus:border-gold focus:ring-0 outline-none transition-all placeholder:text-gray-300 text-plum"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <Link href={`/clients/${client.id}`} key={client.id} className="bg-white p-6 rounded-[2rem] flex items-center justify-between hover:shadow-xl transition-all border border-transparent hover:border-gray-100 group">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl bg-cream shadow-inner text-plum font-bold border border-sage/20">
                                    {client.name.charAt(0)}{(client.lastname ?? '').charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl mb-1 text-plum group-hover:text-gold transition-colors">{client.name} {client.lastname}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${client.latestMeasurement ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${client.latestMeasurement ? 'text-green-600' : 'text-gray-400'}`}>
                                            {client.latestMeasurement ? 'Activo' : 'Sin datos'}
                                        </span>
                                        {client.latestMeasurement && (
                                            <span className="text-xs text-gray-400 ml-2">
                                                🗓️ {new Date(client.latestMeasurement.date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Peso</div>
                                <div className="text-2xl font-bold text-plum flex items-center justify-end gap-2">
                                    {client.latestMeasurement?.weight ? `${client.latestMeasurement.weight} kg` : '--'}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-10 opacity-50">
                        <p>No se encontraron usuarios</p>
                    </div>
                )}
            </div>
        </section>
    );
}
