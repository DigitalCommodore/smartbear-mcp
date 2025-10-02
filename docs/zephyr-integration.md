# Zephyr Test Management Integration

## Overview

The Zephyr MCP integration provides AI assistants with comprehensive test management capabilities through the SmartBear MCP (Model Context Protocol) server. This integration enables seamless test case creation, test planning, execution tracking, and issue coverage analysis through conversational AI interfaces.

### Key Benefits

- **Automated Test Management**: Create and manage test cases, plans, and executions through natural language
- **Issue Traceability**: Analyze test coverage for Jira issues and requirements
- **Streamlined Workflows**: Execute complex test management tasks without manual UI navigation
- **Comprehensive API Access**: Full access to Zephyr Cloud functionality through standardized MCP tools

## Setup

### Environment Variables

The following environment variables configure the Zephyr integration:

#### Required

- **`ZEPHYR_ACCESS_TOKEN`** (required): JWT access token for Zephyr Cloud API authentication
  - Obtain from Zephyr Cloud: Account Settings → API Tokens
  - Format: Standard JWT token (3 base64url-encoded parts separated by dots)
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Optional

- **`ZEPHYR_BASE_URL`** (optional): Specifies the base URL for all REST API requests. This can vary depending on the region where the Jira instance is pinned to. See [API documentation](https://support.smartbear.com/zephyr-scale-cloud/api-docs/#section/Authentication/Accessing-the-API) for regional endpoints.
  - Default: `https://api.zephyrscale.smartbear.com/v2` (US region)
  - Format: Full URL with protocol and version
  - Example: `ZEPHYR_BASE_URL=https://eu.api.zephyrscale.smartbear.com/v2` (EU region)

### Configuration Example

```bash
# Required: JWT access token for authentication
export ZEPHYR_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Optional: Regional endpoint (defaults to US region)
# For EU region, use: https://eu.api.zephyrscale.smartbear.com/v2
export ZEPHYR_BASE_URL="https://api.zephyrscale.smartbear.com/v2"
```

### Validation Steps

1. **Token Validation**: Verify JWT token format and validity
   ```bash
   # Token should have 3 parts separated by dots
   echo $ZEPHYR_ACCESS_TOKEN | tr '.' '\n' | wc -l
   # Should output: 3
   ```

2. **API Connectivity**: Test connection to Zephyr API
   ```bash
   curl -H "Authorization: Bearer $ZEPHYR_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        https://api.zephyrscale.smartbear.com/v2/projects
   ```

## Available Tools

### Issue Coverage

Analyze test coverage for Jira issues and requirements.

#### `zephyr_get_issue_coverage`

Retrieve test case keys and versions that cover a specific Jira issue.

**Note**: This endpoint returns **minimal test case data** (key, version, self link only) per the Zephyr API specification. To get full test case details (objective, steps, status, priority, etc.), use this two-step workflow:

1. Call `zephyr_get_issue_coverage` to get test case keys
2. Call `zephyr_get_test_case` for each key to retrieve complete details

**Returns**: Array of objects with structure `{key: string, version: number, self: string}`

**Parameters:**
- `issueKey` (required): Jira issue key (e.g., "PROJECT-123")
- `projectKey` (optional): Project scope for search

**Example:**
```json
{
  "issueKey": "PROJ-456",
  "projectKey": "PROJ"
}
```

**Use Cases:**
- Check which test cases cover a specific bug or feature
- Identify gaps in test coverage for requirements
- Retrieve test coverage data to create reports for stakeholders

### Test Case Management

Complete CRUD operations for test case lifecycle management.

#### `zephyr_list_test_cases`

List test cases for a project with pagination support.

**Parameters:**
- `projectKey` (required): JIRA project key
- `maxResults` (optional): Maximum number of results per page (default: 10, max: 1000)
- `startAt` (optional): Zero-indexed starting position for pagination (default: 0)

#### `zephyr_list_test_cases__nextgen_`

List test cases using NextGen API with enhanced filtering.

**Parameters:**
- `projectKey` (required): JIRA project key
- `folderId` (optional): Folder ID to filter by
- `maxResults` (optional): Maximum number of results (default: 50, max: 100)

#### `zephyr_get_test_case`

Get details of a specific test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format

#### `zephyr_create_test_case`

Create a new test case with comprehensive metadata.

**Parameters:**
- `testCaseData` (required): Object containing test case information
  - `name` (required): Test case name
  - `projectKey` (required): JIRA project key
  - `objective` (optional): Test case objective
  - `precondition` (optional): Test precondition
  - `estimatedTime` (optional): Estimated duration in milliseconds (e.g., 60000 for 1 minute)
  - `componentId` (optional): Component ID
  - `priorityName` (optional): Priority name (defaults to "Normal" unless overridden by project-level configuration)
  - `statusName` (optional): Status name (defaults to "Draft" unless overridden by project-level configuration)
  - `folderId` (optional): Folder ID
  - `ownerId` (optional): Owner ID
  - `labels` (optional): Array of test case labels
  - `customFields` (optional): Custom fields object

**Example:**
```json
{
  "testCaseData": {
    "name": "User Login Validation",
    "projectKey": "PROJ",
    "objective": "Verify user can login with valid credentials",
    "folderId": 123,
    "priorityName": "High"
  }
}
```

#### `zephyr_update_test_case`

Update existing test case properties.

**Note:** While the Zephyr API uses PUT semantics that clear non-specified fields, this tool automatically protects against data loss by fetching the current test case state and merging your updates. You can safely provide only the fields you want to change without worrying about clearing other fields.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `updateData` (required): Object containing fields to update
  - `name` (optional): Updated test case name
  - `objective` (optional): Updated test case objective
  - `precondition` (optional): Updated test precondition
  - `estimatedTime` (optional): Updated estimated duration in milliseconds (e.g., 60000 for 1 minute)
  - `componentId` (optional): Updated component ID
  - `priorityId` (optional): Updated priority ID (numeric)
  - `statusId` (optional): Updated status ID (numeric)
  - `folderId` (optional): Updated folder ID
  - `ownerId` (optional): Updated owner ID
  - `labels` (optional): Updated test case labels
  - `customFields` (optional): Updated custom fields

**Note:** UPDATE operations require numeric IDs for priority and status, while CREATE operations use names. Use `zephyr_get_test_case` to see the current priority and status IDs.

#### `zephyr_add_test_script`

Add or replace test script for a test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `text` (required): Test script content
- `type` (optional): Test script type - must be 'plain' or 'bdd'. Defaults to 'plain'.
  - `plain`: Freeform text documentation or test instructions
  - `bdd`: Behavior-Driven Development format (e.g., Gherkin) for remote execution via API plugin
  - **Note:** For structured step-by-step test execution, use `zephyr_add_test_steps` instead. Test scripts and test steps are mutually exclusive.

**Warning:** This operation replaces any existing test script. If the test case currently has test steps assigned to it, those steps will be automatically removed when you add/replace the test script. Consider retrieving and saving existing test steps first if you need to preserve them.

#### `zephyr_add_test_steps`

Add structured test steps with expected results.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `mode` (optional): Mode for adding steps - 'APPEND' or 'OVERWRITE'. Defaults to 'APPEND'.
  - `APPEND`: Adds new steps to the end of existing test steps (safe, recommended)
  - `OVERWRITE`: Deletes all existing test steps and replaces with provided steps. **Warning:** Permanently deletes attachments for removed steps. Use with caution.
- `testSteps` (required): Array of test steps with descriptions and expected results
  - `description` (required): Step description
  - `expectedResult` (required): Expected result
  - `testData` (optional): Test data for this step

**Note on Test Step Types:** The Zephyr Scale API supports two types of test steps:
- **Inline test steps** (supported by this tool): Direct step definitions with `testData` as a string field for test data values
- **Delegated test steps** (not currently supported): Steps that call another test case with `parameters` as an array field

This tool creates inline test steps, which is why `testData` is a simple string (e.g., "username: admin, password: test123") rather than a complex parameters object.

**Warning:** If the test case currently has a plain text or BDD test script, that test script will be automatically removed when you add test steps. Test scripts and test steps are mutually exclusive - use `zephyr_add_test_script` for freeform documentation or `zephyr_add_test_steps` for structured execution. Consider retrieving and saving the existing test script first if you need to preserve it.

**Example:**
```json
{
  "testCaseKey": "PROJ-T123",
  "testSteps": [
    {
      "description": "Navigate to login page",
      "expectedResult": "Login form is displayed",
      "testData": "URL: /login"
    },
    {
      "description": "Enter valid credentials",
      "expectedResult": "User is authenticated",
      "testData": "user: admin, pass: secure123"
    }
  ]
}
```

### Test Planning

Organize test activities with test plans.

#### `zephyr_list_test_plans`

List test plans for a project with pagination support.

**Parameters:**
- `projectKey` (required): JIRA project key
- `maxResults` (optional): Maximum number of results per page (default: 10, max: 1000)
- `startAt` (optional): Zero-indexed starting position for pagination (default: 0)

### Test Execution

Record and track test execution results, linking test cases to test cycles with status updates and detailed execution metadata.

#### `zephyr_create_test_execution`

Record test execution results linking test case to test cycle.

**Note**: If the test case has not been added to the test cycle, this operation will automatically create the relationship between them.

**Parameters:**
- `projectKey` (required): JIRA project key
- `testCaseKey` (required): Test case key (format: PROJECT-T123)
- `testCycleKey` (required): Test cycle key (format: PROJECT-R123 or PROJECT-C123)
- `statusName` (required): Execution status (e.g., Pass, Fail, Blocked, In Progress, Not Executed)
- `comment` (optional): Execution comments or failure details
- `environmentName` (optional): Environment where test was executed (e.g., DEV, QA, STAGING, PROD)
- `actualEndDate` (optional): End date timestamp in ISO format (e.g., 2024-01-01T10:00:00.000Z)
- `executionTime` (optional): Execution time in milliseconds
- `executedById` (optional): Jira user account ID of executor
- `assignedToId` (optional): Jira user account ID of assignee
- `testScriptResults` (optional): Array of test script step results with status and actual result details
- `customFields` (optional): Custom field values as key-value pairs

**Example:**
```json
{
  "projectKey": "PROJ",
  "testCaseKey": "PROJ-T123",
  "testCycleKey": "PROJ-R456",
  "statusName": "Pass",
  "comment": "All assertions passed successfully",
  "environmentName": "QA",
  "executionTime": 45000
}
```

**Use Cases:**
- Record manual test execution results
- Track automated test outcomes
- Document test failures with detailed comments
- Associate executions with specific environments

#### `zephyr_update_test_execution`

Update test execution results with new status, comments, or execution metadata.

**Parameters:**
- `executionId` (required): ID of the test execution to update
- `statusName` (optional): Updated execution status
- `comment` (optional): Updated comments or failure details
- `environmentName` (optional): Updated environment name
- `actualEndDate` (optional): Updated end date timestamp in ISO format
- `executionTime` (optional): Updated execution time in milliseconds
- `executedById` (optional): Updated executor ID
- `assignedToId` (optional): Updated assignee ID

**Example:**
```json
{
  "executionId": 12345,
  "statusName": "Fail",
  "comment": "Login button not responding on Chrome browser"
}
```

**Use Cases:**
- Update test execution status after retest
- Add additional failure details
- Correct execution information
- Reassign test executions

### Test Case Links

Manage test case relationships to JIRA issues and external resources.

#### `zephyr_link_test_case_to_issue`

Create traceability link between test case and Jira issue.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `issueId` (required): JIRA issue ID (numeric, e.g., 10100). See [API documentation](https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Cases/operation/createTestCaseIssueLink) for details.

#### `zephyr_get_test_case_links`

Get all links for a test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)

