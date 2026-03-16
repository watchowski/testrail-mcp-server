// TestRail entity types

export interface Project {
  id: number;
  name: string;
  announcement?: string;
  show_announcement?: boolean;
  is_completed?: boolean;
  completed_on?: number;
  suite_mode?: number;
  url?: string;
}

export interface TestSuite {
  id: number;
  name: string;
  description?: string;
  project_id: number;
  is_master?: boolean;
  is_baseline?: boolean;
  is_completed?: boolean;
  completed_on?: number;
  url?: string;
}

export interface Section {
  id: number;
  name: string;
  description?: string;
  suite_id?: number;
  parent_id?: number;
  depth?: number;
  display_order?: number;
}

export interface TestCase {
  id: number;
  title: string;
  section_id?: number;
  template_id?: number;
  type_id?: number;
  priority_id?: number;
  refs?: string;
  created_by?: number;
  created_on?: number;
  updated_by?: number;
  updated_on?: number;
  custom_preconds?: string;
  custom_steps?: string;
  custom_steps_separated?: string;
}

export interface TestRun {
  id: number;
  name: string;
  description?: string;
  suite_id?: number;
  project_id?: number;
  milestone_id?: number;
  assignedto_id?: number;
  include_all?: boolean;
  is_completed?: boolean;
  completed_on?: number;
  passed_count?: number;
  failed_count?: number;
  untested_count?: number;
  url?: string;
}

export interface TestPlan {
  id: number;
  name: string;
  description?: string;
  project_id?: number;
  milestone_id?: number;
  is_completed?: boolean;
  completed_on?: number;
  passed_count?: number;
  failed_count?: number;
  url?: string;
}

export interface Milestone {
  id: number;
  name: string;
  description?: string;
  due_on?: number;
  started_on?: number;
  is_started?: boolean;
  is_completed?: boolean;
  completed_on?: number;
  parent_id?: number;
  project_id?: number;
  url?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_active?: boolean;
}

export interface TestStatus {
  id: number;
  name: string;
  label?: string;
  color_dark?: number;
  color_medium?: number;
  color_bright?: number;
  is_system?: boolean;
  is_untested?: boolean;
  is_final?: boolean;
}

export interface CaseType {
  id: number;
  name: string;
  is_default?: boolean;
}

export interface Priority {
  id: number;
  name: string;
  short_name?: string;
  is_default?: boolean;
  priority?: number;
}

export interface Test {
  id: number;
  case_id: number;
  run_id: number;
  status_id: number;
  assignedto_id?: number;
  title?: string;
}

export interface TestResult {
  id: number;
  test_id: number;
  status_id: number;
  comment?: string;
  elapsed?: string;
  defects?: string;
  created_by?: number;
  created_on?: number;
}

// Payload types for creating/updating resources

export interface TestCasePayload {
  title: string;
  template_id?: number;
  type_id?: number;
  priority_id?: number;
  custom_preconds?: string;
  custom_steps?: string;
  custom_steps_separated?: string;
  refs?: string;
}

export interface TestCaseUpdates {
  title?: string;
  template_id?: number;
  type_id?: number;
  priority_id?: number;
  custom_preconds?: string;
  custom_steps?: string;
  custom_steps_separated?: string;
  refs?: string;
}

export interface TestRunPayload {
  name: string;
  description?: string;
  suite_id?: number;
  case_ids?: number[];
  milestone_id?: number;
  include_all?: boolean;
}

export interface TestRunUpdates {
  name?: string;
  description?: string;
  milestone_id?: number;
  include_all?: boolean;
}

export interface TestPlanPayload {
  name: string;
  description?: string;
  milestone_id?: number;
}

export interface MilestonePayload {
  name: string;
  description?: string;
  due_on?: string;
  parent_id?: number;
}

export interface TestResultPayload {
  status_id: number;
  comment?: string;
  elapsed?: string;
  defects?: string;
}

export interface TestResultsEntry {
  test_id: number;
  status_id: number;
  comment?: string;
  elapsed?: string;
  defects?: string;
}

// Filter types

export interface TestCaseFilters {
  type_id?: number;
  priority_id?: number;
  created_after?: string;
  created_before?: string;
}

export interface TestRunFilters {
  created_after?: string;
  created_before?: string;
  is_completed?: boolean;
  suite_id?: number;
}

export interface TestFilters {
  status_id?: number;
  assignedto_id?: number;
}

export interface TestResultFilters {
  status_id?: number;
  created_after?: string;
  created_before?: string;
}

export interface TestPlanFilters {
  created_after?: string;
  created_before?: string;
  is_completed?: boolean;
}

export interface MilestoneFilters {
  is_completed?: boolean;
  is_started?: boolean;
}

// Bulk creation types

export interface BulkTestCaseInput {
  title: string;
  description?: string;
  priority?: number;
  priority_id?: number;
  refs?: string;
  preconditions?: string;
  template_id?: number;
  type_id?: number;
  custom_preconds?: string;
  custom_steps?: string;
  custom_steps_separated?: string;
}

export interface BulkCreateSuccess {
  success: true;
  testCase: TestCase;
  index: number;
}

export interface BulkCreateError {
  success: false;
  error: unknown;
  testCase: BulkTestCaseInput;
  index: number;
}

export interface BulkCreateResult {
  results: BulkCreateSuccess[];
  errors: BulkCreateError[];
  totalAttempted: number;
  totalSuccessful: number;
  totalFailed: number;
}
