import CsvUploadFlow from "@/components/CsvUploadFlow";

export default function UploadPage() {
    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold text-slate-900">Import Measurements</h1>
                    <p className="mt-2 text-slate-600">Assign CSV data to existing or new clients</p>
                </header>

                <CsvUploadFlow />
            </div>
        </main>
    );
}
