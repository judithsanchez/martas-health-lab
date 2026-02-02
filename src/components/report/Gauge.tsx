import React from 'react';

interface GaugeProps {
    value: number;
    min: number;
    max: number;
    unit: string;
    markers: { label: string; val: number }[];
}

export default function Gauge({ value, min, max, unit, markers }: GaugeProps) {
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
    const width = 280;
    const height = 130;
    const centerX = width / 2;
    const centerY = 110;

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
                    />
                    {/* Value Fill */}
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
                <div className="absolute top-[75px] left-1/2 -translate-x-1/2 flex flex-col items-center w-full">
                    <span className="text-5xl font-black leading-tight">{value}</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest -mt-1">{unit}</span>
                </div>
            </div>
        </a>
    );
}
