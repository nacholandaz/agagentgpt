/**
 * Quick test script for email simulator
 * 
 * Usage: tsx test-simulator.ts
 */

import { emailSimulator } from './src/services/email/emailSimulator.js';

async function test() {
  console.log('Testing Email Simulator...\n');

  // Simulate sending some emails
  await emailSimulator.sendEmail(
    'user1@example.com',
    'Test Email 1',
    'This is a test email body\n\nIt can have multiple lines.',
    5
  );

  await emailSimulator.sendEmail(
    'user2@example.com',
    'Test Email 2',
    'Another test email with different content.',
    3
  );

  await emailSimulator.sendEmail(
    'user1@example.com',
    'Re: Test Email 1',
    'This is a follow-up email to the same recipient.',
    5
  );

  // View results
  console.log('\n📊 Simulator Stats:');
  console.log(`Total emails: ${emailSimulator.getCount()}`);
  console.log('\nAll emails:');
  emailSimulator.getAllEmails().forEach((email, i) => {
    console.log(`\n${i + 1}. To: ${email.to}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   Time: ${email.timestamp.toLocaleString()}`);
    console.log(`   Level: ${email.requesterLevel}`);
  });

  console.log('\n📧 Emails for user1@example.com:');
  const user1Emails = emailSimulator.getEmailsFor('user1@example.com');
  console.log(`Found ${user1Emails.length} emails`);

  console.log('\n✅ Simulator test complete!');
  console.log('\n💡 Tip: Start the server with EMAIL_SIMULATOR=true and visit http://localhost:3000/simulator');
  
  process.exit(0);
}

test().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

