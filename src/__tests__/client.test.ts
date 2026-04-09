import { jest, describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import type { TestRailsClient as TestRailsClientType } from "../client.js";

// Must be declared before the dynamic import below so the mock is in place first
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGet = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPost = jest.fn<any>();

jest.unstable_mockModule("axios", () => ({
  default: {
    create: jest.fn(() => ({
      get: mockGet,
      post: mockPost,
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    })),
  },
}));

// Dynamic import resolves AFTER the mock is registered
let TestRailsClient: typeof TestRailsClientType;

beforeAll(async () => {
  const mod = await import("../client.js");
  TestRailsClient = mod.TestRailsClient;
});

describe("TestRailsClient", () => {
  let client: InstanceType<typeof TestRailsClientType>;

  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    client = new TestRailsClient("https://example.testrail.io", "api-key", "user@example.com");
  });

  // ── constructor ───────────────────────────────────────────────────────────

  describe("constructor", () => {
    it("creates an axios instance pointing at the v2 API base URL", async () => {
      const axiosMod = await import("axios");
      expect(axiosMod.default.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "https://example.testrail.io/index.php?/api/v2",
          auth: { username: "user@example.com", password: "api-key" },
        })
      );
    });
  });

  // ── getProjects ───────────────────────────────────────────────────────────

  describe("getProjects", () => {
    it("unwraps projects from a wrapped response", async () => {
      const projects = [{ id: 1, name: "Web" }];
      mockGet.mockResolvedValue({ data: { projects } });

      const result = await client.getProjects();

      expect(mockGet).toHaveBeenCalledWith("/get_projects");
      expect(result).toEqual(projects);
    });

    it("returns projects when the response is already an array", async () => {
      const projects = [{ id: 2, name: "Mobile" }];
      mockGet.mockResolvedValue({ data: projects });

      expect(await client.getProjects()).toEqual(projects);
    });
  });

  // ── getTestCases ──────────────────────────────────────────────────────────

  describe("getTestCases", () => {
    it("calls the correct endpoint with no filters", async () => {
      mockGet.mockResolvedValue({ data: { cases: [] } });

      await client.getTestCases(1);

      expect(mockGet).toHaveBeenCalledWith("/get_cases/1", { params: {} });
    });

    it("passes suiteId, sectionId, and filter params", async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getTestCases(1, 2, 3, { refs_filter: "TFX-10", priority_id: 4 });

      expect(mockGet).toHaveBeenCalledWith("/get_cases/1", {
        params: { suite_id: 2, section_id: 3, refs_filter: "TFX-10", priority_id: 4 },
      });
    });
  });

  // ── getTestRuns ───────────────────────────────────────────────────────────

  describe("getTestRuns", () => {
    it("converts is_completed true → 1", async () => {
      mockGet.mockResolvedValue({ data: { runs: [] } });

      await client.getTestRuns(1, { is_completed: true });

      expect(mockGet).toHaveBeenCalledWith("/get_runs/1", {
        params: { is_completed: 1 },
      });
    });

    it("converts is_completed false → 0", async () => {
      mockGet.mockResolvedValue({ data: [] });

      await client.getTestRuns(1, { is_completed: false });

      expect(mockGet).toHaveBeenCalledWith("/get_runs/1", {
        params: { is_completed: 0 },
      });
    });

    it("unwraps runs from a paginated response", async () => {
      const runs = [{ id: 5, name: "Sprint 1" }];
      mockGet.mockResolvedValue({ data: { runs } });

      expect(await client.getTestRuns(1)).toEqual(runs);
    });
  });

  // ── getSections ───────────────────────────────────────────────────────────

  describe("getSections", () => {
    it("unwraps sections from a paginated response", async () => {
      const sections = [{ id: 1, name: "Login" }];
      mockGet.mockResolvedValue({ data: { sections } });

      expect(await client.getSections(1)).toEqual(sections);
    });

    it("returns sections when response is already an array", async () => {
      const sections = [{ id: 2, name: "Checkout" }];
      mockGet.mockResolvedValue({ data: sections });

      expect(await client.getSections(1)).toEqual(sections);
    });
  });

  // ── createTestRun ─────────────────────────────────────────────────────────

  describe("createTestRun", () => {
    it("posts to the correct endpoint and returns the run", async () => {
      const run = { id: 10, name: "New Run" };
      mockPost.mockResolvedValue({ data: run });

      const result = await client.createTestRun(5, { name: "New Run" });

      expect(mockPost).toHaveBeenCalledWith("/add_run/5", { name: "New Run" });
      expect(result).toEqual(run);
    });
  });

  // ── deleteSection ─────────────────────────────────────────────────────────

  describe("deleteSection", () => {
    it("posts to the correct delete endpoint", async () => {
      mockPost.mockResolvedValue({ data: {} });

      await client.deleteSection(7);

      expect(mockPost).toHaveBeenCalledWith("/delete_section/7");
    });
  });

  // ── addTestResult ─────────────────────────────────────────────────────────

  describe("addTestResult", () => {
    it("posts a result with the correct payload", async () => {
      const result = { id: 1, test_id: 10, status_id: 5 };
      mockPost.mockResolvedValue({ data: result });

      const returned = await client.addTestResult(10, { status_id: 5, comment: "Failed" });

      expect(mockPost).toHaveBeenCalledWith("/add_result/10", {
        status_id: 5,
        comment: "Failed",
      });
      expect(returned).toEqual(result);
    });
  });

  // ── closeTestRun ──────────────────────────────────────────────────────────

  describe("closeTestRun", () => {
    it("posts to the close endpoint", async () => {
      const run = { id: 1, name: "Run", is_completed: true };
      mockPost.mockResolvedValue({ data: run });

      const result = await client.closeTestRun(1);

      expect(mockPost).toHaveBeenCalledWith("/close_run/1");
      expect(result).toEqual(run);
    });
  });
});
