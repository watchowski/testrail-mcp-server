import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios, { AxiosInstance } from "axios";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// TestRails API client
class TestRailsClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string, username: string) {
    // Try different API URL formats
    const apiPaths = [
      '/index.php?/api/v2',
      '/api/v2'
    ];
    
    console.error('TestRails URL:', baseUrl);
    console.error('Username:', username);
    console.error('API Key provided:', !!apiKey);
    
    this.client = axios.create({
      baseURL: `${baseUrl}/index.php?/api/v2`,
      auth: {
        username: username,
        password: apiKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    
    // Add request interceptor for debugging
    this.client.interceptors.request.use(request => {
      console.error('Making request to:', (request.baseURL || '') + (request.url || ''));
      console.error('Auth username:', request.auth?.username);
      return request;
    });
    
    // Add response interceptor for debugging
    this.client.interceptors.response.use(
      response => {
        console.error('Response received:', response.status);
        return response;
      },
      error => {
        console.error('API Error:', error.response?.status, error.response?.statusText);
        console.error('Request URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
        console.error('Error message:', error.message);
        if (error.response?.data) {
          console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
        }
        return Promise.reject(error);
      }
    );
  }

  // Projects
  async getProjects() {
    try {
      console.error('Attempting to get projects...');
      const response = await this.client.get('/get_projects');
      console.error('Projects response received:', response.status);
      return response.data.projects || response.data;
    } catch (error: any) {
      console.error('Error in getProjects:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  async getProject(projectId: number) {
    const response = await this.client.get(`/get_project/${projectId}`);
    return response.data;
  }

  // Test Cases
  async getTestCases(projectId: number, suiteId?: number, sectionId?: number, filters?: any) {
    let url = `/get_cases/${projectId}`;
    const params = new URLSearchParams();
    
    if (suiteId) params.append('suite_id', suiteId.toString());
    if (sectionId) params.append('section_id', sectionId.toString());
    if (filters?.type_id) params.append('type_id', filters.type_id.toString());
    if (filters?.priority_id) params.append('priority_id', filters.priority_id.toString());
    if (filters?.created_after) params.append('created_after', filters.created_after);
    if (filters?.created_before) params.append('created_before', filters.created_before);
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    const response = await this.client.get(url);
    return response.data;
  }

  async getTestCase(caseId: number) {
    const response = await this.client.get(`/get_case/${caseId}`);
    return response.data;
  }

  async createTestCase(sectionId: number, data: any) {
    const response = await this.client.post(`/add_case/${sectionId}`, data);
    return response.data;
  }

  async createMultipleTestCases(sectionId: number, testCases: any[]) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      try {
        console.error(`Creating test case ${i + 1}/${testCases.length}: ${testCase.title}`);
        const response = await this.client.post(`/add_case/${sectionId}`, {
          title: testCase.title,
          template_id: testCase.template_id || 1, // Test Case (Text)
          type_id: testCase.type_id || 1, // Acceptance
          priority_id: testCase.priority_id || testCase.priority || 3,
          custom_preconds: testCase.custom_preconds || testCase.preconditions,
          custom_steps: testCase.custom_steps || testCase.description,
          custom_steps_separated: testCase.custom_steps_separated || testCase.description,
          refs: testCase.refs
        });
        
        results.push({
          success: true,
          testCase: response.data,
          index: i
        });
        
        console.error(`✅ Created test case: ${response.data.title} (ID: ${response.data.id})`);
      } catch (error: any) {
        console.error(`❌ Failed to create test case: ${testCase.title}`);
        console.error('Error:', error.response?.data || error.message);
        
        errors.push({
          success: false,
          error: error.response?.data || error.message,
          testCase: testCase,
          index: i
        });
      }
    }
    
    return {
      results,
      errors,
      totalAttempted: testCases.length,
      totalSuccessful: results.length,
      totalFailed: errors.length
    };
  }

  async updateTestCase(caseId: number, updates: any) {
    const response = await this.client.post(`/update_case/${caseId}`, updates);
    return response.data;
  }

  async deleteTestCase(caseId: number) {
    const response = await this.client.post(`/delete_case/${caseId}`);
    return response.data;
  }

  // Test Suites
  async getTestSuites(projectId: number) {
    const response = await this.client.get(`/get_suites/${projectId}`);
    return response.data;
  }

  async getTestSuite(suiteId: number) {
    const response = await this.client.get(`/get_suite/${suiteId}`);
    return response.data;
  }

  async createTestSuite(projectId: number, name: string, description?: string) {
    const data = { name, description: description || '' };
    const response = await this.client.post(`/add_suite/${projectId}`, data);
    return response.data;
  }

  // Sections
  async getSections(projectId: number, suiteId?: number) {
    let url = `/get_sections/${projectId}`;
    if (suiteId) {
      url += `&suite_id=${suiteId}`;
    }
    const response = await this.client.get(url);
    return response.data;
  }

  async getSection(sectionId: number) {
    const response = await this.client.get(`/get_section/${sectionId}`);
    return response.data;
  }

  async createSection(projectId: number, name: string, description?: string, suiteId?: number, parentId?: number) {
    const data: any = { name, description: description || '' };
    if (suiteId) data.suite_id = suiteId;
    if (parentId) data.parent_id = parentId;
    
    const response = await this.client.post(`/add_section/${projectId}`, data);
    return response.data;
  }

  // Test Runs
  async getTestRuns(projectId: number, filters?: any) {
    let url = `/get_runs/${projectId}`;
    const params = new URLSearchParams();
    
    if (filters?.created_after) params.append('created_after', filters.created_after);
    if (filters?.created_before) params.append('created_before', filters.created_before);
    if (filters?.is_completed) params.append('is_completed', filters.is_completed.toString());
    if (filters?.suite_id) params.append('suite_id', filters.suite_id.toString());
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    const response = await this.client.get(url);
    return response.data;
  }

  async getTestRun(runId: number) {
    const response = await this.client.get(`/get_run/${runId}`);
    return response.data;
  }

  async createTestRun(projectId: number, data: any) {
    const response = await this.client.post(`/add_run/${projectId}`, data);
    return response.data;
  }

  async updateTestRun(runId: number, updates: any) {
    const response = await this.client.post(`/update_run/${runId}`, updates);
    return response.data;
  }

  async closeTestRun(runId: number) {
    const response = await this.client.post(`/close_run/${runId}`);
    return response.data;
  }

  async deleteTestRun(runId: number) {
    const response = await this.client.post(`/delete_run/${runId}`);
    return response.data;
  }

  // Tests (individual test instances in runs)
  async getTests(runId: number, filters?: any) {
    let url = `/get_tests/${runId}`;
    const params = new URLSearchParams();
    
    if (filters?.status_id) params.append('status_id', filters.status_id.toString());
    if (filters?.assignedto_id) params.append('assignedto_id', filters.assignedto_id.toString());
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    const response = await this.client.get(url);
    return response.data;
  }

  async getTest(testId: number) {
    const response = await this.client.get(`/get_test/${testId}`);
    return response.data;
  }

  // Test Results
  async getTestResults(runId: number, filters?: any) {
    let url = `/get_results_for_run/${runId}`;
    const params = new URLSearchParams();
    
    if (filters?.status_id) params.append('status_id', filters.status_id.toString());
    if (filters?.created_after) params.append('created_after', filters.created_after);
    if (filters?.created_before) params.append('created_before', filters.created_before);
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    const response = await this.client.get(url);
    return response.data;
  }

  async getTestResultsForCase(runId: number, caseId: number) {
    const response = await this.client.get(`/get_results_for_case/${runId}/${caseId}`);
    return response.data;
  }

  async addTestResult(testId: number, data: any) {
    const response = await this.client.post(`/add_result/${testId}`, data);
    return response.data;
  }

  async addTestResults(runId: number, results: any[]) {
    const data = { results };
    const response = await this.client.post(`/add_results/${runId}`, data);
    return response.data;
  }

  async addTestResultForCase(runId: number, caseId: number, data: any) {
    const response = await this.client.post(`/add_result_for_case/${runId}/${caseId}`, data);
    return response.data;
  }

  // Test Plans
  async getTestPlans(projectId: number, filters?: any) {
    let url = `/get_plans/${projectId}`;
    const params = new URLSearchParams();
    
    if (filters?.created_after) params.append('created_after', filters.created_after);
    if (filters?.created_before) params.append('created_before', filters.created_before);
    if (filters?.is_completed) params.append('is_completed', filters.is_completed.toString());
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    const response = await this.client.get(url);
    return response.data;
  }

  async getTestPlan(planId: number) {
    const response = await this.client.get(`/get_plan/${planId}`);
    return response.data;
  }

  async createTestPlan(projectId: number, data: any) {
    const response = await this.client.post(`/add_plan/${projectId}`, data);
    return response.data;
  }

  // Milestones
  async getMilestones(projectId: number, filters?: any) {
    let url = `/get_milestones/${projectId}`;
    const params = new URLSearchParams();
    
    if (filters?.is_completed) params.append('is_completed', filters.is_completed.toString());
    if (filters?.is_started) params.append('is_started', filters.is_started.toString());
    
    if (params.toString()) {
      url += `&${params.toString()}`;
    }
    
    const response = await this.client.get(url);
    return response.data;
  }

  async getMilestone(milestoneId: number) {
    const response = await this.client.get(`/get_milestone/${milestoneId}`);
    return response.data;
  }

  async createMilestone(projectId: number, data: any) {
    const response = await this.client.post(`/add_milestone/${projectId}`, data);
    return response.data;
  }

  // Users
  async getUsers() {
    const response = await this.client.get('/get_users');
    return response.data;
  }

  async getUser(userId: number) {
    const response = await this.client.get(`/get_user/${userId}`);
    return response.data;
  }

  // System Information
  async getStatuses() {
    const response = await this.client.get('/get_statuses');
    return response.data;
  }

  async getCaseTypes() {
    const response = await this.client.get('/get_case_types');
    return response.data;
  }

  async getCaseFields() {
    const response = await this.client.get('/get_case_fields');
    return response.data;
  }

  async getResultFields() {
    const response = await this.client.get('/get_result_fields');
    return response.data;
  }

  async getPriorities() {
    const response = await this.client.get('/get_priorities');
    return response.data;
  }

  async getTemplates(projectId: number) {
    const response = await this.client.get(`/get_templates/${projectId}`);
    return response.data;
  }

  // Reports
  async getReports(projectId: number) {
    const response = await this.client.get(`/get_reports/${projectId}`);
    return response.data;
  }

  async runReport(reportTemplateId: number) {
    const response = await this.client.get(`/run_report/${reportTemplateId}`);
    return response.data;
  }
}

// Initialize TestRails client
const testrailsUrl = process.env.TESTRAILS_URL;
const testrailsApiKey = process.env.TESTRAILS_API_KEY;
const testrailsUsername = process.env.TESTRAILS_USERNAME;

if (!testrailsUrl || !testrailsApiKey || !testrailsUsername) {
  console.error('Please set TESTRAILS_URL, TESTRAILS_API_KEY, and TESTRAILS_USERNAME environment variables');
  process.exit(1);
}

const testRailsClient = new TestRailsClient(testrailsUrl, testrailsApiKey, testrailsUsername);

// Create MCP server
const server = new McpServer({
  name: "testrails-server",
  version: "1.0.0",
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Tools
server.registerTool(
  "get_projects",
  {
    title: "Get TestRails Projects",
    description: "Retrieve all projects from TestRails",
    inputSchema: {}
  },
  async () => {
    try {
      const projects = await testRailsClient.getProjects();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(projects, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching projects: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_test_cases",
  {
    title: "Get Test Cases",
    description: "Retrieve test cases from a specific project and optional suite",
    inputSchema: {
      projectId: z.number().describe("The ID of the project"),
      suiteId: z.number().optional().describe("Optional suite ID to filter test cases")
    }
  },
  async ({ projectId, suiteId }) => {
    try {
      const testCases = await testRailsClient.getTestCases(projectId, suiteId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(testCases, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching test cases: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_test_suites",
  {
    title: "Get Test Suites",
    description: "Retrieve test suites from a specific project",
    inputSchema: {
      projectId: z.number().describe("The ID of the project")
    }
  },
  async ({ projectId }) => {
    try {
      const testSuites = await testRailsClient.getTestSuites(projectId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(testSuites, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching test suites: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_test_runs",
  {
    title: "Get Test Runs",
    description: "Retrieve test runs from a specific project",
    inputSchema: {
      projectId: z.number().describe("The ID of the project")
    }
  },
  async ({ projectId }) => {
    try {
      const testRuns = await testRailsClient.getTestRuns(projectId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(testRuns, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching test runs: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_test_results",
  {
    title: "Get Test Results",
    description: "Retrieve test results for a specific test run",
    inputSchema: {
      runId: z.number().describe("The ID of the test run")
    }
  },
  async ({ runId }) => {
    try {
      const testResults = await testRailsClient.getTestResults(runId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(testResults, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching test results: ${error.message}`
        }],
        isError: true
      };
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
      caseIds: z.array(z.number()).optional().describe("Specific test case IDs to include")
    }
  },
  async ({ projectId, name, description, suiteId, caseIds }) => {
    try {
      const data: any = {
        name,
        description: description || '',
      };
      
      if (suiteId) {
        data.suite_id = suiteId;
      }
      
      if (caseIds && caseIds.length > 0) {
        data.case_ids = caseIds;
      }

      const testRun = await testRailsClient.createTestRun(projectId, data);
      return {
        content: [{
          type: "text",
          text: `Test run created successfully: ${JSON.stringify(testRun, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error creating test run: ${error.message}`
        }],
        isError: true
      };
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
      elapsed: z.string().optional().describe("Time elapsed (e.g., '5m', '1h 30m')")
    }
  },
  async ({ testId, statusId, comment, elapsed }) => {
    try {
      const data: any = {
        status_id: statusId,
      };
      
      if (comment) {
        data.comment = comment;
      }
      
      if (elapsed) {
        data.elapsed = elapsed;
      }

      const result = await testRailsClient.addTestResult(testId, data);
      return {
        content: [{
          type: "text",
          text: `Test result added successfully: ${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error adding test result: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_test_statuses",
  {
    title: "Get Test Statuses",
    description: "Retrieve all available test statuses from TestRails",
    inputSchema: {}
  },
  async () => {
    try {
      const statuses = await testRailsClient.getStatuses();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(statuses, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching test statuses: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "create_test_case",
  {
    title: "Create Test Case",
    description: "Create a new test case in TestRails",
    inputSchema: {
      sectionId: z.number().describe("The ID of the section where the test case will be created"),
      title: z.string().describe("Title of the test case"),
      description: z.string().optional().describe("Description/steps of the test case"),
      priority: z.number().optional().describe("Priority ID (1=Low, 2=Medium, 3=High, 4=Critical)"),
      refs: z.string().optional().describe("Reference field for the test case (e.g., ticket ID)")
    }
  },
  async ({ sectionId, title, description, priority, refs }) => {
    try {
      const data: any = {
        title,
      };
      
      if (description) {
        data.custom_steps_separated = description;
      }
      
      if (priority) {
        data.priority_id = priority;
      }
      
      if (refs) {
        data.refs = refs;
      }

      const testCase = await testRailsClient.createTestCase(sectionId, data);
      return {
        content: [{
          type: "text",
          text: `Test case created successfully: ${JSON.stringify(testCase, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error creating test case: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "create_multiple_test_cases",
  {
    title: "Create Multiple Test Cases",
    description: "Create multiple test cases at once in a specific section",
    inputSchema: {
      sectionId: z.number().describe("The ID of the section where the test cases will be created"),
      testCases: z.array(z.object({
        title: z.string().describe("Title of the test case"),
        description: z.string().optional().describe("Description/steps of the test case"),
        priority: z.number().optional().describe("Priority ID (1=Low, 2=Medium, 3=High, 4=Critical)"),
        refs: z.string().optional().describe("Reference field for the test case (e.g., ticket ID)"),
        preconditions: z.string().optional().describe("Preconditions for the test case"),
        template_id: z.number().optional().describe("Template ID (default: 1 for Test Case Text)"),
        type_id: z.number().optional().describe("Test case type ID (default: 1 for Acceptance)")
      })).describe("Array of test cases to create")
    }
  },
  async ({ sectionId, testCases }) => {
    try {
      console.error(`Creating ${testCases.length} test cases in section ${sectionId}...`);
      const result = await testRailsClient.createMultipleTestCases(sectionId, testCases);
      
      const summary = {
        totalAttempted: result.totalAttempted,
        totalSuccessful: result.totalSuccessful,
        totalFailed: result.totalFailed,
        successfulCases: result.results.map(r => ({
          id: r.testCase.id,
          title: r.testCase.title,
          index: r.index
        })),
        failedCases: result.errors.map(e => ({
          title: e.testCase.title,
          error: e.error,
          index: e.index
        }))
      };
      
      return {
        content: [{
          type: "text",
          text: `Bulk test case creation completed:\n${JSON.stringify(summary, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error creating multiple test cases: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Additional comprehensive tools for TestRails MCP

server.registerTool(
  "get_sections",
  {
    title: "Get Sections",
    description: "Retrieve sections from a specific project",
    inputSchema: {
      projectId: z.number().describe("The ID of the project"),
      suiteId: z.number().optional().describe("Optional suite ID to filter sections")
    }
  },
  async ({ projectId, suiteId }) => {
    try {
      const sections = await testRailsClient.getSections(projectId, suiteId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(sections, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching sections: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "create_section",
  {
    title: "Create Section",
    description: "Create a new section in a project",
    inputSchema: {
      projectId: z.number().describe("The ID of the project"),
      name: z.string().describe("Name of the section"),
      description: z.string().optional().describe("Description of the section"),
      suiteId: z.number().optional().describe("Suite ID if project uses suites"),
      parentId: z.number().optional().describe("Parent section ID for nested sections")
    }
  },
  async ({ projectId, name, description, suiteId, parentId }) => {
    try {
      const section = await testRailsClient.createSection(projectId, name, description, suiteId, parentId);
      return {
        content: [{
          type: "text",
          text: `Section created successfully: ${JSON.stringify(section, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error creating section: ${error.message}`
        }],
        isError: true
      };
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
      assignedtoId: z.number().optional().describe("Filter by assigned user ID")
    }
  },
  async ({ runId, statusId, assignedtoId }) => {
    try {
      const filters: any = {};
      if (statusId) filters.status_id = statusId;
      if (assignedtoId) filters.assignedto_id = assignedtoId;
      
      const tests = await testRailsClient.getTests(runId, filters);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(tests, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching tests: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_test_plans",
  {
    title: "Get Test Plans",
    description: "Retrieve test plans from a specific project",
    inputSchema: {
      projectId: z.number().describe("The ID of the project"),
      isCompleted: z.boolean().optional().describe("Filter by completion status"),
      createdAfter: z.string().optional().describe("Filter by creation date (Unix timestamp)")
    }
  },
  async ({ projectId, isCompleted, createdAfter }) => {
    try {
      const filters: any = {};
      if (isCompleted !== undefined) filters.is_completed = isCompleted;
      if (createdAfter) filters.created_after = createdAfter;
      
      const plans = await testRailsClient.getTestPlans(projectId, filters);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(plans, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching test plans: ${error.message}`
        }],
        isError: true
      };
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
      milestoneId: z.number().optional().describe("Milestone ID to associate with the plan")
    }
  },
  async ({ projectId, name, description, milestoneId }) => {
    try {
      const data: any = { name };
      if (description) data.description = description;
      if (milestoneId) data.milestone_id = milestoneId;
      
      const plan = await testRailsClient.createTestPlan(projectId, data);
      return {
        content: [{
          type: "text",
          text: `Test plan created successfully: ${JSON.stringify(plan, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error creating test plan: ${error.message}`
        }],
        isError: true
      };
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
      isStarted: z.boolean().optional().describe("Filter by start status")
    }
  },
  async ({ projectId, isCompleted, isStarted }) => {
    try {
      const filters: any = {};
      if (isCompleted !== undefined) filters.is_completed = isCompleted;
      if (isStarted !== undefined) filters.is_started = isStarted;
      
      const milestones = await testRailsClient.getMilestones(projectId, filters);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(milestones, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching milestones: ${error.message}`
        }],
        isError: true
      };
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
      parentId: z.number().optional().describe("Parent milestone ID")
    }
  },
  async ({ projectId, name, description, dueOn, parentId }) => {
    try {
      const data: any = { name };
      if (description) data.description = description;
      if (dueOn) data.due_on = dueOn;
      if (parentId) data.parent_id = parentId;
      
      const milestone = await testRailsClient.createMilestone(projectId, data);
      return {
        content: [{
          type: "text",
          text: `Milestone created successfully: ${JSON.stringify(milestone, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error creating milestone: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_users",
  {
    title: "Get Users",
    description: "Retrieve all users from TestRails",
    inputSchema: {}
  },
  async () => {
    try {
      const users = await testRailsClient.getUsers();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(users, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching users: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_case_types",
  {
    title: "Get Case Types",
    description: "Retrieve all available case types",
    inputSchema: {}
  },
  async () => {
    try {
      const caseTypes = await testRailsClient.getCaseTypes();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(caseTypes, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching case types: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_priorities",
  {
    title: "Get Priorities",
    description: "Retrieve all available priorities",
    inputSchema: {}
  },
  async () => {
    try {
      const priorities = await testRailsClient.getPriorities();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(priorities, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching priorities: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "close_test_run",
  {
    title: "Close Test Run",
    description: "Close an active test run",
    inputSchema: {
      runId: z.number().describe("The ID of the test run to close")
    }
  },
  async ({ runId }) => {
    try {
      const result = await testRailsClient.closeTestRun(runId);
      return {
        content: [{
          type: "text",
          text: `Test run closed successfully: ${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error closing test run: ${error.message}`
        }],
        isError: true
      };
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
      includeAll: z.boolean().optional().describe("Include all test cases")
    }
  },
  async ({ runId, name, description, milestoneId, includeAll }) => {
    try {
      const updates: any = {};
      if (name) updates.name = name;
      if (description) updates.description = description;
      if (milestoneId) updates.milestone_id = milestoneId;
      if (includeAll !== undefined) updates.include_all = includeAll;
      
      const result = await testRailsClient.updateTestRun(runId, updates);
      return {
        content: [{
          type: "text",
          text: `Test run updated successfully: ${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error updating test run: ${error.message}`
        }],
        isError: true
      };
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
        defects: z.string().optional().describe("Defect IDs")
      })).describe("Array of test results")
    }
  },
  async ({ runId, results }) => {
    try {
      const result = await testRailsClient.addTestResults(runId, results);
      return {
        content: [{
          type: "text",
          text: `Test results added successfully: ${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error adding test results: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_project",
  {
    title: "Get Project",
    description: "Get details of a specific project",
    inputSchema: {
      projectId: z.number().describe("The ID of the project")
    }
  },
  async ({ projectId }) => {
    try {
      const project = await testRailsClient.getProject(projectId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(project, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching project: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_test_case",
  {
    title: "Get Test Case",
    description: "Get details of a specific test case",
    inputSchema: {
      caseId: z.number().describe("The ID of the test case")
    }
  },
  async ({ caseId }) => {
    try {
      const testCase = await testRailsClient.getTestCase(caseId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(testCase, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching test case: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

server.registerTool(
  "update_test_case",
  {
    title: "Update Test Case",
    description: "Update an existing test case",
    inputSchema: {
      caseId: z.number().describe("The ID of the test case to update"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description/steps"),
      priorityId: z.number().optional().describe("New priority ID"),
      typeId: z.number().optional().describe("New type ID")
    }
  },
  async ({ caseId, title, description, priorityId, typeId }) => {
    try {
      const updates: any = {};
      if (title) updates.title = title;
      if (description) updates.custom_steps_separated = description;
      if (priorityId) updates.priority_id = priorityId;
      if (typeId) updates.type_id = typeId;
      
      const result = await testRailsClient.updateTestCase(caseId, updates);
      return {
        content: [{
          type: "text",
          text: `Test case updated successfully: ${JSON.stringify(result, null, 2)}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error updating test case: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Resources
server.registerResource(
  "projects",
  "testrails://projects",
  {
    title: "TestRails Projects",
    description: "List of all TestRails projects",
    mimeType: "application/json"
  },
  async () => {
    try {
      const projects = await testRailsClient.getProjects();
      return {
        contents: [{
          uri: "testrails://projects",
          text: JSON.stringify(projects, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error: any) {
      throw new Error(`Error fetching projects: ${error.message}`);
    }
  }
);

server.registerResource(
  "statuses",
  "testrails://statuses",
  {
    title: "TestRails Test Statuses",
    description: "List of all available test statuses",
    mimeType: "application/json"
  },
  async () => {
    try {
      const statuses = await testRailsClient.getStatuses();
      return {
        contents: [{
          uri: "testrails://statuses",
          text: JSON.stringify(statuses, null, 2),
          mimeType: "application/json"
        }]
      };
    } catch (error: any) {
      throw new Error(`Error fetching statuses: ${error.message}`);
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TestRails MCP Server is running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
