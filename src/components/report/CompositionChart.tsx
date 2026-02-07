import React from 'react';
import { Droplets } from 'lucide-react';

interface CompositionProps {
    fatPercent: number;
    muscleMass: number;
    boneMass: number;
    waterPercent: number;
    weight: number;
}

export default function CompositionChart({ fatPercent, muscleMass, boneMass, waterPercent, weight }: CompositionProps) {
    // 1. Calculate weights in kg for the stacked bar
    const fatKg = weight * (fatPercent / 100);
    // muscleMass is already in kg
    // boneMass is already in kg

    const totalTrackedMass = fatKg + muscleMass + boneMass;

    // 2. Calculate percentages relative to the TRACKED mass (to fill the bar 100%)
    // This visualizes the distribution of weight among these three tissues.
    const fatWidth = (fatKg / totalTrackedMass) * 100;
    const muscleWidth = (muscleMass / totalTrackedMass) * 100;
    const boneWidth = (boneMass / totalTrackedMass) * 100;

    return (
        <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl space-y-8">
            <div className="flex justify-between items-end">
                <h3 className="text-2xl font-bold text-plum">Composición Corporal</h3>
                {/* Optional: Add context or validation badge if needed */}
            </div>

            <div className="space-y-3">
                {/* The Stacked Bar */}
                <div className="flex h-16 w-full rounded-2xl overflow-hidden shadow-inner">
                    {/* Fat Segment */}
                    <div
                        className="bg-orange-100 flex flex-col justify-center items-center relative transition-all duration-500"
                        style={{ width: `${fatWidth}%` }}
                    >
                        <span className="text-[10px] font-bold uppercase opacity-60 text-orange-500 hidden sm:block">Grasa</span>
                        <span className="text-xl font-black text-orange-500">{fatPercent}%</span>
                    </div>

                    {/* Muscle Segment */}
                    <div
                        className="bg-emerald-100 flex flex-col justify-center items-center relative transition-all duration-500"
                        style={{ width: `${muscleWidth}%` }}
                    >
                        <span className="text-[10px] font-bold uppercase opacity-60 text-emerald-600 hidden sm:block">Músculo</span>
                        <div className='flex items-baseline gap-0.5'>
                            {/* Calculate muscle % relative to total weight for display consistency */}
                            <span className="text-xl font-black text-emerald-600">{((muscleMass / weight) * 100).toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Bone Segment */}
                    <div
                        className="bg-slate-200 flex flex-col justify-center items-center relative transition-all duration-500"
                        style={{ width: `${boneWidth}%` }}
                    >
                        <span className="text-[10px] font-bold uppercase opacity-60 text-slate-500 hidden sm:block">Hueso</span>
                        <span className="text-sm font-black text-slate-500">{boneMass}kg</span>
                    </div>
                </div>

                {/* Legend / Context */}
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    <span className="text-orange-400">Grasa ({fatKg.toFixed(1)}kg)</span>
                    <span className="text-emerald-500 text-center">Músculo ({muscleMass}kg)</span>
                    <span className="text-slate-400 text-right">Hueso</span>
                </div>
            </div>

            {/* Variable Separada: Agua */}
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-500 rounded-xl">
                        <Droplets size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider">Agua Corporal</h4>
                        <p className="text-xs text-blue-400 font-medium">Contenida en tejido magro</p>
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-blue-600">{waterPercent}</span>
                    <span className="text-sm font-bold text-blue-400">%</span>
                </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    <strong>Distribución de Peso:</strong> Gráfico de pila basado en Kg totales de Grasa + Músculo + Hueso. El agua se muestra por separado ya que es un componente intracelular.
                </p>
            </div>
        </div>
    );
}
