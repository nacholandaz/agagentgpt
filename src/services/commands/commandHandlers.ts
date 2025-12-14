import prisma from '../../prisma.js';
import { CONFIG } from '../../config.js';
import { nanoid } from 'nanoid';
import type { User } from '@prisma/client';
import type { ParsedCommand } from './commandParser.js';
import {
  getVisibleUsers,
  getVisibleUser,
  getVisibleUserCount,
} from '../visibility/visibilityService.js';
import {
  getSystemMode,
  getCoreCount,
  getGovernanceRules,
  validateLevelChange,
  checkBootstrapTransition,
} from '../governance/governanceService.js';
import {
  sendCommandResponse,
  sendErrorEmail,
  sendInviteEmail,
} from '../email/emailService.js';
import {
  findUserByHandle,
  canInfluence,
  canVote,
} from '../security/securityService.js';

/**
 * Command Handlers
 * 
 * Each handler processes a command and sends a response email
 */

export async function handleME(user: User): Promise<string> {
  const visibleUsers = await getVisibleUsers(user.level);
  const inviteeCount = await prisma.invite.count({
    where: {
      inviterId: user.id,
      isUsed: true,
    },
  });
  
  let response = `Your Information:
Handle: @${user.handle}
Name: ${user.name}
Level: ${user.level}`;
  
  if (user.invitedBy) {
    response += `\nInvited by: @${user.invitedBy}`;
  }
  
  response += `\nInvitees: ${inviteeCount}`;
  
  // Don't reveal any information about higher levels
  const visibleCount = await getVisibleUserCount(user.level);
  response += `\n\nVisible users: ${visibleCount}`;
  
  return response;
}

export async function handleLIST(user: User): Promise<string> {
  const visibleUsers = await getVisibleUsers(user.level);
  
  if (visibleUsers.length === 0) {
    return 'No users found.';
  }
  
  let response = `Users (${visibleUsers.length}):\n\n`;
  
  for (const visibleUser of visibleUsers) {
    response += `@${visibleUser.handle} - ${visibleUser.name} (Level ${visibleUser.level})`;
    if (user.level === 5 && visibleUser.email) {
      response += ` - ${visibleUser.email}`;
    }
    response += '\n';
  }
  
  return response;
}

export async function handleINVITE(
  user: User,
  args: Record<string, string>
): Promise<string> {
  const email = args.email;
  const handle = args.handle;
  const name = args.name;
  
  if (!email || !handle || !name) {
    return 'Error: Missing required fields. Format:\ninvite: email@example.com\nhandle: newuser\nname: New User';
  }
  
  // Validate handle format
  if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return 'Error: Handle must contain only letters, numbers, underscores, and hyphens.';
  }
  
  // Check if handle already exists
  const existingUser = await findUserByHandle(handle);
  if (existingUser) {
    return `Error: Handle @${handle} is already taken.`;
  }
  
  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  if (existingEmail) {
    return 'Error: Email is already registered.';
  }
  
  // Check if there's an existing unused invite for this email
  const existingInvite = await prisma.invite.findFirst({
    where: {
      email,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });
  
  if (existingInvite) {
    return 'Error: An active invite already exists for this email.';
  }
  
  // Create invite
  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  await prisma.invite.create({
    data: {
      token,
      email,
      handle,
      inviterId: user.id,
      expiresAt,
    },
  });
  
  // Send invite email
  try {
    await sendInviteEmail(email, token, user.handle);
  } catch (error) {
    return 'Error: Failed to send invite email. Please try again.';
  }
  
  return `Invite sent to ${email} for @${handle}.`;
}

export async function handlePROMOTE(
  user: User,
  args: Record<string, string>
): Promise<string> {
  const handle = args.user?.replace('@', '') || args.handle?.replace('@', '');
  const toLevelStr = args.to;
  const reason = args.reason || null;
  
  if (!handle || !toLevelStr) {
    return 'Error: Missing required fields. Format:\nuser: @handle\nto: <level>\nreason: ...';
  }
  
  const toLevel = parseInt(toLevelStr, 10);
  if (isNaN(toLevel) || toLevel < 1 || toLevel > 5) {
    return 'Error: Invalid level. Must be between 1 and 5.';
  }
  
  // Find target user
  const targetUser = await findUserByHandle(handle);
  if (!targetUser) {
    return `Error: User @${handle} not found.`;
  }
  
  // Check if user can influence target
  if (!canInfluence(user.level, targetUser.level)) {
    return 'Error: You cannot influence users at your level or higher.';
  }
  
  // Validate level change
  const validation = await validateLevelChange('promote', toLevel, targetUser.level);
  if (!validation.allowed) {
    return `Error: ${validation.reason}`;
  }
  
  // Get governance rules
  const rules = await getGovernanceRules('promote', toLevel);
  
  // Create level change request
  const request = await prisma.levelChangeRequest.create({
    data: {
      creatorId: user.id,
      targetId: targetUser.id,
      fromLevel: targetUser.level,
      toLevel,
      reason,
      requiredVotes: rules.requiredVotes,
    },
  });
  
  // Auto-vote if creator can vote
  if (canVote(user.level, targetUser.level, targetUser.level)) {
    await prisma.vote.create({
      data: {
        requestId: request.id,
        voterId: user.id,
        vote: 'FOR',
        comment: 'Creator vote',
      },
    });
  }
  
  // Check if request is already approved
  const voteCount = await prisma.vote.count({
    where: {
      requestId: request.id,
      vote: 'FOR',
    },
  });
  
  if (voteCount >= rules.requiredVotes) {
    // Import applyLevelChange here to avoid circular dependency
    const { applyLevelChange } = await import('../governance/governanceService.js');
    await applyLevelChange(
      targetUser.id,
      targetUser.level,
      toLevel,
      reason,
      request.id,
      user.handle
    );
    await checkBootstrapTransition();
    return `Promotion request #${request.id} created and approved. @${handle} is now Level ${toLevel}.`;
  }
  
  return `Promotion request #${request.id} created. Requires ${rules.requiredVotes} votes (currently ${voteCount}).`;
}

