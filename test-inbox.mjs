// Lists the MCP tools and makes one real paid inbox_read ($0.001) with the test payer.
import { readFile } from "node:fs/promises";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const { privateKey } = JSON.parse(await readFile("../data/first-payer-mainnet.json", "utf8"));
const client = new Client({ name: "test", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: ["index.js"], env: { ...process.env, PORT402_PRIVATE_KEY: privateKey } }));
const tools = (await client.listTools()).tools.map((t) => t.name);
console.log(`${tools.length} tools:`, tools.join(", "));
const r = await client.callTool({ name: "inbox_read", arguments: { ack: true, limit: 5 } });
console.log("inbox_read", r.isError ? "ERROR" : "OK", r.content[0].text.slice(0, 200));
await client.close();
