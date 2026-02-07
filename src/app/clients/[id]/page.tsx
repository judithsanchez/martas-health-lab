import { db } from "@/lib/db";
import { clients, measurements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import ClientDetailsView from "@/components/ClientDetailsView";

export const dynamic = 'force-dynamic';

// Fetch data directly in Server Component
async function getData(id: number) {
    const client = await db.select().from(clients).where(eq(clients.id, id)).limit(1);

    if (!client.length) return null;

    const history = await db.select()
        .from(measurements)
        .where(eq(measurements.clientId, id))
        .orderBy(desc(measurements.date));

    return { client: client[0], history };
}

export default async function ClientPage({ params }: { params: { id: string } }) {
    const id = parseInt(params.id);
    if (isNaN(id)) notFound();

    const data = await getData(id);
    if (!data) notFound();

    return <ClientDetailsView client={data.client} measurements={data.history} />;
}
