import { jest } from "@jest/globals";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TestRailsClient } from "../client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolHandler = (args: Record<string, any>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

/**
 * Creates a minimal McpServer mock that captures registered tool handlers
 * so tests can invoke them directly by name.
 */
export function createMockServer(): {
  server: McpServer;
  getHandler: (name: string) => ToolHandler;
} {
  const handlers: Record<string, ToolHandler> = {};
  const server = {
    registerTool: (name: string, _config: unknown, handler: ToolHandler) => {
      handlers[name] = handler;
    },
  } as unknown as McpServer;
  return { server, getHandler: (name) => handlers[name] };
}

/**
 * Creates a fully mocked TestRailsClient where every method is a jest.fn().
 */
export function createMockClient(): jest.Mocked<TestRailsClient> {
  return {
    getProjects: jest.fn(),
    getProject: jest.fn(),
    getTestCases: jest.fn(),
    getTestCase: jest.fn(),
    createTestCase: jest.fn(),
    createMultipleTestCases: jest.fn(),
    updateTestCase: jest.fn(),
    updateMultipleTestCases: jest.fn(),
    addTagToTestCases: jest.fn(),
    deleteTestCase: jest.fn(),
    getTestSuites: jest.fn(),
    getTestSuite: jest.fn(),
    createTestSuite: jest.fn(),
    getSections: jest.fn(),
    getSection: jest.fn(),
    createSection: jest.fn(),
    deleteSection: jest.fn(),
    getTestRuns: jest.fn(),
    getTestRun: jest.fn(),
    createTestRun: jest.fn(),
    updateTestRun: jest.fn(),
    closeTestRun: jest.fn(),
    deleteTestRun: jest.fn(),
    getTests: jest.fn(),
    getTest: jest.fn(),
    getTestResults: jest.fn(),
    getTestResultsForCase: jest.fn(),
    addTestResult: jest.fn(),
    addTestResults: jest.fn(),
    addTestResultForCase: jest.fn(),
    getTestPlans: jest.fn(),
    getTestPlan: jest.fn(),
    createTestPlan: jest.fn(),
    getMilestones: jest.fn(),
    getMilestone: jest.fn(),
    createMilestone: jest.fn(),
    getUsers: jest.fn(),
    getUser: jest.fn(),
    getStatuses: jest.fn(),
    getCaseTypes: jest.fn(),
    getCaseFields: jest.fn(),
    getResultFields: jest.fn(),
    getPriorities: jest.fn(),
    getTemplates: jest.fn(),
    getReports: jest.fn(),
    runReport: jest.fn(),
  } as unknown as jest.Mocked<TestRailsClient>;
}

/** Parses the JSON text from a tool response content array. */
export function parseResponse(result: Awaited<ReturnType<ToolHandler>>): unknown {
  return JSON.parse(result.content[0].text);
}

/** Returns the plain text from a tool response. */
export function getText(result: Awaited<ReturnType<ToolHandler>>): string {
  return result.content[0].text;
}
