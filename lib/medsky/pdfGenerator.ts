/**
 * PDF Generator Service
 *
 * Server-side PDF generation using Puppeteer for Medsky analysis reports.
 * Handles Korean text rendering with proper font support.
 */

import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

// Global browser instance for reuse
let browserInstance: Browser | null = null;

/**
 * Get or create browser instance
 * Reuses browser instance for better performance
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  console.log('🚀 Launching new Puppeteer browser instance...');

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  // Handle browser disconnect
  browserInstance.on('disconnected', () => {
    console.log('🔌 Browser disconnected');
    browserInstance = null;
  });

  return browserInstance;
}

/**
 * Generate PDF from HTML content
 *
 * @param html - Pre-rendered HTML content
 * @returns PDF buffer
 */
export async function generateAnalysisPDF(
  html: string
): Promise<Buffer> {
  const startTime = Date.now();
  console.log(`📄 Generating PDF...`);

  let page: Page | null = null;

  try {
    // Get browser instance
    const browser = await getBrowser();

    // Create new page
    page = await browser.newPage();

    // Set viewport to A4 size
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    });

    // Set page content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait a bit for fonts to load
    await page.evaluate(() => {
      return document.fonts.ready;
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: false, // Better for printing
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      displayHeaderFooter: false, // Disable built-in headers/footers (using custom ones in HTML)
      preferCSSPageSize: true,
      timeout: 30000,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ PDF generated successfully in ${duration}ms (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB)`);

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    throw new Error(
      `PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  } finally {
    // Close page but keep browser instance for reuse
    if (page) {
      await page.close().catch(console.error);
    }
  }
}

/**
 * Close browser instance
 * Call this on server shutdown
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    console.log('🔒 Closing Puppeteer browser instance...');
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Health check for PDF generation service
 * Tests if browser can be launched and basic PDF generation works
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent('<html><body><h1>테스트</h1></body></html>');
    const pdf = await page.pdf({ format: 'A4' });
    await page.close();
    return pdf.length > 0;
  } catch (error) {
    console.error('❌ PDF service health check failed:', error);
    return false;
  }
}
