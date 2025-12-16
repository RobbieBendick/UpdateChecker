// Vercel cron job endpoint
import { runUpdateChecker } from '../src/helpers/cron-job';

export default async function handler(req: any, res: any) {
  // Verify it's a cron request (optional but recommended)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await runUpdateChecker();
    return res.status(200).json({ 
      success: true, 
      message: 'Update checker completed',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

