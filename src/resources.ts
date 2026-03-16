import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TestRailsClient } from "./client.js";

export function registerResources(server: McpServer, client: TestRailsClient): void {
  server.registerResource(
    "projects",
    "testrails://projects",
    {
      title: "TestRails Projects",
      description: "List of all TestRails projects",
      mimeType: "application/json",
    },
    async () => {
      try {
        const projects = await client.getProjects();
        return {
          contents: [{
            uri: "testrails://projects",
            text: JSON.stringify(projects, null, 2),
            mimeType: "application/json",
          }],
        };
      } catch (error) {
        throw new Error(`Error fetching projects: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  server.registerResource(
    "statuses",
    "testrails://statuses",
    {
      title: "TestRails Test Statuses",
      description: "List of all available test statuses",
      mimeType: "application/json",
    },
    async () => {
      try {
        const statuses = await client.getStatuses();
        return {
          contents: [{
            uri: "testrails://statuses",
            text: JSON.stringify(statuses, null, 2),
            mimeType: "application/json",
          }],
        };
      } catch (error) {
        throw new Error(`Error fetching statuses: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
