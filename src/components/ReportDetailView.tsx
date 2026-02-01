"use client";

import React from 'react';
import {
    Activity,
    ArrowLeft,
    Info,
    TrendingUp,
    User,
    Calendar,
    Weight,
    Flame,
    Zap,
    Scale,
    Droplets,
    Dna,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import {
    calculateBMI,
    calculateASMI,
    calculateWtHR,
    calculateFFMI,
    interpretVisceralFat,
    CalculationResult
} from '@/lib/utils/health-calculations';

export default function ReportDetailView({
    client,
    measurement
}: {
    client: any,
    measurement: any
}) {
    // Perform calculations
    const bmi = calculateBMI(measurement.weight, measurement.height || client.height);
    const asmi = calculateASMI(
        measurement.height || client.height,
        measurement.muscleArmLeft || 0,
        measurement.muscleArmRight || 0,
        measurement.muscleLegLeft || 0,
        measurement.muscleLegRight || 0,
        client.gender || 'male'
    );
    const wthr = measurement.waist ? calculateWtHR(measurement.waist, measurement.height || client.height) : null;
    const ffmi = calculateFFMI(measurement.weight, measurement.fatPercent || 0, measurement.height || client.height, client.gender || 'male');
    const visceral = interpretVisceralFat(measurement.visceralFat || 0);

    const MetricCard = ({ title, value, unit, label, description, color, icon: Icon }: any) => (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-gray-50 ${color}`}>
                    <Icon size={24} />
                </div>
                {label && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gray-50 ${color}`}>
                        {label}
                    </span>
                )}
            </div>
            <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</h4>
            <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-plum">{value}</span>
                <span className="text-sm font-medium text-gray-400">{unit}</span>
            </div>
            <p className="text-xs text-gray-400 mt-auto leading-relaxed">{description}</p>
        </div>
    );

    const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
        <div className="mb-8">
            <h3 className="text-2xl font-bold text-plum flex items-center gap-2">
                {title}
            </h3>
            {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
    );

    return (
        <main className="min-h-screen bg-cream pb-20">
            {/* Minimal Header */}
            <div className="px-12 py-8 max-w-7xl mx-auto flex items-center justify-between">
                <Link href={`/clients/${client.id}`} className="flex items-center gap-2 text-sage hover:text-plum transition-colors font-bold text-sm">
                    <ArrowLeft size={18} /> Volver a {client.name}
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Calendar size={14} /> {new Date(measurement.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </div>

            <div className="px-12 max-w-7xl mx-auto space-y-16">
                {/* Hero / Summary Area */}
                <div className="bg-plum rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-white/20 uppercase mb-4">Reporte de Salud Clínico</span>
                            <h1 className="text-5xl font-bold mb-4">{client.name} {client.lastname}</h1>
                            <div className="flex gap-6 opacity-70">
                                <div className="flex items-center gap-2">
                                    <User size={18} /> {client.gender === 'male' ? 'Hombre' : 'Mujer'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={18} /> {measurement.height || client.height} cm
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                            <div className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Peso Actual</div>
                            <div className="text-6xl font-black">{measurement.weight}<span className="text-2xl ml-1 opacity-50">kg</span></div>
                        </div>
                    </div>
                </div>

                {/* Section 1: Clinical Insights */}
                <section>
                    <SectionHeader
                        title="Metas Clínicas y Riesgos"
                        subtitle="Indicadores avanzados de salud basados en consensos médicos internacionales."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="IMC Ajustado"
                            value={bmi.value}
                            unit="kg/m²"
                            label={bmi.label}
                            description={bmi.description}
                            color={bmi.color}
                            icon={Scale}
                        />
                        <MetricCard
                            title="Índice ASMI"
                            value={asmi.value}
                            unit="kg/m²"
                            label={asmi.label}
                            description={asmi.description}
                            color={asmi.color}
                            icon={Activity}
                        />
                        <MetricCard
                            title="Relación WtHR"
                            value={wthr?.value || '--'}
                            unit="ratio"
                            label={wthr?.label || 'Falta medida cintura'}
                            description={wthr?.description || 'Ingrese la circunferencia de cintura para ver este indicador.'}
                            color={wthr?.color || 'text-gray-300'}
                            icon={TrendingUp}
                        />
                        <MetricCard
                            title="Índice FFMI"
                            value={ffmi.value}
                            unit="kg/m²"
                            label={ffmi.label}
                            description={ffmi.description}
                            color={ffmi.color}
                            icon={Zap}
                        />
                    </div>
                </section>

                {/* Section 2: Tanita Raw Data */}
                <section>
                    <SectionHeader
                        title="Métricas de Composición"
                        subtitle="Desglose detallado de los datos capturados por la báscula Tanita."
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Droplets className="text-blue-500 mb-2" size={20} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Agua</span>
                            <span className="text-xl font-bold text-plum">{measurement.waterPercent}%</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center border-b-4 border-b-gold">
                            <Flame className="text-orange-500 mb-2" size={20} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grasa %</span>
                            <span className="text-xl font-bold text-plum">{measurement.fatPercent}%</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Activity className="text-sage mb-2" size={20} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Músculo</span>
                            <span className="text-xl font-bold text-plum">{measurement.muscleMass}kg</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Dna className="text-plum mb-2" size={20} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hueso</span>
                            <span className="text-xl font-bold text-plum">{measurement.boneMass}kg</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <AlertCircle className={visceral.color?.includes('green') ? 'text-sage' : 'text-plum'} size={20} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Visceral</span>
                            <span className="text-xl font-bold text-plum">{measurement.visceralFat}</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Calendar className="text-gold mb-2" size={20} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Edad Met.</span>
                            <span className="text-xl font-bold text-plum">{measurement.metabolicAge}</span>
                        </div>
                    </div>
                </section>

                {/* Segmental Analysis */}
                <section className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-xl">
                    <SectionHeader
                        title="Análisis Segmental"
                        subtitle="Distribución muscular y de grasa por zonas corporales."
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Muscle Map */}
                        <div className="space-y-6">
                            <h5 className="font-bold text-plum uppercase text-xs tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-sage"></div> Masa Muscular (kg)
                            </h5>
                            <div className="space-y-3">
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Brazo Derecho</span>
                                    <span className="font-bold">{measurement.muscleArmRight} kg</span>
                                </div>
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Brazo Izquierdo</span>
                                    <span className="font-bold">{measurement.muscleArmLeft} kg</span>
                                </div>
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Pierna Derecha</span>
                                    <span className="font-bold">{measurement.muscleLegRight} kg</span>
                                </div>
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Pierna Izquierda</span>
                                    <span className="font-bold">{measurement.muscleLegLeft} kg</span>
                                </div>
                                <div className="flex justify-between p-4 bg-plum text-white rounded-2xl">
                                    <span className="text-sm font-medium">Tronco</span>
                                    <span className="font-bold">{measurement.muscleTrunk} kg</span>
                                </div>
                            </div>
                        </div>

                        {/* Fat Map */}
                        <div className="space-y-6">
                            <h5 className="font-bold text-plum uppercase text-xs tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gold"></div> Grasa Corporal (%)
                            </h5>
                            <div className="space-y-3">
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Brazo Derecho</span>
                                    <span className="font-bold">{measurement.fatArmRight}%</span>
                                </div>
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Brazo Izquierdo</span>
                                    <span className="font-bold">{measurement.fatArmLeft}%</span>
                                </div>
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Pierna Derecha</span>
                                    <span className="font-bold">{measurement.fatLegRight}%</span>
                                </div>
                                <div className="flex justify-between p-4 bg-cream rounded-2xl">
                                    <span className="text-sm font-medium">Pierna Izquierda</span>
                                    <span className="font-bold">{measurement.fatLegLeft}%</span>
                                </div>
                                <div className="flex justify-between p-4 bg-gold text-plum rounded-2xl">
                                    <span className="text-sm font-medium">Tronco</span>
                                    <span className="font-bold">{measurement.fatTrunk}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
