// Runs the unpacked .mcpb bundle (path in argv[2]) and makes one real paid read ($0.001).
import { readFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const { privateKey } = JSON.parse(await readFile("../data/first-payer-mainnet.json", "utf8"));
const transport = new StdioClientTransport({ command: process.execPath, args: [`${process.argv[2]}/index.js`], cwd: process.argv[2], env: { ...process.env, PORT402_PRIVATE_KEY: privateKey, PORT402_MAX_USD_PER_CALL: "0.01" } });
const client = new Client({ name: "bundle-test", version: "1.0.0" });
await client.connect(transport);
console.log("tools:", (await client.listTools()).tools.map((t) => t.name).join(", "));
const r = await client.callTool({ name: "memory_get", arguments: { key: "mcp-test" } });
console.log("memory_get", r.isError ? "ERROR" : "OK", r.content[0].text);
await client.close();
