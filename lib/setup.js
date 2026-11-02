import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/**
 * Resolves the canonical path to claude_desktop_config.json for the current OS.
 * @param {string} [platform=process.platform]
 * @param {Record<string, string>} [env=process.env]
 * @param {string} [homedir=os.homedir()]
 * @returns {string}
 */
export function getClaudeConfigPath(
  platform = process.platform,
  env = process.env,
  homedir = os.homedir()
) {
  if (platform === 'darwin') {
    return path.join(homedir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (platform === 'win32') {
    const appData = env.APPDATA || path.win32.join(homedir, 'AppData', 'Roaming');
    return path.win32.join(appData, 'Claude', 'claude_desktop_config.json');
  }
  // Linux / BSD
  const configHome = env.XDG_CONFIG_HOME || path.join(homedir, '.config');
  return path.join(configHome, 'Claude', 'claude_desktop_config.json');
}

/**
 * Validates a Multiplist MCP token format.
 * @param {string} token
 * @returns {boolean}
 */
export function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  return trimmed.startsWith('mcp_live_') && trimmed.length >= 20;
}

/**
 * Builds the canonical Multiplist MCP server entry.
 * @param {string} token
 * @returns {object}
 */
export function buildMultiplistServerEntry(token) {
  return {
    command: 'npx',
    args: ['-y', '@multiplist/mcp-server@latest'],
    env: {
      MULTIPLIST_MCP_TOKEN: token.trim(),
    },
  };
}

/**
 * Patches or creates claude_desktop_config.json with the Multiplist server entry.
 * @param {object} options
 * @param {string} options.token - Multiplist MCP Token
 * @param {string} [options.configPath] - Custom config path (for testing or overrides)
 * @param {boolean} [options.dryRun=false] - If true, returns planned mutation without writing
 * @returns {{ success: boolean, configPath: string, backupPath?: string, config: object, isNew: boolean }}
 */
export function configureClaudeDesktop({ token, configPath, dryRun = false }) {
  if (!isValidToken(token)) {
    throw new Error('Invalid token. Multiplist MCP tokens must start with "mcp_live_" and be at least 20 characters.');
  }

  const targetPath = configPath || getClaudeConfigPath();
  const dirPath = path.dirname(targetPath);

  let existingConfig = {};
  let isNew = true;
  let backupPath;

  if (fs.existsSync(targetPath)) {
    isNew = false;
    const raw = fs.readFileSync(targetPath, 'utf8');
    try {
      existingConfig = JSON.parse(raw);
    } catch {
      // Create backup of corrupted/invalid JSON
      const corruptBackup = `${targetPath}.corrupt-${Date.now()}`;
      if (!dryRun) {
        fs.writeFileSync(corruptBackup, raw, 'utf8');
      }
      existingConfig = {};
    }

    // Create safe timestamped backup of existing valid file
    backupPath = `${targetPath}.bak-${Date.now()}`;
    if (!dryRun) {
      fs.writeFileSync(backupPath, raw, 'utf8');
    }
  }

  if (typeof existingConfig !== 'object' || existingConfig === null || Array.isArray(existingConfig)) {
    existingConfig = {};
  }

  if (!existingConfig.mcpServers || typeof existingConfig.mcpServers !== 'object' || Array.isArray(existingConfig.mcpServers)) {
    existingConfig.mcpServers = {};
  }

  // Inject or update multiplist entry
  existingConfig.mcpServers.multiplist = buildMultiplistServerEntry(token);

  if (!dryRun) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(existingConfig, null, 2) + '\n', 'utf8');
  }

  return {
    success: true,
    configPath: targetPath,
    backupPath,
    config: existingConfig,
    isNew,
  };
}
