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
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ClientListWidget } from "@/components/ClientListWidget";

export default async function Home() {
    const clients = await getClientsWithLatestMeasurement();
    const activeClientsCount = clients.filter(c => c.isActive).length;

    // Calculate measurements this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const measurementsThisMonthCount = clients.filter(c =>
        c.latestMeasurement && new Date(c.latestMeasurement.date) >= startOfMonth
    ).length;

    return (
        <div className="bg-cream min-h-screen">
            <div className="px-12 py-10 space-y-12 max-w-7xl mx-auto">
                <div>
                    <h2 className="text-2xl font-bold text-plum">¡Bienvenida, Marta! 👋</h2>
                </div>
                {/* Hero Section */}
                <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 rounded-[2.5rem] p-10 text-white shadow-xl flex items-center justify-between relative overflow-hidden bg-gradient-to-br from-plum to-[#5E3D5E]">
                        <div className="relative z-10 max-w-md">
                            <h3 className="text-4xl font-bold mb-4">Transformando datos en salud. 🍎</h3>
                            <p className="opacity-70 mb-8 leading-relaxed text-lg">Tienes nuevas métricas para analizar hoy. ¿Empezamos?</p>
                            <Link href="/upload" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transform transition-all hover:-translate-y-1 shadow-xl bg-gold text-plum border border-transparent hover:bg-white">
                                <Plus size={20} /> Nuevo Registro
                            </Link>
                        </div>
                        {/* Abstract Shape */}
                        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 rounded-full opacity-10 border-[40px] border-gold"></div>
                    </div>

                    {/* Vitales Widget */}
                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl flex flex-col justify-between">
                        <div>
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-plum">
                                <Activity size={20} className="text-sage" /> Vitales del Mes
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">✨</span>
                                        <span className="text-xs font-medium text-gray-500">Usuarios Activos</span>
                                    </div>
                                    <span className="font-bold text-sm text-plum">{activeClientsCount}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">📊</span>
                                        <span className="text-xs font-medium text-gray-500">Mediciones del mes</span>
                                    </div>
                                    <span className="font-bold text-sm text-plum">{measurementsThisMonthCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filters & Patient List Widget */}
                <ClientListWidget clients={clients} />
            </div>
        </div>
    );
}
