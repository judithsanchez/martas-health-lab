
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
                /* Hide Sidebar and elements marked no-pdf */
                aside, nav, .sidebar-container, .no-pdf { display: none !important; }

                /* Reset Main Content Margins and Height */
                html, body, main { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    width: 100% !important; 
                    height: auto !important; 
                    min-height: 100vh !important; 
                    overflow: visible !important; 
                    position: static !important;
                }

                /* Scale down everything to fit better in Portrait */
                body { 
                    zoom: 0.85; 
                    background-color: rgb(255, 252, 248) !important; 
                    -webkit-print-color-adjust: exact; 
                }

                /* Specific fixes for the Header Card */
                .bg-plum {
                    padding: 1.5rem !important; /* Reduce from p-12 (3rem) to p-6 */
                    border-radius: 1.5rem !important;
                }
                
                /* title adjustments */
                h1.text-5xl { font-size: 2.5rem !important; margin-bottom: 0.5rem !important; }

                /* Fix activity level text wrapping */
                .text-sm { font-size: 0.8rem !important; white-space: nowrap !important; }
                
                /* Reduce gap in grid/flex layouts */
                .gap-8 { gap: 1rem !important; }
                .gap-12 { gap: 1.5rem !important; }

                /* FORCE GAUGE VISIBILITY */
                /* The gauge is hidden on mobile (hidden md:block). We must override this for PDF. */
                .hidden { display: block !important; } 
                div[class*="hidden md:block"] { display: block !important; }

                /* Fix backdrop blur issues in PDF */
                .backdrop-blur-md { backdrop-filter: none !important; background-color: rgba(255, 255, 255, 0.2) !important; }

                /* Ensure background color persists */
                body { -webkit-print-color-adjust: exact; }

                /* Hide scrollbars */
                ::-webkit-scrollbar { display: none; }
            `
        });

        // Wait a bit for layout to adjust after style injection
        await new Promise(r => setTimeout(r, 1500));

        // Calculate the full height of the content
        // Since we removed overflow constraints, body/html should now be full height
        const bodyHeight = await page.evaluate(() => {
            return Math.max(
                document.body.scrollHeight,
                document.body.offsetHeight,
                document.documentElement.clientHeight,
                document.documentElement.scrollHeight,
                document.documentElement.offsetHeight
            );
        });

        // Generate PDF
        // We set width to standard A4 width (794px at 96dpi) to force "Portrait" layout (vertical stack)
        // and height to full content to make it "pageless"
        const pdfBuffer = await page.pdf({
            width: '794px',
            height: `${bodyHeight + 40}px`, // Add some padding
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
