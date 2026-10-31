// Real end-to-end test: starts the MCP server, calls its 3 tools, pays Port 402 with the test wallet.
// Run from mcp/: node test-client.mjs   (spends ~$0.004 of the test wallet's USDC)
import { readFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const { privateKey } = JSON.parse(await readFile("../data/first-payer-mainnet.json", "utf8"));
const transport = new StdioClientTransport({ command: process.execPath, args: ["index.js"], env: { ...process.env, PORT402_PRIVATE_KEY: privateKey } });
const client = new Client({ name: "test", version: "1.0.0" });
await client.connect(transport);
console.log("tools:", (await client.listTools()).tools.map((t) => t.name).join(", "));
for (const [name, args] of [["memory_set", { key: "mcp-test", value: { ok: "from MCP" } }], ["memory_get", { key: "mcp-test" }], ["memory_list", {}]]) {
  const r = await client.callTool({ name, arguments: args });
  console.log(name, r.isError ? "ERROR" : "OK", r.content[0].text);
}
await client.close();
