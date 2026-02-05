
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

        // Set viewport to A4 width at 2x scale (Retina) for sharp text/charts
        await page.setViewport({
            width: 794,
            height: 1123, // Standard A4 height, though it will expand
            deviceScaleFactor: 2,
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
                    min-height: 0 !important; /* Allow height to shrink to content */
                    overflow: visible !important; 
                    position: static !important;
                }

                /* Scale down everything to fit better in Portrait */
                body { 
                    zoom: 0.85; 
                    background-color: #f9f8f4 !important; 
                    -webkit-print-color-adjust: exact; 
                    padding-bottom: 25px !important; /* Reduced padding from 50px */
                }

                /* Specific fixes for the Header Card */
                .bg-plum {
                    padding: 1.5rem !important; /* Reduce from p-12 (3rem) to p-6 */
                    border-radius: 1.5rem !important;
                }
                
                /* title adjustments */
                h1.text-5xl { font-size: 2.5rem !important; margin-bottom: 2rem !important; }

                /* Fix activity level text wrapping */
                .text-sm { font-size: 0.8rem !important; white-space: nowrap !important; }
                
                /* Reduce gap in grid/flex layouts */
                .gap-8 { gap: 1rem !important; }
                .gap-12 { gap: 1.5rem !important; }

                /* FORCE GAUGE VISIBILITY */
                /* The gauge is hidden on mobile (hidden md:block). We must override this for PDF. */
                .hidden { display: block !important; } 
                div[class*="hidden md:block"] { display: block !important; }

                /* Fix backdrop blur and opacity issues in PDF */
                .backdrop-blur-md { backdrop-filter: none !important; background-color: rgba(255, 255, 255, 0.2) !important; }

                /* FORCE COLORS AND OPACITY FOR GAUGE */
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                
                /* Disable all transitions for PDF capture */
                * { transition: none !important; animation: none !important; }

                /* Target Gauge specific bars to ensure they are visible */
                /* Matches Tailwind opacity-80 and transition classes */
                div[class*="opacity-80"] { opacity: 1 !important; }
                div[class*="bg-black/20"] { background-color: rgba(0, 0, 0, 0.2) !important; }
                
                /* Ensure background color persists globally */
                body { background-color: #f9f8f4 !important; }

                /* Hide scrollbars */
                ::-webkit-scrollbar { display: none; }
            `
        });

        // Wait a bit for layout to settle (removed transitions should make this faster/safer)
        await new Promise(r => setTimeout(r, 1000));

        // ---------------------------------------------------------
        // SCREENSHOT-TO-PDF STRATEGY (High Fidelity)
        // ---------------------------------------------------------
        // 1. Capture the exact state of the screen/DOM as a PNG
        // We capture fullPage: true, which gives us the entire scrollable height
        const screenshotBuffer = await page.screenshot({
            fullPage: true,
            encoding: 'base64',
            type: 'png'
        });

        // 2. We need to know the aspect ratio to set the PDF height correctly.
        // The screenshot dimensions depend on the viewport we set earlier (width: 794).
        // Let's get the actual body height from the page context to be precise.
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);

        // The viewport width was 794. The screenshot height should be bodyHeight.
        // We add a little padding to be safe.
        const pdfHeight = bodyHeight + 20;

        // 3. setContent to an HTML page that just renders this image
        await page.setContent(`
            <!DOCTYPE html>
            <html>
                <body style="margin:0; padding:0; background-color: #f9f8f4;">
                    <img src="data:image/png;base64,${screenshotBuffer}" style="width:100%; height:auto; display:block;" />
                </body>
            </html>
        `);

        // 4. Print this "Image Page" to PDF with exact dimensions
        const pdfBuffer = await page.pdf({
            width: '794px',
            height: `${pdfHeight}px`, // Dynamically set height to fit the full image
            printBackground: true,
            pageRanges: '1',
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
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
