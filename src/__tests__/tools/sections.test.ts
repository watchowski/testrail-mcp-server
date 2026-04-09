import { registerSectionTools } from "../../tools/sections.js";
import { createMockServer, createMockClient, getText, parseResponse } from "../helpers.js";

describe("Section tools", () => {
  let client: ReturnType<typeof createMockClient>;
  let getHandler: ReturnType<typeof createMockServer>["getHandler"];

  beforeEach(() => {
    client = createMockClient();
    const mock = createMockServer();
    getHandler = mock.getHandler;
    registerSectionTools(mock.server, client);
  });

  // ── get_sections ──────────────────────────────────────────────────────────

  describe("get_sections", () => {
    it("returns sections as JSON", async () => {
      const sections = [{ id: 1, name: "Login" }, { id: 2, name: "Dashboard" }];
      client.getSections.mockResolvedValue(sections);

      const result = await getHandler("get_sections")({ projectId: 10 });

      expect(client.getSections).toHaveBeenCalledWith(10, undefined);
      expect(parseResponse(result)).toEqual(sections);
      expect(result.isError).toBeUndefined();
    });

    it("passes suiteId when provided", async () => {
      client.getSections.mockResolvedValue([]);

      await getHandler("get_sections")({ projectId: 10, suiteId: 5 });

      expect(client.getSections).toHaveBeenCalledWith(10, 5);
    });

    it("returns isError on failure", async () => {
      client.getSections.mockRejectedValue(new Error("Not found"));

      const result = await getHandler("get_sections")({ projectId: 10 });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Not found");
    });
  });

  // ── get_section ───────────────────────────────────────────────────────────

  describe("get_section", () => {
    it("returns a single section as JSON", async () => {
      const section = { id: 3, name: "Auth" };
      client.getSection.mockResolvedValue(section);

      const result = await getHandler("get_section")({ sectionId: 3 });

      expect(client.getSection).toHaveBeenCalledWith(3);
      expect(parseResponse(result)).toEqual(section);
    });

    it("returns isError on failure", async () => {
      client.getSection.mockRejectedValue(new Error("Section not found"));

      const result = await getHandler("get_section")({ sectionId: 999 });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Section not found");
    });
  });

  // ── create_section ────────────────────────────────────────────────────────

  describe("create_section", () => {
    it("creates section with required fields only", async () => {
      const created = { id: 10, name: "Smoke" };
      client.createSection.mockResolvedValue(created);

      const result = await getHandler("create_section")({ projectId: 1, name: "Smoke" });

      expect(client.createSection).toHaveBeenCalledWith(1, "Smoke", undefined, undefined, undefined);
      expect(getText(result)).toContain("Section created successfully");
    });

    it("passes all optional fields", async () => {
      client.createSection.mockResolvedValue({ id: 11, name: "API" });

      await getHandler("create_section")({
        projectId: 1,
        name: "API",
        description: "API tests",
        suiteId: 2,
        parentId: 5,
      });

      expect(client.createSection).toHaveBeenCalledWith(1, "API", "API tests", 2, 5);
    });

    it("returns isError on failure", async () => {
      client.createSection.mockRejectedValue(new Error("Duplicate name"));

      const result = await getHandler("create_section")({ projectId: 1, name: "Dup" });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Duplicate name");
    });
  });

  // ── delete_section_if_empty ───────────────────────────────────────────────

  describe("delete_section_if_empty", () => {
    it("deletes section when it has no test cases", async () => {
      client.getTestCases.mockResolvedValue([]);
      client.deleteSection.mockResolvedValue(undefined);

      const result = await getHandler("delete_section_if_empty")({
        sectionId: 7,
        projectId: 1,
      });

      expect(client.getTestCases).toHaveBeenCalledWith(1, undefined, 7);
      expect(client.deleteSection).toHaveBeenCalledWith(7);
      expect(getText(result)).toContain("deleted successfully");
      expect(result.isError).toBeUndefined();
    });

    it("blocks deletion when section contains test cases", async () => {
      client.getTestCases.mockResolvedValue([
        { id: 101, title: "Login test" },
        { id: 102, title: "Logout test" },
      ]);

      const result = await getHandler("delete_section_if_empty")({
        sectionId: 7,
        projectId: 1,
      });

      expect(client.deleteSection).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("2 test case(s)");
    });

    it("passes suiteId to getTestCases when provided", async () => {
      client.getTestCases.mockResolvedValue([]);
      client.deleteSection.mockResolvedValue(undefined);

      await getHandler("delete_section_if_empty")({
        sectionId: 7,
        projectId: 1,
        suiteId: 3,
      });

      expect(client.getTestCases).toHaveBeenCalledWith(1, 3, 7);
    });

    it("returns isError when getTestCases throws", async () => {
      client.getTestCases.mockRejectedValue(new Error("API error"));

      const result = await getHandler("delete_section_if_empty")({
        sectionId: 7,
        projectId: 1,
      });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("API error");
    });

    it("returns isError when deleteSection throws", async () => {
      client.getTestCases.mockResolvedValue([]);
      client.deleteSection.mockRejectedValue(new Error("Permission denied"));

      const result = await getHandler("delete_section_if_empty")({
        sectionId: 7,
        projectId: 1,
      });

      expect(result.isError).toBe(true);
      expect(getText(result)).toContain("Permission denied");
    });
  });
});
