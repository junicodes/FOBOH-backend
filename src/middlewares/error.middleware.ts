import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  console.error('[ERROR]', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): Response => {
  return res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};
