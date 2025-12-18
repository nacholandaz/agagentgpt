import prisma from '../../prisma.js';
import type { User } from '@prisma/client';

/**
 * Visibility Service
 * 
 * Enforces absolute secrecy of higher levels.
 * Users can only see users with level <= their level.
 * Only Level 5 users can see emails.
 */

export interface VisibleUser {
  handle: string;
  name: string;
  email?: string; // Only if viewer is Level 5
  level: number;
}

/**
 * Filters users to only include those visible to the requester
 */
export async function getVisibleUsers(requesterLevel: number): Promise<VisibleUser[]> {
  const users = await prisma.user.findMany({
    where: {
      level: { lte: requesterLevel },
      isActive: true,
    },
    select: {
      handle: true,
      name: true,
      email: true,
      level: true,
    },
    orderBy: {
      handle: 'asc',
    },
    take: 200, // Limit results
  });

  return users.map(user => ({
    handle: user.handle,
    name: user.name,
    email: requesterLevel === 5 ? (user.email ?? undefined) : undefined,
    level: user.level,
  }));
}

/**
 * Gets a single user if visible to requester
 */
export async function getVisibleUser(
  handle: string,
  requesterLevel: number
): Promise<VisibleUser | null> {
  const user = await prisma.user.findUnique({
    where: { handle },
    select: {
      handle: true,
      name: true,
      email: true,
      level: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  if (user.level > requesterLevel) {
    return null; // User exists but is not visible
  }

  return {
    handle: user.handle,
    name: user.name,
    email: requesterLevel === 5 ? (user.email ?? undefined) : undefined,
    level: user.level,
  };
}

/**
 * Sanitizes text to remove any hints of higher levels
 * This is a conservative approach - removes any numbers that might indicate levels
 */
export function sanitizeText(text: string, requesterLevel: number): string {
  // Remove any explicit mentions of levels higher than requester
  // This is a simple implementation - can be enhanced
  let sanitized = text;
  
  // Remove patterns like "level 6", "level 7", etc. if requester is below 5
  if (requesterLevel < 5) {
    for (let level = requesterLevel + 1; level <= 10; level++) {
      const regex = new RegExp(`level\\s*${level}`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }
  }
  
  return sanitized.trim();
}

/**
 * Gets user count at or below requester's level
 * Never reveals counts of higher levels
 */
export async function getVisibleUserCount(requesterLevel: number): Promise<number> {
  return prisma.user.count({
    where: {
      level: { lte: requesterLevel },
      isActive: true,
    },
  });
}

/**
 * Gets count of users at a specific level, only if visible
 */
export async function getLevelCount(
  level: number,
  requesterLevel: number
): Promise<number | null> {
  if (level > requesterLevel) {
    return null; // Don't reveal count of higher level
  }
  
  return prisma.user.count({
    where: {
      level,
      isActive: true,
    },
  });
}

