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
    "find_test_cases_by_ref",
    {
      title: "Find Test Cases by Reference",
      description: "Search for test cases that match one or more reference values (e.g., ticket IDs like 'TFX-18' or 'TFX-18,TFX-42')",
      inputSchema: {
        projectId: z.number().describe("The ID of the project to search in"),
        refs: z.string().describe("Comma-separated list of references to search for (e.g., 'TFX-18' or 'TFX-18,TFX-42')"),
        suiteId: z.number().optional().describe("Optional suite ID to narrow the search"),
        sectionId: z.number().optional().describe("Optional section ID to narrow the search"),
      },
    },
    async ({ projectId, refs, suiteId, sectionId }) => {
      try {
        const testCases = await client.getTestCases(projectId, suiteId, sectionId, { refs_filter: refs });
        if (testCases.length === 0) {
          return { content: [{ type: "text", text: `No test cases found for reference(s): ${refs}` }] };
        }
        return { content: [{ type: "text", text: `Found ${testCases.length} test case(s) for reference(s) "${refs}":\n${JSON.stringify(testCases, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error searching test cases by reference: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_multiple_test_cases",
    {
      title: "Update Multiple Test Cases",
      description: "Apply the same field updates to multiple test cases at once",
      inputSchema: {
        caseIds: z.array(z.number()).describe("List of test case IDs to update"),
        title: z.string().optional().describe("New title to set on all cases"),
        description: z.string().optional().describe("New description/steps to set on all cases"),
        priorityId: z.number().optional().describe("New priority ID (1=Low, 2=Medium, 3=High, 4=Critical)"),
        typeId: z.number().optional().describe("New type ID"),
        refs: z.string().optional().describe("New refs value to set on all cases (replaces existing refs)"),
        addTag: z.string().optional().describe("Tag to append to each case without removing existing tags (e.g. 'regression', 'smoke')"),
      },
    },
    async ({ caseIds, title, description, priorityId, typeId, refs, addTag }) => {
      try {
        const updates = {
          ...(title && { title }),
          ...(description && { custom_steps_separated: description }),
          ...(priorityId && { priority_id: priorityId }),
          ...(typeId && { type_id: typeId }),
          ...(refs !== undefined && { refs }),
        };
        const bulkUpdates = caseIds.map(caseId => ({ caseId, updates }));
        const result = await client.updateMultipleTestCases(bulkUpdates, addTag);
        const summary = {
          totalAttempted: result.totalAttempted,
          totalSuccessful: result.totalSuccessful,
          totalFailed: result.totalFailed,
          updatedCases: result.results.map(r => ({ id: r.testCase.id, title: r.testCase.title })),
          failedCases: result.errors.map(e => ({ caseId: e.caseId, error: e.error })),
        };
        return { content: [{ type: "text", text: `Bulk test case update completed:\n${JSON.stringify(summary, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error updating multiple test cases: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_tag_to_test_cases",
    {
      title: "Add Tag to Test Cases",
      description: "Add a tag (ref) to one or more test cases without removing existing tags",
      inputSchema: {
        caseIds: z.array(z.number()).describe("List of test case IDs to tag"),
        tag: z.string().describe("The tag to add (e.g., 'regression', 'smoke', 'TFX-42')"),
      },
    },
    async ({ caseIds, tag }) => {
      try {
        const result = await client.addTagToTestCases(caseIds, tag);
        const summary = {
          tag,
          totalAttempted: result.totalAttempted,
          totalSuccessful: result.totalSuccessful,
          totalFailed: result.totalFailed,
          taggedCases: result.results.map(r => ({ id: r.testCase.id, title: r.testCase.title, refs: r.testCase.refs })),
          failedCases: result.errors.map(e => ({ caseId: e.caseId, error: e.error })),
        };
        return { content: [{ type: "text", text: `Tag "${tag}" added to test cases:\n${JSON.stringify(summary, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error adding tag to test cases: ${errMsg(error)}` }], isError: true };
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
