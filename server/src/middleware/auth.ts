import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload, User, ApiResponse } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse = {
      success: false,
      error: 'Access token is required',
    };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      const response: ApiResponse = {
        success: false,
        error: 'Access token has expired',
      };
      res.status(401).json(response);
      return;
    }

    const response: ApiResponse = {
      success: false,
      error: 'Invalid access token',
    };
    res.status(401).json(response);
  }
}

export function authorize(...roles: User['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Authentication required',
      };
      res.status(401).json(response);
      return;
    }

    if (!roles.includes(req.user.role)) {
      const response: ApiResponse = {
        success: false,
        error: 'You do not have permission to perform this action',
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
}
