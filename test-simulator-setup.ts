/**
 * Diagnostic script to test email simulator setup
 */

import { config } from 'dotenv';

config();

console.log('🔍 Email Simulator Diagnostic\n');

// Check environment variable
const useSimulator = process.env.EMAIL_SIMULATOR === 'true' || process.env.NODE_ENV === 'test';
console.log(`EMAIL_SIMULATOR env var: ${process.env.EMAIL_SIMULATOR || 'NOT SET'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
console.log(`Will use simulator: ${useSimulator ? '✅ YES' : '❌ NO'}\n`);

// Test simulator import
try {
  const { emailSimulator } = await import('./src/services/email/emailSimulator.js');
  console.log('✅ Simulator module loaded successfully');
  
  // Test sending an email
  await emailSimulator.sendEmail(
    'test@example.com',
    'Test Email',
    'This is a test email body',
    5
  );
  
  const emails = emailSimulator.getAllEmails();
  console.log(`✅ Simulator working! Found ${emails.length} email(s)`);
  
  if (emails.length > 0) {
    console.log('\nLatest email:');
    console.log(`  To: ${emails[0].to}`);
    console.log(`  Subject: ${emails[0].subject}`);
  }
  
} catch (error) {
  console.error('❌ Error loading simulator:', error);
  process.exit(1);
}

console.log('\n✅ All checks passed!');
console.log('\n💡 To use simulator:');
console.log('   1. Make sure EMAIL_SIMULATOR=true is in .env');
console.log('   2. Start server: npm run dev');
console.log('   3. Visit: http://localhost:3000/simulator');

