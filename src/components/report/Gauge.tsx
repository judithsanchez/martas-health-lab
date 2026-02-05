import React from 'react';

interface GaugeMarker {
    label: string;
    val: number;
    color?: string;
    position?: any; // Kept for interface compatibility but unused
}

interface GaugeProps {
    value: number;
    min: number;
    max: number;
    unit: string;
    markers: GaugeMarker[];
    ticks?: number[]; // Unused in new design
    width?: number; // Unused
    height?: number; // Unused
}

export default function Gauge({ value, min, max, unit, markers }: GaugeProps) {
    const rangeTotal = max - min;
    const percentage = Math.min(Math.max(((value - min) / rangeTotal) * 100, 0), 100);

    // Convert markers to ranges
    // Markers are assumed to be "end" points of ranges, or explicitly sorted thresholds
    // Logic: range[i] is from (previous_val or min) LOW to markers[i].val HIGH
    const ranges = markers.map((m, i, arr) => {
        const start = i === 0 ? min : arr[i - 1].val;
        const end = m.val;
        // Use provided color or default to a subtle slate if missing
        const color = m.color ? `${m.color}/20` : 'bg-slate-700/20';

        return {
            start,
            end,
            label: m.label,
            color
        };
    });

    return (
        <div className="w-full max-w-lg">
            <div className="flex justify-center items-baseline mb-2">
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white tracking-tight">{value}</span>
                    <span className="text-sm font-bold text-white/50 uppercase">{unit}</span>
                </div>
            </div>

            <div className="relative h-4 w-full bg-black/20 rounded-full overflow-hidden flex backdrop-blur-sm border border-white/5">
                {/* Background Ranges */}
                {ranges.map((r, i) => {
                    // Safe calculation for width percentage
                    const widthRaw = ((r.end - r.start) / rangeTotal) * 100;
                    const width = Math.max(0, widthRaw); // Ensure no negative widths

                    return (
                        <div
                            key={i}
                            className={`h-full ${r.color} transition-all duration-300 hover:opacity-100 opacity-80`}
                            style={{ width: `${width}%` }}
                            title={`${r.label}: ${r.start} - ${r.end}`}
                        />
                    );
                })}

                {/* Marker */}
                <div
                    className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000 ease-out rounded-full -ml-[3px]"
                    style={{ left: `${percentage}%` }}
                />
            </div>

            {/* Legend / Labels below */}
            <div className="flex justify-center mt-2 text-[10px] uppercase font-bold text-white/30 tracking-widest">
                <div className="flex justify-between w-full px-1">
                    {ranges.map((r, i) => (
                        <span key={i}>{r.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
