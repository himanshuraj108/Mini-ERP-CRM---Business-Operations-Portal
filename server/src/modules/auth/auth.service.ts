import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database';
import { config } from '../../config/env';
import { User, JwtPayload } from '../../types';

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateAccessToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiry as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(user: User): string {
  return jwt.sign(
    { userId: user.id },
    config.refreshTokenSecret,
    { expiresIn: config.refreshTokenExpiry as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, config.refreshTokenSecret) as { userId: string };
}

export async function findUserById(userId: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}
