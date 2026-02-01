import { getMeasurements } from "@/lib/actions/clients";
import Link from 'next/link';

export default async function Home() {
    const data = await getMeasurements();

    return (
        <main className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Marta&apos;s Health Lab</h1>
                        <p className="text-slate-500">Dashboard</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/clients"
                            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition font-medium"
                        >
                            Manage Clients
                        </Link>
                        <Link
                            href="/upload"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                        >
                            Import CSV
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4 border-b">Date</th>
                                    <th className="p-4 border-b">Client</th>
                                    <th className="p-4 border-b">Weight (kg)</th>
                                    <th className="p-4 border-b">BMI</th>
                                    <th className="p-4 border-b">Fat %</th>
                                    <th className="p-4 border-b">Muscle (kg)</th>
                                    <th className="p-4 border-b">Water %</th>
                                    <th className="p-4 border-b">Bone (kg)</th>
                                    <th className="p-4 border-b">Visceral Fat</th>
                                    <th className="p-4 border-b">BMR / DCI</th>
                                    <th className="p-4 border-b">Metabolic Age</th>
                                    <th className="p-4 border-b">Physique Rating</th>
                                    <th className="p-4 border-b">Body Type</th>
                                    {/* Segmental Fat */}
                                    <th className="p-4 border-b bg-slate-50">Fat Arm R</th>
                                    <th className="p-4 border-b bg-slate-50">Fat Arm L</th>
                                    <th className="p-4 border-b bg-slate-50">Fat Leg R</th>
                                    <th className="p-4 border-b bg-slate-50">Fat Leg L</th>
                                    <th className="p-4 border-b bg-slate-50">Fat Trunk</th>
                                    {/* Segmental Muscle */}
                                    <th className="p-4 border-b bg-slate-100">Mus Arm R</th>
                                    <th className="p-4 border-b bg-slate-100">Mus Arm L</th>
                                    <th className="p-4 border-b bg-slate-100">Mus Leg R</th>
                                    <th className="p-4 border-b bg-slate-100">Mus Leg L</th>
                                    <th className="p-4 border-b bg-slate-100">Mus Trunk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={21} className="p-8 text-center text-slate-500">
                                            No measurements found. Start by importing a CSV.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition">
                                            <td className="p-4 text-slate-700 whitespace-nowrap">
                                                {new Date(row.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-medium text-slate-900">
                                                {row.clientName}
                                                <span className="block text-xs text-slate-400 font-normal">
                                                    @{row.clientUsername || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-700 font-medium">{row.weight}</td>
                                            <td className="p-4 text-slate-700">{row.bmi?.toFixed(1) ?? '-'}</td>
                                            <td className="p-4 text-slate-700">{row.fatPercent}%</td>
                                            <td className="p-4 text-slate-700">{row.muscleMass}</td>
                                            <td className="p-4 text-slate-700">{row.waterPercent}%</td>
                                            <td className="p-4 text-slate-700">{row.boneMass}</td>
                                            <td className="p-4 text-slate-700">{row.visceralFat}</td>
                                            <td className="p-4 text-slate-700">
                                                {row.bmr} / {row.dciKcal}
                                            </td>
                                            <td className="p-4 text-slate-700">{row.metabolicAge}</td>
                                            <td className="p-4 text-slate-700">{row.physiqueRatingScale ?? '-'}</td>
                                            <td className="p-4 text-slate-700">{row.bodyType === 1 ? 'Athlete' : 'Standard'}</td>

                                            {/* Segmental Fat */}
                                            <td className="p-4 text-slate-600 bg-slate-50/50">{row.fatArmRight}%</td>
                                            <td className="p-4 text-slate-600 bg-slate-50/50">{row.fatArmLeft}%</td>
                                            <td className="p-4 text-slate-600 bg-slate-50/50">{row.fatLegRight}%</td>
                                            <td className="p-4 text-slate-600 bg-slate-50/50">{row.fatLegLeft}%</td>
                                            <td className="p-4 text-slate-600 bg-slate-50/50">{row.fatTrunk}%</td>

                                            {/* Segmental Muscle */}
                                            <td className="p-4 text-slate-600 bg-slate-100/30">{row.muscleArmRight}</td>
                                            <td className="p-4 text-slate-600 bg-slate-100/30">{row.muscleArmLeft}</td>
                                            <td className="p-4 text-slate-600 bg-slate-100/30">{row.muscleLegRight}</td>
                                            <td className="p-4 text-slate-600 bg-slate-100/30">{row.muscleLegLeft}</td>
                                            <td className="p-4 text-slate-600 bg-slate-100/30">{row.muscleTrunk}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
