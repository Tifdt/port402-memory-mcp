#!/usr/bin/env node
// Port 402 Memory — MCP server. Gives an agent persistent memory, paid per call (x402, USDC on Base).
// The agent's wallet pays and is also its private namespace. Hard spending cap per call.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { privateKeyToAccount } from "viem/accounts";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";

const BASE = (process.env.PORT402_URL || "https://port-402-production.up.railway.app").replace(/\/$/, "");
const KEY = process.env.PORT402_PRIVATE_KEY;
const MAX_ATOMIC = BigInt(Math.round(Number(process.env.PORT402_MAX_USD_PER_CALL || "0.01") * 1e6));

let payFetch = null;
if (KEY) {
  const client = new x402Client();
  client.register("eip155:8453", new ExactEvmScheme(privateKeyToAccount(KEY)));
  client.registerPolicy((version, reqs) => reqs.filter((r) => BigInt(r.amount) <= MAX_ATOMIC));
  payFetch = wrapFetchWithPayment(fetch, client);
}

const text = (obj) => ({ content: [{ type: "text", text: typeof obj === "string" ? obj : JSON.stringify(obj) }] });
async function call(method, path, body) {
  if (!payFetch) return text("PORT402_PRIVATE_KEY is not set: add the private key of a Base wallet holding a little USDC (e.g. $1 = 500+ writes).");
  const res = await payFetch(BASE + path, {
    method,
    headers: body ? { "content-type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ...text({ status: res.status, ...data }), isError: true };
  return text(data);
}

const keySchema = z.string().regex(/^[A-Za-z0-9._:-]{1,128}$/).describe("Memory key, e.g. 'notes' or 'project:todo'");
const server = new McpServer({ name: "port402-memory", version: "1.0.0" });

server.tool("memory_set", "Save a JSON value under a key in your persistent memory ($0.002). Survives restarts and sessions.",
  { key: keySchema, value: z.any().describe("Any JSON value, max 64 KB") },
  ({ key, value }) => call("PUT", `/v1/memory/${key}`, { value }));
server.tool("memory_get", "Read a value back from your persistent memory ($0.001).",
  { key: keySchema },
  ({ key }) => call("GET", `/v1/memory/${key}`));
server.tool("memory_list", "List the keys in your persistent memory ($0.001).", {},
  () => call("GET", "/v1/memory"));

await server.connect(new StdioServerTransport());
