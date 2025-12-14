import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../prisma.js';
import { hashPassword } from '../services/security/securityService.js';
import { CONFIG } from '../config.js';

/**
 * Accept Invite Route
 * 
 * Handles invite acceptance via web form
 */

const ACCEPT_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Accept Invitation - Cocéntrica</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      color: #555;
      font-weight: 500;
    }
    input[type="text"],
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }
    button {
      background: #007bff;
      color: white;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
      width: 100%;
    }
    button:hover {
      background: #0056b3;
    }
    .error {
      color: #dc3545;
      margin-top: 10px;
      padding: 10px;
      background: #f8d7da;
      border-radius: 4px;
    }
    .success {
      color: #155724;
      margin-top: 10px;
      padding: 10px;
      background: #d4edda;
      border-radius: 4px;
    }
    .checkbox-group {
      margin: 20px 0;
    }
    .checkbox-group input {
      width: auto;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accept Invitation</h1>
    {{CONTENT}}
  </div>
</body>
</html>
`;

const FORM_HTML = `
<form method="POST" action="/accept">
  <input type="hidden" name="token" value="{{TOKEN}}">
  
  <div class="form-group">
    <label for="name">Name *</label>
    <input type="text" id="name" name="name" required>
  </div>
  
  <div class="form-group">
    <label for="handle">Handle *</label>
    <input type="text" id="handle" name="handle" required pattern="[a-zA-Z0-9_-]+" title="Only letters, numbers, underscores, and hyphens">
    <small style="color: #666;">Only letters, numbers, underscores, and hyphens</small>
  </div>
  
  <div class="form-group">
    <label for="password">Password *</label>
    <input type="password" id="password" name="password" required minlength="8">
    <small style="color: #666;">Minimum 8 characters</small>
  </div>
  
  <div class="checkbox-group">
    <label>
      <input type="checkbox" name="agree" required>
      I agree to the terms and conditions
    </label>
  </div>
  
  <button type="submit">Accept Invitation</button>
</form>
`;

export async function registerAcceptInviteRoute(fastify: FastifyInstance) {
  // GET: Show accept form
  fastify.get('/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = (request.query as { token?: string }).token;
      
      if (!token) {
        const content = '<div class="error">Invalid invitation link. Token is missing.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Find invite
      const invite = await prisma.invite.findUnique({
        where: { token },
      });
      
      if (!invite) {
        const content = '<div class="error">Invalid invitation token.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      if (invite.isUsed) {
        const content = '<div class="error">This invitation has already been used.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      if (invite.expiresAt < new Date()) {
        const content = '<div class="error">This invitation has expired.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Show form
      const form = FORM_HTML.replace('{{TOKEN}}', token);
      return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', form));
    } catch (error) {
      console.error('Error showing accept form:', error);
      const content = '<div class="error">An error occurred. Please try again.</div>';
      return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
    }
  });
  
  // POST: Process acceptance
  fastify.post('/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        token?: string;
        name?: string;
        handle?: string;
        password?: string;
        agree?: string;
      };
      
      const { token, name, handle, password, agree } = body;
      
      if (!token || !name || !handle || !password || !agree) {
        const content = '<div class="error">All fields are required.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Validate handle format
      if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
        const content = '<div class="error">Handle must contain only letters, numbers, underscores, and hyphens.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Find invite
      const invite = await prisma.invite.findUnique({
        where: { token },
        include: { inviter: true },
      });
      
      if (!invite) {
        const content = '<div class="error">Invalid invitation token.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      if (invite.isUsed) {
        const content = '<div class="error">This invitation has already been used.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      if (invite.expiresAt < new Date()) {
        const content = '<div class="error">This invitation has expired.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Check if handle matches invite
      if (invite.handle !== handle) {
        const content = '<div class="error">Handle does not match the invitation.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Check if handle already exists
      const existingUser = await prisma.user.findUnique({
        where: { handle },
      });
      
      if (existingUser) {
        const content = '<div class="error">This handle is already taken.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({
        where: { email: invite.email },
      });
      
      if (existingEmail) {
        const content = '<div class="error">This email is already registered.</div>';
        return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
      }
      
      // Create user
      const passwordHash = await hashPassword(password);
      
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            handle,
            name,
            email: invite.email,
            passwordHash,
            level: 1, // All new users start at Level 1
            invitedBy: invite.inviter.handle,
          },
        });
        
        // Mark invite as used
        await tx.invite.update({
          where: { id: invite.id },
          data: {
            isUsed: true,
            acceptedAt: new Date(),
            inviteeId: user.id,
          },
        });
      });
      
      const content = '<div class="success">Invitation accepted! You can now use the email system to interact with Cocéntrica.</div>';
      return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
    } catch (error) {
      console.error('Error processing invite acceptance:', error);
      const content = '<div class="error">An error occurred. Please try again.</div>';
      return reply.type('text/html').send(ACCEPT_HTML.replace('{{CONTENT}}', content));
    }
  });
}

