# @multiplist/setup-claude

> **1-Click Claude Desktop MCP Configuration for Multiplist (Portable AI Memory Vault & Workspace)**

Connect [Claude Desktop](https://claude.ai/download) to your sovereign Multiplist brain in 5 seconds with zero JSON editing.

[![npm version](https://img.shields.io/npm/v/@multiplist/setup-claude.svg)](https://www.npmjs.com/package/@multiplist/setup-claude)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Instant Setup

Run in your terminal:

```bash
npx @multiplist/setup-claude
```

The script will prompt for your Multiplist MCP Token (generated at [multiplist.ai/settings](https://multiplist.ai/settings)), safely back up your existing Claude Desktop configuration, and inject the canonical `@multiplist/mcp-server` entry.

### Non-Interactive Setup

```bash
npx @multiplist/setup-claude --token mcp_live_YOUR_TOKEN_HERE
```

### Dry Run (Preview Only)

```bash
npx @multiplist/setup-claude --token mcp_live_YOUR_TOKEN_HERE --dry-run
```

---

## 🛠️ What it Does

1. **Auto-Detects OS Config Path:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`
2. **Creates a Safe Timestamped Backup:**
   - Saves `claude_desktop_config.json.bak-<timestamp>` before making any modifications.
3. **Merges Non-Destructively:**
   - Preserves all your other existing MCP servers (Filesystem, Postgres, Brave Search, etc.).
4. **Injects Multiplist Sovereign MCP Server:**
   ```json
   {
     "mcpServers": {
       "multiplist": {
         "command": "npx",
         "args": ["-y", "@multiplist/mcp-server@latest"],
         "env": {
           "MULTIPLIST_MCP_TOKEN": "mcp_live_YOUR_TOKEN"
         }
       }
     }
   }
   ```

---

## 🔒 Security & Privacy

- **Zero Third-Party Dependencies:** Pure Node.js built-ins only.
- **Zero Custody:** Runs 100% locally on your machine. Your token never leaves your device.

---

## 📄 License

MIT © [Multiplist](https://multiplist.ai)
