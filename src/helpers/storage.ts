import * as fs from 'fs';
import * as path from 'path';
import { Redis } from '@upstash/redis';
import Logger from '../config/log';

const namespace = 'storage';

interface StoredTitles {
  valheim: string | null;
  vintageStory: string | null;
  lastUpdated: string;
}

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const STORAGE_FILE = path.join(process.cwd(), 'data', 'titles.json');
const KV_KEY = 'stored_titles';

// Initialize Redis client (only used on Vercel)
const redis = isVercel ? Redis.fromEnv() : null;

/**
 * Ensure the data directory exists (local only)
 */
function ensureDataDirectory(): void {
  if (isVercel) return;
  const dataDir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load stored titles from KV (Vercel) or file (local)
 */
export async function loadStoredTitles(): Promise<StoredTitles> {
  // On Vercel, use Upstash Redis
  if (isVercel && redis) {
    try {
      const stored = await redis.get<StoredTitles>(KV_KEY);
      if (stored) {
        Logger.info('Loaded stored titles from Redis', { namespace, stored });
        return stored;
      }
      Logger.info('No existing titles in Redis, returning defaults', {
        namespace,
      });
      return {
        valheim: null,
        vintageStory: null,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      Logger.error(`Error loading stored titles from Redis: ${error.message}`, {
        namespace,
        error,
      });
      return {
        valheim: null,
        vintageStory: null,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Local: use file system
  try {
    ensureDataDirectory();
    if (!fs.existsSync(STORAGE_FILE)) {
      Logger.info('No existing storage file found, creating new one', {
        namespace,
      });
      return {
        valheim: null,
        vintageStory: null,
        lastUpdated: new Date().toISOString(),
      };
    }

    const fileContent = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const stored = JSON.parse(fileContent) as StoredTitles;
    Logger.info('Loaded stored titles from file', { namespace, stored });
    return stored;
  } catch (error: any) {
    Logger.error(`Error loading stored titles: ${error.message}`, {
      namespace,
      error,
    });
    return {
      valheim: null,
      vintageStory: null,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Save titles to KV (Vercel) or file (local)
 */
export async function saveStoredTitles(titles: StoredTitles): Promise<void> {
  // On Vercel, use Upstash Redis
  if (isVercel && redis) {
    try {
      await redis.set(KV_KEY, titles);
      Logger.info('Saved titles to Redis', { namespace, titles });
    } catch (error: any) {
      Logger.error(`Error saving stored titles to Redis: ${error.message}`, {
        namespace,
        error,
      });
    }
    return;
  }

  // Local: save to file
  try {
    ensureDataDirectory();
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(titles, null, 2), 'utf-8');
    Logger.info('Saved titles to storage file', { namespace, titles });
  } catch (error: any) {
    Logger.error(`Error saving stored titles: ${error.message}`, {
      namespace,
      error,
    });
  }
}
