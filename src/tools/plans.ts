import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { TestRailsClient } from "../client.js";

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function registerPlanTools(server: McpServer, client: TestRailsClient): void {
  server.registerTool(
    "get_test_plans",
    {
      title: "Get Test Plans",
      description: "Retrieve test plans from a specific project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        isCompleted: z.boolean().optional().describe("Filter by completion status"),
        createdAfter: z.string().optional().describe("Filter by creation date (Unix timestamp)"),
      },
    },
    async ({ projectId, isCompleted, createdAfter }) => {
      try {
        const filters = {
          ...(isCompleted !== undefined && { is_completed: isCompleted }),
          ...(createdAfter && { created_after: createdAfter }),
        };
        const plans = await client.getTestPlans(projectId, filters);
        return { content: [{ type: "text", text: JSON.stringify(plans, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching test plans: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_test_plan",
    {
      title: "Create Test Plan",
      description: "Create a new test plan in TestRails",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        name: z.string().describe("Name of the test plan"),
        description: z.string().optional().describe("Description of the test plan"),
        milestoneId: z.number().optional().describe("Milestone ID to associate with the plan"),
      },
    },
    async ({ projectId, name, description, milestoneId }) => {
      try {
        const data = {
          name,
          ...(description && { description }),
          ...(milestoneId && { milestone_id: milestoneId }),
        };
        const plan = await client.createTestPlan(projectId, data);
        return { content: [{ type: "text", text: `Test plan created successfully:\n${JSON.stringify(plan, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error creating test plan: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_milestones",
    {
      title: "Get Milestones",
      description: "Retrieve milestones from a specific project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        isCompleted: z.boolean().optional().describe("Filter by completion status"),
        isStarted: z.boolean().optional().describe("Filter by start status"),
      },
    },
    async ({ projectId, isCompleted, isStarted }) => {
      try {
        const filters = {
          ...(isCompleted !== undefined && { is_completed: isCompleted }),
          ...(isStarted !== undefined && { is_started: isStarted }),
        };
        const milestones = await client.getMilestones(projectId, filters);
        return { content: [{ type: "text", text: JSON.stringify(milestones, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching milestones: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "get_milestone",
    {
      title: "Get Milestone",
      description: "Get details of a specific milestone",
      inputSchema: {
        milestoneId: z.number().describe("The ID of the milestone"),
      },
    },
    async ({ milestoneId }) => {
      try {
        const milestone = await client.getMilestone(milestoneId);
        return { content: [{ type: "text", text: JSON.stringify(milestone, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error fetching milestone: ${errMsg(error)}` }], isError: true };
      }
    }
  );

  server.registerTool(
    "create_milestone",
    {
      title: "Create Milestone",
      description: "Create a new milestone in a project",
      inputSchema: {
        projectId: z.number().describe("The ID of the project"),
        name: z.string().describe("Name of the milestone"),
        description: z.string().optional().describe("Description of the milestone"),
        dueOn: z.string().optional().describe("Due date (Unix timestamp)"),
        parentId: z.number().optional().describe("Parent milestone ID"),
      },
    },
    async ({ projectId, name, description, dueOn, parentId }) => {
      try {
        const data = {
          name,
          ...(description && { description }),
          ...(dueOn && { due_on: dueOn }),
          ...(parentId && { parent_id: parentId }),
        };
        const milestone = await client.createMilestone(projectId, data);
        return { content: [{ type: "text", text: `Milestone created successfully:\n${JSON.stringify(milestone, null, 2)}` }] };
      } catch (error) {
        return { content: [{ type: "text", text: `Error creating milestone: ${errMsg(error)}` }], isError: true };
      }
    }
  );
}
