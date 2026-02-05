
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(
    request: NextRequest,
    { params }: { params: { clientId: string; reportId: string } }
) {
    try {
        const { clientId, reportId } = params;

        // Ensure we have a valid URL to visit
        // In production, this should be the full domain. For dev, localhost:3000 is fine.
        const host = request.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
        const reportUrl = `${protocol}://${host}/clients/${clientId}/reports/${reportId}`;

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Navigate to the report page
        await page.goto(reportUrl, {
            waitUntil: 'networkidle0', // Wait until network is idle (images loaded etc)
            timeout: 60000,
        });

        // Hide sidebar and scrollbars via CSS injection
        // We assume the sidebar has a generic structure to match.
        // Also hiding 'ReportHeader' navigation elements if needed, but keeping the Report Title card.
        await page.addStyleTag({
            content: `
                /* Hide Sidebar - Adjust selector based on actual Sidebar component */
                aside, nav, .sidebar-container, .no-pdf { display: none !important; }

                /* Reset Main Content Margins */
                main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
                body { overflow: visible !important; background-color: rgb(255, 252, 248) !important; }

                /* Hide scrollbars */
                ::-webkit-scrollbar { display: none; }
            `
        });

        // Calculate the full height of the body
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

        // Generate PDF
        // We set width to standard screen width (e.g., 1440px or 1200px) and height to full content
        // This creates a "pageless" feel
        const pdfBuffer = await page.pdf({
            width: '1440px',
            height: `${bodyHeight + 50}px`, // Add some padding
            printBackground: true,
            pageRanges: '1', // Only 1 "page" which is the full height
        });

        await browser.close();

        // Return PDF as response
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="report-${clientId}-${reportId}.pdf"`,
            },
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
