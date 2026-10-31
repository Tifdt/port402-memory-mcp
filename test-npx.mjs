// Installs the server the way users do (npx from GitHub) and lists its tools. No payment.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "npx", args: ["-y", "github:Tifdt/port402-memory-mcp"], env: { ...process.env, PORT402_PRIVATE_KEY: "0x" + "11".repeat(32) } });
const client = new Client({ name: "npx-test", version: "1.0.0" });
await client.connect(transport);
console.log("npx install OK, tools:", (await client.listTools()).tools.map((t) => t.name).join(", "));
await client.close();
