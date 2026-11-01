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
const server = new McpServer({ name: "port402-memory", version: "1.2.0" });

server.tool("memory_set", "Save a JSON value under a key in your persistent memory ($0.002). Survives restarts and sessions.",
  { key: keySchema, value: z.any().describe("Any JSON value, max 64 KB") },
  ({ key, value }) => call("PUT", `/v1/memory/${key}`, { value }));
server.tool("memory_get", "Read a value back from your persistent memory ($0.001).",
  { key: keySchema },
  ({ key }) => call("GET", `/v1/memory/${key}`));
server.tool("memory_list", "List the keys in your persistent memory ($0.001).", {},
  () => call("GET", "/v1/memory"));
server.tool("memory_delete", "Delete a key from your persistent memory ($0.001).",
  { key: keySchema },
  ({ key }) => call("DELETE", `/v1/memory/${key}`));
server.tool("memory_export", "Export your whole memory as one JSON document, format port402-memory-export/1 ($0.002). Use it for backups.", {},
  () => call("GET", "/v1/export"));

server.tool("inbox_get_url", "Get your inbox URL ($0.002): a secret address anyone (webhooks, other agents, humans) can POST JSON to for free while you're away. rotate=true issues a new one.",
  { rotate: z.boolean().optional() },
  ({ rotate }) => call("POST", "/v1/inbox", rotate === undefined ? {} : { rotate }));
server.tool("inbox_read", "Read messages waiting in your inbox, oldest first ($0.001). ack=true removes what you read. Due reminders land here too.",
  { ack: z.boolean().optional(), limit: z.number().int().min(1).max(200).optional() },
  ({ ack, limit }) => call("GET", `/v1/inbox?ack=${ack ? "true" : "false"}${limit ? `&limit=${limit}` : ""}`));
server.tool("reminder_schedule", "Alarm clock ($0.005): schedule a message for later (10 s to 366 days). It lands in your inbox when due, and is POSTed to your https webhook if you give one.",
  {
    inSeconds: z.number().min(10).max(31622400).optional().describe("Delay in seconds"),
    at: z.string().optional().describe("ISO 8601 date, alternative to inSeconds"),
    message: z.any().describe("Any JSON, max 16 KB: what you want to be reminded of"),
    webhook: z.string().url().optional().describe("Public https URL to POST the reminder to"),
  },
  ({ inSeconds, at, message, webhook }) => call("POST", "/v1/reminders", { inSeconds, at, message, webhook }));
server.tool("reminder_list", "List your pending reminders ($0.001).", {},
  () => call("GET", "/v1/reminders"));
server.tool("reminder_cancel", "Cancel a pending reminder ($0.001).",
  { id: z.string().regex(/^[0-9a-f]{16}$/) },
  ({ id }) => call("DELETE", `/v1/reminders/${id}`));

await server.connect(new StdioServerTransport());
