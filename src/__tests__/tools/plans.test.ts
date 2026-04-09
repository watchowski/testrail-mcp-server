import { registerPlanTools } from "../../tools/plans.js";
import { createMockServer, createMockClient, getText, parseResponse } from "../helpers.js";

describe("Plan tools", () => {
  let client: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    client = createMockClient();
    const mock = createMockServer();
    getHandler = mock.getHandler;
    registerPlanTools(mock.server, client);
  });

  // ── get_test_plans ────────────────────────────────────────────────────────

  describe("get_test_plans", () => {
    it("fetches plans for a project", async () => {
      const plans = [{ id: 1, name: "Q1 Plan" }];
      client.getTestPlans.mockResolvedValue(plans);

      const result = await getHandler("get_test_plans")({ projectId: 1 });

      expect(client.getTestPlans).toHaveBeenCalledWith(1, {});
      expect(parseResponse(result)).toEqual(plans);
    });

    it("passes isCompleted and createdAfter filters", async () => {
      client.getTestPlans.mockResolvedValue([]);

      await getHandler("get_test_plans")({
        projectId: 1,
        isCompleted: true,
        createdAfter: "1700000000",
      });

      expect(client.getTestPlans).toHaveBeenCalledWith(1, {
        is_completed: true,
        created_after: "1700000000",
      });
    });

    it("returns isError on failure", async () => {
      client.getTestPlans.mockRejectedValue(new Error("Unauthorized"));

      const result = await getHandler("get_test_plans")({ projectId: 1 });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Unauthorized");
    });
  });

  // ── create_test_plan ──────────────────────────────────────────────────────

  describe("create_test_plan", () => {
    it("creates a plan with name only", async () => {
      client.createTestPlan.mockResolvedValue({ id: 10, name: "Sprint Plan" });

      const result = await getHandler("create_test_plan")({ projectId: 1, name: "Sprint Plan" });

      expect(client.createTestPlan).toHaveBeenCalledWith(1, { name: "Sprint Plan" });
      expect(getText(result)).toContain("Test plan created successfully");
    });

    it("includes optional description and milestoneId", async () => {
      client.createTestPlan.mockResolvedValue({ id: 11, name: "Full Plan" });

      await getHandler("create_test_plan")({
        projectId: 1,
        name: "Full Plan",
        description: "All features",
        milestoneId: 5,
      });

      expect(client.createTestPlan).toHaveBeenCalledWith(1, {
        name: "Full Plan",
        description: "All features",
        milestone_id: 5,
      });
    });

    it("returns isError on failure", async () => {
      client.createTestPlan.mockRejectedValue(new Error("Quota exceeded"));

      const result = await getHandler("create_test_plan")({ projectId: 1, name: "Plan" });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_milestones ────────────────────────────────────────────────────────

  describe("get_milestones", () => {
    it("fetches milestones for a project", async () => {
      const milestones = [{ id: 1, name: "v1.0" }];
      client.getMilestones.mockResolvedValue(milestones);

      const result = await getHandler("get_milestones")({ projectId: 2 });

      expect(client.getMilestones).toHaveBeenCalledWith(2, {});
      expect(parseResponse(result)).toEqual(milestones);
    });

    it("passes isCompleted and isStarted filters", async () => {
      client.getMilestones.mockResolvedValue([]);

      await getHandler("get_milestones")({
        projectId: 2,
        isCompleted: false,
        isStarted: true,
      });

      expect(client.getMilestones).toHaveBeenCalledWith(2, {
        is_completed: false,
        is_started: true,
      });
    });

    it("returns isError on failure", async () => {
      client.getMilestones.mockRejectedValue(new Error("Server error"));

      const result = await getHandler("get_milestones")({ projectId: 2 });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_milestone ─────────────────────────────────────────────────────────

  describe("get_milestone", () => {
    it("returns a single milestone", async () => {
      const milestone = { id: 7, name: "v2.0" };
      client.getMilestone.mockResolvedValue(milestone);

      const result = await getHandler("get_milestone")({ milestoneId: 7 });

      expect(client.getMilestone).toHaveBeenCalledWith(7);
      expect(parseResponse(result)).toEqual(milestone);
    });

    it("returns isError on failure", async () => {
      client.getMilestone.mockRejectedValue(new Error("Not found"));

      const result = await getHandler("get_milestone")({ milestoneId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── create_milestone ──────────────────────────────────────────────────────

  describe("create_milestone", () => {
    it("creates a milestone with name only", async () => {
      client.createMilestone.mockResolvedValue({ id: 1, name: "v3.0" });

      const result = await getHandler("create_milestone")({ projectId: 1, name: "v3.0" });

      expect(client.createMilestone).toHaveBeenCalledWith(1, { name: "v3.0" });
      expect(getText(result)).toContain("Milestone created successfully");
    });

    it("includes optional fields", async () => {
      client.createMilestone.mockResolvedValue({ id: 2, name: "v4.0" });

      await getHandler("create_milestone")({
        projectId: 1,
        name: "v4.0",
        description: "Major release",
        dueOn: "1800000000",
        parentId: 1,
      });

      expect(client.createMilestone).toHaveBeenCalledWith(1, {
        name: "v4.0",
        description: "Major release",
        due_on: "1800000000",
        parent_id: 1,
      });
    });

    it("returns isError on failure", async () => {
      client.createMilestone.mockRejectedValue(new Error("Forbidden"));

      const result = await getHandler("create_milestone")({ projectId: 1, name: "x" });

      expect(result.isError).toBe(true);
    });
  });
});
