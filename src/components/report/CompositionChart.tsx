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
    // 2. Calculate raw percentages
    let fatWidth = (fatKg / totalTrackedMass) * 100;
    let muscleWidth = (muscleMass / totalTrackedMass) * 100;
    let boneWidth = (boneMass / totalTrackedMass) * 100;

    // 3. Smart Layout: Enforce minimum visual width for readability
    const MIN_DISPLAY_WIDTH = 15; // Minimum % to fit text comfortably

    // Helper to distribute 'defect' (space needed) from rich segments
    const distributeDefect = (defect: number, ...segments: { val: number, set: (v: number) => void }[]) => {
        const totalRich = segments.reduce((acc, s) => acc + s.val, 0);
        segments.forEach(seg => {
            seg.set(seg.val - (seg.val / totalRich) * defect);
        });
    };

    if (boneWidth < MIN_DISPLAY_WIDTH) {
        const defect = MIN_DISPLAY_WIDTH - boneWidth;
        boneWidth = MIN_DISPLAY_WIDTH;

        // Steal space from Fat and Muscle
        const totalOther = fatWidth + muscleWidth;
        fatWidth -= (fatWidth / totalOther) * defect;
        muscleWidth -= (muscleWidth / totalOther) * defect;
    }
    // (Could add checks for other segments, but Bone is typically the only small one)

    return (
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-gray-100 shadow-xl space-y-8">
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
                        <span className="text-xl font-black text-orange-500">{Number(fatPercent).toFixed(1)}%</span>
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
                        <div className='flex items-baseline gap-0.5'>
                            <span className="text-sm font-black text-slate-500">{((boneMass / weight) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Legend / Context */}
                {/* Legend removed as requested */}
            </div>

            {/* Variable Separada: Agua */}
            {/* Variable Separada: Agua (Less Protagonic) */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100/50 text-blue-400 rounded-lg">
                        <Droplets size={16} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-blue-900/70 uppercase tracking-wider">Agua Corporal</h4>
                        <p className="text-[10px] text-blue-400/80 font-medium">Contenida en tejido magro</p>
                    </div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-blue-500/80">{Number(waterPercent).toFixed(1)}</span>
                    <span className="text-xs font-bold text-blue-400/80">%</span>
                </div>
            </div>

            <div className="px-2">
                <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                    <strong>Distribución de Peso:</strong> Gráfico de pila basado en Grasa + Músculo + Hueso. (El agua es intracelular).
                </p>
            </div>
        </div>
    );
}
