import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const widgetHtml = readFileSync("public/widget.html", "utf8");

function createReflectionServer() {
  const server = new McpServer({
    name: "reflect-buddy-local",
    version: "0.1.0",
  });

  // Widget resource
  server.registerResource(
    "widget",
    "ui://widget/reflect-buddy.html",
    {},
    async () => ({
      contents: [
        {
          uri: "ui://widget/reflect-buddy.html",
          mimeType: "text/html+skybridge",
          text: widgetHtml,
          _meta: { "openai/widgetPrefersBorder": true },
        },
      ],
    }),
  );

  // Tool: open panel (renders widget)
  server.registerTool(
    "open_reflection_panel",
    {
      title: "Open Reflect Buddy",
      description: "Opens the Reflect Buddy widget.",
      inputSchema: {},
      _meta: {
        "openai/outputTemplate": "ui://widget/reflect-buddy.html",
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking": "Opening Reflect Buddy",
        "openai/toolInvocation/invoked": "Reflect Buddy is open",
      },
    },
    async () => ({
      content: [{ type: "text", text: "Opened Reflect Buddy." }],
      structuredContent: {},
    }),
  );

  return server;
}

const port = Number(process.env.PORT ?? 8787);
const MCP_PATH = "/mcp";

const sessions = new Map();

const httpServer = createServer(async (req, res) => {
  if (!req.url) return res.writeHead(400).end("Missing URL");

  const host = req.headers.host || "localhost";
  const url = new URL(req.url, `http://${host}`);

  // CORS preflight
  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    return res.end();
  }

  // Health check
  if (req.method === "GET" && url.pathname === "/") {
    return res
      .writeHead(200, { "content-type": "text/plain" })
      .end("Reflect Buddy local MCP is running");
  }

  if (url.pathname !== MCP_PATH) {
    return res.writeHead(404).end("Not Found");
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId =
    typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

  if (req.method === "DELETE") {
    if (sessionId && sessions.has(sessionId)) {
      const s = sessions.get(sessionId);
      try {
        s.transport.close();
        s.server.close();
      } catch {}
      sessions.delete(sessionId);
    }
    return res.writeHead(204).end();
  }

  if (req.method === "GET" || req.method === "POST") {
    let session = sessionId ? sessions.get(sessionId) : undefined;

    if (!session) {
      const newSessionId = randomUUID();
      const server = createReflectionServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        enableJsonResponse: true,
      });

      await server.connect(transport);
      session = { server, transport };
      sessions.set(newSessionId, session);
      res.setHeader("Mcp-Session-Id", newSessionId);
    }

    try {
      await session.transport.handleRequest(req, res);
    } catch (e) {
      console.error("Error handling MCP request:", e);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(405).end("Method Not Allowed");
});

httpServer.listen(port, () => {
  console.log(
    `Reflect Buddy MCP listening on http://localhost:${port}${MCP_PATH}`,
  );
});
