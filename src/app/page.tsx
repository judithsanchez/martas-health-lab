import { getClientsWithLatestMeasurement } from "@/lib/actions/clients";
import Link from 'next/link';

export default async function Home() {
    const clients = await getClientsWithLatestMeasurement();

    return (
        <main className="min-h-screen bg-cream p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-plum">Dashboard</h1>
                        <p className="text-sage font-medium mt-1">Client Progress Overview</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clients.map((client) => {
                        const latest = client.latestMeasurement;
                        const trends = client.trends;

                        return (
                            <Link
                                href={`/clients/${client.id}`}
                                key={client.id}
                                className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md hover:border-gold transition duration-200 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-plum group-hover:bg-gold transition-colors"></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-plum transition-colors">{client.name} {client.lastname}</h2>
                                        <p className="text-sm text-slate-500">@{client.username}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {client.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2 bg-cream rounded-lg">
                                        <span className="text-sm font-medium text-slate-600">Weight</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-plum">{latest?.weight ?? '-'} kg</span>
                                            {trends.weight === 'up' && <span className="text-red-500 text-xs">▲</span>}
                                            {trends.weight === 'down' && <span className="text-green-500 text-xs">▼</span>}
                                            {trends.weight === 'stable' && <span className="text-slate-400 text-xs">−</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-cream rounded-lg">
                                        <span className="text-sm font-medium text-slate-600">Body Fat</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-plum">{latest?.fatPercent ?? '-'}%</span>
                                            {trends.fatPercent === 'up' && <span className="text-red-500 text-xs">▲</span>}
                                            {trends.fatPercent === 'down' && <span className="text-green-500 text-xs">▼</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-cream rounded-lg">
                                        <span className="text-sm font-medium text-slate-600">Muscle</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-plum">{latest?.muscleMass ?? '-'} kg</span>
                                            {trends.muscleMass === 'up' && <span className="text-green-500 text-xs">▲</span>}
                                            {trends.muscleMass === 'down' && <span className="text-red-500 text-xs">▼</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                    <span>Last Update: {latest ? new Date(latest.date).toLocaleDateString() : 'Never'}</span>
                                    <span className="group-hover:translate-x-1 transition-transform text-gold font-medium">View Details →</span>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Add Client Card */}
                    <Link
                        href="/clients"
                        className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-gold hover:text-gold hover:bg-cream/50 transition duration-200 min-h-[300px]"
                    >
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                            <span className="text-2xl font-light">+</span>
                        </div>
                        <span className="font-medium">Manage Clients</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}
