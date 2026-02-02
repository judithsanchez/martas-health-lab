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
    calculateMFR,
    interpretVisceralFat,
    calculateBMR,
    interpretMetabolicAge,
    interpretBoneMass,
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
import ReportHeader from '@/components/report/ReportHeader';

export default function ReportDetailView({
    client,
    measurement,
    history = []
}: {
    client: any,
    measurement: any,
    history?: any[]
}) {
    // activeGroup and metricGroups removed as they are no longer used

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
    const mfr = calculateMFR(measurement.muscleMass || 0, measurement.weight, measurement.fatPercent || 0);
    const visceral = interpretVisceralFat(measurement.visceralFat || 0);

    const bmrCalc = calculateBMR(measurement.weight, measurement.height || client.height, client.age || 0, client.gender || 'male');
    const metAgeCalc = interpretMetabolicAge(measurement.metabolicAge || 0, client.age || 0);
    const boneMassCalc = interpretBoneMass(measurement.boneMass || 0, measurement.weight, client.gender || 'male');

    // Prepare chart data merging history with current measurement
    const chartData = React.useMemo(() => {
        // Create a map to avoid duplicates based on date string
        const dataMap = new Map();

        // Add history items
        history.forEach(item => {
            const dateStr = new Date(item.date).toISOString().split('T')[0];
            dataMap.set(dateStr, { ...item });
        });

        // Add/Overwrite with current measurement
        if (measurement.date) {
            const currentDateStr = new Date(measurement.date).toISOString().split('T')[0];
            dataMap.set(currentDateStr, { ...measurement });
        }

        // Convert back to array and sort
        return Array.from(dataMap.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-10) // Keep only last 10
            .map(record => ({
                ...record,
                ffmi: calculateFFMI(record.weight, record.fatPercent, record.height || client.height, client.gender).value,
                fatMassKg: Number((record.weight * (record.fatPercent / 100)).toFixed(1))
            }));
    }, [history, measurement, client.height, client.gender]);

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

    const CircularProgress = ({ value, label, subValue, subLabel, unit, color, icon: Icon }: any) => {
        const radius = 35;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (value / 100) * circumference;

        return (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 flex flex-col items-center flex-1 shadow-sm hover:shadow-md transition-shadow">
                <div className="relative mb-6">
                    <svg width="100" height="100" className="transform -rotate-90">
                        <circle
                            cx="50" cy="50" r={radius}
                            className="stroke-gray-100 fill-none"
                            strokeWidth="8"
                        />
                        <circle
                            cx="50" cy="50" r={radius}
                            className={`fill-none transition-all duration-1000 ease-out ${color}`}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-baseline items-baseline">
                            <span className="text-2xl font-black text-plum">{value}</span>
                            <span className="text-[10px] font-bold text-gray-400 ml-0.5">{unit}</span>
                        </div>
                    </div>
                </div>
                <h4 className="text-base font-bold text-plum mb-1">{label}</h4>
                {subValue && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        {subValue}{subLabel}
                    </p>
                )}
            </div>
        );
    };

    // TinyLineChart removed as requested


    const StatusRow = ({ label, value, unit, status, statusColor, icon: Icon }: any) => {
        return (
            <div className="bg-white/50 p-4 rounded-3xl flex items-center justify-between group hover:bg-white transition-all border border-transparent hover:border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-4 z-10 relative">
                    <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:shadow-md transition-shadow">
                        <Icon size={20} className="text-plum" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-plum">{value}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{unit}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 z-10 relative">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColor} bg-white shadow-sm border border-gray-50`}>
                        {status}
                    </span>
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
                <ReportHeader client={client} measurement={measurement} ffmi={{ ...ffmi, color: ffmi.color || '' }} />

                {/* Master History Chart (Option A) removed as requested */}

                {/* New Section 2: Fragmented Dashboard Layout */}
                <div className="space-y-8 mb-12">
                    {/* 1) Top Horizontal Card: Core Composition */}
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sage/10 rounded-2xl">
                                    <Activity className="text-sage" size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-plum">Composición Corporal</h3>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <CheckCircle2 size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Estándar Global</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <CircularProgress
                                label="Grasa Corporal"
                                value={measurement.fatPercent}
                                unit="%"
                                subValue={(measurement.weight * (measurement.fatPercent / 100)).toFixed(1)}
                                subLabel="KG MASA GRASA"
                                color="stroke-orange-500"
                                icon={Flame}
                            />
                            <CircularProgress
                                label="Masa Muscular"
                                value={Math.min(100, (measurement.muscleMass / measurement.weight) * 100).toFixed(1)}
                                unit="%"
                                subValue={measurement.muscleMass}
                                subLabel={`KG (${measurement.physiqueRatingScale || '--'} SCORE)`}
                                color="stroke-sage"
                                icon={Activity}
                            />
                            <CircularProgress
                                label="Hidratación"
                                value={measurement.waterPercent}
                                unit="%"
                                subValue={(measurement.weight * (measurement.waterPercent / 100)).toFixed(1)}
                                subLabel="KG AGUA TOTAL"
                                color="stroke-blue-500"
                                icon={Droplets}
                            />
                        </div>
                    </div>

                    {/* MFR Standalone Section (Horizontal Insert) */}
                    <div className="bg-gold/10 rounded-[3rem] p-10 border border-gold/20 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <TrendingUp className="text-gold" size={20} />
                            </div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-xl font-bold text-plum">Relación Músculo-Grasa (MFR)</h4>
                                <Tooltip text="Muscle-to-Fat Ratio: Indica cuántos kg de músculo tienes por cada kg de grasa. Un valor > 2.5 es saludable, > 4.0 es ideal para atletas." />
                            </div>
                        </div>

                        <HealthScale
                            title=""
                            value={mfr.value}
                            unit="ratio"
                            min={0} max={6}
                            markers={[
                                { label: 'Pobre', val: 1.5 },
                                { label: 'Aceptable', val: 2.5 },
                                { label: 'Bueno', val: 4.0 },
                                { label: 'Atlético', val: 6 }
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 2) Metabolic Health Card */}
                        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-gold/10 rounded-xl">
                                    <Zap className="text-gold" size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Salud Metabólica</h4>
                            </div>
                            <div className="flex flex-col gap-4">
                                <StatusRow
                                    label="Tasa Metabólica Basal (BMR)"
                                    value={bmrCalc.value}
                                    unit="kcal/día (calc)"
                                    status={bmrCalc.label}
                                    statusColor={bmrCalc.color}
                                    icon={Flame}
                                />
                                <StatusRow
                                    label="Ingesta Calórica (DCI)"
                                    value={measurement.dciKcal}
                                    unit="kcal/día (med)"
                                    status="SUGERIDO"
                                    statusColor="text-blue-400"
                                    icon={Zap}
                                />
                                <StatusRow
                                    label="Edad Metabólica"
                                    value={metAgeCalc.value}
                                    unit="años"
                                    status={metAgeCalc.label}
                                    statusColor={metAgeCalc.color}
                                    icon={Calendar}
                                />
                                <StatusRow
                                    label="Índice ASMI"
                                    value={asmi.value}
                                    unit="kg/m²"
                                    status={asmi.label.toUpperCase()}
                                    statusColor={asmi.color}
                                    icon={Activity}
                                // No direct history for ASMI unless calculated for all past records? 
                                // Skipping graph for inferred index for now to ensure safety.
                                />
                            </div>
                        </div>

                        {/* 3) Physical Indices Card */}
                        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-plum/10 rounded-xl">
                                    <Scale className="text-plum" size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Índices Físicos</h4>
                            </div>
                            <div className="flex flex-col gap-4">
                                <StatusRow
                                    label="Grasa Visceral"
                                    value={measurement.visceralFat}
                                    unit="Rating"
                                    status={visceral.label}
                                    statusColor={visceral.color}
                                    icon={AlertCircle}
                                    history={history}
                                    dataKey="visceralFat"
                                />
                                <StatusRow
                                    label="Masa Ósea"
                                    value={boneMassCalc.value}
                                    unit="kg"
                                    status={boneMassCalc.label}
                                    statusColor={boneMassCalc.color}
                                    icon={Dna}
                                    history={history}
                                    dataKey="boneMass"
                                />
                                <StatusRow
                                    label="Peso"
                                    value={measurement.weight}
                                    unit="kg"
                                    status="ACTUAL"
                                    statusColor="text-plum bg-plum/5 border-plum/10"
                                    icon={Weight}
                                    history={history}
                                    dataKey="weight"
                                />
                                <StatusRow
                                    label="BMI (IMC)"
                                    value={bmi.value}
                                    unit="kg/m²"
                                    status={bmi.label.toUpperCase()}
                                    statusColor={bmi.color}
                                    icon={Scale}
                                    history={history}
                                    dataKey="bmi"
                                />
                            </div>
                        </div>
                    </div>
                </div>


                {/* Section: Progress History removed as requested */}

                {/* Segmental Analysis */}
                <section className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-xl">
                    <SectionHeader
                        title="Análisis Segmental"
                        subtitle="Distribución muscular y de grasa por zonas corporales."
                    />
                    <div className="overflow-hidden bg-white/50 rounded-3xl border border-gray-100">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-plum/5 border-b border-plum/10">
                                    <th className="py-4 px-6 text-left text-xs font-bold text-plum uppercase tracking-widest">Zona</th>
                                    <th className="py-4 px-6 text-right text-xs font-bold text-sage uppercase tracking-widest">Masa Muscular (kg)</th>
                                    <th className="py-4 px-6 text-right text-xs font-bold text-gold uppercase tracking-widest">Grasa Corporal (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {[
                                    { label: 'Brazo Derecho', muscle: measurement.muscleArmRight, fat: measurement.fatArmRight },
                                    { label: 'Brazo Izquierdo', muscle: measurement.muscleArmLeft, fat: measurement.fatArmLeft },
                                    { label: 'Pierna Derecha', muscle: measurement.muscleLegRight, fat: measurement.fatLegRight },
                                    { label: 'Pierna Izquierda', muscle: measurement.muscleLegLeft, fat: measurement.fatLegLeft },
                                    { label: 'Tronco', muscle: measurement.muscleTrunk, fat: measurement.fatTrunk },
                                ].map((row, idx) => (
                                    <tr key={idx} className="hover:bg-plum/5 transition-colors">
                                        <td className="py-4 px-6 text-sm font-bold text-plum">{row.label}</td>
                                        <td className="py-4 px-6 text-right font-medium text-gray-600">{row.muscle} kg</td>
                                        <td className="py-4 px-6 text-right font-medium text-gray-600">{row.fat}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
