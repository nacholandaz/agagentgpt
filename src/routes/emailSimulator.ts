import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { emailSimulator } from '../services/email/emailSimulator.js';

export async function registerEmailSimulatorRoute(fastify: FastifyInstance) {
  // API endpoint to get all emails
  fastify.get('/simulator/emails', async (request: FastifyRequest, reply: FastifyReply) => {
    const emails = emailSimulator.getAllEmails();
    return { emails, count: emails.length };
  });

  // API endpoint to clear all emails
  fastify.post('/simulator/clear', async (request: FastifyRequest, reply: FastifyReply) => {
    emailSimulator.clear();
    return { message: 'All emails cleared' };
  });

  // API endpoint to send email from form
  fastify.post('/simulator/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { from, subject, text } = request.body as { from?: string; subject?: string; text?: string };
      
      if (!from || !text) {
        return reply.status(400).send({ error: 'Missing required fields: from, text' });
      }

      // Forward to inbound email endpoint using fastify.inject
      const response = await fastify.inject({
        method: 'POST',
        url: '/inbound/email',
        payload: { from, subject: subject || '', text },
      });

      if (response.statusCode !== 200) {
        return reply.status(500).send({ error: 'Failed to process email' });
      }

      return reply.send({ status: 'sent', message: 'Email sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Web UI - User Perspective Email Simulator
  fastify.get('/simulator', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const emails = emailSimulator.getAllEmails();
      
      // Sort by timestamp (newest first)
      const sortedEmails = [...emails].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Email Agent Simulator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      color: #333;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .subtitle {
      color: #666;
      margin: 0 0 20px 0;
      font-size: 14px;
    }
    .status {
      padding: 12px;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 5px;
      margin-bottom: 20px;
      color: #155724;
      font-size: 14px;
    }
    .send-form {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .send-form h2 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #333;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #555;
      font-size: 14px;
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      font-family: inherit;
    }
    .form-group textarea {
      min-height: 120px;
      resize: vertical;
      font-family: 'Courier New', monospace;
    }
    .form-actions {
      display: flex;
      gap: 10px;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      background: #0056b3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .clear-btn {
      background: #6c757d;
    }
    .clear-btn:hover {
      background: #5a6268;
    }
    .controls {
      margin: 20px 0;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .email-thread {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .email-thread h2 {
      margin: 0 0 20px 0;
      font-size: 20px;
      color: #333;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    .message {
      margin-bottom: 25px;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid;
    }
    .message.sent {
      background: #e7f5e7;
      border-left-color: #28a745;
      margin-left: 10%;
    }
    .message.received {
      background: #e7f0ff;
      border-left-color: #007bff;
      margin-right: 10%;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .message-label {
      font-weight: 600;
      color: #333;
    }
    .message-time {
      color: #666;
    }
    .message-subject {
      font-weight: 600;
      margin: 8px 0;
      color: #333;
      font-size: 16px;
    }
    .message-body {
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      line-height: 1.6;
      color: #333;
      background: rgba(255,255,255,0.7);
      padding: 12px;
      border-radius: 4px;
      margin-top: 8px;
    }
    .empty {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    .help-text {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-top: 15px;
      font-size: 13px;
      color: #666;
    }
    .help-text strong {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Email Agent Simulator</h1>
    <p class="subtitle">Test the email agent from a user's perspective</p>
    
    <div class="status">
      Simulator mode active - No real emails are being sent. This shows what users will see.
    </div>

    <div class="send-form">
      <h2>Send Email to Agent</h2>
      <form id="sendEmailForm" onsubmit="sendEmail(event)">
        <div class="form-group">
          <label for="fromEmail">Your Email:</label>
          <input type="email" id="fromEmail" name="from" value="core@cocentrica.org" required>
          <small style="color: #666; font-size: 12px;">Use the email of a user in the database</small>
        </div>
        <div class="form-group">
          <label for="emailSubject">Subject (Command):</label>
          <input type="text" id="emailSubject" name="subject" placeholder="ME" value="ME">
          <small style="color: #666; font-size: 12px;">Commands: ME, LIST, INVITE, PROMOTE, DEMOTE, VOTE</small>
        </div>
        <div class="form-group">
          <label for="emailBody">Message Body:</label>
          <textarea id="emailBody" name="text" placeholder="ME" required>ME</textarea>
          <small style="color: #666; font-size: 12px;">For commands like INVITE, use format:<br>INVITE<br>email: user@example.com<br>handle: username<br>name: Full Name</small>
        </div>
        <div class="form-actions">
          <button type="submit">Send Email</button>
          <button type="button" class="clear-btn" onclick="clearForm()">Clear Form</button>
        </div>
      </form>
    </div>
    
    <div class="controls">
      <button onclick="location.reload()">Refresh</button>
      <button class="clear-btn" onclick="clearEmails()">Clear All Emails</button>
      <span style="margin-left: auto; color: #666; font-size: 13px;">${emails.length} email${emails.length !== 1 ? 's' : ''}</span>
    </div>

    <div class="email-thread">
      <h2>Email Conversation</h2>
      ${sortedEmails.length === 0 
        ? '<div class="empty">No emails yet. Send a command using the form above to see the agent\'s response.</div>'
        : sortedEmails.map(email => {
            const isReceived = email.from === 'core@cocentrica.org' && email.subject.startsWith('Re:');
            const safeText = email.text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeSubject = (email.subject || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `
              <div class="message ${isReceived ? 'received' : 'sent'}">
                <div class="message-header">
                  <span class="message-label">${isReceived ? 'From Agent' : 'To Agent'}</span>
                  <span class="message-time">${new Date(email.timestamp).toLocaleString()}</span>
                </div>
                <div class="message-subject">${safeSubject || '(No subject)'}</div>
                <div class="message-body">${safeText}</div>
              </div>
            `;
          }).join('')
      }
    </div>

    <div class="help-text">
      <strong>How to use:</strong><br>
      1. Enter your email (must match a user in the database)<br>
      2. Enter a command in Subject or Body (ME, LIST, INVITE, etc.)<br>
      3. Click "Send Email" to send to the agent<br>
      4. The agent's response will appear below<br>
      <br>
      <strong>Available Commands:</strong><br>
      • <code>ME</code> - View your profile<br>
      • <code>LIST</code> - List visible users<br>
      • <code>INVITE</code> - Invite a new user<br>
      • <code>PROMOTE</code> - Promote a user (requires votes)<br>
      • <code>DEMOTE</code> - Demote a user (requires votes)<br>
      • <code>VOTE</code> - Vote on a request
    </div>
  </div>

  <script>
    async function sendEmail(event) {
      event.preventDefault();
      event.stopPropagation();
      
      // Get the form element reliably
      const form = event.currentTarget || event.target.closest('form') || document.getElementById('sendEmailForm');
      if (!form) {
        console.error('Form not found');
        alert('Error: Form not found');
        return false;
      }

      const formData = new FormData(form);
      const data = {
        from: formData.get('from'),
        subject: formData.get('subject') || '',
        text: formData.get('text'),
      };

      // Validate required fields
      if (!data.from || !data.text) {
        alert('Please fill in all required fields (Email and Message Body)');
        return false;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        const response = await fetch('/simulator/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Email sent successfully:', result);
          setTimeout(() => {
            location.reload();
          }, 500);
        } else {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Failed to send email:', error);
          alert('Failed to send email: ' + (error.error || 'Unknown error'));
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Email';
          }
        }
      } catch (error) {
        console.error('Error sending email:', error);
        alert('Error sending email: ' + (error.message || 'Network error. Please check your connection.'));
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Email';
        }
      }
      
      return false;
    }

    function clearForm() {
      document.getElementById('sendEmailForm').reset();
      document.getElementById('fromEmail').value = 'core@cocentrica.org';
      document.getElementById('emailSubject').value = 'ME';
      document.getElementById('emailBody').value = 'ME';
    }

    async function clearEmails() {
      if (confirm('Clear all emails? This will remove the entire conversation history.')) {
        await fetch('/simulator/clear', { method: 'POST' });
        location.reload();
      }
    }

    // Ensure form handler is attached when page loads
    (function() {
      function attachHandler() {
        const form = document.getElementById('sendEmailForm');
        if (form && !form.dataset.handlerAttached) {
          form.addEventListener('submit', sendEmail);
          form.dataset.handlerAttached = 'true';
          console.log('Form submit handler attached');
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachHandler);
      } else {
        attachHandler();
      }
    })();

    setInterval(() => {
      location.reload();
    }, 5000);
  </script>
</body>
</html>`;
    
      return reply.type('text/html').send(html);
    } catch (error) {
      console.error('Error in simulator route:', error);
      return reply.status(500).send(`
        <html><body>
          <h1>Error</h1>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          <pre>${error instanceof Error ? error.stack : ''}</pre>
        </body></html>
      `);
    }
  });
}
