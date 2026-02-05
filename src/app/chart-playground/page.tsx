"use client";

import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, BarChart, Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, Scale, Droplets } from 'lucide-react';

const DUMMY_HISTORY = Array.from({ length: 15 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (15 - i) * 7); // weekly
    return {
        date: date.toISOString().split('T')[0],
        weight: 60 + Math.random() * 2 - 1 + (i * 0.1), // slight upward trend
        muscle: 24 + Math.random() * 0.5,
        fat: 28 - (i * 0.2) + Math.random() * 0.5, // downward trend
    };
});

export default function ChartPlayground() {
    const [recordCount, setRecordCount] = useState(10);
    const data = DUMMY_HISTORY.slice(Math.max(DUMMY_HISTORY.length - recordCount, 0));

    // Rule: show last 10
    const displayData = data.slice(-10);
    const hasEnoughData = displayData.length >= 2;

    return (
        <div className="min-h-screen bg-cream p-12 space-y-12">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-plum mb-4">Progress Graph Prototypes</h1>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm inline-flex">
                    <label className="text-sm font-bold text-gray-500">Simulate Records:</label>
                    <input
                        type="range"
                        min="1"
                        max="15"
                        value={recordCount}
                        onChange={(e) => setRecordCount(Number(e.target.value))}
                        className="w-32 accent-plum"
                    />
                    <span className="font-mono font-bold text-plum">{recordCount} records</span>
                    <span className="text-xs text-gray-400">
                        (Showing {displayData.length} in graph)
                    </span>
                </div>
            </header>

            {!hasEnoughData ? (
                <div className="p-8 bg-white rounded-3xl border border-gray-200 text-center text-gray-400 italic">
                    Not enough data for graphs (Need 2+)
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* OPTION 1: Sparkline Card */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Scale size={64} className="text-plum" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Peso</h3>
                                <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                                    <TrendingDown size={12} />
                                    <span>0.4 kg</span>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-plum mb-4">
                                61.2 <span className="text-sm font-medium text-gray-400">kg</span>
                            </div>
                            {/* Sparkline */}
                            <div className="h-16 w-full opacity-50 hover:opacity-100 transition-opacity">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={displayData}>
                                        <defs>
                                            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#581c87" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#581c87" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="weight" stroke="#581c87" strokeWidth={2} fill="url(#splitColor)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* OPTION 2: Trend Overlay (Behind text) */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-20">Masa Muscular</h3>
                        <div className="relative z-20 flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-plum">24.5</span>
                            <span className="text-sm font-medium text-gray-400">kg</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-24 z-10 opacity-20 pointer-events-none">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={displayData}>
                                    <Bar dataKey="muscle" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="relative z-20 mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs">
                            <span className="text-gray-400">Tendencia (10 sem)</span>
                            <span className="font-bold text-emerald-500">+1.2%</span>
                        </div>
                    </div>

                    {/* OPTION 3: Dedicated Mini-Graph Card */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grasa Corporal</h3>
                            <div className="p-2 bg-gold/10 rounded-lg text-gold">
                                <Activity size={16} />
                            </div>
                        </div>
                        <div className="flex-1 min-h-[100px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={displayData}>
                                    <Line type="monotone" dataKey="fat" stroke="#eab308" strokeWidth={3} dot={{ r: 3, fill: '#eab308' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-2 flex justify-between items-end">
                            <span className="text-3xl font-bold text-plum">26.5<span className="text-sm text-gray-400 ml-1">%</span></span>
                        </div>
                    </div>

                </div>
            )}

            {/* OPTION 4: Main History Chart (Full Width) */}
            {hasEnoughData && (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-plum">Histórico de Progreso</h2>
                            <p className="text-xs text-gray-400 mt-1">Últimas 10 mediciones</p>
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-xl">
                            <button className="px-4 py-2 bg-white shadow-sm rounded-lg text-xs font-bold text-plum">Peso</button>
                            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-plum transition-colors">Grasa</button>
                            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-plum transition-colors">Músculo</button>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#581c87" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#581c87" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(d) => new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis
                                    domain={['dataMin - 1', 'dataMax + 1']}
                                    hide
                                />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="#581c87"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorWeight)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
