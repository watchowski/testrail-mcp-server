import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TestRailsClient } from "../client.js";

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerSectionTools(server: McpServer, client: TestRailsClient): void {
  server.registerTool(
    "get_sections",
    {
      title: "Get Sections",
      description: "Retrieve sections from a specific project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        suiteId: z.number().optional().describe("Optional suite ID to filter sections"),
      },
    },
    async ({ projectId, suiteId }) => {
      try {
        const sections = await client.getSections(projectId, suiteId);
        return { content: [{ type: "text", text: JSON.stringify(sections, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching sections: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_section",
    {
      title: "Create Section",
      description: "Create a new section in a project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        name: z.string().describe("Name of the section"),
        description: z.string().optional().describe("Description of the section"),
        suiteId: z.number().optional().describe("Suite ID if project uses suites"),
        parentId: z.number().optional().describe("Parent section ID for nested sections"),
      },
    },
    async ({ projectId, name, description, suiteId, parentId }) => {
      try {
        const section = await client.createSection(projectId, name, description, suiteId, parentId);
        return { content: [{ type: "text", text: `Section created successfully:\n${JSON.stringify(section, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error creating section: ${errMsg(error)}` }], isError: true };
      }
    }
  );
}
