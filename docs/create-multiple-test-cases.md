# Create Multiple Test Cases Tool Documentation

## Overview

The `create_multiple_test_cases` tool is a new MCP tool that enables bulk creation of test cases in TestRails. This tool was designed to replicate and improve upon the functionality of the `create-tfx18-testcases.mjs` script, allowing you to create multiple test cases with a single API call instead of making individual requests for each test case.

## Tool Specification

**Tool Name:** `create_multiple_test_cases`

**Description:** Create multiple test cases at once in a specific section

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sectionId` | number | ✅ Yes | The ID of the section where the test cases will be created |
| `testCases` | array | ✅ Yes | Array of test case objects to create |

### Test Case Object Structure

Each test case in the `testCases` array should have the following structure:

```typescript
{
  title: string,                    // Required: Title of the test case
  description?: string,             // Optional: Description/steps of the test case
  priority?: number,                // Optional: Priority ID (1=Low, 2=Medium, 3=High, 4=Critical)
  refs?: string,                    // Optional: Reference field (e.g., ticket ID like "TFX-18")
  preconditions?: string,           // Optional: Preconditions for the test case
  template_id?: number,             // Optional: Template ID (default: 1 for Test Case Text)
  type_id?: number                  // Optional: Test case type ID (default: 1 for Acceptance)
}
```

## Usage Example

### Complete Workflow (replicating the original script)

```javascript
// Step 1: Get projects to find Highway.com project
const projects = await mcpClient.callTool('get_projects', {});

// Step 2: Find Highway.com project (filter client-side)
const highwayProject = projects.find(p => p.name.toLowerCase().includes('highway'));

// Step 3: Get test suites for the project
const suites = await mcpClient.callTool('get_test_suites', {
  projectId: highwayProject.id
});

// Step 4: Get sections to check for "Discover Loads" section
const sections = await mcpClient.callTool('get_sections', {
  projectId: highwayProject.id,
  suiteId: suites[0].id
});

// Step 5: Create section if it doesn't exist
let discoverLoadsSection = sections.find(s => 
  s.name.toLowerCase().includes('discover loads')
);

if (!discoverLoadsSection) {
  const newSection = await mcpClient.callTool('create_section', {
    projectId: highwayProject.id,
    name: 'Discover Loads',
    description: 'Test cases for the Discover Loads epic functionality',
    suiteId: suites[0].id
  });
  discoverLoadsSection = newSection;
}

// Step 6: Create all test cases at once
const result = await mcpClient.callTool('create_multiple_test_cases', {
  sectionId: discoverLoadsSection.id,
  testCases: [
    {
      title: 'TFX-18 - Calendar Picker Navigation from Date Fields',
      description: `**Objective:** Verify navigation to calendar picker from pick-up and drop-off date fields...`,
      priority: 3,
      refs: 'TFX-18',
      preconditions: 'User has access to the mobile app and is on the search screen'
    },
    // ... add all 15 test cases
  ]
});
```

### Response Format

The tool returns a comprehensive response with the following structure:

```json
{
  "content": [{
    "type": "text",
    "text": {
      "totalAttempted": 15,
      "totalSuccessful": 15,
      "totalFailed": 0,
      "successfulCases": [
        {
          "id": 12345,
          "title": "TFX-18 - Calendar Picker Navigation from Date Fields",
          "index": 0
        },
        // ... more successful cases
      ],
      "failedCases": [
        // Any failed cases with error details
      ]
    }
  }]
}
```

## Advantages Over Original Script

### 1. **Batch Processing**
- Single API call instead of 15 individual calls
- Reduced network overhead and faster execution
- Better transaction consistency

### 2. **Enhanced Error Handling**
- Partial success support (some cases can succeed even if others fail)
- Detailed error reporting for each failed case
- Comprehensive success/failure summary

### 3. **Type Safety**
- Zod schema validation for all input parameters
- TypeScript type checking prevents runtime errors
- Clear parameter documentation

### 4. **Better Logging**
- Progress tracking during creation
- Detailed console output for debugging
- Structured error messages

### 5. **Consistent Response Format**
- Standardized MCP response structure
- JSON-formatted output for easy parsing
- Clear success/error indicators

## Implementation Details

### TestRails API Integration

The tool uses the TestRails API endpoint `/add_case/{section_id}` for each test case creation. The following mappings are applied:

| MCP Parameter | TestRails Field | Default Value |
|---------------|-----------------|---------------|
| `title` | `title` | - |
| `description` | `custom_steps` & `custom_steps_separated` | - |
| `priority` | `priority_id` | 3 (High) |
| `refs` | `refs` | - |
| `preconditions` | `custom_preconds` | - |
| `template_id` | `template_id` | 1 (Test Case Text) |
| `type_id` | `type_id` | 1 (Acceptance) |

### Error Handling Strategy

1. **Individual Case Errors**: If one test case fails, the tool continues with the remaining cases
2. **Network Errors**: Proper error catching and reporting for API failures
3. **Validation Errors**: Zod schema validation prevents invalid data submission
4. **Progress Tracking**: Console logging shows progress and identifies problematic cases

## Comparison with Original Script

| Feature | Original Script | New MCP Tool |
|---------|----------------|--------------|
| API Calls | 15 individual calls | 1 batch call |
| Error Handling | Stop on first error | Continue on errors |
| Type Safety | Runtime validation | Compile-time + runtime |
| Response Format | Custom logging | Structured JSON |
| Reusability | Script-specific | Generic tool |
| Progress Tracking | Console logs | Structured progress |
| Partial Success | Not supported | Fully supported |

## Future Enhancements

Potential improvements for the tool:

1. **Parallel Processing**: Create multiple test cases in parallel for even faster execution
2. **Template Support**: Pre-defined test case templates for common patterns
3. **Validation Rules**: Custom validation for test case data
4. **Bulk Updates**: Similar tool for updating multiple existing test cases
5. **Import/Export**: Support for CSV or JSON file imports

## Related Tools

This tool works well with other MCP tools in the TestRails server:

- `get_projects` - Find target project
- `get_test_suites` - Get available suites
- `get_sections` - Find or verify target section
- `create_section` - Create section if needed
- `get_priorities` - Get available priority levels
- `get_case_types` - Get available case types

## Support and Troubleshooting

Common issues and solutions:

1. **Section Not Found**: Ensure the `sectionId` exists and is accessible
2. **Authentication Errors**: Verify TestRails credentials in environment variables
3. **Validation Errors**: Check that all required fields are provided
4. **Partial Failures**: Review the `failedCases` array for specific error messages
