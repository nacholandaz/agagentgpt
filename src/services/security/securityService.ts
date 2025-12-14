import bcrypt from 'bcryptjs';
import prisma from '../../prisma.js';
import type { User } from '@prisma/client';

/**
 * Security Service
 * 
 * Handles authentication and authorization
 */

/**
 * Hashes a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifies a password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Finds user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Finds user by handle
 */
export async function findUserByHandle(handle: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { handle },
  });
}

/**
 * Validates that a user can influence a target user
 * User can only influence users at their level or lower
 */
export function canInfluence(actorLevel: number, targetLevel: number): boolean {
  return actorLevel >= targetLevel;
}

/**
 * Validates that a user can vote on a request
 */
export function canVote(
  voterLevel: number,
  targetLevel: number,
  allowedVoterMinLevel: number
): boolean {
  return voterLevel >= targetLevel && voterLevel >= allowedVoterMinLevel;
}

