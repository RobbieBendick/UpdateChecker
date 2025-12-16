import axios from 'axios';
import Logger from '../config/log';

const namespace = 'discord';

/**
 * Send a message to Discord via webhook
 */
async function sendDiscordWebhook(message: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    Logger.warn(
      'Discord webhook not configured - missing DISCORD_WEBHOOK_URL',
      {
        namespace,
      }
    );
    return;
  }
  try {
    await axios.post(webhookUrl, {
      content: message,
    });
    Logger.info('Discord webhook message sent successfully', { namespace });
  } catch (error: any) {
    Logger.error(`Failed to send Discord webhook: ${error.message}`, {
      namespace,
      error,
    });
  }
}

/**
 * Send update notification to Discord
 */
export async function sendUpdateNotification(
  game: string,
  newTitle: string,
  oldTitle: string | null
): Promise<void> {
  const message =
    `🆕 **${game} UPDATE DETECTED!**\n\n` +
    `**New Title:** ${newTitle}\n` +
    (oldTitle ? `**Previous Title:** ${oldTitle}\n` : '') +
    `\nCheck it out: ${
      game === 'Valheim'
        ? 'https://www.valheimgame.com/news/'
        : 'https://www.vintagestory.at/blog.html/news/'
    }`;

  await sendDiscordWebhook(message);
}

/**
 * Send a test message to Discord
 */
export async function sendDiscordMessage(message: string): Promise<void> {
  await sendDiscordWebhook(message);
}
