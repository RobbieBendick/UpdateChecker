import { Router, Request, Response } from 'express';
import { runUpdateChecker } from '../helpers/cron-job';
import { sendDiscordMessage, sendUpdateNotification } from '../helpers/discord';
import { sendResponse } from '../shared/helpers/response';

const router = Router();

// Root endpoint
router.get('/', (req: Request, res: Response) => {
  return sendResponse({
    req,
    res,
    message: 'Welcome to UpdateChecker API!',
    data: {
      version: '1.0.0',
      status: 'online',
    },
    namespace: 'index-router.root',
  });
});

// Test endpoint to manually trigger the update checker
router.get('/test', async (req: Request, res: Response) => {
  try {
    await runUpdateChecker();
    return sendResponse({
      req,
      res,
      message:
        'Update checker test completed successfully. Check console for results.',
      data: {
        timestamp: new Date().toISOString(),
      },
      namespace: 'index-router.test',
    });
  } catch (error: any) {
    return sendResponse({
      req,
      res,
      message: 'Update checker test failed',
      data: {
        error: error.message,
      },
      status: 500,
      namespace: 'index-router.test',
    });
  }
});

// Test endpoint for Discord bot
router.get('/test-discord', async (req: Request, res: Response) => {
  try {
    // Test 1: Simple message
    await sendDiscordMessage('🧪 **Test Message**\n\nThis is a test message from the UpdateChecker bot!');
    
    // Test 2: Update notification format
    await sendUpdateNotification('Valheim', 'Test Title', 'Old Test Title');
    
    return sendResponse({
      req,
      res,
      message: 'Discord test messages sent! Check your Discord channel.',
      data: {
        timestamp: new Date().toISOString(),
      },
      namespace: 'index-router.test-discord',
    });
  } catch (error: any) {
    return sendResponse({
      req,
      res,
      message: 'Discord test failed',
      data: {
        error: error.message,
      },
      status: 500,
      namespace: 'index-router.test-discord',
    });
  }
});

// Add your routes here
// router.use('/example', exampleRouter);

export default router;
