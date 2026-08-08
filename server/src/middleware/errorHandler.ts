import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { config } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (config.nodeEnv === 'development') {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    console.error(err.stack);
  } else {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  }

  if ((err as NodeJS.ErrnoException).code === '23505') {
    const response: ApiResponse = {
      success: false,
      error: 'A record with this value already exists',
    };
    res.status(409).json(response);
    return;
  }

  if ((err as NodeJS.ErrnoException).code === '23503') {
    const response: ApiResponse = {
      success: false,
      error: 'Referenced record does not exist',
    };
    res.status(400).json(response);
    return;
  }

  const response: ApiResponse = {
    success: false,
    error: config.isProduction ? 'An unexpected error occurred' : err.message,
  };
  res.status(500).json(response);
}

export function notFound(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  };
  res.status(404).json(response);
}
