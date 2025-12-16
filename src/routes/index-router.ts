import { Router, Request, Response } from 'express';
import { runUpdateChecker } from '../helpers/cron-job';
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

// Add your routes here
// router.use('/example', exampleRouter);

export default router;
