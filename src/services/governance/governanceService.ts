import prisma from '../../prisma.js';
import { CONFIG } from '../../config.js';
import type { User } from '@prisma/client';

export type SystemMode = 'BOOTSTRAP' | 'ACTIVE';

export interface GovernanceRules {
  mode: SystemMode;
  coreCount: number;
  canPromote: boolean;
  canDemote: boolean;
  requiredVotes: number;
}

/**
 * Governance Service
 * 
 * Handles bootstrap logic, odd Core rule, and voting requirements
 */

/**
 * Gets current system mode
 */
export async function getSystemMode(): Promise<SystemMode> {
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'system_mode' },
  });
  
  return (config?.value as SystemMode) || 'BOOTSTRAP';
}

/**
 * Sets system mode
 */
export async function setSystemMode(mode: SystemMode, updatedBy?: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key: 'system_mode' },
    create: {
      key: 'system_mode',
      value: mode,
      updatedBy,
    },
    update: {
      value: mode,
      updatedBy,
    },
  });
}

/**
 * Gets count of active Core members (Level 5)
 */
export async function getCoreCount(): Promise<number> {
  return prisma.user.count({
    where: {
      level: 5,
      isActive: true,
    },
  });
}

/**
 * Checks if Core count is odd
 */
export async function isCoreOdd(): Promise<boolean> {
  const count = await getCoreCount();
  return count % 2 === 1;
}

/**
 * Gets governance rules for a specific operation
 */
export async function getGovernanceRules(
  operation: 'promote' | 'demote',
  targetLevel: number
): Promise<GovernanceRules> {
  const mode = await getSystemMode();
  const coreCount = await getCoreCount();
  
  const isCoreOperation = targetLevel === 5;
  
  let canPromote = false;
  let canDemote = false;
  let requiredVotes = CONFIG.governance.defaultRequiredVotes;
  
  if (mode === 'BOOTSTRAP') {
    if (isCoreOperation) {
      // Bootstrap Core rules
      if (coreCount === 1) {
        // First Core member can promote second
        canPromote = operation === 'promote';
        requiredVotes = 1;
      } else if (coreCount === 2) {
        // Either Core member can nominate third
        canPromote = operation === 'promote';
        requiredVotes = 2;
      }
      // When coreCount reaches 3, system switches to ACTIVE
      canDemote = false; // No demotions during bootstrap
    } else {
      // Levels 1-4 are not enabled during bootstrap
      canPromote = false;
      canDemote = false;
    }
  } else {
    // ACTIVE mode
    if (isCoreOperation) {
      canPromote = true;
      canDemote = coreCount > 1; // Can't demote last Core member
      requiredVotes = coreCount >= 3 ? 3 : coreCount;
      
      // Odd Core rule: block single changes that would make Core even
      if (operation === 'promote' && coreCount % 2 === 0) {
        // Promoting to Core when count is even would make it odd - allowed
        canPromote = true;
      } else if (operation === 'promote' && coreCount % 2 === 1) {
        // Promoting to Core when count is odd would make it even - blocked
        canPromote = false;
      } else if (operation === 'demote' && coreCount % 2 === 0) {
        // Demoting from Core when count is even would make it odd - allowed
        canDemote = true;
      } else if (operation === 'demote' && coreCount % 2 === 1) {
        // Demoting from Core when count is odd would make it even - blocked
        canDemote = false;
      }
    } else {
      // Levels 1-4 operations
      canPromote = true;
      canDemote = true;
      requiredVotes = CONFIG.governance.defaultRequiredVotes;
    }
  }
  
  return {
    mode,
    coreCount,
    canPromote,
    canDemote,
    requiredVotes,
  };
}

/**
 * Validates if a level change is allowed
 */
export async function validateLevelChange(
  operation: 'promote' | 'demote',
  targetLevel: number,
  currentLevel: number
): Promise<{ allowed: boolean; reason?: string }> {
  const rules = await getGovernanceRules(operation, targetLevel);
  
  if (operation === 'promote') {
    if (!rules.canPromote) {
      return {
        allowed: false,
        reason: 'Promotion not allowed in current system state',
      };
    }
    
    if (targetLevel <= currentLevel) {
      return {
        allowed: false,
        reason: 'Target level must be higher than current level',
      };
    }
    
    if (targetLevel === 5 && rules.mode === 'ACTIVE') {
      // Check odd Core rule
      const coreCount = await getCoreCount();
      if (coreCount % 2 === 1) {
        return {
          allowed: false,
          reason: 'Core must remain odd. Promotion would make Core even.',
        };
      }
    }
  } else {
    // demote
    if (!rules.canDemote) {
      return {
        allowed: false,
        reason: 'Demotion not allowed in current system state',
      };
    }
    
    if (targetLevel >= currentLevel) {
      return {
        allowed: false,
        reason: 'Target level must be lower than current level',
      };
    }
    
    if (currentLevel === 5 && rules.mode === 'ACTIVE') {
      // Check odd Core rule
      const coreCount = await getCoreCount();
      if (coreCount === 1) {
        return {
          allowed: false,
          reason: 'Cannot demote the last remaining Core member',
        };
      }
      if (coreCount % 2 === 1) {
        return {
          allowed: false,
          reason: 'Core must remain odd. Demotion would make Core even.',
        };
      }
    }
  }
  
  return { allowed: true };
}

/**
 * Checks if system should switch from BOOTSTRAP to ACTIVE
 */
export async function checkBootstrapTransition(): Promise<void> {
  const mode = await getSystemMode();
  const coreCount = await getCoreCount();
  
  if (mode === 'BOOTSTRAP' && coreCount >= 3) {
    await setSystemMode('ACTIVE');
  }
}

/**
 * Applies a level change after approval
 */
export async function applyLevelChange(
  userId: string,
  fromLevel: number,
  toLevel: number,
  reason: string | null,
  requestId: string,
  changedBy: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Update user level
    await tx.user.update({
      where: { id: userId },
      data: { level: toLevel },
    });
    
    // Log to history
    await tx.userLevelHistory.create({
      data: {
        userId,
        fromLevel,
        toLevel,
        reason,
        requestId,
        changedBy,
      },
    });
    
    // Mark request as approved
    await tx.levelChangeRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        resolvedAt: new Date(),
      },
    });
    
    // Check if we need to transition to ACTIVE mode
    if (toLevel === 5) {
      const coreCount = await tx.user.count({
        where: { level: 5, isActive: true },
      });
      if (coreCount >= 3) {
        await tx.systemConfig.upsert({
          where: { key: 'system_mode' },
          create: { key: 'system_mode', value: 'ACTIVE' },
          update: { value: 'ACTIVE' },
        });
      }
    }
  });
}

