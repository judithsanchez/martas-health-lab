export const dynamic = 'force-dynamic';
import { getClients } from "@/lib/actions/clients";
import ClientManager from "@/components/ClientManager";

export default async function ClientsPage() {
    const clients = await getClients();

    return (
        <div className="bg-cream min-h-screen">
            <div className="px-4 py-6 md:px-12 md:py-10 space-y-6 md:space-y-12 max-w-7xl mx-auto">
                <ClientManager clients={clients} />
            </div>
        </div>
    );
}
