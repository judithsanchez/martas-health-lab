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
    ArrowUpRight,
    Ruler
} from 'lucide-react';
import Link from 'next/link';
import {
    calculateBMI,
    calculateASMI,
    calculateWtHR,
    calculateFFMI,
    calculateMFR,
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
    const getActivityLevelLabel = (level: number | null) => {
        if (!level) return '--';
        const labels: Record<number, string> = {
            1: 'Sedentario',
            2: 'Moderadamente activo',
            3: 'Muy activo / Atleta'
        };
        return labels[level] || `Nivel ${level}`;
    };

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

    const Gauge = ({ value, min, max, unit, markers }: { value: number, min: number, max: number, unit: string, markers: { label: string, val: number }[] }) => {
        // Segment-based scaling logic
        const calculateSegmentPercentage = (v: number) => {
            const thresholds = [min, ...markers.map(m => m.val)];
            const segmentCount = markers.length;
            const segmentWidth = 100 / segmentCount;

            for (let i = 0; i < segmentCount; i++) {
                const s = thresholds[i];
                const e = thresholds[i + 1];
                if (v <= e) {
                    const inner = (v - s) / (e - s);
                    return (i + Math.min(Math.max(inner, 0), 1)) * segmentWidth;
                }
            }
            return 100;
        };

        const percentage = calculateSegmentPercentage(value);
        const strokeWidth = 10;
        const radius = 70;
        const width = 340;
        const height = 160;
        const centerX = width / 2;
        const centerY = 130;

        const circumference = Math.PI * radius;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <a
                href="https://pubmed.ncbi.nlm.nih.gov/7496846/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center no-underline cursor-pointer group"
            >
                <div className="relative">
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                        {/* Background Path */}
                        <path
                            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.15)"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                        />
                        {/* Value Path */}
                        <path
                            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
                            fill="none"
                            stroke="white"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />

                        {/* Segment Ticks (Equally spaced at 25%, 50%, 75%) */}
                        {[25, 50, 75].map((p, i) => {
                            const angle = Math.PI + (p / 100) * Math.PI;
                            const x1 = centerX + (radius - 3) * Math.cos(angle);
                            const y1 = centerY + (radius - 3) * Math.sin(angle);
                            const x2 = centerX + (radius + 3) * Math.cos(angle);
                            const y2 = centerY + (radius + 3) * Math.sin(angle);
                            return (
                                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
                            );
                        })}

                        {/* Labels Positioning */}
                        {markers.map((m, i) => {
                            let p = 0;
                            let textAnchor: "start" | "middle" | "end" = "middle";
                            let labelRadius = radius + 25;
                            let offsetY = 0;

                            if (i === 0) {
                                p = 0; // BAJO at the very start
                                textAnchor = "end";
                                labelRadius = radius + 30;
                            } else if (i === markers.length - 1) {
                                p = 100; // SUPERIOR at the very end
                                textAnchor = "start";
                                labelRadius = radius + 30;
                            } else {
                                // PROMEDIO and EXCELENTE
                                p = i === 1 ? 8 : 92;
                                labelRadius = radius + 20;
                                offsetY = -35;
                            }

                            const angle = Math.PI + (p / 100) * Math.PI;
                            const tx = centerX + labelRadius * Math.cos(angle);
                            const ty = centerY + labelRadius * Math.sin(angle) + offsetY;

                            return (
                                <text
                                    key={i}
                                    x={tx}
                                    y={ty}
                                    textAnchor={textAnchor}
                                    className="fill-white font-bold text-[9px] uppercase tracking-wider opacity-70"
                                >
                                    {m.label}
                                </text>
                            );
                        })}
                    </svg>
                    <div className="absolute top-[95px] left-1/2 -translate-x-1/2 flex flex-col items-center w-full">
                        <span className="text-5xl font-black leading-tight">{value}</span>
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest -mt-1">{unit}</span>
                    </div>
                </div>
            </a>
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
                        <div className="flex-1">
                            <h1 className="text-5xl font-bold mb-6">{client.name} {client.lastname}</h1>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                                <div className="flex items-center gap-3">
                                    <User size={20} className="text-white/50" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Género</p>
                                        <p className="font-semibold">{client.gender === 'male' ? 'Hombre' : 'Mujer'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={20} className="text-white/50" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Edad</p>
                                        <p className="font-semibold">{client.age || '--'} años</p>
                                    </div>
                                </div>
                                {client.birthday && (
                                    <div className="flex items-center gap-3">
                                        <Calendar size={20} className="text-white/50" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Cumpleaños</p>
                                            <p className="font-semibold">
                                                {new Date(client.birthday).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Ruler size={20} className="text-white/50" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Altura</p>
                                        <p className="font-semibold">{measurement.height || client.height || '--'} cm</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Activity size={20} className="text-white/50" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Nivel de Actividad</p>
                                        <p className="font-semibold">{getActivityLevelLabel(measurement.activityLevel || client.activityLevel)}</p>
                                    </div>
                                </div>
                                {client.sessionsPerWeek && (
                                    <div className="flex items-center gap-3">
                                        <Zap size={20} className="text-white/50" />
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sesiones por semana</p>
                                            <p className="font-semibold">{client.sessionsPerWeek} sesiones</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Weight size={20} className="text-white/50" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Peso Actual</p>
                                        <p className="font-semibold">{measurement.weight} kg</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 h-fit min-w-[340px] flex flex-col items-center justify-center pt-8">
                            <Gauge
                                value={ffmi.value}
                                min={12} max={30}
                                unit="kg/m²"
                                markers={client.gender === 'female' ? [
                                    { label: 'Bajo', val: 15 },
                                    { label: 'Promedio', val: 18 },
                                    { label: 'Excelente', val: 22 },
                                    { label: 'Superior', val: 30 }
                                ] : [
                                    { label: 'Bajo', val: 18 },
                                    { label: 'Promedio', val: 21 },
                                    { label: 'Excelente', val: 25 },
                                    { label: 'Superior', val: 30 }
                                ]}
                            />
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-4 text-center leading-tight">
                                Índice de Masa<br />Libre de Grasa
                            </div>
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
                                title="Fat-Free Mass Index (FFMI)"
                                value={ffmi.value}
                                unit="kg/m²"
                                min={12} max={30}
                                markers={client.gender === 'female' ? [
                                    { label: 'Bajo', val: 15 },
                                    { label: 'Promedio', val: 18 },
                                    { label: 'Excelente', val: 22 },
                                    { label: 'Superior', val: 30 }
                                ] : [
                                    { label: 'Bajo', val: 18 },
                                    { label: 'Promedio', val: 21 },
                                    { label: 'Excelente', val: 25 },
                                    { label: 'Superior', val: 30 }
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
                                title="MFR (Muscle-to-Fat Ratio)"
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
                        <div className="lg:col-span-2">
                            <HealthScale
                                title="Grasa Visceral"
                                value={measurement.visceralFat}
                                unit="lvl"
                                min={1} max={20}
                                markers={[
                                    { label: 'Saludable', val: 12 },
                                    { label: 'Exceso', val: 15 },
                                    { label: 'Riesgo', val: 20 }
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
