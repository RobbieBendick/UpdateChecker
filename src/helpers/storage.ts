import * as fs from 'fs';
import * as path from 'path';
import Logger from '../config/log';

const namespace = 'storage';

interface StoredTitles {
  valheim: string | null;
  vintageStory: string | null;
  lastUpdated: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'data', 'titles.json');

/**
 * Ensure the data directory exists
 */
function ensureDataDirectory(): void {
  const dataDir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Load stored titles from file
 */
export function loadStoredTitles(): StoredTitles {
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
 * Save titles to file
 */
export function saveStoredTitles(titles: StoredTitles): void {
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

