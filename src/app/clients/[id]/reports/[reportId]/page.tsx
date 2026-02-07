export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { clients, measurements } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReportDetailView from "@/components/ReportDetailView";

async function getReportData(clientId: number, reportId: number) {
    const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    const measurement = await db.select().from(measurements).where(
        and(
            eq(measurements.id, reportId),
            eq(measurements.clientId, clientId)
        )
    ).limit(1);

    const history = await db.select()
        .from(measurements)
        .where(eq(measurements.clientId, clientId))
        .orderBy(measurements.date);

    if (!client.length || !measurement.length) return null;

    return {
        client: client[0],
        measurement: measurement[0],
        history
    };
}

export default async function ReportPage({
    params
}: {
    params: { id: string, reportId: string }
}) {
    const clientId = parseInt(params.id);
    const reportId = parseInt(params.reportId);

    if (isNaN(clientId) || isNaN(reportId)) notFound();

    const data = await getReportData(clientId, reportId);
    if (!data) notFound();

    return <ReportDetailView client={data.client} measurement={data.measurement} history={data.history} />;
}
