import React from 'react';
import {
    Activity,
    Calendar,
    User,
    Ruler,
    Zap,
    Download,
    ArrowLeft
} from 'lucide-react';
import Gauge from './Gauge';

interface ReportHeaderProps {
    client: any;
    measurement: any;
    ffmi: {
        value: number;
        label: string;
        description: string;
        color: string;
    };
}

export default function ReportHeader({ client, measurement, ffmi }: ReportHeaderProps) {
    const getActivityLevelLabel = (level: number | null) => {
        if (!level) return '--';
        const labels: Record<number, string> = {
            1: 'Sedentario',
            2: 'Moderadamente activo',
            3: 'Muy activo / Atleta'
        };
        return labels[level] || `Nivel ${level}`;
    };

    // --- Gauge Controller Configuration ---
    // Adjust these variables to control the gauge appearance
    const gaugeController = {
        width: 350, // Increased width to prevent cramping
        height: 140,
        ticks: [25, 50, 75], // Partitions at 25%, 50%, 75%
        female: {
            min: 12,
            max: 30,
            unit: "kg/m²",
            markers: [
                { label: 'Bajo', val: 15, color: 'bg-indigo-500', position: { percentage: 0, radiusOffset: 25, textAnchor: 'end' } },
                { label: '', val: 18, color: 'bg-emerald-500', position: { percentage: 8, radiusOffset: 15, yOffset: -35 } },
                { label: '', val: 22, color: 'bg-amber-500', position: { percentage: 92, radiusOffset: 15, yOffset: -35 } },
                { label: 'Superior', val: 30, color: 'bg-rose-500', position: { percentage: 100, radiusOffset: 25, textAnchor: 'start' } }
            ]
        },
        male: {
            min: 12,
            max: 30,
            unit: "kg/m²",
            markers: [
                { label: 'Bajo', val: 18, color: 'bg-indigo-500', position: { percentage: 0, radiusOffset: 25, textAnchor: 'end' } },
                { label: '', val: 21, color: 'bg-emerald-500', position: { percentage: 8, radiusOffset: 15, yOffset: -35 } },
                { label: '', val: 25, color: 'bg-amber-500', position: { percentage: 92, radiusOffset: 15, yOffset: -35 } },
                { label: 'Superior', val: 30, color: 'bg-rose-500', position: { percentage: 100, radiusOffset: 25, textAnchor: 'start' } }
            ]
        }
    };

    // Select active config based on gender
    const activeConfig = client.gender === 'female' ? gaugeController.female : gaugeController.male;

    return (
        <>
            <div className="flex justify-between items-center mb-6 opacity-60">
                <button
                    onClick={() => window.history.back()}
                    className="no-pdf flex items-center gap-2 hover:text-plum transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Volver a {client.name}</span>
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span className="text-xs font-bold tracking-widest uppercase">
                            {measurement.date ? new Date(measurement.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>

                    {/* PDF Download Button - Moved here */}
                    <button
                        onClick={() => window.open(`/api/reports/${client.id}/${measurement.id}/pdf`, '_blank')}
                        className="no-pdf flex items-center gap-2 bg-plum text-white hover:bg-plum/90 px-4 py-2 rounded-full transition-all shadow-md group border border-white/10"
                        title="Descargar PDF"
                    >
                        <Download size={14} className="text-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Descargar PDF</span>
                    </button>
                </div>
            </div>

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
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-1 border border-white/20 h-fit flex flex-col items-center justify-center w-full md:w-[350px]">
                        <div className="w-full flex items-center justify-center">
                            <Gauge
                                value={ffmi.value}
                                min={activeConfig.min}
                                max={activeConfig.max}
                                unit={activeConfig.unit}
                                markers={activeConfig.markers as any} // Cast to any to avoid strict type checks on position during dev
                                ticks={gaugeController.ticks}
                                width={gaugeController.width}
                                height={gaugeController.height}
                            />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-4 text-center leading-tight">
                            Índice de Masa<br />Libre de Grasa
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
