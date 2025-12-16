import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import Logger from '../config/log';

const namespace = 'discord';

let client: Client | null = null;
let channel: TextChannel | null = null;

/**
 * Initialize Discord bot client
 */
export async function initializeDiscordBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    Logger.warn('Discord bot not configured - missing token or channel ID', {
      namespace,
    });
    return;
  }

  try {
    client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    await client.login(token);

    client.once('ready', async () => {
      Logger.info('Discord bot logged in successfully', { namespace });

      // Get the channel
      const fetchedChannel = await client!.channels.fetch(channelId);
      if (fetchedChannel && fetchedChannel.isTextBased()) {
        channel = fetchedChannel as TextChannel;
        Logger.info('Discord channel ready', { namespace, channelId });
      } else {
        Logger.error('Discord channel not found or not a text channel', {
          namespace,
          channelId,
        });
      }
    });

    client.on('error', (error: unknown) => {
      Logger.error(`Discord bot error: ${(error as Error).message}`, {
        namespace,
        error: error as Error,
      });
    });
  } catch (error: any) {
    Logger.error(`Failed to initialize Discord bot: ${error.message}`, {
      namespace,
      error,
    });
  }
}

/**
 * Send a message to Discord channel
 */
export async function sendDiscordMessage(message: string): Promise<void> {
  if (!channel) {
    Logger.warn('Discord channel not available, skipping message', {
      namespace,
    });
    return;
  }

  try {
    await channel.send(message);
    Logger.info('Discord message sent successfully', { namespace });
  } catch (error: any) {
    Logger.error(`Failed to send Discord message: ${error.message}`, {
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

  await sendDiscordMessage(message);
}
