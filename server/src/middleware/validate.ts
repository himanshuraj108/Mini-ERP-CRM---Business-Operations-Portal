import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiResponse } from '../types';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = result.error.issues.map((e: any) => ({
        field: e.path.map(String).join('.'),
        message: e.message as string,
      }));

      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        details: errors,
      };
      res.status(400).json(response);
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errors = result.error.issues.map((e: any) => ({
        field: e.path.map(String).join('.'),
        message: e.message as string,
      }));

      const response: ApiResponse = {
        success: false,
        error: 'Invalid query parameters',
        details: errors,
      };
      res.status(400).json(response);
      return;
    }

    req.query = result.data as Record<string, string>;
    next();
  };
}
