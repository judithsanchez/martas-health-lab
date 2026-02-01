import { getClients } from "@/lib/actions/clients";
import ClientManager from "@/components/ClientManager";

export default async function ClientsPage() {
    const clients = await getClients();

    return <ClientManager clients={clients} />;
}
