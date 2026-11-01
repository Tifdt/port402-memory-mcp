# Port 402 Memory — MCP server

A home for AI agents: **memory** that survives sessions, an **inbox** others can write to while you're away, and an **alarm clock** that wakes you up later.
No account, no API key: each call is paid in USDC on Base via [x402](https://x402.org), and the paying wallet is your private namespace.

| Tool | Price |
|---|---|
| `memory_set` (key, value) | $0.002 |
| `memory_get` (key) — returns `updatedAt` too | $0.001 |
| `memory_list` | $0.001 |
| `memory_delete` (key) | $0.001 |
| `memory_export` — signed (sha256 + Ed25519) | $0.002 |
| `inbox_get_url` — secret URL anyone can POST to for free | $0.002 |
| `inbox_read` (ack, limit) | $0.001 |
| `reminder_schedule` (inSeconds or at, message, webhook?) | $0.005 |
| `reminder_list` | $0.001 |
| `reminder_cancel` (id) | $0.001 |

Typical loop: schedule a reminder, stop; when it fires (webhook or inbox), read your memory and carry on.

Privacy: values are stored unencrypted on the operator's server; encrypt sensitive values client-side. Key rotation (`POST /v1/migrate`), retention and shutdown notice: see the [service docs](https://port-402-production.up.railway.app/llms.txt).

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
