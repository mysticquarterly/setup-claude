#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { configureClaudeDesktop, getClaudeConfigPath, isValidToken } from '../lib/setup.js';

// ANSI styling (zero-dependency)
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function banner() {
  console.log(`
${c.cyan}${c.bold}┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ${c.magenta}Multiplist${c.cyan} — Portable AI Memory Vault & Workspace          │
│   ${c.dim}1-Click Claude Desktop MCP Configuration${c.cyan}                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘${c.reset}
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    token: null,
    dryRun: false,
    help: false,
    path: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--token' || arg === '-t') {
      options.token = args[++i];
    } else if (arg === '--path' || arg === '-p') {
      options.path = args[++i];
    } else if (arg.startsWith('mcp_live_')) {
      options.token = arg;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${c.bold}Usage:${c.reset}
  npx @multiplist/setup-claude [options]
  npx @multiplist/setup-claude <token>

${c.bold}Options:${c.reset}
  -t, --token <token>   Your Multiplist MCP token (starts with mcp_live_)
  -p, --path <path>     Custom path to claude_desktop_config.json
  --dry-run             Preview the configuration changes without saving
  -h, --help            Show this help message

${c.bold}Get your Multiplist MCP token:${c.reset}
  ${c.cyan}https://multiplist.ai/settings${c.reset}
`);
}

async function run() {
  const options = parseArgs();

  if (options.help) {
    banner();
    showHelp();
    process.exit(0);
  }

  banner();

  let token = options.token || process.env.MULTIPLIST_MCP_TOKEN;

  if (!token) {
    const rl = readline.createInterface({ input, output });
    try {
      console.log(`${c.yellow}Get your sovereign MCP token from:${c.reset} ${c.cyan}${c.bold}https://multiplist.ai/settings${c.reset}\n`);
      token = await rl.question(`${c.bold}Enter your Multiplist MCP Token (starts with mcp_live_):${c.reset} `);
      token = token.trim();
    } finally {
      rl.close();
    }
  }

  if (!isValidToken(token)) {
    console.error(`\n${c.red}${c.bold}✗ Error:${c.reset} ${c.red}Invalid token format.${c.reset}`);
    console.error(`Multiplist MCP tokens must begin with ${c.cyan}"mcp_live_"${c.reset} and be at least 20 characters.`);
    console.error(`Generate your token at: ${c.cyan}https://multiplist.ai/settings${c.reset}\n`);
    process.exit(1);
  }

  try {
    const result = configureClaudeDesktop({
      token,
      configPath: options.path,
      dryRun: options.dryRun,
    });

    console.log(`\n${c.green}${c.bold}✓ Successfully configured Multiplist in Claude Desktop!${c.reset}\n`);
    console.log(`  ${c.bold}Config Location:${c.reset} ${c.dim}${result.configPath}${c.reset}`);
    if (result.backupPath) {
      console.log(`  ${c.bold}Backup Saved:${c.reset}   ${c.dim}${result.backupPath}${c.reset}`);
    }
    if (options.dryRun) {
      console.log(`  ${c.yellow}${c.bold}[DRY RUN]${c.reset} ${c.dim}No files were modified.${c.reset}`);
    }

    console.log(`\n${c.bold}Configured Entry:${c.reset}`);
    console.log(c.dim + JSON.stringify({ mcpServers: { multiplist: result.config.mcpServers.multiplist } }, null, 2) + c.reset);

    console.log(`
${c.cyan}${c.bold}Next Step:${c.reset}
  1. If Claude Desktop is currently running, ${c.bold}fully quit and restart it${c.reset} (Cmd+Q on macOS).
  2. Look for the hammer icon (${c.bold}🔨${c.reset}) in Claude chat — Multiplist's 71 tools are now live!
`);
  } catch (err) {
    console.error(`\n${c.red}${c.bold}✗ Failed to configure Claude Desktop:${c.reset} ${err.message}\n`);
    process.exit(1);
  }
}

run();
