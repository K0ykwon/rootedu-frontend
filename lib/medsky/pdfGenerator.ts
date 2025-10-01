/**
 * PDF Generator Service
 *
 * Server-side PDF generation using Puppeteer for Medsky analysis reports.
 * Handles Korean text rendering with proper font support.
 * Optimized for serverless environments (Vercel, AWS Lambda)
 */

import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';

// Global browser instance for reuse (local development only)
let browserInstance: Browser | null = null;

/**
 * Detect if running in serverless environment
 */
function isServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.CLOUDFLARE_WORKERS
  );
}

/**
 * Get or create browser instance
 * - In serverless: Always creates fresh instance (no reuse)
 * - In local dev: Reuses instance for better performance
 */
async function getBrowser(): Promise<Browser> {
  const serverless = isServerless();

  // In serverless, always create fresh browser
  if (serverless) {
    console.log('🌐 Serverless environment detected - creating fresh browser instance');
    return createBrowser();
  }

  // In local dev, try to reuse existing browser
  if (browserInstance) {
    try {
      // Test if browser is actually connected and responsive
      const version = await browserInstance.version();
      console.log(`♻️ Reusing browser instance: ${version}`);
      return browserInstance;
    } catch (error) {
      console.log('⚠️ Existing browser instance unresponsive, creating new one');
      browserInstance = null;
    }
  }

  console.log('🚀 Creating new Puppeteer browser instance...');
  browserInstance = await createBrowser();

  // Handle browser disconnect (local dev only)
  browserInstance.on('disconnected', () => {
    console.log('🔌 Browser disconnected');
    browserInstance = null;
  });

  return browserInstance;
}

/**
 * Create new browser instance with serverless-optimized configuration
 */
async function createBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--single-process', // Better for serverless
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-color-profile=srgb',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
    ],
  });

  return browser;
}

/**
 * Generate PDF from HTML content with retry logic
 *
 * @param html - Pre-rendered HTML content
 * @param retries - Number of retry attempts (default: 3)
 * @returns PDF buffer
 */
export async function generateAnalysisPDF(
  html: string,
  retries: number = 3
): Promise<Buffer> {
  const startTime = Date.now();
  console.log(`📄 Generating PDF (${retries} retries remaining)...`);

  let page: Page | null = null;
  let browser: Browser | null = null;
  const serverless = isServerless();

  try {
    // Get browser instance
    browser = await getBrowser();

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

    // Wait for fonts to load
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
    console.error(`❌ PDF generation failed (${retries} retries left):`, error);

    // Clean up on error
    if (page) {
      await page.close().catch(() => {});
    }

    // In serverless, close browser on error (will create new one on retry)
    if (serverless && browser) {
      await browser.close().catch(() => {});
    }

    // Retry logic
    if (retries > 0) {
      console.log(`🔄 Retrying PDF generation... (${retries - 1} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      return generateAnalysisPDF(html, retries - 1);
    }

    // Final failure
    throw new Error(
      `PDF 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  } finally {
    // Close page (but keep browser for reuse in local dev)
    if (page && !page.isClosed()) {
      await page.close().catch(console.error);
    }

    // In serverless, always close browser after use
    if (serverless && browser) {
      await browser.close().catch(console.error);
    }
  }
}

/**
 * Close browser instance
 * Call this on server shutdown (local dev only, not needed in serverless)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance && !isServerless()) {
    console.log('🔒 Closing Puppeteer browser instance...');
    await browserInstance.close().catch(console.error);
    browserInstance = null;
  }
}

/**
 * Health check for PDF generation service
 * Tests if browser can be launched and basic PDF generation works
 */
export async function healthCheck(): Promise<boolean> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent('<html><body><h1>테스트</h1></body></html>');
    const pdf = await page.pdf({ format: 'A4' });

    const success = pdf.length > 0;
    console.log(`✅ PDF health check ${success ? 'passed' : 'failed'}`);

    return success;
  } catch (error) {
    console.error('❌ PDF service health check failed:', error);
    return false;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }

    // In serverless, close browser after health check
    if (isServerless() && browser) {
      await browser.close().catch(() => {});
    }
  }
}
