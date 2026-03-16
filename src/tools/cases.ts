import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TestRailsClient } from "../client.js";

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerCaseTools(server: McpServer, client: TestRailsClient): void {
  server.registerTool(
    "get_test_cases",
    {
      title: "Get Test Cases",
      description: "Retrieve test cases from a specific project and optional suite/section",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        suiteId: z.number().optional().describe("Optional suite ID to filter test cases"),
        sectionId: z.number().optional().describe("Optional section ID to filter test cases"),
      },
    },
    async ({ projectId, suiteId, sectionId }) => {
      try {
        const testCases = await client.getTestCases(projectId, suiteId, sectionId);
        return { content: [{ type: "text", text: JSON.stringify(testCases, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test cases: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_test_case",
    {
      title: "Get Test Case",
      description: "Get details of a specific test case",
      inputSchema: {
        caseId: z.number().describe("The ID of the test case"),
      },
    },
    async ({ caseId }) => {
      try {
        const testCase = await client.getTestCase(caseId);
        return { content: [{ type: "text", text: JSON.stringify(testCase, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test case: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_test_case",
    {
      title: "Create Test Case",
      description: "Create a new test case in TestRails",
      inputSchema: {
        sectionId: z.number().describe("The ID of the section where the test case will be created"),
        title: z.string().describe("Title of the test case"),
        description: z.string().optional().describe("Description/steps of the test case"),
        priority: z.number().optional().describe("Priority ID (1=Low, 2=Medium, 3=High, 4=Critical)"),
        refs: z.string().optional().describe("Reference field for the test case (e.g., ticket ID)"),
      },
    },
    async ({ sectionId, title, description, priority, refs }) => {
      try {
        const data = {
          title,
          ...(description && { custom_steps_separated: description }),
          ...(priority && { priority_id: priority }),
          ...(refs && { refs }),
        };
        const testCase = await client.createTestCase(sectionId, data);
        return { content: [{ type: "text", text: `Test case created successfully:\n${JSON.stringify(testCase, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error creating test case: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_multiple_test_cases",
    {
      title: "Create Multiple Test Cases",
      description: "Create multiple test cases at once in a specific section",
      inputSchema: {
        sectionId: z.number().describe("The ID of the section where the test cases will be created"),
        testCases: z.array(z.object({
          title: z.string().describe("Title of the test case"),
          description: z.string().optional().describe("Description/steps of the test case"),
          priority: z.number().optional().describe("Priority ID (1=Low, 2=Medium, 3=High, 4=Critical)"),
          refs: z.string().optional().describe("Reference field for the test case"),
          preconditions: z.string().optional().describe("Preconditions for the test case"),
          template_id: z.number().optional().describe("Template ID (default: 1 for Test Case Text)"),
          type_id: z.number().optional().describe("Test case type ID (default: 1 for Acceptance)"),
        })).describe("Array of test cases to create"),
      },
    },
    async ({ sectionId, testCases }) => {
      try {
        const result = await client.createMultipleTestCases(sectionId, testCases);
        const summary = {
          totalAttempted: result.totalAttempted,
          totalSuccessful: result.totalSuccessful,
          totalFailed: result.totalFailed,
          successfulCases: result.results.map(r => ({ id: r.testCase.id, title: r.testCase.title, index: r.index })),
          failedCases: result.errors.map(e => ({ title: e.testCase.title, error: e.error, index: e.index })),
        };
        return { content: [{ type: "text", text: `Bulk test case creation completed:\n${JSON.stringify(summary, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error creating multiple test cases: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_test_case",
    {
      title: "Update Test Case",
      description: "Update an existing test case",
      inputSchema: {
        caseId: z.number().describe("The ID of the test case to update"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description/steps"),
        priorityId: z.number().optional().describe("New priority ID"),
        typeId: z.number().optional().describe("New type ID"),
      },
    },
    async ({ caseId, title, description, priorityId, typeId }) => {
      try {
        const updates = {
          ...(title && { title }),
          ...(description && { custom_steps_separated: description }),
          ...(priorityId && { priority_id: priorityId }),
          ...(typeId && { type_id: typeId }),
        };
        const result = await client.updateTestCase(caseId, updates);
        return { content: [{ type: "text", text: `Test case updated successfully:\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error updating test case: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "delete_test_case",
    {
      title: "Delete Test Case",
      description: "Permanently delete a test case",
      inputSchema: {
        caseId: z.number().describe("The ID of the test case to delete"),
      },
    },
    async ({ caseId }) => {
      try {
        await client.deleteTestCase(caseId);
        return { content: [{ type: "text", text: `Test case ${caseId} deleted successfully` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error deleting test case: ${errMsg(error)}` }], isError: true };
      }
    }
  );
}
