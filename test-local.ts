/**
 * Local Testing Script
 * 
 * This script allows you to test the system functions directly
 * without going through HTTP endpoints.
 * 
 * Usage: tsx test-local.ts
 */

import prisma from './src/prisma.js';
import { parseCommand } from './src/services/commands/commandParser.js';
import { handleCommand } from './src/services/commands/commandHandlers.js';
import { getSystemMode, getCoreCount } from './src/services/governance/governanceService.js';
import { getVisibleUsers } from './src/services/visibility/visibilityService.js';

async function test() {
  console.log('=== Cocéntrica Core Testing ===\n');

  try {
    // Test 1: Check system status
    console.log('1. System Status:');
    const mode = await getSystemMode();
    const coreCount = await getCoreCount();
    console.log(`   Mode: ${mode}`);
    console.log(`   Core Count: ${coreCount}\n`);

    // Test 2: Find admin user
    console.log('2. Finding admin user...');
    const admin = await prisma.user.findFirst({
      where: { level: 5 },
    });

    if (!admin) {
      console.log('   ❌ No Core member found. Run seed first!');
      return;
    }

    console.log(`   ✓ Found: @${admin.handle} (${admin.name})\n`);

    // Test 3: Parse commands
    console.log('3. Testing command parser:');
    const commands = [
      'ME',
      'LIST',
      'INVITE\nemail: test@example.com\nhandle: testuser\nname: Test User',
      'PROMOTE\nuser: @testuser\nto: 2\nreason: Testing',
    ];

    for (const cmd of commands) {
      const parsed = parseCommand(cmd);
      console.log(`   "${cmd.split('\n')[0]}" → ${parsed.type}`);
    }
    console.log('');

    // Test 4: Execute ME command
    console.log('4. Testing ME command:');
    try {
      const meResponse = await handleCommand(
        { type: 'ME', args: {} },
        admin
      );
      console.log('   Response:');
      console.log(meResponse.split('\n').map((l: string) => `   ${l}`).join('\n'));
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    console.log('');

    // Test 5: Execute LIST command
    console.log('5. Testing LIST command:');
    try {
      const listResponse = await handleCommand(
        { type: 'LIST', args: {} },
        admin
      );
      console.log('   Response:');
      console.log(listResponse.split('\n').map((l: string) => `   ${l}`).join('\n'));
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    console.log('');

    // Test 6: Check visible users
    console.log('6. Testing visibility service:');
    const visibleUsers = await getVisibleUsers(admin.level);
    console.log(`   Visible users to Level ${admin.level}: ${visibleUsers.length}`);
    visibleUsers.forEach((u) => {
      console.log(`   - @${u.handle} (Level ${u.level})${u.email ? ` - ${u.email}` : ''}`);
    });
    console.log('');

    // Test 7: Database stats
    console.log('7. Database Statistics:');
    const userCount = await prisma.user.count();
    const inviteCount = await prisma.invite.count();
    const requestCount = await prisma.levelChangeRequest.count();
    const voteCount = await prisma.vote.count();

    console.log(`   Users: ${userCount}`);
    console.log(`   Invites: ${inviteCount}`);
    console.log(`   Level Change Requests: ${requestCount}`);
    console.log(`   Votes: ${voteCount}`);
    console.log('');

    console.log('✅ Testing complete!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();

