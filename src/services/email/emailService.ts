import nodemailer from 'nodemailer';
import { CONFIG } from '../../config.js';
import { sanitizeText } from '../visibility/visibilityService.js';
import { emailSimulator } from './emailSimulator.js';

/**
 * Email Service
 * 
 * Handles all outbound email with visibility filtering
 * Supports simulator mode for testing
 */

// Check if simulator mode is enabled
const USE_SIMULATOR = process.env.EMAIL_SIMULATOR === 'true' || 
                      process.env.NODE_ENV === 'test';

const transporter = !USE_SIMULATOR ? nodemailer.createTransport({
  host: CONFIG.email.smtp.host,
  port: CONFIG.email.smtp.port,
  secure: CONFIG.email.smtp.secure,
  auth: CONFIG.email.smtp.auth.user
    ? {
        user: CONFIG.email.smtp.auth.user,
        pass: CONFIG.email.smtp.auth.pass,
      }
    : undefined,
}) : null;

/**
 * Sends an email with visibility filtering
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  requesterLevel: number
): Promise<void> {
  // Sanitize text to remove hints of higher levels
  const sanitizedText = sanitizeText(text, requesterLevel);
  
  if (USE_SIMULATOR) {
    // Use simulator instead of real SMTP
    await emailSimulator.sendEmail(to, subject, sanitizedText, requesterLevel);
    return;
  }

  const mailOptions = {
    from: CONFIG.email.from,
    to,
    subject,
    text: sanitizedText,
  };
  
  try {
    await transporter!.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Sends invite email
 */
export async function sendInviteEmail(
  email: string,
  token: string,
  inviterHandle: string
): Promise<void> {
  const acceptUrl = `${CONFIG.app.baseUrl}/accept?token=${token}`;
  
  const text = `You have been invited to join Cocéntrica by @${inviterHandle}.

To accept this invitation, visit:
${acceptUrl}

This link will expire in 7 days.`;

  await sendEmail(email, 'Invitation to Cocéntrica', text, 5); // System emails use Level 5 visibility
}

/**
 * Sends command response email
 */
export async function sendCommandResponse(
  to: string,
  subject: string,
  body: string,
  requesterLevel: number
): Promise<void> {
  await sendEmail(to, subject, body, requesterLevel);
}

/**
 * Sends error email
 */
export async function sendErrorEmail(
  to: string,
  message: string,
  requesterLevel: number
): Promise<void> {
  const text = `An error occurred while processing your request:

${message}

If you believe this is an error, please contact support.`;
  
  await sendEmail(to, 'Error processing request', text, requesterLevel);
}

/**
 * Sends unauthorized email (for unknown senders)
 */
export async function sendUnauthorizedEmail(to: string): Promise<void> {
  const text = `You are not authorized to use this system.

If you believe this is an error, please contact support.`;
  
  await sendEmail(to, 'Not authorized', text, 5);
}

// Export simulator for access
export { emailSimulator };