#### `zephyr_create_test_case_web_link`

Create a web link for a test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `webLinkData` (required): Web link data with URL and optional description
  - `url` (required): Web link URL (must start with http:// or https://)
  - `description` (optional): Optional description for the web link

**Note:** The `webLinkData` parameter is structured as a nested object to match the Zephyr Cloud API's WebLinkInput schema. While it currently contains only 2 fields, this design follows the pattern used for other CREATE operations (e.g., `createTestCase` uses `testCaseData`) and mirrors the API specification structure. This approach ensures consistency and is extensible if additional fields are added to WebLinkInput in future API versions.

### Test Case Versions

Track test case version history and retrieve historical snapshots.

#### `zephyr_list_test_case_versions`

List all versions of a test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `maxResults` (optional): Maximum number of results (default: 10, max: 1000)

#### `zephyr_get_test_case_version`

Get a specific version of a test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `version` (required): Version number of the test case to retrieve

### Test Scripts and Steps

Retrieve test case implementation details.

#### `zephyr_get_test_case_test_script`

Get the test script for a test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)

#### `zephyr_get_test_case_test_steps`

Get test steps for a test case.

**Parameters:**
- `testCaseKey` (required): Test case key in Zephyr format (e.g., PROJECT-T123)
- `maxResults` (optional): Maximum number of results (default: 10, max: 1000)
- `startAt` (optional): Zero-indexed starting position (default: 0)


