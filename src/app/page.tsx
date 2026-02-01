import { Button } from "@/components";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-bold text-primary">Marta's Lab</h1>
                <div className="flex gap-4 items-center">
                    <a href="/upload" className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition">
                        Import CSV
                    </a>
                    <Button />
                </div>
            </div>
        </main>
    );
}
