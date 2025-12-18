import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../prisma.js';
import { findUserByEmail } from '../services/security/securityService.js';
import { parseCommand } from '../services/commands/commandParser.js';
import { handleCommand } from '../services/commands/commandHandlers.js';
import {
  sendCommandResponse,
  sendErrorEmail,
  sendUnauthorizedEmail,
} from '../services/email/emailService.js';

/**
 * Inbound Email Route
 * 
 * Handles incoming emails from SMTP services (SendGrid, SES, etc.)
 * Supports multiple payload formats
 */

interface EmailPayload {
  from?: string;
  sender?: string;
  envelope?: {
    from?: string;
  };
  headers?: {
    from?: string;
  };
  subject?: string;
  text?: string;
  body?: string;
  'body-plain'?: string;
  'body-html'?: string;
}

/**
 * Extracts email address from various formats
 */
function extractEmail(from: string | undefined): string | null {
  if (!from) return null;
  
  // Handle "Name <email@example.com>" format
  const match = from.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Handle plain email
  if (from.includes('@')) {
    return from.trim();
  }
  
  return null;
}

/**
 * Extracts text from email body
 */
function extractText(payload: EmailPayload): string {
  return (
    payload.text ||
    payload.body ||
    payload['body-plain'] ||
    payload['body-html']?.replace(/<[^>]*>/g, '') ||
    ''
  );
}

export async function registerInboundEmailRoute(fastify: FastifyInstance) {
  fastify.post('/inbound/email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = request.body as EmailPayload;
      
      // Extract sender email
      const fromEmail =
        extractEmail(payload.from) ||
        extractEmail(payload.sender) ||
        extractEmail(payload.envelope?.from) ||
        extractEmail(payload.headers?.from);
      
      if (!fromEmail) {
        return reply.status(400).send({ error: 'No sender email found' });
      }
      
      // Find user by email
      const user = await findUserByEmail(fromEmail);
      
      if (!user || !user.isActive) {
        // Send unauthorized email but don't reveal system exists
        try {
          await sendUnauthorizedEmail(fromEmail);
        } catch (error) {
          console.error('Failed to send unauthorized email:', error);
        }
        return reply.status(200).send({ status: 'processed' });
      }
      
      // Extract command from email
      const subject = payload.subject || '';
      const body = extractText(payload);
      
      // Combine subject and body for command parsing
      const commandText = subject + '\n' + body;
      const command = parseCommand(commandText);
      
      if (command.type === 'UNKNOWN') {
        await sendErrorEmail(
          user.email,
          'Unknown command. Available commands: ME, LIST, INVITE, PROMOTE, DEMOTE, VOTE',
          user.level
        );
        return reply.status(200).send({ status: 'processed' });
      }
      
      // Handle command
      try {
        const response = await handleCommand(command, user);
        await sendCommandResponse(
          user.email,
          `Re: ${subject || 'Command Response'}`,
          response,
          user.level
        );
      } catch (error) {
        console.error('Error handling command:', error);
        await sendErrorEmail(
          user.email,
          error instanceof Error ? error.message : 'An unexpected error occurred',
          user.level
        );
      }
      
      return reply.status(200).send({ status: 'processed' });
    } catch (error) {
      console.error('Error processing inbound email:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

