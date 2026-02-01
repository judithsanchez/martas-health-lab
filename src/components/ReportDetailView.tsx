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
    CheckCircle2,
    Zap as Flash,
    ArrowUpRight
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
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function ReportDetailView({
    client,
    measurement,
    history = []
}: {
    client: any,
    measurement: any,
    history?: any[]
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

    const Tooltip = ({ text }: { text: string }) => (
        <div className="group relative inline-block ml-1">
            <Info size={14} className="text-gray-300 cursor-help hover:text-plum transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-plum text-white text-[10px] rounded-lg shadow-xl z-50 leading-tight">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-plum"></div>
            </div>
        </div>
    );

    const MetricCard = ({ title, value, unit, label, description, color, icon: Icon, fullTitle }: any) => (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow group/card">
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
            <div className="flex items-center mb-1">
                <h4 className="text-gray-500 text-xs font-bold uppercase tracking-widest">{title}</h4>
                {fullTitle && <Tooltip text={fullTitle} />}
            </div>
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
            {subtitle && <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-2xl">{subtitle}</p>}
        </div>
    );

    const ProgressChart = ({ data, dataKey, color, title, unit }: any) => (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col h-[300px]">
            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">{title} ({unit})</h5>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.1} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            hide
                        />
                        <YAxis
                            hide
                            domain={['dataMin - 1', 'dataMax + 1']}
                        />
                        <RechartsTooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill={`url(#grad-${dataKey})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const HealthScale = ({ value, min, max, markers, title, unit }: any) => {
        const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
        return (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</h5>
                    <span className="text-xl font-bold text-plum">{value}<span className="text-[10px] ml-1 opacity-50">{unit}</span></span>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 left-0 h-full bg-plum transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex justify-between">
                    {markers.map((m: any, i: number) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="w-px h-1 bg-gray-300 mb-1" />
                            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

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
                        <div className="lg:col-span-2">
                            <HealthScale
                                title="Indice de Masa Corporal"
                                value={bmi.value}
                                unit="kg/m²"
                                min={15} max={40}
                                markers={[
                                    { label: 'Bajo', val: 18.5 },
                                    { label: 'Normal', val: 24.9 },
                                    { label: 'Sobrepeso', val: 29.9 },
                                    { label: 'Obeso', val: 40 }
                                ]}
                            />
                        </div>
                        <MetricCard
                            title="Índice ASMI"
                            fullTitle="Appendicular Skeletal Muscle Index (Músculo en extremidades)"
                            value={asmi.value}
                            unit="kg/m²"
                            label={asmi.label}
                            description={asmi.description}
                            color={asmi.color}
                            icon={Activity}
                        />
                        <MetricCard
                            title="Índice FFMI"
                            fullTitle="Fat-Free Mass Index (Índice de Masa Libre de Grasa)"
                            value={ffmi.value}
                            unit="kg/m²"
                            label={ffmi.label}
                            description={ffmi.description}
                            color={ffmi.color}
                            icon={Zap}
                        />
                        <div className="lg:col-span-2">
                            <HealthScale
                                title="Porcentaje de Grasa"
                                value={measurement.fatPercent}
                                unit="%"
                                min={5} max={45}
                                markers={[
                                    { label: 'Atlético', val: 13 },
                                    { label: 'Fitness', val: 17 },
                                    { label: 'Aceptable', val: 24 },
                                    { label: 'Riesgo', val: 30 }
                                ]}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <HealthScale
                                title="Grasa Visceral"
                                value={measurement.visceralFat}
                                unit="lvl"
                                min={1} max={20}
                                markers={[
                                    { label: 'Saludable', val: 9 },
                                    { label: 'Exceso', val: 12 },
                                    { label: 'Alto Riesgo', val: 15 }
                                ]}
                            />
                        </div>
                    </div>
                </section>

                {/* Section: Progress History */}
                {history.length >= 2 && (
                    <section>
                        <SectionHeader
                            title="Evolución Histórica"
                            subtitle="Seguimiento visual de tu progreso a lo largo del tiempo."
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ProgressChart
                                title="Peso"
                                data={history}
                                dataKey="weight"
                                color="#4a304b" // Plum
                                unit="kg"
                            />
                            <ProgressChart
                                title="Grasa Corporal"
                                data={history}
                                dataKey="fatPercent"
                                color="#c2a05b" // Gold
                                unit="%"
                            />
                            <ProgressChart
                                title="Masa Muscular"
                                data={history}
                                dataKey="muscleMass"
                                color="#a4b9bc" // Sage
                                unit="kg"
                            />
                        </div>
                    </section>
                )}

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
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Edad Met.</span>
                            <span className="text-xl font-bold text-plum">{measurement.metabolicAge}</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Flame className="text-plum mb-2" size={20} />
                            <div className="flex items-center mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">BMR</span>
                                <Tooltip text="Basal Metabolic Rate (Tasa Metabólica Basal)" />
                            </div>
                            <span className="text-xl font-bold text-plum">{measurement.bmr} <span className="text-[10px] font-normal opacity-50">kcal</span></span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Zap className="text-sage mb-2" size={20} />
                            <div className="flex items-center mb-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DCI</span>
                                <Tooltip text="Daily Caloric Intake (Ingesta Calórica Diaria rD)" />
                            </div>
                            <span className="text-xl font-bold text-plum">{measurement.dciKcal} <span className="text-[10px] font-normal opacity-50">kcal</span></span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                            <Scale className="text-gold mb-2" size={20} />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-center">Physique</span>
                            <span className="text-xl font-bold text-plum">{measurement.physiqueRatingScale}</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col shadow-inner bg-gray-50/30">
                            <div className="flex items-center gap-2 mb-2">
                                <User size={14} className="text-plum" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo Bio</span>
                            </div>
                            <span className="text-xs font-bold text-plum">
                                {measurement.bodyType === 1 ? 'Atleta' : 'Estándar'}
                            </span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col shadow-inner bg-gray-50/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity size={14} className="text-sage" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actividad</span>
                            </div>
                            <span className="text-xs font-bold text-plum">
                                Nivel {measurement.activityLevel || client.activityLevel || '--'}
                            </span>
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