export async function handleDEMOTE(
  user: User,
  args: Record<string, string>
): Promise<string> {
  const handle = args.user?.replace('@', '') || args.handle?.replace('@', '');
  const toLevelStr = args.to;
  const reason = args.reason || null;
  
  if (!handle || !toLevelStr) {
    return 'Error: Missing required fields. Format:\nuser: @handle\nto: <level>\nreason: ...';
  }
  
  const toLevel = parseInt(toLevelStr, 10);
  if (isNaN(toLevel) || toLevel < 1 || toLevel > 5) {
    return 'Error: Invalid level. Must be between 1 and 5.';
  }
  
  // Find target user
  const targetUser = await findUserByHandle(handle);
  if (!targetUser) {
    return `Error: User @${handle} not found.`;
  }
  
  // Check if user can influence target
  if (!canInfluence(user.level, targetUser.level)) {
    return 'Error: You cannot influence users at your level or higher.';
  }
  
  // Validate level change
  const validation = await validateLevelChange('demote', toLevel, targetUser.level);
  if (!validation.allowed) {
    return `Error: ${validation.reason}`;
  }
  
  // Get governance rules
  const rules = await getGovernanceRules('demote', toLevel);
  
  // Create level change request
  const request = await prisma.levelChangeRequest.create({
    data: {
      creatorId: user.id,
      targetId: targetUser.id,
      fromLevel: targetUser.level,
      toLevel,
      reason,
      requiredVotes: rules.requiredVotes,
    },
  });
  
  // Auto-vote if creator can vote
  if (canVote(user.level, targetUser.level, targetUser.level)) {
    await prisma.vote.create({
      data: {
        requestId: request.id,
        voterId: user.id,
        vote: 'FOR',
        comment: 'Creator vote',
      },
    });
  }
  
  // Check if request is already approved
  const voteCount = await prisma.vote.count({
    where: {
      requestId: request.id,
      vote: 'FOR',
    },
  });
  
  if (voteCount >= rules.requiredVotes) {
    const { applyLevelChange } = await import('../governance/governanceService.js');
    await applyLevelChange(
      targetUser.id,
      targetUser.level,
      toLevel,
      reason,
      request.id,
      user.handle
    );
    return `Demotion request #${request.id} created and approved. @${handle} is now Level ${toLevel}.`;
  }
  
  return `Demotion request #${request.id} created. Requires ${rules.requiredVotes} votes (currently ${voteCount}).`;
}

export async function handleVOTE(
  user: User,
  args: Record<string, string>
): Promise<string> {
  const requestId = args.request;
  const voteStr = args.vote?.toUpperCase();
  const comment = args.comment || null;
  
  if (!requestId || !voteStr) {
    return 'Error: Missing required fields. Format:\nrequest: <id>\nvote: FOR | AGAINST\ncomment: ...';
  }
  
  if (voteStr !== 'FOR' && voteStr !== 'AGAINST') {
    return 'Error: Vote must be FOR or AGAINST.';
  }
  
  // Find request
  const request = await prisma.levelChangeRequest.findUnique({
    where: { id: requestId },
    include: { target: true },
  });
  
  if (!request) {
    return `Error: Request #${requestId} not found.`;
  }
  
  if (request.status !== 'PENDING') {
    return `Error: Request #${requestId} is ${request.status.toLowerCase()}.`;
  }
  
  // Check if user can vote
  if (!canVote(user.level, request.target.level, request.target.level)) {
    return 'Error: You cannot vote on this request.';
  }
  
  // Check if user already voted
  const existingVote = await prisma.vote.findUnique({
    where: {
      requestId_voterId: {
        requestId,
        voterId: user.id,
      },
    },
  });
  
  if (existingVote) {
    // Update existing vote
    await prisma.vote.update({
      where: { id: existingVote.id },
      data: {
        vote: voteStr,
        comment,
      },
    });
    return `Vote updated for request #${requestId}.`;
  }
  
  // Create new vote
  await prisma.vote.create({
    data: {
      requestId,
      voterId: user.id,
      vote: voteStr,
      comment,
    },
  });
  
  // Check if request is now approved
  const forVotes = await prisma.vote.count({
    where: {
      requestId,
      vote: 'FOR',
    },
  });
  
  if (forVotes >= request.requiredVotes) {
    const { applyLevelChange } = await import('../governance/governanceService.js');
    await applyLevelChange(
      request.targetId,
      request.fromLevel,
      request.toLevel,
      request.reason,
      request.id,
      user.handle
    );
    await checkBootstrapTransition();
    return `Vote recorded. Request #${requestId} approved and applied.`;
  }
  
  return `Vote recorded for request #${requestId}. ${forVotes}/${request.requiredVotes} votes.`;
}

/**
 * Routes command to appropriate handler
 */
export async function handleCommand(
  command: ParsedCommand,
  user: User
): Promise<string> {
  switch (command.type) {
    case 'ME':
      return handleME(user);
    case 'LIST':
      return handleLIST(user);
    case 'INVITE':
      return handleINVITE(user, command.args);
    case 'PROMOTE':
      return handlePROMOTE(user, command.args);
    case 'DEMOTE':
      return handleDEMOTE(user, command.args);
    case 'VOTE':
      return handleVOTE(user, command.args);
    default:
      return 'Unknown command. Available commands: ME, LIST, INVITE, PROMOTE, DEMOTE, VOTE';
  }
}

