# TestRail MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for TestRail. Gives AI assistants full access to your TestRail instance — browse projects, manage test cases, create runs, record results, and more.

## Requirements

- Node.js 18+
- TestRail instance with API access enabled

## Installation

### Via npx (no install required)

```json
{
  "mcpServers": {
    "testrail": {
      "command": "npx",
      "args": ["-y", "testrail-mcp-server"],
      "env": {
        "TESTRAILS_URL": "https://your-instance.testrail.io",
        "TESTRAILS_USERNAME": "your-email@company.com",
        "TESTRAILS_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Via global install

```bash
npm install -g testrail-mcp-server
```

Then in your MCP client config:

```json
{
  "mcpServers": {
    "testrail": {
      "command": "testrail-mcp-server",
      "env": {
        "TESTRAILS_URL": "https://your-instance.testrail.io",
        "TESTRAILS_USERNAME": "your-email@company.com",
        "TESTRAILS_API_KEY": "your-api-key"
      }
    }
  }
}
```

To get your API key: **My Settings → API Keys** in TestRail.

## Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
TESTRAILS_URL=https://your-instance.testrail.io
TESTRAILS_USERNAME=your-email@company.com
TESTRAILS_API_KEY=your-api-key
```

### 3. Build

```bash
npm run build
```

### 4. Connect to Claude Desktop (local build)

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "testrail": {
      "command": "node",
      "args": ["/absolute/path/to/testrail-mcp-server/build/index.js"],
      "env": {
        "TESTRAILS_URL": "https://your-instance.testrail.io",
        "TESTRAILS_USERNAME": "your-email@company.com",
        "TESTRAILS_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Development

```bash
npm run watch      # watch mode — recompiles on file changes
npm run typecheck  # type-check without emitting output
npm run dev        # single build + run
```

Enable verbose API logging:

```bash
DEBUG=1 npm start
```

## Tools

### Projects

| Tool | Description |
|---|---|
| `get_projects` | List all projects |
| `get_project` | Get a specific project by ID |

### Test Suites

| Tool | Description |
|---|---|
| `get_test_suites` | List suites in a project |
| `get_test_suite` | Get a specific suite by ID |

### Sections

| Tool | Description |
|---|---|
| `get_sections` | List sections (optionally filtered by suite) |
| `get_section` | Get a specific section by ID (resolves section_id to name) |
| `create_section` | Create a section, with optional parent for nesting |

### Test Cases

| Tool | Description |
|---|---|
| `get_test_cases` | List test cases with optional suite/section/type/priority filters |
| `get_test_case` | Get a specific test case by ID |
| `find_test_cases_by_ref` | Search test cases by reference (e.g. `TFX-18` or `TFX-18,TFX-42`) |
| `create_test_case` | Create a single test case |
| `create_multiple_test_cases` | Bulk-create test cases in a section |
| `update_test_case` | Update title, steps, priority, or type |
| `delete_test_case` | Permanently delete a test case |

### Test Runs

| Tool | Description |
|---|---|
| `get_test_runs` | List runs with optional suite/completion filters |
| `get_test_run` | Get a specific run by ID |
| `find_test_run_by_title` | Search runs by title (partial, case-insensitive) |
| `create_test_run` | Create a run, optionally scoped to specific cases |
| `update_test_run` | Update name, description, or milestone |
| `close_test_run` | Close an active run |
| `delete_test_run` | Permanently delete a run |

### Test Execution

| Tool | Description |
|---|---|
| `get_tests` | List test instances in a run, with status/assignee filters |
| `get_test_results` | Get results for a run, with status filter |
| `add_test_result` | Record a result for a specific test instance |
| `add_test_result_for_case` | Record a result by case ID within a run |
| `add_test_results` | Record multiple results in a single call |

### Test Plans

| Tool | Description |
|---|---|
| `get_test_plans` | List plans with optional completion filter |
| `create_test_plan` | Create a test plan, optionally linked to a milestone |

### Milestones

| Tool | Description |
|---|---|
| `get_milestones` | List milestones with optional started/completed filters |
| `get_milestone` | Get a specific milestone by ID |
| `create_milestone` | Create a milestone with optional due date and parent |

### Users & System

| Tool | Description |
|---|---|
| `get_users` | List all users |
| `get_user` | Get a specific user by ID |
| `get_test_statuses` | List all test statuses |
| `get_case_types` | List available case types |
| `get_case_fields` | List custom case fields |
| `get_result_fields` | List custom result fields |
| `get_priorities` | List available priorities |
| `get_templates` | List case templates for a project |
| `get_reports` | List report templates for a project |
| `run_report` | Execute a report template |

## Resources

| URI | Description |
|---|---|
| `testrails://projects` | Live list of all projects |
| `testrails://statuses` | All available test statuses |

## Example prompts

```
Show me all projects in TestRail
```
```
Find all test cases with reference TFX-18 in project 3
```
```
Create a test run for project 1 called "Sprint 24 Regression" using suite 5
```
```
Mark test 892 as passed with comment "Verified on staging"
```
```
Bulk create these 10 test cases in section 44: [...]
```
```
Find the latest active run with "smoke" in the title for project 2
```

## Project structure

```
src/
  index.ts          # Server entry point
  client.ts         # TestRail API client
  types.ts          # TypeScript interfaces
  resources.ts      # MCP resource registrations
  tools/
    system.ts       # Projects, suites, users, priorities, etc.
    cases.ts        # Test case tools
    sections.ts     # Section tools
    runs.ts         # Test run and result tools
    plans.ts        # Test plan and milestone tools
```

## License

MIT
