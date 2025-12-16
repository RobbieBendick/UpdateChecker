import Logger from '../config/log';
import indexRouter from './index-router';

function routes() {
  return {
    '/': indexRouter, // Root routes
    '/api': indexRouter, // API routes
    // Add your routes here
    // '/api/example': exampleRouter,
  };
}

export default function bindRoutes(app: any) {
  const namespace = 'bind-routes.bindRoutes';
  try {
    Logger.info('Binding routes', { namespace });
    for (const [key, value] of Object.entries(routes())) {
      app.use(key, value);
    }
    Logger.info('Routes bound successfully', { namespace });
  } catch (error) {
    Logger.error(`Error binding routes: ${error}`, { namespace });
    // Don't exit on Vercel - let the function handle the error
    const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
    if (!isVercel) {
      process.exit(1);
    }
    throw error;
  }
}
