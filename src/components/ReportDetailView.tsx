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
    calculateAge,
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
import CompositionChart from '@/components/report/CompositionChart';

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

    // Calculate effective age
    const effectiveAge = client.age || calculateAge(client.birthday) || 30; // Default to 30 if unknown to avoid div/0 or bad BMR

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

    const bmrCalc = calculateBMR(measurement.weight, measurement.height || client.height, effectiveAge, client.gender || 'male');
    const metAgeCalc = interpretMetabolicAge(measurement.metabolicAge || 0, effectiveAge);
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
            .map(record => {
                return {
                    ...record,
                    bmi: calculateBMI(record.weight, record.height || client.height).value,
                    visceralFat: record.visceralFat || 0,
                    boneMass: record.boneMass || 0,
                    ffmi: calculateFFMI(record.weight, record.fatPercent, record.height || client.height, client.gender).value,
                    fatMassKg: Number((record.weight * (record.fatPercent / 100)).toFixed(1))
                };
            });
    }, [history, measurement, client.height, client.gender]);

    // Find previous measurement for progress comparison
    // Find previous measurement for progress comparison
    const previousMeasurement = React.useMemo(() => {
        if (!history || history.length === 0) return null;
        // Filter out current date to ensure we compare against past
        const past = history.filter(h => {
            // Simple string comparison YYYY-MM-DD
            const hDate = new Date(h.date).toISOString().split('T')[0];
            const cDate = new Date(measurement.date).toISOString().split('T')[0];
            return hDate !== cDate;
        });
        // Sort descending by date
        return past.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [history, measurement.date]);

    // Calculate previous values if available
    const prevValues = React.useMemo(() => {
        if (!previousMeasurement) return null;
        const h = previousMeasurement.height || client.height;
        return {
            weight: previousMeasurement.weight,
            visceral: previousMeasurement.visceralFat || 0, // Raw number
            boneMass: previousMeasurement.boneMass || 0,   // Raw number
            bmi: calculateBMI(previousMeasurement.weight, h).value, // Extract value
            bmr: calculateBMR(previousMeasurement.weight, h, previousMeasurement.age || client.age || 30, client.gender || 'male').value, // Extract value
            dci: previousMeasurement.dciKcal,
            metAge: previousMeasurement.metabolicAge || 0, // Raw number
            asmi: calculateASMI(
                h,
                previousMeasurement.muscleArmLeft || 0,
                previousMeasurement.muscleArmRight || 0,
                previousMeasurement.muscleLegLeft || 0,
                previousMeasurement.muscleLegRight || 0,
                client.gender || 'male'
            ).value // Extract value
        };
    }, [previousMeasurement, client]);

    const Tooltip = ({ text }: { text: string }) => (
        <div className="group relative inline-block ml-1">
            <Info size={14} className="text-gray-300 cursor-help hover:text-plum transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-plum text-white text-[10px] rounded-lg shadow-xl z-50 leading-tight">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-plum"></div>
            </div>
        </div>
    );

    const MetricCard = ({ title, value, unit, label, description, color, icon: Icon, fullTitle, sparklineData, sparklineKey, sparklineColor }: any) => (
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow group/card relative overflow-hidden">
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className={`p-2 rounded-2xl bg-gray-50 ${color}`}>
                    <Icon size={18} />
                </div>
                {label && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gray-50 ${color}`}>
                        {label}
                    </span>
                )}
            </div>
            <div className="flex items-center mb-1 relative z-10">
                <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{title}</h4>
                {fullTitle && <Tooltip text={fullTitle} />}
            </div>
            <div className="flex items-baseline gap-1 mb-1 relative z-10">
                <span className="text-2xl font-bold text-plum">{value}</span>
                <span className="text-xs font-medium text-gray-400">{unit}</span>
            </div>

            {/* Sparkline Overlay */}
            {sparklineData && sparklineData.length >= 2 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData}>
                            <defs>
                                <linearGradient id={`grad-${sparklineKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sparklineColor || "#581c87"} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={sparklineColor || "#581c87"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey={sparklineKey}
                                stroke={sparklineColor || "#581c87"}
                                strokeWidth={2}
                                fill={`url(#grad-${sparklineKey})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            <p className="text-[10px] text-gray-400 mt-auto leading-relaxed relative z-10">{description}</p>
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
                <div
                    className="h-3 rounded-full mb-2 w-full overflow-hidden"
                    style={{
                        background: `linear-gradient(to right, #4a304b ${percentage}%, #e5e7eb ${percentage}%)`
                    }}
                />
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



    // TinyLineChart removed as requested


    const StatusRow = ({ label, value, unit, status, statusColor, icon: Icon, trend, higherIsBetter = false }: any) => {
        // Determine logic for Trend Color
        // If higherIsBetter = true: (+)=>Green, (-)=>Red
        // If higherIsBetter = false: (+)=>Red, (-)=>Green (Default, e.g. for Weight/Fat)
        let trendColor = 'text-gray-300';
        if (trend > 0) {
            trendColor = higherIsBetter ? 'text-emerald-500' : 'text-rose-400';
        } else if (trend < 0) {
            trendColor = higherIsBetter ? 'text-rose-400' : 'text-emerald-500';
        }

        return (
            <div className="bg-white/50 p-4 rounded-3xl flex items-center justify-between group hover:bg-white transition-all border border-transparent hover:border-gray-100 relative overflow-hidden">
                <div className="flex items-center gap-3 z-10 relative">
                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <Icon size={16} className="text-plum" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold text-plum">{value}</span>
                            <span className="text-[9px] text-gray-400 font-medium">{unit}</span>

                            {/* Trend Indicator */}
                            {trend !== undefined && trend !== null && !isNaN(trend) && Math.abs(trend) >= 0.1 && (
                                <div className={`flex items-center text-[9px] font-bold ${trendColor} bg-white/50 px-1.5 py-0.5 rounded-md`}>
                                    {trend > 0 ? '▲' : trend < 0 ? '▼' : '-'}
                                    <span className="ml-0.5">{Math.abs(trend).toFixed(1)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 z-10 relative">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${statusColor} bg-white shadow-sm border border-gray-50`}>
                        {status}
                    </span>
                </div>
            </div>
        );
    };

    const CustomChartTooltip = ({ active, payload, label, unit }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-xs">
                    <p className="font-bold text-gray-500 mb-1">{new Date(label).toLocaleDateString()}</p>
                    <p className="font-bold text-plum text-sm">
                        {Number(payload[0].value).toFixed(1)}
                        <span className="text-[10px] ml-0.5 text-gray-400">{unit}</span>
                    </p>
                </div>
            );
        }
        return null;
    };


    return (
        <main className="min-h-screen bg-cream pb-20">
            {/* Minimal Header */}
            <div className="px-4 md:px-12 max-w-7xl mx-auto space-y-6 md:space-y-8 mt-4">
                {/* Hero / Summary Area */}
                <ReportHeader client={{ ...client, age: effectiveAge }} measurement={measurement} ffmi={{ ...ffmi, color: ffmi.color || '' }} />

                {/* Master History Chart (Option A) removed as requested */}

                {/* New Section 2: Fragmented Dashboard Layout */}
                <div className="space-y-8 mb-12">
                    {/* 1) Top Horizontal Card: Core Composition */}
                    <CompositionChart
                        fatPercent={measurement.fatPercent || 0}
                        muscleMass={measurement.muscleMass || 0}
                        boneMass={measurement.boneMass || 0}
                        waterPercent={measurement.waterPercent || 0}
                        weight={measurement.weight}
                    />

                    {/* MFR Standalone Section (Horizontal Insert) */}
                    <div className="bg-gold/10 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gold/20 shadow-lg">
                        <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                            <div className="p-2 bg-white rounded-xl shadow-sm mt-1">
                                <TrendingUp className="text-gold" size={20} />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-plum">Relación Músculo-Grasa (MFR)</h4>
                                <p className="text-sm text-plum/70 mt-1 max-w-2xl leading-relaxed">
                                    Indica cuántos kg de músculo tienes por cada kg de grasa. Un valor &gt; 2.5 es saludable, &gt; 4.0 es ideal para atletas.
                                </p>
                            </div>
                        </div>

                        <HealthScale
                            title=""
                            value={Number(mfr.value || 0).toFixed(1)}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 2) Metabolic Health Card */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-gray-100 shadow-xl">
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
                                    trend={prevValues ? bmrCalc.value - prevValues.bmr : null}
                                    higherIsBetter={true}
                                />
                                <StatusRow
                                    label="Ingesta Calórica (DCI)"
                                    value={measurement.dciKcal}
                                    unit="kcal/día (med)"
                                    status="SUGERIDO"
                                    statusColor="text-blue-400"
                                    icon={Zap}
                                    trend={prevValues ? measurement.dciKcal - prevValues.dci : null}
                                />
                                <StatusRow
                                    label="Edad Metabólica"
                                    value={metAgeCalc.value}
                                    unit="años"
                                    status={metAgeCalc.label}
                                    statusColor={metAgeCalc.color}
                                    icon={Calendar}
                                    trend={prevValues ? metAgeCalc.value - prevValues.metAge : null}
                                    higherIsBetter={false} // Lower is better
                                />
                                <StatusRow
                                    label="Índice ASMI"
                                    value={Number(asmi.value || 0).toFixed(1)}
                                    unit="kg/m²"
                                    status={asmi.label.toUpperCase()}
                                    statusColor={asmi.color}
                                    icon={Activity}
                                    // No direct history for ASMI unless calculated for all past records? 
                                    // Skipping graph for inferred index for now to ensure safety.
                                    trend={prevValues ? asmi.value - prevValues.asmi : null}
                                    higherIsBetter={true}
                                />
                            </div>
                        </div>

                        {/* 3) Physical Indices Grid (Replaces List) */}
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-gray-100 shadow-xl">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-plum/10 rounded-xl">
                                    <Scale className="text-plum" size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Índices Físicos</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Weight Card with Sparkline */}
                                <MetricCard
                                    title="Peso"
                                    value={Number(measurement.weight || 0).toFixed(1)}
                                    unit="kg"
                                    icon={Weight}
                                    color="text-plum bg-plum/5"
                                    sparklineData={chartData}
                                    sparklineKey="weight"
                                    sparklineColor="#581c87"
                                />

                                {/* BMI Card with Sparkline */}
                                <MetricCard
                                    title="BMI (IMC)"
                                    value={bmi.value}
                                    unit="kg/m²"
                                    label={bmi.label.toUpperCase()}
                                    icon={Scale}
                                    color={bmi.color}
                                    sparklineData={chartData}
                                    sparklineKey="bmi"
                                    sparklineColor="#581c87" // Purple for BMI
                                />

                                {/* Visceral Fat Card */}
                                <MetricCard
                                    title="Grasa Visceral"
                                    value={Number(measurement.visceralFat || 0).toFixed(1)}
                                    unit="Rating"
                                    label={visceral.label}
                                    icon={AlertCircle}
                                    color={visceral.color}
                                    sparklineData={chartData}
                                    sparklineKey="visceralFat"
                                    sparklineColor="#eab308" // Gold/Yellow
                                />

                                {/* Bone Mass Card */}
                                <MetricCard
                                    title="Masa Ósea"
                                    value={Number(boneMassCalc.value || 0).toFixed(1)}
                                    unit="kg"
                                    label={boneMassCalc.label}
                                    icon={Dna}
                                    color={boneMassCalc.color}
                                    sparklineData={chartData}
                                    sparklineKey="boneMass"
                                    sparklineColor="#10b981" // Emerald
                                />
                            </div>
                        </div>
                    </div>
                </div>


                {/* Section: Progress History removed as requested */}

                {/* Side-by-Side Layout: Segmental (Left) + Charts (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-0">

                    {/* Left Column: Segmental Analysis (Clean vertical list) */}
                    <section className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-gray-100 shadow-xl h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <Activity className="text-gray-400" size={16} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Análisis Segmental</h4>
                                <p className="text-[10px] text-gray-400">Distribución muscular y de grasa</p>
                            </div>
                        </div>

                        <div className="space-y-2 flex-1 flex flex-col justify-center">
                            {/* Header Row */}
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 px-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zona</span>
                                <div className="flex items-center gap-6">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-16 text-right">Músculo</span>
                                    <div className="w-px h-0"></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-12 text-right">Grasa</span>
                                </div>
                            </div>

                            {[
                                { label: 'Brazo Derecho', muscle: measurement.muscleArmRight, fat: measurement.fatArmRight },
                                { label: 'Brazo Izquierdo', muscle: measurement.muscleArmLeft, fat: measurement.fatArmLeft },
                                { label: 'Pierna Derecha', muscle: measurement.muscleLegRight, fat: measurement.fatLegRight },
                                { label: 'Pierna Izquierda', muscle: measurement.muscleLegLeft, fat: measurement.fatLegLeft },
                                { label: 'Tronco', muscle: measurement.muscleTrunk, fat: measurement.fatTrunk },
                            ].map((row, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors rounded-lg px-2">
                                    <span className="text-xs font-bold text-gray-500">{row.label}</span>
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end w-16">
                                            <span className="text-xs font-bold text-sage">{Number(row.muscle || 0).toFixed(1)} kg</span>
                                        </div>
                                        <div className="w-px h-4 bg-gray-100"></div>
                                        <div className="flex flex-col items-end w-12">
                                            <span className="text-xs font-bold text-gold">{Number(row.fat || 0).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Right Column: History Charts (Stacked Vertically) */}
                    {history.length >= 2 ? (
                        <div className="flex flex-col gap-6 h-full">


                            {/* Muscle Chart */}
                            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Masa Muscular (kg)</h4>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10)}>
                                            <defs>
                                                <linearGradient id="colorMuscle" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} hide />
                                            <RechartsTooltip
                                                content={<CustomChartTooltip unit="kg" />}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="muscleMass"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorMuscle)"
                                                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Fat Chart */}
                            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Grasa Corporal (%)</h4>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10)}>
                                            <defs>
                                                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="date" hide />
                                            <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                                            <RechartsTooltip
                                                content={<CustomChartTooltip unit="%" />}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="fatPercent"
                                                stroke="#eab308"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorFat)"
                                                dot={{ r: 4, fill: '#eab308', strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200 text-gray-400 text-sm italic h-full">
                            No hay suficiente historial para mostrar gráficos de progreso.
                        </div>
                    )}
                </div>

            </div>
        </main>
    );
}
