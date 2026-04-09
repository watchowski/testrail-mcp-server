#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TestRailsClient } from "./client.js";
import { registerCaseTools } from "./tools/cases.js";
import { registerRunTools } from "./tools/runs.js";
import { registerPlanTools } from "./tools/plans.js";
import { registerSectionTools } from "./tools/sections.js";
import { registerSystemTools } from "./tools/system.js";
import { registerResources } from "./resources.js";

const { TESTRAILS_URL, TESTRAILS_API_KEY, TESTRAILS_USERNAME } = process.env;

if (!TESTRAILS_URL || !TESTRAILS_API_KEY || !TESTRAILS_USERNAME) {
  console.error("Missing required environment variables: TESTRAILS_URL, TESTRAILS_API_KEY, TESTRAILS_USERNAME");
  process.exit(1);
}

const client = new TestRailsClient(TESTRAILS_URL, TESTRAILS_API_KEY, TESTRAILS_USERNAME);

const server = new McpServer(
  { name: "testrails-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

registerSystemTools(server, client);
registerCaseTools(server, client);
registerSectionTools(server, client);
registerRunTools(server, client);
registerPlanTools(server, client);
registerResources(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TestRails MCP Server running on stdio");
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
