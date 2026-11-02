import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  getClaudeConfigPath,
  isValidToken,
  buildMultiplistServerEntry,
  configureClaudeDesktop,
} from '../lib/setup.js';

test('getClaudeConfigPath returns correct OS paths', () => {
  const darwin = getClaudeConfigPath('darwin', {}, '/Users/alice');
  assert.equal(darwin, '/Users/alice/Library/Application Support/Claude/claude_desktop_config.json');

  const win = getClaudeConfigPath('win32', { APPDATA: 'C:\\Users\\alice\\AppData\\Roaming' }, 'C:\\Users\\alice');
  assert.equal(win, 'C:\\Users\\alice\\AppData\\Roaming\\Claude\\claude_desktop_config.json');

  const linux = getClaudeConfigPath('linux', { XDG_CONFIG_HOME: '/home/alice/.config' }, '/home/alice');
  assert.equal(linux, '/home/alice/.config/Claude/claude_desktop_config.json');
});

test('isValidToken validates correctly', () => {
  assert.equal(isValidToken('mcp_live_1234567890abcdef1234'), true);
  assert.equal(isValidToken('mcp_live_short'), false);
  assert.equal(isValidToken('invalid_prefix_12345678901234'), false);
  assert.equal(isValidToken(''), false);
  assert.equal(isValidToken(null), false);
  assert.equal(isValidToken(undefined), false);
});

test('buildMultiplistServerEntry formats canonical entry', () => {
  const entry = buildMultiplistServerEntry('mcp_live_test_token_123456789');
  assert.deepEqual(entry, {
    command: 'npx',
    args: ['-y', '@multiplist/mcp-server@latest'],
    env: {
      MULTIPLIST_MCP_TOKEN: 'mcp_live_test_token_123456789',
    },
  });
});

test('configureClaudeDesktop creates new file when none exists', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-setup-test-'));
  const testConfigPath = path.join(tempDir, 'Claude', 'claude_desktop_config.json');

  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const res = configureClaudeDesktop({
    token: 'mcp_live_mock_token_1234567890',
    configPath: testConfigPath,
  });

  assert.equal(res.success, true);
  assert.equal(res.isNew, true);
  assert.equal(fs.existsSync(testConfigPath), true);

  const written = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
  assert.equal(written.mcpServers.multiplist.env.MULTIPLIST_MCP_TOKEN, 'mcp_live_mock_token_1234567890');
  assert.deepEqual(written.mcpServers.multiplist.args, ['-y', '@multiplist/mcp-server@latest']);
});

test('configureClaudeDesktop non-destructively preserves existing servers and creates backup', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-setup-test-'));
  const testConfigPath = path.join(tempDir, 'claude_desktop_config.json');

  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // Pre-seed with existing server
  const initial = {
    mcpServers: {
      filesystem: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/Users/alice/Desktop'],
      },
    },
  };
  fs.writeFileSync(testConfigPath, JSON.stringify(initial, null, 2), 'utf8');

  const res = configureClaudeDesktop({
    token: 'mcp_live_mock_token_1234567890',
    configPath: testConfigPath,
  });

  assert.equal(res.success, true);
  assert.equal(res.isNew, false);
  assert.ok(res.backupPath);
  assert.equal(fs.existsSync(res.backupPath), true);

  const updated = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
  assert.ok(updated.mcpServers.filesystem, 'Existing filesystem server must be preserved');
  assert.ok(updated.mcpServers.multiplist, 'Multiplist server must be added');
  assert.equal(updated.mcpServers.multiplist.env.MULTIPLIST_MCP_TOKEN, 'mcp_live_mock_token_1234567890');
});

test('configureClaudeDesktop honors dryRun without writing files', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-setup-test-'));
  const testConfigPath = path.join(tempDir, 'claude_desktop_config.json');

  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const res = configureClaudeDesktop({
    token: 'mcp_live_mock_token_1234567890',
    configPath: testConfigPath,
    dryRun: true,
  });

  assert.equal(res.success, true);
  assert.equal(fs.existsSync(testConfigPath), false);
  assert.ok(res.config.mcpServers.multiplist);
});
