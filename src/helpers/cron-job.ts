import * as cron from 'node-cron';
import Logger from '../config/log';
import { scrapeValheimNews, scrapeVintageStoryNews } from './scraper';
import { loadStoredTitles, saveStoredTitles } from './storage';

const namespace = 'cron-job';

/**
 * Run the update checker task
 */
export async function runUpdateChecker(): Promise<void> {
  Logger.info('Starting update checker cron job', { namespace });

  try {
    // Load previous titles (now async)
    const stored = await loadStoredTitles();

    // Print stored titles if we have any
    if (stored.valheim || stored.vintageStory) {
      console.log('\n=== Previously Stored Titles ===');
      console.log('Valheim:', stored.valheim || 'Not available');
      console.log('Vintage Story:', stored.vintageStory || 'Not available');
      console.log('Last Updated:', stored.lastUpdated);
      console.log('================================\n');
    }

    // Scrape both websites
    const [valheimResult, vintageStoryResult] = await Promise.all([
      scrapeValheimNews(),
      scrapeVintageStoryNews(),
    ]);

    // Log the results and check for updates
    if (valheimResult.success && valheimResult.title) {
      console.log('Valheim News Title:', valheimResult.title);
      Logger.info(`Valheim title: ${valheimResult.title}`, { namespace });

      // Check if this is a new update
      if (stored.valheim && valheimResult.title !== stored.valheim) {
        const updateMessage = `🆕 VALHEIM UPDATE DETECTED! New title: "${valheimResult.title}" (Previous: "${stored.valheim}")`;
        console.log(updateMessage);
        Logger.info('Valheim update detected!', {
          namespace,
          old: stored.valheim,
          new: valheimResult.title,
        });
      } else if (!stored.valheim && valheimResult.title) {
        Logger.info('First Valheim title recorded', {
          namespace,
          title: valheimResult.title,
        });
      }
    } else {
      console.log('Valheim News Title: Failed to fetch');
      Logger.warn('Failed to fetch Valheim title', {
        namespace,
        error: valheimResult.error,
      });
    }

    if (vintageStoryResult.success && vintageStoryResult.title) {
      console.log('Vintage Story News Title:', vintageStoryResult.title);
      Logger.info(`Vintage Story title: ${vintageStoryResult.title}`, {
        namespace,
      });

      // Check if this is a new update
      if (
        stored.vintageStory &&
        vintageStoryResult.title !== stored.vintageStory
      ) {
        const updateMessage = `🆕 VINTAGE STORY UPDATE DETECTED! New title: "${vintageStoryResult.title}" (Previous: "${stored.vintageStory}")`;
        console.log(updateMessage);
        Logger.info('Vintage Story update detected!', {
          namespace,
          old: stored.vintageStory,
          new: vintageStoryResult.title,
        });
      } else if (!stored.vintageStory && vintageStoryResult.title) {
        Logger.info('First Vintage Story title recorded', {
          namespace,
          title: vintageStoryResult.title,
        });
      }
    } else {
      console.log('Vintage Story News Title: Failed to fetch');
      Logger.warn('Failed to fetch Vintage Story title', {
        namespace,
        error: vintageStoryResult.error,
      });
    }

    // Only save if titles have changed
    const valheimChanged =
      valheimResult.title !== null && valheimResult.title !== stored.valheim;
    const vintageStoryChanged =
      vintageStoryResult.title !== null &&
      vintageStoryResult.title !== stored.vintageStory;

    if (
      valheimChanged ||
      vintageStoryChanged ||
      !stored.valheim ||
      !stored.vintageStory
    ) {
      // Save current titles for next run
      const currentTitles = {
        valheim: valheimResult.title,
        vintageStory: vintageStoryResult.title,
        lastUpdated: new Date().toISOString(),
      };
      await saveStoredTitles(currentTitles); // Now async

      // Print stored titles summary
      console.log('\n=== Stored Titles Summary ===');
      console.log('Valheim:', currentTitles.valheim || 'Not available');
      console.log(
        'Vintage Story:',
        currentTitles.vintageStory || 'Not available'
      );
      console.log('Last Updated:', currentTitles.lastUpdated);
      console.log('===========================\n');

      Logger.info('Update checker completed - titles saved', {
        namespace,
        storedTitles: currentTitles,
        valheimChanged,
        vintageStoryChanged,
      });
    } else {
      console.log('\n=== No Changes Detected ===');
      console.log('Titles unchanged - storage not updated');
      console.log('===========================\n');

      Logger.info('Update checker completed - no changes', {
        namespace,
        valheim: valheimResult.title,
        vintageStory: vintageStoryResult.title,
      });
    }
  } catch (error: any) {
    Logger.error(`Error in update checker: ${error.message}`, {
      namespace,
      error,
    });
  }
}

/**
 * Initialize and start the cron job
 * Runs daily at 7:00 AM PST (15:00 UTC in standard time, 14:00 UTC in daylight time)
 * Using 15:00 UTC as default (PST is UTC-8, PDT is UTC-7)
 * Note: This will need adjustment for daylight saving time
 */
export function initializeCronJob(): void {
  // Only run cron jobs if not on Vercel (Vercel uses their own cron system)
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

  if (isVercel) {
    Logger.info(
      'Running on Vercel - cron jobs should be configured via Vercel Cron Jobs',
      { namespace }
    );
    return;
  }

  // Cron expression: 0 15 * * * = 15:00 UTC daily (7:00 AM PST)
  // For PDT (daylight time), use 0 14 * * * = 14:00 UTC (7:00 AM PDT)
  // Using 15:00 UTC for PST (standard time)
  const cronExpression = '0 15 * * *'; // 7:00 AM PST

  Logger.info(
    `Initializing cron job to run daily at 7:00 AM PST (${cronExpression} UTC)`,
    { namespace }
  );

  const task = cron.schedule(cronExpression, () => {
    runUpdateChecker();
  });

  // Run immediately on startup for testing (optional - remove if not needed)
  runUpdateChecker();

  Logger.info('Cron job initialized successfully', { namespace });
}
