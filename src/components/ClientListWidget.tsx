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
                        <Link href={`/clients/${client.id}`} key={client.id} className="bg-white p-4 md:p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between hover:shadow-xl transition-all border border-transparent hover:border-gray-100 group gap-4">
                            <div className="flex flex-col gap-4 w-full">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl flex items-center justify-center text-lg md:text-2xl bg-cream shadow-inner text-plum font-bold border border-sage/20 shrink-0">
                                        {client.name.charAt(0)}{(client.lastname ?? '').charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg md:text-xl mb-1 text-plum group-hover:text-gold transition-colors">{client.name} {client.lastname}</h4>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${client.latestMeasurement ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${client.latestMeasurement ? 'text-green-600' : 'text-gray-400'}`}>
                                                {client.latestMeasurement ? 'ACTIVO' : 'SIN DATOS'}
                                            </span>
                                            {client.latestMeasurement && (
                                                <span className="text-xs text-gray-400 ml-2">
                                                    🗓️ {new Date(client.latestMeasurement.date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {client.latestMeasurement && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Peso</div>
                                            <div className="text-sm font-bold text-plum">{Number(client.latestMeasurement.weight).toFixed(1)} kg</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">BMI</div>
                                            <div className="text-sm font-bold text-plum">{client.latestMeasurement.bmi ? Number(client.latestMeasurement.bmi).toFixed(1) : '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">% Grasa</div>
                                            <div className="text-sm font-bold text-plum">{client.latestMeasurement.fatPercent ? Number(client.latestMeasurement.fatPercent).toFixed(1) + '%' : '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Músculo</div>
                                            <div className="text-sm font-bold text-plum">{client.latestMeasurement.muscleMass ? Number(client.latestMeasurement.muscleMass).toFixed(1) + ' kg' : '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Masa Ósea</div>
                                            <div className="text-sm font-bold text-plum">{client.latestMeasurement.boneMass ? Number(client.latestMeasurement.boneMass).toFixed(1) + ' kg' : '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Visceral</div>
                                            <div className="text-sm font-bold text-plum">{client.latestMeasurement.visceralFat ?? '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">DCI</div>
                                            <div className="text-sm font-bold text-plum">{client.latestMeasurement.dciKcal ? client.latestMeasurement.dciKcal + ' kcal' : '-'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Edad Met.</div>
                                            <div className="text-sm font-bold text-plum">{client.latestMeasurement.metabolicAge ?? '-'}</div>
                                        </div>
                                    </div>
                                )}
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
