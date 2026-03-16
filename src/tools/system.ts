import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TestRailsClient } from "../client.js";

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerSystemTools(server: McpServer, client: TestRailsClient): void {
  server.registerTool(
    "get_projects",
    {
      title: "Get TestRails Projects",
      description: "Retrieve all projects from TestRails",
      inputSchema: {},
    },
    async () => {
      try {
        const projects = await client.getProjects();
        return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching projects: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_project",
    {
      title: "Get Project",
      description: "Get details of a specific project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
      },
    },
    async ({ projectId }) => {
      try {
        const project = await client.getProject(projectId);
        return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching project: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_test_suites",
    {
      title: "Get Test Suites",
      description: "Retrieve test suites from a specific project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
      },
    },
    async ({ projectId }) => {
      try {
        const testSuites = await client.getTestSuites(projectId);
        return { content: [{ type: "text", text: JSON.stringify(testSuites, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test suites: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_test_suite",
    {
      title: "Get Test Suite",
      description: "Get details of a specific test suite",
      inputSchema: {
        suiteId: z.number().describe("The ID of the test suite"),
      },
    },
    async ({ suiteId }) => {
      try {
        const suite = await client.getTestSuite(suiteId);
        return { content: [{ type: "text", text: JSON.stringify(suite, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test suite: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_users",
    {
      title: "Get Users",
      description: "Retrieve all users from TestRails",
      inputSchema: {},
    },
    async () => {
      try {
        const users = await client.getUsers();
        return { content: [{ type: "text", text: JSON.stringify(users, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching users: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_user",
    {
      title: "Get User",
      description: "Get details of a specific user",
      inputSchema: {
        userId: z.number().describe("The ID of the user"),
      },
    },
    async ({ userId }) => {
      try {
        const user = await client.getUser(userId);
        return { content: [{ type: "text", text: JSON.stringify(user, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching user: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_test_statuses",
    {
      title: "Get Test Statuses",
      description: "Retrieve all available test statuses from TestRails",
      inputSchema: {},
    },
    async () => {
      try {
        const statuses = await client.getStatuses();
        return { content: [{ type: "text", text: JSON.stringify(statuses, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test statuses: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_case_types",
    {
      title: "Get Case Types",
      description: "Retrieve all available case types",
      inputSchema: {},
    },
    async () => {
      try {
        const caseTypes = await client.getCaseTypes();
        return { content: [{ type: "text", text: JSON.stringify(caseTypes, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching case types: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_case_fields",
    {
      title: "Get Case Fields",
      description: "Retrieve all available custom fields for test cases",
      inputSchema: {},
    },
    async () => {
      try {
        const fields = await client.getCaseFields();
        return { content: [{ type: "text", text: JSON.stringify(fields, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching case fields: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_result_fields",
    {
      title: "Get Result Fields",
      description: "Retrieve all available custom fields for test results",
      inputSchema: {},
    },
    async () => {
      try {
        const fields = await client.getResultFields();
        return { content: [{ type: "text", text: JSON.stringify(fields, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching result fields: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_priorities",
    {
      title: "Get Priorities",
      description: "Retrieve all available priorities",
      inputSchema: {},
    },
    async () => {
      try {
        const priorities = await client.getPriorities();
        return { content: [{ type: "text", text: JSON.stringify(priorities, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching priorities: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_templates",
    {
      title: "Get Templates",
      description: "Retrieve available test case templates for a project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
      },
    },
    async ({ projectId }) => {
      try {
        const templates = await client.getTemplates(projectId);
        return { content: [{ type: "text", text: JSON.stringify(templates, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching templates: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_reports",
    {
      title: "Get Reports",
      description: "Retrieve available reports for a project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
      },
    },
    async ({ projectId }) => {
      try {
        const reports = await client.getReports(projectId);
        return { content: [{ type: "text", text: JSON.stringify(reports, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching reports: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "run_report",
    {
      title: "Run Report",
      description: "Execute a report template and retrieve the results",
      inputSchema: {
        reportTemplateId: z.number().describe("The ID of the report template to run"),
      },
    },
    async ({ reportTemplateId }) => {
      try {
        const result = await client.runReport(reportTemplateId);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error running report: ${errMsg(error)}` }], isError: true };
      }
    }
  );
}
