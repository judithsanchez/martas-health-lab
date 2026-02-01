import { getClientsWithLatestMeasurement } from "@/lib/actions/clients";
import {
    Users,
    Upload,
    Activity,
    Search,
    Bell,
    Plus,
    Calendar,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default async function Home() {
    const clients = await getClientsWithLatestMeasurement();
    const clientCount = clients.length;
    // Calculate today's measurements
    const today = new Date().toDateString();
    const measurementsToday = clients.filter(c => c.latestMeasurement && new Date(c.latestMeasurement.date).toDateString() === today).length;

    return (
        <div className="bg-cream min-h-screen">
            <header className="h-24 px-12 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-md z-10 border-b border-gray-100">
                <div>
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-40 mb-1 text-plum">Health Management</p>
                    <h2 className="text-2xl font-serif font-bold text-plum">¡Bienvenida, Marta! 👋</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 transition-all">
                        <Search size={18} className="text-sage" />
                        <input type="text" placeholder="Buscar expediente..." className="bg-transparent border-none focus:outline-none text-sm w-48 placeholder:text-slate-400 text-slate-700" />
                    </div>
                    <button className="relative w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-plum hover:text-gold transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full border border-white bg-gold"></span>
                    </button>
                </div>
            </header>

            <div className="px-12 py-10 space-y-12 max-w-7xl mx-auto">
                {/* Hero Section */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 rounded-[2.5rem] p-12 text-white shadow-xl flex items-center justify-between relative overflow-hidden bg-gradient-to-br from-plum to-[#5E3D5E]">
                        <div className="relative z-10 max-w-md">
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-white/20 uppercase mb-4">Lab Status: Optimizado</span>
                            <h3 className="text-4xl font-serif font-bold mb-4 italic">Transformando datos en salud. 🍎</h3>
                            <p className="opacity-70 mb-8 leading-relaxed text-lg">Tienes nuevas métricas para analizar hoy. ¿Empezamos?</p>
                            <Link href="/upload" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transform transition-all hover:-translate-y-1 shadow-xl bg-gold text-plum border border-transparent hover:bg-white">
                                <Plus size={20} /> Nuevo Registro
                            </Link>
                        </div>
                        {/* Abstract Shape */}
                        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 rounded-full opacity-10 border-[40px] border-gold"></div>
                    </div>

                    {/* Vitales Widget */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl flex flex-col justify-between">
                        <div>
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-plum">
                                <Activity size={20} className="text-sage" /> Vitales del Mes
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">✨</span>
                                        <span className="text-xs font-medium text-gray-500">Pacientes Lab</span>
                                    </div>
                                    <span className="font-bold text-sm text-plum">{clientCount}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📊</span>
                                        <span className="text-xs font-medium text-gray-500">Mediciones Hoy</span>
                                    </div>
                                    <span className="font-bold text-sm text-plum">{measurementsToday}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">🏆</span>
                                        <span className="text-xs font-medium text-gray-500">Data Health</span>
                                    </div>
                                    <span className="font-bold text-sm text-plum">98%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Patient List */}
                <section className="space-y-6">
                    <h3 className="text-2xl font-serif font-bold italic px-4 text-plum">Pacientes en Seguimiento ✨</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {clients.map((client) => (
                            <Link href={`/clients/${client.id}`} key={client.id} className="bg-white p-6 rounded-[2rem] flex items-center justify-between hover:shadow-xl transition-all border border-transparent hover:border-gray-100 group">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl bg-cream shadow-inner text-plum font-bold border border-sage/20">
                                        {client.name.charAt(0)}{(client.lastname ?? '').charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl mb-1 text-plum group-hover:text-gold transition-colors">{client.name} {client.lastname}</h4>
                                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            Última: {client.latestMeasurement ? new Date(client.latestMeasurement.date).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Estado</p>
                                        <span className={`font-bold ${client.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                                            {client.isActive ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    {client.latestMeasurement && (
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Peso</p>
                                            <span className="font-bold text-plum">{client.latestMeasurement.weight} kg</span>
                                        </div>
                                    )}
                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-gold transition-colors" />
                                </div>
                            </Link>
                        ))}
                        {clients.length === 0 && (
                            <p className="text-center text-slate-400 py-10">No hay pacientes registrados aún.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
