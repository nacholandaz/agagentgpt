/**
 * Command Parser
 * 
 * Parses email commands from plain text
 */

export type CommandType = 'ME' | 'LIST' | 'INVITE' | 'PROMOTE' | 'DEMOTE' | 'VOTE' | 'UNKNOWN';

export interface ParsedCommand {
  type: CommandType;
  args: Record<string, string>;
}

/**
 * Parses email body into a command
 */
export function parseCommand(body: string): ParsedCommand {
  const lines = body.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { type: 'UNKNOWN', args: {} };
  }
  
  const firstLine = lines[0].toUpperCase().trim();
  
  // Check for command type
  let commandType: CommandType = 'UNKNOWN';
  if (firstLine === 'ME') {
    commandType = 'ME';
  } else if (firstLine === 'LIST') {
    commandType = 'LIST';
  } else if (firstLine.startsWith('INVITE')) {
    commandType = 'INVITE';
  } else if (firstLine.startsWith('PROMOTE')) {
    commandType = 'PROMOTE';
  } else if (firstLine.startsWith('DEMOTE')) {
    commandType = 'DEMOTE';
  } else if (firstLine.startsWith('VOTE')) {
    commandType = 'VOTE';
  }
  
  // Parse arguments (key: value format)
  const args: Record<string, string> = {};
  
  for (const line of lines.slice(1)) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase();
      const value = line.substring(colonIndex + 1).trim();
      args[key] = value;
    }
  }
  
  // For commands that might have arguments on the first line
  if (commandType === 'INVITE' && firstLine.includes(':')) {
    const colonIndex = firstLine.indexOf(':');
    const value = firstLine.substring(colonIndex + 1).trim();
    if (!args.email) {
      args.email = value;
    }
  }
  
  return { type: commandType, args };
}

