# TestRails MCP Server

A comprehensive Model Context Protocol (MCP) server that provides full integration with TestRails test management platform. This server enables AI assistants to perform complete TestRails operations through 25+ tools covering the entire API surface area.

## Features

This enhanced MCP server provides comprehensive TestRails integration with the following capabilities:

### Comprehensive Tool Set (25+ Tools)

#### Project Management
- **get_projects**: Retrieve all projects from TestRails
- **get_project**: Get specific project details

#### Test Case Management
- **get_test_cases**: Get test cases with advanced filtering (project, suite, section, type, priority, date range)
- **get_test_case**: Get specific test case details
- **create_test_case**: Create new test cases with full field support
- **update_test_case**: Update existing test cases

#### Test Suite & Section Management
- **get_test_suites**: Retrieve test suites from projects
- **get_sections**: Get sections with optional suite filtering
- **create_section**: Create new sections with hierarchy support

#### Test Run Management
- **get_test_runs**: Get test runs with advanced filtering (completion status, date range, suite)
- **create_test_run**: Create new test runs with full configuration
- **update_test_run**: Update existing test runs
- **close_test_run**: Close active test runs

#### Test Execution
- **get_tests**: Get test instances from runs with filtering
- **get_test_results**: Retrieve test results with advanced filtering
- **add_test_result**: Add single test result
- **add_test_results**: Add multiple test results in batch

#### Test Plan Management
- **get_test_plans**: Retrieve test plans with filtering
- **create_test_plan**: Create new test plans

#### Milestone Management
- **get_milestones**: Get project milestones with filtering
- **create_milestone**: Create new milestones with hierarchy

#### System Information
- **get_users**: Retrieve all users
- **get_test_statuses**: Get available test statuses
- **get_case_types**: Get available case types
- **get_priorities**: Get available priorities

### Advanced Features
- **Batch Operations**: Add multiple test results simultaneously
- **Advanced Filtering**: Date ranges, status, user assignment, completion filters
- **Hierarchy Support**: Nested sections and milestone hierarchies
- **Comprehensive Error Handling**: Detailed error messages and graceful failures

### Resources
- **testrails://projects**: Live access to all TestRails projects
- **testrails://statuses**: Available test result statuses

## Setup

### Prerequisites
- Node.js 18 or higher
- TestRails instance with API access
- TestRails API key

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template and configure your TestRails settings:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your TestRails configuration:
   ```
   TESTRAILS_URL=https://your-testrails-instance.testrail.io
   TESTRAILS_USERNAME=your-email@company.com
   TESTRAILS_API_KEY=your-api-key-here
   ```

### Getting TestRails API Key

1. Log in to your TestRails instance
2. Go to "My Settings" (click on your avatar in the top right)
3. Click on the "API Keys" tab
4. Generate a new API key if you don't have one
5. Copy the API key to your `.env` file

### Building

```bash
npm run build
```

### Running

```bash
npm start
```

For development with auto-compilation:
```bash
npm run dev
```

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "testrails": {
      "command": "node",
      "args": ["/path/to/testrails-mcp-server/build/index.js"],
      "env": {
        "TESTRAILS_URL": "https://your-testrails-instance.testrail.io",
        "TESTRAILS_USERNAME": "your-email@company.com",
        "TESTRAILS_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Example Interactions

Once connected, you can ask your AI assistant things like:

- "Show me all projects in TestRails"
- "Get test cases for project ID 1"
- "Create a test run for project 1 with the name 'Sprint 23 Testing'"
- "Add a passed result for test ID 123 with comment 'All tests passed successfully'"
- "What are the available test statuses?"

## API Coverage

This server covers the most common TestRails API operations:

- Projects management
- Test cases retrieval and creation
- Test suites management
- Test runs creation and management
- Test results management
- Status information

## Security Notes

- API keys are sensitive credentials - keep them secure
- Consider using environment variables or secure credential storage
- TestRails API has rate limiting - be mindful of excessive requests
- Only users with appropriate TestRails permissions can perform certain operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
