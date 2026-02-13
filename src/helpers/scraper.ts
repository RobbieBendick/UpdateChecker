import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import Logger from '../config/log';

const namespace = 'scraper';

interface ScrapeResult {
  title: string | null;
  success: boolean;
  error?: string;
}

/**
 * Scrapes Valheim news page for the first H1 with class "title"
 */
export async function scrapeValheimNews(): Promise<ScrapeResult> {
  try {
    const url = 'https://www.valheimgame.com/news/';
    Logger.info(`Fetching Valheim news from ${url}`, { namespace });

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Find first H1 with class "title"
    const titleElement = $('h1.title').first();
    const title = titleElement.text().trim();

    if (!title) {
      Logger.warn('No title found with selector h1.title', { namespace });
      return {
        title: null,
        success: false,
        error: 'Title not found',
      };
    }

    Logger.info(`Valheim title found: ${title}`, { namespace });
    return {
      title,
      success: true,
    };
  } catch (error: any) {
    Logger.error(`Error scraping Valheim news: ${error.message}`, {
      namespace,
      error,
    });
    return {
      title: null,
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Scrapes Vintage Story blog page: first news record (li.cCmsRecord_row), first <a> text only.
 * Uses only the first link label to avoid including pagination numbers (1, 2, 3...) from other <a> tags.
 * Uses Puppeteer to bypass Cloudflare protection.
 */
export async function scrapeVintageStoryNews(): Promise<ScrapeResult> {
  let browser;
  try {
    const newsUrl = 'https://www.vintagestory.at/blog.html/news/';
    Logger.info(`Fetching Vintage Story news from ${newsUrl}`, { namespace });

    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: isVercel
        ? chromium.args
        : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
          ],
      executablePath: isVercel ? await chromium.executablePath() : undefined,
    });

    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to the page and wait for content to load
    Logger.info('Navigating to Vintage Story news page...', { namespace });
    await page.goto(newsUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait a bit for any dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the page HTML
    const html = await page.content();
    await browser.close();
    browser = undefined;

    // Parse with cheerio
    const $ = cheerio.load(html);

    // Get the first news record row, then only the first <a> inside it (the title link).
    // This avoids picking up pagination links (1, 2, 3, 4, ...) which are also <a> tags.
    const firstRow = $('li.cCmsRecord_row').first();
    const titleLink = firstRow.find('a').first();
    const title = titleLink.text().trim();

    if (!title) {
      Logger.warn(
        'No title found: first li.cCmsRecord_row had no first <a>',
        { namespace }
      );
      return {
        title: null,
        success: false,
        error: 'Title not found',
      };
    }

    Logger.info(`Vintage Story title found: ${title}`, { namespace });
    return {
      title,
      success: true,
    };
  } catch (error: any) {
    // Ensure browser is closed even on error
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignore close errors
      }
    }
    Logger.error(`Error scraping Vintage Story news: ${error.message}`, {
      namespace,
      error,
    });
    return {
      title: null,
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
