import { Request, Response, NextFunction } from 'express';
import { LoginInput } from './auth.schema';
import {
  findUserByEmail,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  findUserById,
} from './auth.service';
import { ApiResponse } from '../../types';
import { config } from '../../config/env';

const REFRESH_COOKIE_NAME = 'refresh_token';

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export async function login(
  req: Request<object, object, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user || !user.is_active) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password',
      };
      res.status(401).json(response);
      return;
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);

    if (!passwordMatches) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password',
      };
      res.status(401).json(response);
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login successful',
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: 'Refresh token not found',
      };
      res.status(401).json(response);
      return;
    }

    let payload: { userId: string };

    try {
      payload = verifyRefreshToken(token);
    } catch {
      const response: ApiResponse = {
        success: false,
        error: 'Refresh token is invalid or expired',
      };
      res.status(401).json(response);
      return;
    }

    const user = await findUserById(payload.userId);

    if (!user || !user.is_active) {
      const response: ApiResponse = {
        success: false,
        error: 'User not found or deactivated',
      };
      res.status(401).json(response);
      return;
    }

    const newAccessToken = generateAccessToken(user);

    const response: ApiResponse = {
      success: true,
      data: { accessToken: newAccessToken },
      message: 'Token refreshed successfully',
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });

  const response: ApiResponse = {
    success: true,
    message: 'Logged out successfully',
  };
  res.status(200).json(response);
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await findUserById(req.user!.userId);

    if (!user) {
      const response: ApiResponse = { success: false, error: 'User not found' };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
