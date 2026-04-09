import { registerRunTools } from "../../tools/runs.js";
import { createMockServer, createMockClient, getText, parseResponse } from "../helpers.js";

describe("Run tools", () => {
  let client: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    client = createMockClient();
    const mock = createMockServer();
    getHandler = mock.getHandler;
    registerRunTools(mock.server, client);
  });

  // ── get_test_runs ─────────────────────────────────────────────────────────

  describe("get_test_runs", () => {
    it("fetches runs for a project", async () => {
      const runs = [{ id: 1, name: "Sprint 1" }];
      client.getTestRuns.mockResolvedValue(runs);

      const result = await getHandler("get_test_runs")({ projectId: 5 });

      expect(client.getTestRuns).toHaveBeenCalledWith(5, {});
      expect(parseResponse(result)).toEqual(runs);
    });

    it("passes isCompleted and suiteId filters", async () => {
      client.getTestRuns.mockResolvedValue([]);

      await getHandler("get_test_runs")({ projectId: 5, isCompleted: true, suiteId: 2 });

      expect(client.getTestRuns).toHaveBeenCalledWith(5, { is_completed: true, suite_id: 2 });
    });

    it("omits is_completed when not provided", async () => {
      client.getTestRuns.mockResolvedValue([]);

      await getHandler("get_test_runs")({ projectId: 5 });

      expect(client.getTestRuns).toHaveBeenCalledWith(5, {});
    });

    it("returns isError on failure", async () => {
      client.getTestRuns.mockRejectedValue(new Error("Unauthorized"));

      const result = await getHandler("get_test_runs")({ projectId: 5 });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Unauthorized");
    });
  });

  // ── get_test_run ──────────────────────────────────────────────────────────

  describe("get_test_run", () => {
    it("returns a single run", async () => {
      const run = { id: 42, name: "Regression" };
      client.getTestRun.mockResolvedValue(run);

      const result = await getHandler("get_test_run")({ runId: 42 });

      expect(client.getTestRun).toHaveBeenCalledWith(42);
      expect(parseResponse(result)).toEqual(run);
    });

    it("returns isError on failure", async () => {
      client.getTestRun.mockRejectedValue(new Error("Run not found"));

      const result = await getHandler("get_test_run")({ runId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── create_test_run ───────────────────────────────────────────────────────

  describe("create_test_run", () => {
    it("creates a run with required fields", async () => {
      const run = { id: 10, name: "Sprint 2" };
      client.createTestRun.mockResolvedValue(run);

      const result = await getHandler("create_test_run")({ projectId: 1, name: "Sprint 2" });

      expect(client.createTestRun).toHaveBeenCalledWith(1, { name: "Sprint 2" });
      expect(getText(result)).toContain("Test run created successfully");
    });

    it("includes optional fields when provided", async () => {
      client.createTestRun.mockResolvedValue({ id: 11, name: "Full run" });

      await getHandler("create_test_run")({
        projectId: 1,
        name: "Full run",
        description: "All tests",
        suiteId: 3,
        caseIds: [101, 102],
        milestoneId: 5,
      });

      expect(client.createTestRun).toHaveBeenCalledWith(1, {
        name: "Full run",
        description: "All tests",
        suite_id: 3,
        case_ids: [101, 102],
        milestone_id: 5,
      });
    });

    it("returns isError on failure", async () => {
      client.createTestRun.mockRejectedValue(new Error("Invalid project"));

      const result = await getHandler("create_test_run")({ projectId: 999, name: "x" });

      expect(result.isError).toBe(true);
    });
  });

  // ── update_test_run ───────────────────────────────────────────────────────

  describe("update_test_run", () => {
    it("updates only the provided fields", async () => {
      client.updateTestRun.mockResolvedValue({ id: 1, name: "Updated" });

      await getHandler("update_test_run")({ runId: 1, name: "Updated" });

      expect(client.updateTestRun).toHaveBeenCalledWith(1, { name: "Updated" });
    });

    it("handles includeAll flag", async () => {
      client.updateTestRun.mockResolvedValue({ id: 1, name: "Run" });

      await getHandler("update_test_run")({ runId: 1, includeAll: false });

      expect(client.updateTestRun).toHaveBeenCalledWith(1, { include_all: false });
    });

    it("returns isError on failure", async () => {
      client.updateTestRun.mockRejectedValue(new Error("Not found"));

      const result = await getHandler("update_test_run")({ runId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── close_test_run ────────────────────────────────────────────────────────

  describe("close_test_run", () => {
    it("closes the run and returns result", async () => {
      client.closeTestRun.mockResolvedValue({ id: 1, name: "Sprint 1", is_completed: true });

      const result = await getHandler("close_test_run")({ runId: 1 });

      expect(client.closeTestRun).toHaveBeenCalledWith(1);
      expect(getText(result)).toContain("closed successfully");
    });

    it("returns isError on failure", async () => {
      client.closeTestRun.mockRejectedValue(new Error("Already closed"));

      const result = await getHandler("close_test_run")({ runId: 1 });

      expect(result.isError).toBe(true);
    });
  });

  // ── delete_test_run ───────────────────────────────────────────────────────

  describe("delete_test_run", () => {
    it("deletes the run and confirms", async () => {
      client.deleteTestRun.mockResolvedValue(undefined);

      const result = await getHandler("delete_test_run")({ runId: 7 });

      expect(client.deleteTestRun).toHaveBeenCalledWith(7);
      expect(getText(result)).toContain("7");
      expect(getText(result)).toContain("deleted successfully");
    });

    it("returns isError on failure", async () => {
      client.deleteTestRun.mockRejectedValue(new Error("No permission"));

      const result = await getHandler("delete_test_run")({ runId: 7 });

      expect(result.isError).toBe(true);
    });
  });

  // ── find_test_run_by_title ────────────────────────────────────────────────

  describe("find_test_run_by_title", () => {
    const allRuns = [
      { id: 1, name: "Sprint 1 Regression" },
      { id: 2, name: "Smoke Tests" },
      { id: 3, name: "Sprint 2 Regression" },
    ];

    it("returns matching runs (case-insensitive)", async () => {
      client.getTestRuns.mockResolvedValue(allRuns);

      const result = await getHandler("find_test_run_by_title")({
        projectId: 1,
        title: "sprint",
        includeCompleted: true,
      });

      expect(getText(result)).toContain("2 test run(s)");
    });

    it("returns not-found message when no match", async () => {
      client.getTestRuns.mockResolvedValue(allRuns);

      const result = await getHandler("find_test_run_by_title")({
        projectId: 1,
        title: "nonexistent",
        includeCompleted: true,
      });

      expect(getText(result)).toContain("No test runs found");
    });

    it("filters only active runs by default (includeCompleted omitted)", async () => {
      client.getTestRuns.mockResolvedValue([]);

      await getHandler("find_test_run_by_title")({ projectId: 1, title: "Sprint" });

      expect(client.getTestRuns).toHaveBeenCalledWith(1, { is_completed: false });
    });

    it("includes completed runs when includeCompleted is true", async () => {
      client.getTestRuns.mockResolvedValue([]);

      await getHandler("find_test_run_by_title")({ projectId: 1, title: "Sprint", includeCompleted: true });

      expect(client.getTestRuns).toHaveBeenCalledWith(1, {});
    });
  });

  // ── find_test_run ─────────────────────────────────────────────────────────

  describe("find_test_run", () => {
    const runs = [
      { id: 1, name: "Sprint 1", description: "regression suite" },
      { id: 2, name: "Smoke Tests", description: "" },
      { id: 3, name: "Sprint 2", description: "REF-42 automation" },
    ];

    it("matches by run name", async () => {
      client.getTestRuns.mockResolvedValue(runs);

      const result = await getHandler("find_test_run")({ projectId: 1, query: "smoke" });

      expect(getText(result)).toContain("1 test run(s)");
      expect(getText(result)).toContain("Smoke Tests");
    });

    it("matches by description", async () => {
      client.getTestRuns.mockResolvedValue(runs);

      const result = await getHandler("find_test_run")({ projectId: 1, query: "REF-42" });

      expect(getText(result)).toContain("1 test run(s)");
      expect(getText(result)).toContain("Sprint 2");
    });

    it("returns both name and description matches", async () => {
      client.getTestRuns.mockResolvedValue(runs);

      const result = await getHandler("find_test_run")({ projectId: 1, query: "sprint" });

      expect(getText(result)).toContain("2 test run(s)");
    });

    it("is case-insensitive", async () => {
      client.getTestRuns.mockResolvedValue(runs);

      const result = await getHandler("find_test_run")({ projectId: 1, query: "REGRESSION" });

      expect(getText(result)).toContain("1 test run(s)");
    });

    it("returns not-found message when no match", async () => {
      client.getTestRuns.mockResolvedValue(runs);

      const result = await getHandler("find_test_run")({ projectId: 1, query: "xyz-not-there" });

      expect(getText(result)).toContain("No test runs found");
    });

    it("searches open and closed runs by default (no isCompleted filter)", async () => {
      client.getTestRuns.mockResolvedValue([]);

      await getHandler("find_test_run")({ projectId: 1, query: "x" });

      expect(client.getTestRuns).toHaveBeenCalledWith(1, {});
    });

    it("passes isCompleted filter when provided", async () => {
      client.getTestRuns.mockResolvedValue([]);

      await getHandler("find_test_run")({ projectId: 1, query: "x", isCompleted: true });

      expect(client.getTestRuns).toHaveBeenCalledWith(1, { is_completed: true });
    });

    it("returns isError on failure", async () => {
      client.getTestRuns.mockRejectedValue(new Error("Server error"));

      const result = await getHandler("find_test_run")({ projectId: 1, query: "x" });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_runs_with_results ─────────────────────────────────────────────────

  describe("get_runs_with_results", () => {
    it("returns each run enriched with its tests", async () => {
      const runs = [
        { id: 1, name: "Run A" },
        { id: 2, name: "Run B" },
      ];
      const testsForA = [{ id: 10, case_id: 100, run_id: 1, status_id: 1 }];
      const testsForB = [{ id: 20, case_id: 200, run_id: 2, status_id: 5 }];
      client.getTestRuns.mockResolvedValue(runs);
      client.getTests.mockResolvedValueOnce(testsForA).mockResolvedValueOnce(testsForB);

      const result = await getHandler("get_runs_with_results")({ projectId: 1 });

      expect(client.getTestRuns).toHaveBeenCalledWith(1, {});
      expect(client.getTests).toHaveBeenCalledWith(1);
      expect(client.getTests).toHaveBeenCalledWith(2);
      const data = parseResponse(result) as Array<{ id: number; tests: unknown[] }>;
      expect(data[0].tests).toEqual(testsForA);
      expect(data[1].tests).toEqual(testsForB);
    });

    it("returns empty array when project has no runs", async () => {
      client.getTestRuns.mockResolvedValue([]);

      const result = await getHandler("get_runs_with_results")({ projectId: 1 });

      expect(client.getTests).not.toHaveBeenCalled();
      expect(parseResponse(result)).toEqual([]);
    });

    it("passes isCompleted filter when provided", async () => {
      client.getTestRuns.mockResolvedValue([]);

      await getHandler("get_runs_with_results")({ projectId: 1, isCompleted: false });

      expect(client.getTestRuns).toHaveBeenCalledWith(1, { is_completed: false });
    });

    it("returns isError when getTestRuns fails", async () => {
      client.getTestRuns.mockRejectedValue(new Error("Connection refused"));

      const result = await getHandler("get_runs_with_results")({ projectId: 1 });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Connection refused");
    });

    it("returns isError when getTests fails for any run", async () => {
      client.getTestRuns.mockResolvedValue([{ id: 1, name: "Run" }]);
      client.getTests.mockRejectedValue(new Error("Timeout"));

      const result = await getHandler("get_runs_with_results")({ projectId: 1 });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_tests ─────────────────────────────────────────────────────────────

  describe("get_tests", () => {
    it("fetches tests for a run", async () => {
      const tests = [{ id: 1, case_id: 10, run_id: 5, status_id: 1 }];
      client.getTests.mockResolvedValue(tests);

      const result = await getHandler("get_tests")({ runId: 5 });

      expect(client.getTests).toHaveBeenCalledWith(5, {});
      expect(parseResponse(result)).toEqual(tests);
    });

    it("passes status and assignedto filters", async () => {
      client.getTests.mockResolvedValue([]);

      await getHandler("get_tests")({ runId: 5, statusId: 5, assignedtoId: 3 });

      expect(client.getTests).toHaveBeenCalledWith(5, { status_id: 5, assignedto_id: 3 });
    });
  });

  // ── get_test_results ──────────────────────────────────────────────────────

  describe("get_test_results", () => {
    it("fetches results for a run", async () => {
      const results = [{ id: 1, test_id: 10, status_id: 1 }];
      client.getTestResults.mockResolvedValue(results);

      const result = await getHandler("get_test_results")({ runId: 5 });

      expect(client.getTestResults).toHaveBeenCalledWith(5, {});
      expect(parseResponse(result)).toEqual(results);
    });

    it("passes statusId filter", async () => {
      client.getTestResults.mockResolvedValue([]);

      await getHandler("get_test_results")({ runId: 5, statusId: 5 });

      expect(client.getTestResults).toHaveBeenCalledWith(5, { status_id: 5 });
    });
  });

  // ── add_test_result ───────────────────────────────────────────────────────

  describe("add_test_result", () => {
    it("adds a result with required fields", async () => {
      client.addTestResult.mockResolvedValue({ id: 1, test_id: 10, status_id: 1 });

      const result = await getHandler("add_test_result")({ testId: 10, statusId: 1 });

      expect(client.addTestResult).toHaveBeenCalledWith(10, { status_id: 1 });
      expect(getText(result)).toContain("added successfully");
    });

    it("includes optional fields", async () => {
      client.addTestResult.mockResolvedValue({ id: 1, test_id: 10, status_id: 5 });

      await getHandler("add_test_result")({
        testId: 10,
        statusId: 5,
        comment: "Bug found",
        elapsed: "2m",
        defects: "BUG-1",
      });

      expect(client.addTestResult).toHaveBeenCalledWith(10, {
        status_id: 5,
        comment: "Bug found",
        elapsed: "2m",
        defects: "BUG-1",
      });
    });

    it("returns isError on failure", async () => {
      client.addTestResult.mockRejectedValue(new Error("Test not found"));

      const result = await getHandler("add_test_result")({ testId: 999, statusId: 1 });

      expect(result.isError).toBe(true);
    });
  });

  // ── add_test_results ──────────────────────────────────────────────────────

  describe("add_test_results", () => {
    it("bulk-adds results to a run", async () => {
      const payload = [
        { test_id: 1, status_id: 1 },
        { test_id: 2, status_id: 5 },
      ];
      client.addTestResults.mockResolvedValue(payload as never);

      const result = await getHandler("add_test_results")({ runId: 5, results: payload });

      expect(client.addTestResults).toHaveBeenCalledWith(5, payload);
      expect(getText(result)).toContain("added successfully");
    });
  });

  // ── add_test_result_for_case ──────────────────────────────────────────────

  describe("add_test_result_for_case", () => {
    it("adds a result for a specific case in a run", async () => {
      client.addTestResultForCase.mockResolvedValue({ id: 1, test_id: 10, status_id: 1 });

      const result = await getHandler("add_test_result_for_case")({
        runId: 5,
        caseId: 100,
        statusId: 1,
      });

      expect(client.addTestResultForCase).toHaveBeenCalledWith(5, 100, { status_id: 1 });
      expect(getText(result)).toContain("added successfully");
    });

    it("returns isError on failure", async () => {
      client.addTestResultForCase.mockRejectedValue(new Error("Case not in run"));

      const result = await getHandler("add_test_result_for_case")({
        runId: 5,
        caseId: 999,
        statusId: 1,
      });

      expect(result.isError).toBe(true);
    });
  });
});
