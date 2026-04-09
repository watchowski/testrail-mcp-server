import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TestRailsClient } from "../client.js";

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerRunTools(server: McpServer, client: TestRailsClient): void {
  server.registerTool(
    "get_test_runs",
    {
      title: "Get Test Runs",
      description: "Retrieve test runs from a specific project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        isCompleted: z.boolean().optional().describe("Filter by completion status"),
        suiteId: z.number().optional().describe("Filter by suite ID"),
      },
    },
    async ({ projectId, isCompleted, suiteId }) => {
      try {
        const filters = {
          ...(isCompleted !== undefined && { is_completed: isCompleted }),
          ...(suiteId && { suite_id: suiteId }),
        };
        const testRuns = await client.getTestRuns(projectId, filters);
        return { content: [{ type: "text", text: JSON.stringify(testRuns, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test runs: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_test_run",
    {
      title: "Get Test Run",
      description: "Get details of a specific test run",
      inputSchema: {
        runId: z.number().describe("The ID of the test run"),
      },
    },
    async ({ runId }) => {
      try {
        const run = await client.getTestRun(runId);
        return { content: [{ type: "text", text: JSON.stringify(run, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test run: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_test_run",
    {
      title: "Create Test Run",
      description: "Create a new test run in TestRails",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        name: z.string().describe("Name of the test run"),
        description: z.string().optional().describe("Description of the test run"),
        suiteId: z.number().optional().describe("Suite ID to include in the test run"),
        caseIds: z.array(z.number()).optional().describe("Specific test case IDs to include"),
        milestoneId: z.number().optional().describe("Milestone ID to associate with the run"),
      },
    },
    async ({ projectId, name, description, suiteId, caseIds, milestoneId }) => {
      try {
        const data = {
          name,
          ...(description && { description }),
          ...(suiteId && { suite_id: suiteId }),
          ...(caseIds && caseIds.length > 0 && { case_ids: caseIds }),
          ...(milestoneId && { milestone_id: milestoneId }),
        };
        const testRun = await client.createTestRun(projectId, data);
        return { content: [{ type: "text", text: `Test run created successfully:\n${JSON.stringify(testRun, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error creating test run: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "update_test_run",
    {
      title: "Update Test Run",
      description: "Update an existing test run",
      inputSchema: {
        runId: z.number().describe("The ID of the test run to update"),
        name: z.string().optional().describe("New name for the test run"),
        description: z.string().optional().describe("New description for the test run"),
        milestoneId: z.number().optional().describe("New milestone ID"),
        includeAll: z.boolean().optional().describe("Include all test cases"),
      },
    },
    async ({ runId, name, description, milestoneId, includeAll }) => {
      try {
        const updates = {
          ...(name && { name }),
          ...(description && { description }),
          ...(milestoneId && { milestone_id: milestoneId }),
          ...(includeAll !== undefined && { include_all: includeAll }),
        };
        const result = await client.updateTestRun(runId, updates);
        return { content: [{ type: "text", text: `Test run updated successfully:\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error updating test run: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "close_test_run",
    {
      title: "Close Test Run",
      description: "Close an active test run",
      inputSchema: {
        runId: z.number().describe("The ID of the test run to close"),
      },
    },
    async ({ runId }) => {
      try {
        const result = await client.closeTestRun(runId);
        return { content: [{ type: "text", text: `Test run closed successfully:\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error closing test run: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "delete_test_run",
    {
      title: "Delete Test Run",
      description: "Permanently delete a test run",
      inputSchema: {
        runId: z.number().describe("The ID of the test run to delete"),
      },
    },
    async ({ runId }) => {
      try {
        await client.deleteTestRun(runId);
        return { content: [{ type: "text", text: `Test run ${runId} deleted successfully` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error deleting test run: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "find_test_run_by_title",
    {
      title: "Find Test Run by Title",
      description: "Search for test runs whose title contains the given string (case-insensitive)",
      inputSchema: {
        projectId: z.number().describe("The ID of the project to search in"),
        title: z.string().describe("The title (or partial title) to search for"),
        suiteId: z.number().optional().describe("Optional suite ID to narrow the search"),
        includeCompleted: z.boolean().optional().describe("Include completed runs in the search (default: false)"),
      },
    },
    async ({ projectId, title, suiteId, includeCompleted }) => {
      try {
        const filters = {
          ...(suiteId && { suite_id: suiteId }),
          ...(includeCompleted !== true && { is_completed: false }),
        };
        const runs = await client.getTestRuns(projectId, filters);
        const matches = runs.filter(r => r.name.toLowerCase().includes(title.toLowerCase()));
        if (matches.length === 0) {
          return { content: [{ type: "text", text: `No test runs found matching title: "${title}"` }] };
        }
        return { content: [{ type: "text", text: `Found ${matches.length} test run(s) matching "${title}":\n${JSON.stringify(matches, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error searching test runs by title: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_tests",
    {
      title: "Get Tests",
      description: "Retrieve test instances from a test run",
      inputSchema: {
        runId: z.number().describe("The ID of the test run"),
        statusId: z.number().optional().describe("Filter by status ID"),
        assignedtoId: z.number().optional().describe("Filter by assigned user ID"),
      },
    },
    async ({ runId, statusId, assignedtoId }) => {
      try {
        const filters = {
          ...(statusId && { status_id: statusId }),
          ...(assignedtoId && { assignedto_id: assignedtoId }),
        };
        const tests = await client.getTests(runId, filters);
        return { content: [{ type: "text", text: JSON.stringify(tests, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching tests: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_test_results",
    {
      title: "Get Test Results",
      description: "Retrieve test results for a specific test run",
      inputSchema: {
        runId: z.number().describe("The ID of the test run"),
        statusId: z.number().optional().describe("Filter by status ID"),
      },
    },
    async ({ runId, statusId }) => {
      try {
        const filters = {
          ...(statusId && { status_id: statusId }),
        };
        const testResults = await client.getTestResults(runId, filters);
        return { content: [{ type: "text", text: JSON.stringify(testResults, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test results: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_test_result",
    {
      title: "Add Test Result",
      description: "Add a test result to a specific test",
      inputSchema: {
        testId: z.number().describe("The ID of the test"),
        statusId: z.number().describe("Status ID (1=Passed, 2=Blocked, 3=Untested, 4=Retest, 5=Failed)"),
        comment: z.string().optional().describe("Comment for the test result"),
        elapsed: z.string().optional().describe("Time elapsed (e.g., '5m', '1h 30m')"),
        defects: z.string().optional().describe("Defect IDs (comma-separated)"),
      },
    },
    async ({ testId, statusId, comment, elapsed, defects }) => {
      try {
        const data = {
          status_id: statusId,
          ...(comment && { comment }),
          ...(elapsed && { elapsed }),
          ...(defects && { defects }),
        };
        const result = await client.addTestResult(testId, data);
        return { content: [{ type: "text", text: `Test result added successfully:\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error adding test result: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_test_results",
    {
      title: "Add Multiple Test Results",
      description: "Add multiple test results to a test run at once",
      inputSchema: {
        runId: z.number().describe("The ID of the test run"),
        results: z.array(z.object({
          test_id: z.number().describe("Test ID"),
          status_id: z.number().describe("Status ID"),
          comment: z.string().optional().describe("Comment"),
          elapsed: z.string().optional().describe("Time elapsed"),
          defects: z.string().optional().describe("Defect IDs"),
        })).describe("Array of test results"),
      },
    },
    async ({ runId, results }) => {
      try {
        const result = await client.addTestResults(runId, results);
        return { content: [{ type: "text", text: `Test results added successfully:\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error adding test results: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_runs_with_results",
    {
      title: "Get Runs with Results",
      description: "Retrieve all test runs for a project (open, closed, or both) and include the test instances with their current status for each run",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        isCompleted: z.boolean().optional().describe("Filter by completion status. Omit to get both open and closed runs"),
        suiteId: z.number().optional().describe("Filter by suite ID"),
      },
    },
    async ({ projectId, isCompleted, suiteId }) => {
      try {
        const filters = {
          ...(isCompleted !== undefined && { is_completed: isCompleted }),
          ...(suiteId && { suite_id: suiteId }),
        };
        const runs = await client.getTestRuns(projectId, filters);
        const runsWithResults = await Promise.all(
          runs.map(async (run) => {
            const tests = await client.getTests(run.id);
            return { ...run, tests };
          })
        );
        return { content: [{ type: "text", text: JSON.stringify(runsWithResults, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching runs with results: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "find_test_run",
    {
      title: "Find Test Run by Name or Reference",
      description: "Search for a test run by matching against its name or description. Searches both open and closed runs by default.",
      inputSchema: {
        projectId: z.number().describe("The ID of the project to search in"),
        query: z.string().describe("The string to search for in the run name or description (case-insensitive)"),
        suiteId: z.number().optional().describe("Optional suite ID to narrow the search"),
        isCompleted: z.boolean().optional().describe("Filter by completion status. Omit to search both open and closed runs"),
      },
    },
    async ({ projectId, query, suiteId, isCompleted }) => {
      try {
        const filters = {
          ...(suiteId && { suite_id: suiteId }),
          ...(isCompleted !== undefined && { is_completed: isCompleted }),
        };
        const runs = await client.getTestRuns(projectId, filters);
        const q = query.toLowerCase();
        const matches = runs.filter(r =>
          r.name.toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
        );
        if (matches.length === 0) {
          return { content: [{ type: "text", text: `No test runs found matching: "${query}"` }] };
        }
        return { content: [{ type: "text", text: `Found ${matches.length} test run(s) matching "${query}":\n${JSON.stringify(matches, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error searching test runs: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "add_test_result_for_case",
    {
      title: "Add Test Result for Case",
      description: "Add a test result for a specific case in a test run",
      inputSchema: {
        runId: z.number().describe("The ID of the test run"),
        caseId: z.number().describe("The ID of the test case"),
        statusId: z.number().describe("Status ID (1=Passed, 2=Blocked, 3=Untested, 4=Retest, 5=Failed)"),
        comment: z.string().optional().describe("Comment for the test result"),
        elapsed: z.string().optional().describe("Time elapsed (e.g., '5m', '1h 30m')"),
        defects: z.string().optional().describe("Defect IDs (comma-separated)"),
      },
    },
    async ({ runId, caseId, statusId, comment, elapsed, defects }) => {
      try {
        const data = {
          status_id: statusId,
          ...(comment && { comment }),
          ...(elapsed && { elapsed }),
          ...(defects && { defects }),
        };
        const result = await client.addTestResultForCase(runId, caseId, data);
        return { content: [{ type: "text", text: `Test result added successfully:\n${JSON.stringify(result, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error adding test result for case: ${errMsg(error)}` }], isError: true };
      }
    }
  );
}
