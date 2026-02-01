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
                    <Link
                        href="/upload"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                    >
                        Import CSV
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="p-4 border-b">Date</th>
                                    <th className="p-4 border-b">Client</th>
                                    <th className="p-4 border-b">Weight (kg)</th>
                                    <th className="p-4 border-b">Fat %</th>
                                    <th className="p-4 border-b">Muscle (kg)</th>
                                    <th className="p-4 border-b">Visceral Fat</th>
                                    <th className="p-4 border-b">Metabolic Age</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-500">
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
                                            <td className="p-4 text-slate-700">{row.weight}</td>
                                            <td className="p-4 text-slate-700">{row.fatPercent}</td>
                                            <td className="p-4 text-slate-700">{row.muscleMass}</td>
                                            <td className="p-4 text-slate-700">{row.visceralFat}</td>
                                            <td className="p-4 text-slate-700">{row.metabolicAge}</td>
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