## Common Workflows

### Creating Test Cases

Complete workflow for creating comprehensive test cases:

```json
// 1. Create the test case
{
  "tool": "zephyr_create_test_case",
  "parameters": {
    "testCaseData": {
      "name": "User Registration Validation",
      "objective": "Verify new user registration process",
      "projectKey": "ECOM",
      "folderId": 456,
      "priorityName": "High"
    }
  }
}

// 2. Add detailed test steps
{
  "tool": "zephyr_add_test_steps",
  "parameters": {
    "testCaseKey": "ECOM-T789",
    "testSteps": [
      {
        "description": "Navigate to registration page",
        "expectedResult": "Registration form displays all required fields"
      },
      {
        "description": "Fill form with valid data",
        "expectedResult": "Form accepts input without validation errors",
        "testData": "email: test@example.com, password: SecurePass123"
      },
      {
        "description": "Submit registration",
        "expectedResult": "User account created and confirmation email sent"
      }
    ]
  }
}

// 3. Link to requirement issue
{
  "tool": "zephyr_link_test_case_to_issue",
  "parameters": {
    "testCaseKey": "ECOM-T789",
    "issueId": 10100
  }
}
```

### Test Planning

List and analyze test plans:

```json
// List test plans for a project
{
  "tool": "zephyr_list_test_plans",
  "parameters": {
    "projectKey": "ECOM"
  }
}
```

