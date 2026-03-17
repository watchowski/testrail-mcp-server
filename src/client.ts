import axios, { AxiosInstance } from "axios";
import type {
  Project, TestSuite, Section, TestCase, TestRun, TestPlan,
  Milestone, User, TestStatus, CaseType, Priority, Test, TestResult,
  TestCasePayload, TestCaseUpdates, TestRunPayload, TestRunUpdates,
  TestPlanPayload, MilestonePayload, TestResultPayload, TestResultsEntry,
  TestCaseFilters, TestRunFilters, TestFilters, TestResultFilters,
  TestPlanFilters, MilestoneFilters, BulkTestCaseInput, BulkCreateResult,
} from "./types.js";

const BULK_CREATE_DELAY_MS = 100;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(...args: unknown[]): void {
  if (process.env.DEBUG) console.error(...args);
}

export class TestRailsClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string, username: string) {
    this.client = axios.create({
      baseURL: `${baseUrl}/index.php?/api/v2`,
      auth: { username, password: apiKey },
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    if (process.env.DEBUG) {
      this.client.interceptors.request.use(request => {
        log("Request:", request.method?.toUpperCase(), (request.baseURL ?? "") + (request.url ?? ""));
        return request;
      });
      this.client.interceptors.response.use(
        response => { log("Response:", response.status); return response; },
        error => {
          log("API Error:", error.response?.status, error.response?.statusText);
          log("URL:", (error.config?.baseURL ?? "") + (error.config?.url ?? ""));
          if (error.response?.data) log("Error data:", JSON.stringify(error.response.data));
          return Promise.reject(error);
        }
      );
    }
  }

  // Projects

  async getProjects(): Promise<Project[]> {
    const response = await this.client.get<{ projects: Project[] } | Project[]>("/get_projects");
    return (response.data as { projects?: Project[] }).projects ?? (response.data as Project[]);
  }

  async getProject(projectId: number): Promise<Project> {
    const response = await this.client.get<Project>(`/get_project/${projectId}`);
    return response.data;
  }

  // Test Cases

  async getTestCases(projectId: number, suiteId?: number, sectionId?: number, filters?: TestCaseFilters): Promise<TestCase[]> {
    const params: Record<string, string | number> = {};
    if (suiteId) params.suite_id = suiteId;
    if (sectionId) params.section_id = sectionId;
    if (filters?.type_id) params.type_id = filters.type_id;
    if (filters?.priority_id) params.priority_id = filters.priority_id;
    if (filters?.created_after) params.created_after = filters.created_after;
    if (filters?.created_before) params.created_before = filters.created_before;
    if (filters?.refs_filter) params.refs_filter = filters.refs_filter;
    const response = await this.client.get<TestCase[]>(`/get_cases/${projectId}`, { params });
    return response.data;
  }

  async getTestCase(caseId: number): Promise<TestCase> {
    const response = await this.client.get<TestCase>(`/get_case/${caseId}`);
    return response.data;
  }

  async createTestCase(sectionId: number, data: TestCasePayload): Promise<TestCase> {
    const response = await this.client.post<TestCase>(`/add_case/${sectionId}`, data);
    return response.data;
  }

  async createMultipleTestCases(sectionId: number, testCases: BulkTestCaseInput[]): Promise<BulkCreateResult> {
    const results: BulkCreateResult["results"] = [];
    const errors: BulkCreateResult["errors"] = [];

    for (let i = 0; i < testCases.length; i++) {
      if (i > 0) await delay(BULK_CREATE_DELAY_MS);
      const testCase = testCases[i];
      try {
        log(`Creating test case ${i + 1}/${testCases.length}: ${testCase.title}`);
        const response = await this.client.post<TestCase>(`/add_case/${sectionId}`, {
          title: testCase.title,
          template_id: testCase.template_id ?? 1,
          type_id: testCase.type_id ?? 1,
          priority_id: testCase.priority_id ?? testCase.priority ?? 3,
          custom_preconds: testCase.custom_preconds ?? testCase.preconditions,
          custom_steps: testCase.custom_steps ?? testCase.description,
          custom_steps_separated: testCase.custom_steps_separated ?? testCase.description,
          refs: testCase.refs,
        });
        results.push({ success: true, testCase: response.data, index: i });
        log(`Created: ${response.data.title} (ID: ${response.data.id})`);
      } catch (error: unknown) {
        const err = error as { response?: { data?: unknown }; message?: string };
        const errDetail = err.response?.data ?? err.message;
        log(`Failed: ${testCase.title}`, errDetail);
        errors.push({ success: false, error: errDetail, testCase, index: i });
      }
    }

    return {
      results,
      errors,
      totalAttempted: testCases.length,
      totalSuccessful: results.length,
      totalFailed: errors.length,
    };
  }

  async updateTestCase(caseId: number, updates: TestCaseUpdates): Promise<TestCase> {
    const response = await this.client.post<TestCase>(`/update_case/${caseId}`, updates);
    return response.data;
  }

  async deleteTestCase(caseId: number): Promise<void> {
    await this.client.post(`/delete_case/${caseId}`);
  }

  // Test Suites

  async getTestSuites(projectId: number): Promise<TestSuite[]> {
    const response = await this.client.get<TestSuite[]>(`/get_suites/${projectId}`);
    return response.data;
  }

  async getTestSuite(suiteId: number): Promise<TestSuite> {
    const response = await this.client.get<TestSuite>(`/get_suite/${suiteId}`);
    return response.data;
  }

  async createTestSuite(projectId: number, name: string, description?: string): Promise<TestSuite> {
    const response = await this.client.post<TestSuite>(`/add_suite/${projectId}`, { name, description: description ?? "" });
    return response.data;
  }

  // Sections

  async getSections(projectId: number, suiteId?: number): Promise<Section[]> {
    const params: Record<string, number> = {};
    if (suiteId) params.suite_id = suiteId;
    const response = await this.client.get<Section[]>(`/get_sections/${projectId}`, { params });
    return response.data;
  }

  async getSection(sectionId: number): Promise<Section> {
    const response = await this.client.get<Section>(`/get_section/${sectionId}`);
    return response.data;
  }

  async createSection(projectId: number, name: string, description?: string, suiteId?: number, parentId?: number): Promise<Section> {
    const data: Record<string, string | number> = { name, description: description ?? "" };
    if (suiteId) data.suite_id = suiteId;
    if (parentId) data.parent_id = parentId;
    const response = await this.client.post<Section>(`/add_section/${projectId}`, data);
    return response.data;
  }

  // Test Runs

  async getTestRuns(projectId: number, filters?: TestRunFilters): Promise<TestRun[]> {
    const params: Record<string, string | number | boolean> = {};
    if (filters?.created_after) params.created_after = filters.created_after;
    if (filters?.created_before) params.created_before = filters.created_before;
    if (filters?.is_completed !== undefined) params.is_completed = filters.is_completed ? 1 : 0;
    if (filters?.suite_id) params.suite_id = filters.suite_id;
    const response = await this.client.get<TestRun[]>(`/get_runs/${projectId}`, { params });
    return response.data;
  }

  async getTestRun(runId: number): Promise<TestRun> {
    const response = await this.client.get<TestRun>(`/get_run/${runId}`);
    return response.data;
  }

  async createTestRun(projectId: number, data: TestRunPayload): Promise<TestRun> {
    const response = await this.client.post<TestRun>(`/add_run/${projectId}`, data);
    return response.data;
  }

  async updateTestRun(runId: number, updates: TestRunUpdates): Promise<TestRun> {
    const response = await this.client.post<TestRun>(`/update_run/${runId}`, updates);
    return response.data;
  }

  async closeTestRun(runId: number): Promise<TestRun> {
    const response = await this.client.post<TestRun>(`/close_run/${runId}`);
    return response.data;
  }

  async deleteTestRun(runId: number): Promise<void> {
    await this.client.post(`/delete_run/${runId}`);
  }

  // Tests (individual instances in a run)

  async getTests(runId: number, filters?: TestFilters): Promise<Test[]> {
    const params: Record<string, number> = {};
    if (filters?.status_id) params.status_id = filters.status_id;
    if (filters?.assignedto_id) params.assignedto_id = filters.assignedto_id;
    const response = await this.client.get<Test[]>(`/get_tests/${runId}`, { params });
    return response.data;
  }

  async getTest(testId: number): Promise<Test> {
    const response = await this.client.get<Test>(`/get_test/${testId}`);
    return response.data;
  }

  // Test Results

  async getTestResults(runId: number, filters?: TestResultFilters): Promise<TestResult[]> {
    const params: Record<string, string | number> = {};
    if (filters?.status_id) params.status_id = filters.status_id;
    if (filters?.created_after) params.created_after = filters.created_after;
    if (filters?.created_before) params.created_before = filters.created_before;
    const response = await this.client.get<TestResult[]>(`/get_results_for_run/${runId}`, { params });
    return response.data;
  }

  async getTestResultsForCase(runId: number, caseId: number): Promise<TestResult[]> {
    const response = await this.client.get<TestResult[]>(`/get_results_for_case/${runId}/${caseId}`);
    return response.data;
  }

  async addTestResult(testId: number, data: TestResultPayload): Promise<TestResult> {
    const response = await this.client.post<TestResult>(`/add_result/${testId}`, data);
    return response.data;
  }

  async addTestResults(runId: number, results: TestResultsEntry[]): Promise<TestResult[]> {
    const response = await this.client.post<TestResult[]>(`/add_results/${runId}`, { results });
    return response.data;
  }

  async addTestResultForCase(runId: number, caseId: number, data: TestResultPayload): Promise<TestResult> {
    const response = await this.client.post<TestResult>(`/add_result_for_case/${runId}/${caseId}`, data);
    return response.data;
  }

  // Test Plans

  async getTestPlans(projectId: number, filters?: TestPlanFilters): Promise<TestPlan[]> {
    const params: Record<string, string | number | boolean> = {};
    if (filters?.created_after) params.created_after = filters.created_after;
    if (filters?.created_before) params.created_before = filters.created_before;
    if (filters?.is_completed !== undefined) params.is_completed = filters.is_completed ? 1 : 0;
    const response = await this.client.get<TestPlan[]>(`/get_plans/${projectId}`, { params });
    return response.data;
  }

  async getTestPlan(planId: number): Promise<TestPlan> {
    const response = await this.client.get<TestPlan>(`/get_plan/${planId}`);
    return response.data;
  }

  async createTestPlan(projectId: number, data: TestPlanPayload): Promise<TestPlan> {
    const response = await this.client.post<TestPlan>(`/add_plan/${projectId}`, data);
    return response.data;
  }

  // Milestones

  async getMilestones(projectId: number, filters?: MilestoneFilters): Promise<Milestone[]> {
    const params: Record<string, number> = {};
    if (filters?.is_completed !== undefined) params.is_completed = filters.is_completed ? 1 : 0;
    if (filters?.is_started !== undefined) params.is_started = filters.is_started ? 1 : 0;
    const response = await this.client.get<Milestone[]>(`/get_milestones/${projectId}`, { params });
    return response.data;
  }

  async getMilestone(milestoneId: number): Promise<Milestone> {
    const response = await this.client.get<Milestone>(`/get_milestone/${milestoneId}`);
    return response.data;
  }

  async createMilestone(projectId: number, data: MilestonePayload): Promise<Milestone> {
    const response = await this.client.post<Milestone>(`/add_milestone/${projectId}`, data);
    return response.data;
  }

  // Users

  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>("/get_users");
    return response.data;
  }

