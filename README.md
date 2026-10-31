# Port 402 Memory — MCP server

Persistent memory for AI agents. Your agent saves and reads JSON across sessions and restarts.
No account, no API key: each call is paid in USDC on Base via [x402](https://x402.org), and the paying wallet is your private namespace.

| Tool | Price |
|---|---|
| `memory_set` (key, value) | $0.002 |
| `memory_get` (key) | $0.001 |
| `memory_list` | $0.001 |

$1 of USDC ≈ 500 writes or 1,000 reads. Hard cap per call: $0.01 by default (`PORT402_MAX_USD_PER_CALL`).

## Install

Claude Code:
```
claude mcp add port402-memory -e PORT402_PRIVATE_KEY=0xYOUR_KEY -- npx -y github:Tifdt/port402-memory-mcp
```

Claude Desktop / Cursor (`mcpServers`):
```json
{ "port402-memory": { "command": "npx", "args": ["-y", "github:Tifdt/port402-memory-mcp"], "env": { "PORT402_PRIVATE_KEY": "0xYOUR_KEY" } } }
```

Claude Desktop one-click: download `port402-memory.mcpb` from the [latest release](https://github.com/Tifdt/port402-memory-mcp/releases/latest) and open it.

Use a dedicated wallet with only a few dollars of USDC on Base.

## HTTP API (without MCP)

`https://port-402-production.up.railway.app` — catalog at `/pricing.json`, `/openapi.json`, `/llms.txt`, terms at `/terms`.

Operated by Faloria — Florian Folio EI (France).

- MCP Registry name: `mcp-name: io.github.Tifdt/port402-memory`
