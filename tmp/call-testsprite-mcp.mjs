import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { cwd } from "node:process";

const mcpConfig = JSON.parse(readFileSync(".vscode/mcp.json", "utf8"));
const apiKey = mcpConfig?.servers?.testsprite?.env?.API_KEY;

if (!apiKey || apiKey === "your-testsprite-api-key") {
  throw new Error("Missing TestSprite API key in .vscode/mcp.json");
}

const child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx.cmd @testsprite/testsprite-mcp@latest server"], {
  cwd: cwd(),
  env: { ...process.env, API_KEY: apiKey },
  stdio: ["pipe", "pipe", "pipe"],
});

let nextId = 1;
let buffer = Buffer.alloc(0);
const pending = new Map();

function send(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`);
  child.stdin.write(body);
}

function request(method, params = {}) {
  const id = nextId++;
  send({ jsonrpc: "2.0", id, method, params });
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

function notification(method, params = {}) {
  send({ jsonrpc: "2.0", method, params });
}

function parseFrames() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      throw new Error(`Invalid MCP frame header: ${header}`);
    }

    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) return;

    const body = buffer.subarray(bodyStart, bodyEnd).toString("utf8");
    buffer = buffer.subarray(bodyEnd);
    const message = JSON.parse(body);

    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  }
}

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  parseFrames();
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
});

child.on("exit", (code) => {
  for (const { reject } of pending.values()) {
    reject(new Error(`MCP server exited with code ${code}`));
  }
});

const projectPath = cwd();

try {
  await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "codex-local-testsprite-runner", version: "1.0.0" },
  });
  notification("notifications/initialized");

  const result = await request("tools/call", {
    name: "testsprite_generate_code_and_execute",
    arguments: {
      projectName: "payroll-frontend",
      projectPath,
      testIds: [],
      additionalInstruction:
        "Use the existing TESTSPRITE_PRD.md and seeded admin credentials. Focus on login, protected routing, backend-driven navigation, and core payroll/attendance/report smoke flows.",
      serverMode: "development",
    },
  });

  console.log(JSON.stringify(result, null, 2));
} finally {
  child.kill();
}
