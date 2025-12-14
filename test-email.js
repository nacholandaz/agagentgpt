#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * 
 * Tests SMTP connection without sending an email
 * 
 * Usage: node test-email.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const config = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
};

console.log('Testing SMTP Configuration...\n');
console.log('Settings:');
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Secure: ${config.secure}`);
console.log(`  Auth: ${config.auth ? 'Yes' : 'No'}\n`);

const transporter = nodemailer.createTransport(config);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (error.code === 'EAUTH') {
      console.log('💡 Tip: Check your username and password');
      console.log('   - For Gmail: Use App Password, not regular password');
      console.log('   - For SendGrid: Use "apikey" as username, API key as password');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Check your SMTP host and port');
      console.log('   - Verify firewall settings');
      console.log('   - Try port 465 with secure=true for SSL');
    }
    
    process.exit(1);
  } else {
    console.log('✅ SMTP server is ready to send emails!\n');
    console.log('Configuration looks good. You can now use the email system.');
    process.exit(0);
  }
});

