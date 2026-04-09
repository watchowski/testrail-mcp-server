import { registerCaseTools } from "../../tools/cases.js";
import { createMockServer, createMockClient, getText, parseResponse } from "../helpers.js";

describe("Case tools", () => {
  let client: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    client = createMockClient();
    const mock = createMockServer();
    getHandler = mock.getHandler;
    registerCaseTools(mock.server, client);
  });

  // ── get_test_cases ────────────────────────────────────────────────────────

  describe("get_test_cases", () => {
    it("fetches cases for a project", async () => {
      const cases = [{ id: 1, title: "Login" }];
      client.getTestCases.mockResolvedValue(cases);

      const result = await getHandler("get_test_cases")({ projectId: 1 });

      expect(client.getTestCases).toHaveBeenCalledWith(1, undefined, undefined);
      expect(parseResponse(result)).toEqual(cases);
    });

    it("passes suiteId and sectionId filters", async () => {
      client.getTestCases.mockResolvedValue([]);

      await getHandler("get_test_cases")({ projectId: 1, suiteId: 2, sectionId: 3 });

      expect(client.getTestCases).toHaveBeenCalledWith(1, 2, 3);
    });

    it("returns isError on failure", async () => {
      client.getTestCases.mockRejectedValue(new Error("Project not found"));

      const result = await getHandler("get_test_cases")({ projectId: 999 });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Project not found");
    });
  });

  // ── get_test_case ─────────────────────────────────────────────────────────

  describe("get_test_case", () => {
    it("returns a single case", async () => {
      const tc = { id: 55, title: "Checkout flow" };
      client.getTestCase.mockResolvedValue(tc);

      const result = await getHandler("get_test_case")({ caseId: 55 });

      expect(client.getTestCase).toHaveBeenCalledWith(55);
      expect(parseResponse(result)).toEqual(tc);
    });

    it("returns isError on failure", async () => {
      client.getTestCase.mockRejectedValue(new Error("Not found"));

      const result = await getHandler("get_test_case")({ caseId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── create_test_case ──────────────────────────────────────────────────────

  describe("create_test_case", () => {
    it("creates a case with only the required title", async () => {
      client.createTestCase.mockResolvedValue({ id: 1, title: "Login test" });

      const result = await getHandler("create_test_case")({
        sectionId: 10,
        title: "Login test",
      });

      expect(client.createTestCase).toHaveBeenCalledWith(10, { title: "Login test" });
      expect(getText(result)).toContain("Test case created successfully");
    });

    it("maps optional fields to API fields", async () => {
      client.createTestCase.mockResolvedValue({ id: 2, title: "Payment" });

      await getHandler("create_test_case")({
        sectionId: 10,
        title: "Payment",
        description: "Steps here",
        priority: 4,
        refs: "TICKET-99",
      });

      expect(client.createTestCase).toHaveBeenCalledWith(10, {
        title: "Payment",
        custom_steps_separated: "Steps here",
        priority_id: 4,
        refs: "TICKET-99",
      });
    });

    it("returns isError on failure", async () => {
      client.createTestCase.mockRejectedValue(new Error("Section not found"));

      const result = await getHandler("create_test_case")({ sectionId: 999, title: "x" });

      expect(result.isError).toBe(true);
    });
  });

  // ── create_multiple_test_cases ────────────────────────────────────────────

  describe("create_multiple_test_cases", () => {
    it("returns a summary of created cases", async () => {
      const bulkResult = {
        totalAttempted: 2,
        totalSuccessful: 2,
        totalFailed: 0,
        results: [
          { success: true as const, testCase: { id: 1, title: "A" }, index: 0 },
          { success: true as const, testCase: { id: 2, title: "B" }, index: 1 },
        ],
        errors: [],
      };
      client.createMultipleTestCases.mockResolvedValue(bulkResult);

      const result = await getHandler("create_multiple_test_cases")({
        sectionId: 5,
        testCases: [{ title: "A" }, { title: "B" }],
      });

      expect(client.createMultipleTestCases).toHaveBeenCalledWith(5, [{ title: "A" }, { title: "B" }]);
      const text = getText(result);
      expect(text).toContain("Bulk test case creation completed");
      expect(text).toContain('"totalSuccessful": 2');
    });

    it("returns isError on failure", async () => {
      client.createMultipleTestCases.mockRejectedValue(new Error("API error"));

      const result = await getHandler("create_multiple_test_cases")({
        sectionId: 5,
        testCases: [{ title: "A" }],
      });

      expect(result.isError).toBe(true);
    });
  });

  // ── update_test_case ──────────────────────────────────────────────────────

  describe("update_test_case", () => {
    it("updates a case with provided fields", async () => {
      client.updateTestCase.mockResolvedValue({ id: 1, title: "Updated title" });

      const result = await getHandler("update_test_case")({
        caseId: 1,
        title: "Updated title",
        priorityId: 2,
        typeId: 3,
      });

      expect(client.updateTestCase).toHaveBeenCalledWith(1, {
        title: "Updated title",
        priority_id: 2,
        type_id: 3,
      });
      expect(getText(result)).toContain("updated successfully");
    });

    it("maps description to custom_steps_separated", async () => {
      client.updateTestCase.mockResolvedValue({ id: 1, title: "Test" });

      await getHandler("update_test_case")({ caseId: 1, description: "New steps" });

      expect(client.updateTestCase).toHaveBeenCalledWith(1, {
        custom_steps_separated: "New steps",
      });
    });

    it("returns isError on failure", async () => {
      client.updateTestCase.mockRejectedValue(new Error("Case not found"));

      const result = await getHandler("update_test_case")({ caseId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── find_test_cases_by_ref ────────────────────────────────────────────────

  describe("find_test_cases_by_ref", () => {
    it("returns matching cases", async () => {
      const cases = [{ id: 1, title: "Login", refs: "TFX-10" }];
      client.getTestCases.mockResolvedValue(cases);

      const result = await getHandler("find_test_cases_by_ref")({
        projectId: 1,
        refs: "TFX-10",
      });

      expect(client.getTestCases).toHaveBeenCalledWith(1, undefined, undefined, { refs_filter: "TFX-10" });
      expect(getText(result)).toContain("Found 1 test case(s)");
    });

    it("returns not-found message when no cases match", async () => {
      client.getTestCases.mockResolvedValue([]);

      const result = await getHandler("find_test_cases_by_ref")({
        projectId: 1,
        refs: "TFX-999",
      });

      expect(getText(result)).toContain("No test cases found");
    });

    it("narrows search with suiteId and sectionId", async () => {
      client.getTestCases.mockResolvedValue([]);

      await getHandler("find_test_cases_by_ref")({
        projectId: 1,
        refs: "TFX-10",
        suiteId: 2,
        sectionId: 3,
      });

      expect(client.getTestCases).toHaveBeenCalledWith(1, 2, 3, { refs_filter: "TFX-10" });
    });
  });

  // ── update_multiple_test_cases ────────────────────────────────────────────

  describe("update_multiple_test_cases", () => {
    it("bulk-updates cases and returns a summary", async () => {
      const bulkResult = {
        totalAttempted: 2,
        totalSuccessful: 2,
        totalFailed: 0,
        results: [
          { success: true as const, testCase: { id: 1, title: "A" }, caseId: 1, index: 0 },
          { success: true as const, testCase: { id: 2, title: "B" }, caseId: 2, index: 1 },
        ],
        errors: [],
      };
      client.updateMultipleTestCases.mockResolvedValue(bulkResult);

      const result = await getHandler("update_multiple_test_cases")({
        caseIds: [1, 2],
        priorityId: 3,
      });

      expect(client.updateMultipleTestCases).toHaveBeenCalledWith(
        [
          { caseId: 1, updates: { priority_id: 3 } },
          { caseId: 2, updates: { priority_id: 3 } },
        ],
        undefined
      );
      expect(getText(result)).toContain("Bulk test case update completed");
    });

    it("passes addTag to client", async () => {
      client.updateMultipleTestCases.mockResolvedValue({
        totalAttempted: 1, totalSuccessful: 1, totalFailed: 0, results: [], errors: [],
      });

      await getHandler("update_multiple_test_cases")({ caseIds: [1], addTag: "smoke" });

      expect(client.updateMultipleTestCases).toHaveBeenCalledWith(
        [{ caseId: 1, updates: {} }],
        "smoke"
      );
    });
  });

  // ── add_tag_to_test_cases ─────────────────────────────────────────────────

  describe("add_tag_to_test_cases", () => {
    it("tags cases and returns a summary", async () => {
      const bulkResult = {
        totalAttempted: 1,
        totalSuccessful: 1,
        totalFailed: 0,
        results: [{ success: true as const, testCase: { id: 1, title: "A", refs: "smoke" }, caseId: 1, index: 0 }],
        errors: [],
      };
      client.addTagToTestCases.mockResolvedValue(bulkResult);

      const result = await getHandler("add_tag_to_test_cases")({
        caseIds: [1],
        tag: "smoke",
      });

      expect(client.addTagToTestCases).toHaveBeenCalledWith([1], "smoke");
      expect(getText(result)).toContain('"smoke"');
    });

    it("returns isError on failure", async () => {
      client.addTagToTestCases.mockRejectedValue(new Error("API error"));

      const result = await getHandler("add_tag_to_test_cases")({ caseIds: [1], tag: "smoke" });

      expect(result.isError).toBe(true);
    });
  });

  // ── delete_test_case ──────────────────────────────────────────────────────

  describe("delete_test_case", () => {
    it("deletes a case and confirms", async () => {
      client.deleteTestCase.mockResolvedValue(undefined);

      const result = await getHandler("delete_test_case")({ caseId: 42 });

      expect(client.deleteTestCase).toHaveBeenCalledWith(42);
      expect(getText(result)).toContain("42");
      expect(getText(result)).toContain("deleted successfully");
    });

    it("returns isError on failure", async () => {
      client.deleteTestCase.mockRejectedValue(new Error("Not found"));

      const result = await getHandler("delete_test_case")({ caseId: 999 });

      expect(result.isError).toBe(true);
    });
  });
});
