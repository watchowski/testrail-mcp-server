import { registerSystemTools } from "../../tools/system.js";
import { createMockServer, createMockClient, getText, parseResponse } from "../helpers.js";

describe("System tools", () => {
  let client: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    client = createMockClient();
    const mock = createMockServer();
    getHandler = mock.getHandler;
    registerSystemTools(mock.server, client);
  });

  // ── get_projects ──────────────────────────────────────────────────────────

  describe("get_projects", () => {
    it("returns all projects as JSON", async () => {
      const projects = [{ id: 1, name: "Web App" }, { id: 2, name: "Mobile" }];
      client.getProjects.mockResolvedValue(projects);

      const result = await getHandler("get_projects")({});

      expect(client.getProjects).toHaveBeenCalled();
      expect(parseResponse(result)).toEqual(projects);
      expect(result.isError).toBeUndefined();
    });

    it("returns isError on failure", async () => {
      client.getProjects.mockRejectedValue(new Error("Unauthorized"));

      const result = await getHandler("get_projects")({});

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Unauthorized");
    });
  });

  // ── get_project ───────────────────────────────────────────────────────────

  describe("get_project", () => {
    it("returns a single project", async () => {
      const project = { id: 3, name: "Backend API" };
      client.getProject.mockResolvedValue(project);

      const result = await getHandler("get_project")({ projectId: 3 });

      expect(client.getProject).toHaveBeenCalledWith(3);
      expect(parseResponse(result)).toEqual(project);
    });

    it("returns isError on failure", async () => {
      client.getProject.mockRejectedValue(new Error("Project not found"));

      const result = await getHandler("get_project")({ projectId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_test_suites ───────────────────────────────────────────────────────

  describe("get_test_suites", () => {
    it("returns suites for a project", async () => {
      const suites = [{ id: 1, name: "Master Suite", project_id: 5 }];
      client.getTestSuites.mockResolvedValue(suites);

      const result = await getHandler("get_test_suites")({ projectId: 5 });

      expect(client.getTestSuites).toHaveBeenCalledWith(5);
      expect(parseResponse(result)).toEqual(suites);
    });

    it("returns isError on failure", async () => {
      client.getTestSuites.mockRejectedValue(new Error("Not found"));

      const result = await getHandler("get_test_suites")({ projectId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_test_suite ────────────────────────────────────────────────────────

  describe("get_test_suite", () => {
    it("returns a single suite", async () => {
      const suite = { id: 8, name: "Regression", project_id: 1 };
      client.getTestSuite.mockResolvedValue(suite);

      const result = await getHandler("get_test_suite")({ suiteId: 8 });

      expect(client.getTestSuite).toHaveBeenCalledWith(8);
      expect(parseResponse(result)).toEqual(suite);
    });

    it("returns isError on failure", async () => {
      client.getTestSuite.mockRejectedValue(new Error("Suite not found"));

      const result = await getHandler("get_test_suite")({ suiteId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_users ─────────────────────────────────────────────────────────────

  describe("get_users", () => {
    it("returns all users", async () => {
      const users = [{ id: 1, name: "Alice", email: "alice@example.com" }];
      client.getUsers.mockResolvedValue(users);

      const result = await getHandler("get_users")({});

      expect(client.getUsers).toHaveBeenCalled();
      expect(parseResponse(result)).toEqual(users);
    });

    it("returns isError on failure", async () => {
      client.getUsers.mockRejectedValue(new Error("Server error"));

      const result = await getHandler("get_users")({});

      expect(result.isError).toBe(true);
    });
  });

  // ── get_user ──────────────────────────────────────────────────────────────

  describe("get_user", () => {
    it("returns a single user", async () => {
      const user = { id: 2, name: "Bob", email: "bob@example.com" };
      client.getUser.mockResolvedValue(user);

      const result = await getHandler("get_user")({ userId: 2 });

      expect(client.getUser).toHaveBeenCalledWith(2);
      expect(parseResponse(result)).toEqual(user);
    });
  });

  // ── get_test_statuses ─────────────────────────────────────────────────────

  describe("get_test_statuses", () => {
    it("returns all statuses", async () => {
      const statuses = [
        { id: 1, name: "passed", label: "Passed" },
        { id: 5, name: "failed", label: "Failed" },
      ];
      client.getStatuses.mockResolvedValue(statuses);

      const result = await getHandler("get_test_statuses")({});

      expect(client.getStatuses).toHaveBeenCalled();
      expect(parseResponse(result)).toEqual(statuses);
    });

    it("returns isError on failure", async () => {
      client.getStatuses.mockRejectedValue(new Error("Connection error"));

      const result = await getHandler("get_test_statuses")({});

      expect(result.isError).toBe(true);
    });
  });

  // ── get_case_types ────────────────────────────────────────────────────────

  describe("get_case_types", () => {
    it("returns all case types", async () => {
      const types = [{ id: 1, name: "Functional" }];
      client.getCaseTypes.mockResolvedValue(types);

      const result = await getHandler("get_case_types")({});

      expect(client.getCaseTypes).toHaveBeenCalled();
      expect(parseResponse(result)).toEqual(types);
    });
  });

  // ── get_case_fields ───────────────────────────────────────────────────────

  describe("get_case_fields", () => {
    it("returns all case fields", async () => {
      const fields = [{ id: 1, label: "Preconditions" }];
      client.getCaseFields.mockResolvedValue(fields);

      const result = await getHandler("get_case_fields")({});

      expect(client.getCaseFields).toHaveBeenCalled();
      expect(parseResponse(result)).toEqual(fields);
    });
  });

  // ── get_result_fields ─────────────────────────────────────────────────────

  describe("get_result_fields", () => {
    it("returns all result fields", async () => {
      const fields = [{ id: 2, label: "Environment" }];
      client.getResultFields.mockResolvedValue(fields);

      const result = await getHandler("get_result_fields")({});

      expect(client.getResultFields).toHaveBeenCalled();
      expect(parseResponse(result)).toEqual(fields);
    });
  });

  // ── get_priorities ────────────────────────────────────────────────────────

  describe("get_priorities", () => {
    it("returns all priorities", async () => {
      const priorities = [
        { id: 1, name: "Low" },
        { id: 4, name: "Critical" },
      ];
      client.getPriorities.mockResolvedValue(priorities);

      const result = await getHandler("get_priorities")({});

      expect(client.getPriorities).toHaveBeenCalled();
      expect(parseResponse(result)).toEqual(priorities);
    });
  });

  // ── get_templates ─────────────────────────────────────────────────────────

  describe("get_templates", () => {
    it("returns templates for a project", async () => {
      const templates = [{ id: 1, name: "Test Case Text" }];
      client.getTemplates.mockResolvedValue(templates);

      const result = await getHandler("get_templates")({ projectId: 3 });

      expect(client.getTemplates).toHaveBeenCalledWith(3);
      expect(parseResponse(result)).toEqual(templates);
    });

    it("returns isError on failure", async () => {
      client.getTemplates.mockRejectedValue(new Error("Not found"));

      const result = await getHandler("get_templates")({ projectId: 999 });

      expect(result.isError).toBe(true);
    });
  });

  // ── get_reports ───────────────────────────────────────────────────────────

  describe("get_reports", () => {
    it("returns reports for a project", async () => {
      const reports = [{ id: 1, name: "Summary" }];
      client.getReports.mockResolvedValue(reports);

      const result = await getHandler("get_reports")({ projectId: 4 });

      expect(client.getReports).toHaveBeenCalledWith(4);
      expect(parseResponse(result)).toEqual(reports);
    });
  });

  // ── run_report ────────────────────────────────────────────────────────────

  describe("run_report", () => {
    it("executes a report template and returns the result", async () => {
      const reportResult = { url: "https://example.com/report/1" };
      client.runReport.mockResolvedValue(reportResult);

      const result = await getHandler("run_report")({ reportTemplateId: 10 });

      expect(client.runReport).toHaveBeenCalledWith(10);
      expect(parseResponse(result)).toEqual(reportResult);
    });

    it("returns isError on failure", async () => {
      client.runReport.mockRejectedValue(new Error("Report failed"));

      const result = await getHandler("run_report")({ reportTemplateId: 999 });

      expect(result.isError).toBe(true);
    });
  });
});