  async getUser(userId: number): Promise<User> {
    const response = await this.client.get<User>(`/get_user/${userId}`);
    return response.data;
  }

  // System information

  async getStatuses(): Promise<TestStatus[]> {
    const response = await this.client.get<TestStatus[]>("/get_statuses");
    return response.data;
  }

  async getCaseTypes(): Promise<CaseType[]> {
    const response = await this.client.get<CaseType[]>("/get_case_types");
    return response.data;
  }

  async getCaseFields(): Promise<unknown[]> {
    const response = await this.client.get<unknown[]>("/get_case_fields");
    return response.data;
  }

  async getResultFields(): Promise<unknown[]> {
    const response = await this.client.get<unknown[]>("/get_result_fields");
    return response.data;
  }

  async getPriorities(): Promise<Priority[]> {
    const response = await this.client.get<Priority[]>("/get_priorities");
    return response.data;
  }

  async getTemplates(projectId: number): Promise<unknown[]> {
    const response = await this.client.get<unknown[]>(`/get_templates/${projectId}`);
    return response.data;
  }

  async getReports(projectId: number): Promise<unknown[]> {
    const response = await this.client.get<unknown[]>(`/get_reports/${projectId}`);
    return response.data;
  }

  async runReport(reportTemplateId: number): Promise<unknown> {
    const response = await this.client.get<unknown>(`/run_report/${reportTemplateId}`);
    return response.data;
  }
}