### Issue Traceability

Analyzing test coverage and ensuring comprehensive testing:

```json
// 1. Analyze issue coverage
{
  "tool": "zephyr_get_issue_coverage",
  "parameters": {
    "issueKey": "ECOM-BUG-456",
    "projectKey": "ECOM"
  }
}

// 2. Create additional test case if coverage is insufficient
{
  "tool": "zephyr_create_test_case",
  "parameters": {
    "testCaseData": {
      "name": "Regression Test for Payment Bug",
      "objective": "Verify payment processing bug is resolved",
      "projectKey": "ECOM"
    }
  }
}

// 3. Link new test case to bug issue
{
  "tool": "zephyr_link_test_case_to_issue",
  "parameters": {
    "testCaseKey": "ECOM-T790",
    "issueId": 10456
  }
}
```

## Error Handling

### Common Error Scenarios

#### Authentication Errors
```
Error: Zephyr API error (GET /projects): Invalid authentication token [Status: 401]
```
**Resolution**: Verify `ZEPHYR_ACCESS_TOKEN` is valid and not expired

#### Authorization Errors
```
Error: Zephyr API error (POST /testcases): Insufficient permissions [Status: 403]
```
**Resolution**: Ensure the user account associated with the token has the required permissions for the project and operation (Jira Browse projects permission, read access, and Zephyr Cloud access)

#### Invalid Project Key
```
Error: Project not found: NONEXISTENT
```
**Resolution**: Verify project key exists and user has access

#### Rate Limiting
```
Error: API rate limit exceeded [Status: 429]
```
**Resolution**: Implement delays between requests or contact administrator for rate limit increase

#### Network Connectivity
```
Error: Network request failed: ECONNREFUSED
```
**Resolution**: Check network connectivity and `ZEPHYR_BASE_URL` configuration

### Troubleshooting Guide

#### Token Issues
1. **Expired Token**: Create a new token in Zephyr Cloud account settings
2. **Invalid Format**: Ensure token is complete JWT with 3 parts separated by dots
3. **Permissions**: Verify the user account associated with the token has required project and API permissions
   - Verify if the token was created by someone with the Jira `Browse project` project permission.

#### API Connection Issues
1. **Regional URL**: Verify `ZEPHYR_BASE_URL` matches your Jira instance region (US default or EU). See [API documentation](https://support.smartbear.com/zephyr-scale-cloud/api-docs/#section/Authentication/Accessing-the-API) for regional endpoints.
2. **SSL/TLS**: Ensure proper certificate configuration for HTTPS endpoints
3. **Firewall**: Check network firewall rules for API endpoint access

#### Data Validation Errors
1. **Required Fields**: Ensure all required parameters are provided
2. **Format Validation**: Check parameter formats match API expectations
3. **Reference Integrity**: Verify referenced entities (projects, folders, etc.) exist

#### Performance Considerations
1. **Caching**: Enable caching for metadata operations to improve performance
2. **Batch Operations**: Group related operations to minimize API calls
3. **Error Retry**: Implement appropriate retry logic for transient failures

### Support Resources

- **Zephyr Documentation**: [https://support.smartbear.com/zephyr-scale-cloud/](https://support.smartbear.com/zephyr-scale-cloud/)
- **API Reference**: [https://support.smartbear.com/zephyr-scale-cloud/api-docs/](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)
- **SmartBear Community**: [https://community.smartbear.com/](https://community.smartbear.com/)
- **MCP Protocol**: [https://modelcontextprotocol.io/](https://modelcontextprotocol.io/)

## Advanced Configuration

### Custom Headers
The integration automatically sets required headers:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `Accept: application/json`
- `User-Agent: SmartBear-MCP-Server/1.0.0`

### Caching Configuration
Metadata operations (statuses, priorities, environments) are cached with 5-minute TTL for improved performance. Cache behavior is handled automatically.

### Logging
Integration provides comprehensive debug logging for troubleshooting. Logs include:
- Entry/exit points for all operations
- Parameter validation results
- API request/response details
- Error context and stack traces

### Performance Optimization
- Metadata caching reduces API calls for reference data
- Concurrent request support for bulk operations
- Efficient error handling with context preservation
- Memory-efficient response processing
