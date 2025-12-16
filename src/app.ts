import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import Logger from './config/log';
import { initializeCronJob } from './helpers/cron-job';
import bindRoutes from './routes/bind-routes';
import { ErrorResponse, sendErrorResponse } from './shared/helpers/response';
import { initializeDiscordBot } from './helpers/discord';

const namespace: string = 'app';

let app = express();

dotenv.config();

// Initialize Discord bot (only if not on Vercel, or handle Vercel differently)
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  initializeDiscordBot().catch(error => {
    Logger.error(`Failed to initialize Discord bot: ${error.message}`, {
      namespace: 'app',
    });
  });
}

// Configure CORS
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Always allow localhost for development/testing
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }

    // In development/test mode, allow all origins
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      return callback(null, true);
    }

    // In production, add your allowed origins here
    const allowedOrigins: string[] = [
      // Add your production domains here
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS before other middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Configure Helmet to work with CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(bodyParser.urlencoded({ extended: true }));

// Bind routes
bindRoutes(app);

// Initialize cron job for update checking
initializeCronJob();

// Handle unhandled rejections and exceptions
// On Vercel, we should log but not exit to allow error responses
process.on('unhandledRejection', (reason: Error | any) => {
  Logger.error(`Unhandled Rejection: ${reason}`, { namespace });
  if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
    process.exit(1);
  }
});

process.on('uncaughtException', (error: Error) => {
  Logger.error(`Uncaught Exception: ${error}`, { namespace });
  if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
    process.exit(1);
  }
});

// catch 404 and forward to error handler
app.use((req: Request, res: Response, _next: NextFunction) => {
  return sendErrorResponse({
    req,
    res,
    namespace,
    ...ErrorResponse.routeNotFound,
  });
});

// Error handler
app.use((error: any, req: Request, res: Response, _next: NextFunction) => {
  // Set locals, only providing error in development
  res.locals.message = error.message;
  res.locals.error = req.app.get('env') === 'development' ? error : {};

  return sendErrorResponse({
    req,
    res,
    namespace,
    ...ErrorResponse.internalServerError,
    stacktrace: error,
  });
});

// Set up local host (only if not running on Vercel)
// Vercel handles serverless functions, so we don't need to start a server
let server: any;
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  Logger.info('Starting server', { namespace });
  server = app.listen(
    parseInt(process.env.PORT || '3000'),
    '0.0.0.0',
    function () {
      Logger.log(
        'info',
        `Server running in ${
          process.env.NODE_ENV || 'development'
        } mode on port ${process.env.PORT || '3000'}`,
        {
          namespace,
        }
      );
    }
  );
} else {
  Logger.info('Running on Vercel - serverless mode', { namespace });
}

export { server };

export default app;
