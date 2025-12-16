import { Request, Response } from 'express';
import Logger from '../../config/log';

enum StatusCode {
  // Successful
  Ok = 200,
  Created = 201,
  NoContent = 204,

  // Errors
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  Conflict = 409,
  TooManyRequests = 429,
  InternalServerError = 500,
}

export function sendResponse({
  req,
  res,
  message,
  data,
  status = StatusCode.Ok,
  namespace,
  count,
  total,
}: {
  req: Request;
  res: Response;
  message: string;
  data?: any;
  status?: number;
  namespace?: string;
  count?: number;
  total?: number;
}) {
  const { ip } = req;
  if (namespace !== undefined) {
    Logger.info(message, { namespace, ip, status, data, count, total });
  }

  const responseBody: any = { message, data, count };
  if (total !== undefined) {
    responseBody.total = total;
  }

  return res.status(status).send(responseBody);
}

export function sendErrorResponse({
  req,
  res,
  error,
  errorMessage,
  status,
  stacktrace,
  namespace,
  validationErrors,
}: {
  req: Request;
  res: Response;
  error: string;
  errorMessage: string;
  status: number;
  stacktrace?: any;
  namespace?: string;
  validationErrors?: any;
}) {
  const { ip } = req;

  if (stacktrace !== undefined) {
    Logger.error(
      `Error: ${error}. Error message: ${errorMessage}. View full stacktrace.`,
      {
        namespace,
        ip,
        stacktrace,
      }
    );
  } else {
    Logger.warn(`Error: ${error}. Error message: ${errorMessage}`, {
      namespace,
      ip,
    });
  }
  if (validationErrors) {
    return res.status(status).send({ error, errorMessage, validationErrors });
  } else {
    return res.status(status).send({ error, errorMessage });
  }
}

export const ErrorResponse = {
  rateLimitExceeded: {
    error: 'rate_limit_exceeded',
    errorMessage: 'Rate limit exceeded',
    status: StatusCode.TooManyRequests,
  },
  internalServerError: {
    error: 'internal_sever_error',
    errorMessage: 'Internal server error',
    status: StatusCode.InternalServerError,
  },
  validationErrors: {
    error: 'validation_errors',
    errorMessage: "Validation errors: Some fields weren't filled out correctly",
    status: StatusCode.BadRequest,
  },
  unauthorized: {
    error: 'unauthorized',
    errorMessage: 'Unauthorized',
    status: StatusCode.Unauthorized,
  },
  routeNotFound: {
    error: 'route_not_found',
    errorMessage: 'Route not found',
    status: StatusCode.NotFound,
  },
};

export const ResponseInfo = {
  success: {
    message: 'Success',
    status: StatusCode.Ok,
  },
};

