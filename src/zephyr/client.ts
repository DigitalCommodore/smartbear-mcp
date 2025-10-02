/**
 * Minimal ZephyrClient class implementing Client interface for MCP integration.
 *
 * Follows the exact same pattern as ReflectClient for guaranteed compilation success.
 */

import type { Client, GetInputFunction, RegisterToolsFunction } from "../common/types.js";
import { z } from "zod";

import { AuthService } from "./services/auth.js";
import { ApiService } from "./services/api.js";
import { CacheService } from "./services/cache.js";
import { getIssueCoverage } from "./tools/issue-coverage.js";
import {
  createTestCase,
  listTestCasesNextGen,
  updateTestCase,
  linkTestCaseToIssue,
  addTestScript,
  addTestSteps,
  getTestCaseLinks,
  createTestCaseWebLink,
  listTestCaseVersions,
  getTestCaseVersion,
  getTestCaseTestScript,
  getTestCaseTestSteps
} from './tools/test-cases.js';
import { createTestExecution, updateTestExecution } from './tools/test-execution.js';

export class ZephyrClient implements Client {
  private authService: AuthService;
  private apiService: ApiService;
  private cacheService: CacheService;
  
  name = "Zephyr Test Management";
  prefix = "zephyr";

  constructor(
    accessToken?: string,
    baseUrl: string = "https://api.zephyrscale.smartbear.com/v2"
  ) {
    try {
      // Get access token from parameter or environment variable
      const token = accessToken || process.env.ZEPHYR_ACCESS_TOKEN;
      
      if (!token) {
        throw new Error("ZEPHYR_ACCESS_TOKEN is required - provide via parameter or environment variable");
      }

      // Initialize services with error handling
      this.authService = new AuthService(token);
      this.apiService = new ApiService(baseUrl, this.authService);
      this.cacheService = new CacheService(300); // 5 minute default TTL
      
      console.log(`[ZephyrClient] Initialized successfully with baseUrl: ${baseUrl}`);
    } catch (error) {
      console.error(`[ZephyrClient] Initialization failed:`, error);
      throw error;
    }
  }

  async listTestCases(projectKey: string, params?: { maxResults?: number; startAt?: number }): Promise<any> {
    return this.apiService.get(`/testcases`, { projectKey, ...params });
  }

  async getTestCase(testCaseKey: string): Promise<any> {
    return this.apiService.get(`/testcases/${testCaseKey}`);
  }

  async listTestPlans(projectKey: string, params?: { maxResults?: number; startAt?: number }): Promise<any> {
    return this.apiService.get(`/testplans`, { projectKey, ...params });
  }

  registerTools(
    register: RegisterToolsFunction,
    _getInput: GetInputFunction,
  ): void {
    console.log('[ZephyrClient] Starting tool registration...');
    let registeredCount = 0;

    try {
      // Register issue coverage tool
      register(
        {
          title: "Get Issue Test Coverage",
          summary: "Retrieve test case keys and versions linked to a specific JIRA issue",
          purpose: "Identify which test cases cover bugs, requirements, or user stories (returns keys only - use zephyr_get_test_case for full details)",
          useCases: [
            "Check which test cases cover a specific bug or feature",
            "Identify gaps in test coverage for requirements",
            "Retrieve test coverage data to create reports for stakeholders"
          ],
          examples: [
            {
              description: "Get coverage for a specific issue",
              parameters: { issueKey: "PROJ-123" },
              expectedOutput: "Array of {key, version, self} objects for each linked test case"
            }
          ],
          hints: [
            "Use JIRA issue key format (e.g., PROJ-123)",
            "Ensure you have access to the issue in JIRA",
            "Coverage is based on explicit links between issues and test cases"
          ],
          readOnly: true,
          idempotent: true,
          parameters: [
            {
              name: "issueKey",
              type: z.string(),
              description: "JIRA issue key in format PROJECT-123",
              required: true,
            },
            {
              name: "projectKey",
              type: z.string().optional(),
              description: "Optional project key to scope the search",
              required: false,
            },
          ]
        },
        async (args, _extra) => {
          if (!args.issueKey) throw new Error("issueKey argument is required");
          const response = await getIssueCoverage(this.apiService, args.issueKey, args.projectKey);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register list test cases tool
      register(
        {
          title: "List Test Cases",
          summary: "List test cases for a project with pagination support",
          parameters: [
            {
              name: "projectKey",
              type: z.string(),
              description: "JIRA project key",
              required: true,
            },
            {
              name: "maxResults",
              type: z.number().min(1).max(1000).optional(),
              description: "Maximum number of results per page (default: 10, max: 1000)",
              required: false,
            },
            {
              name: "startAt",
              type: z.number().min(0).max(1000000).optional(),
              description: "Zero-indexed starting position for pagination (default: 0)",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.projectKey) throw new Error("projectKey argument is required");
          const response = await this.listTestCases(args.projectKey, {
            maxResults: args.maxResults,
            startAt: args.startAt,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        },
      );
      registeredCount++;

      // Register get test case tool
      register(
        {
          title: "Get Test Case",
          summary: "Get details of a specific test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          const response = await this.getTestCase(args.testCaseKey);
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        },
      );
      registeredCount++;

      // Register list test plans tool
      register(
        {
          title: "List Test Plans",
          summary: "List test plans for a project with pagination support",
          parameters: [
            {
              name: "projectKey",
              type: z.string(),
              description: "JIRA project key",
              required: true,
            },
            {
              name: "maxResults",
              type: z.number().min(1).max(1000).optional(),
              description: "Maximum number of results per page (default: 10, max: 1000)",
              required: false,
            },
            {
              name: "startAt",
              type: z.number().min(0).max(1000000).optional(),
              description: "Zero-indexed starting position for pagination (default: 0)",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.projectKey) throw new Error("projectKey argument is required");
          const response = await this.listTestPlans(args.projectKey, {
            maxResults: args.maxResults,
            startAt: args.startAt,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(response) }],
          };
        },
      );
      registeredCount++;

      // Register create test case tool
      register(
        {
          title: "Create Test Case",
          summary: "Create a new test case in Zephyr",
          parameters: [
            {
              name: "testCaseData",
              type: z.object({
                name: z.string().describe("Test case name"),
                projectKey: z.string().describe("JIRA project key"),
                objective: z.string().optional().describe("Test case objective"),
                precondition: z.string().optional().describe("Test precondition"),
                estimatedTime: z.number().optional().describe("Estimated duration in milliseconds (e.g., 60000 for 1 minute)"),
                componentId: z.number().optional().describe("Component ID"),
                priorityName: z.string().optional().describe("Priority name (defaults to \"Normal\" unless overridden by project-level configuration)"),
                statusName: z.string().optional().describe("Status name (defaults to \"Draft\" unless overridden by project-level configuration)"),
                folderId: z.number().optional().describe("Folder ID"),
                ownerId: z.string().optional().describe("Owner ID"),
                labels: z.array(z.string()).optional().describe("Test case labels"),
                customFields: z.record(z.any()).optional().describe("Custom fields")
              }),
              description: "Test case data including name, objective, and metadata",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseData) throw new Error("testCaseData argument is required");
          const response = await createTestCase(this.apiService, args.testCaseData);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register list test cases nextgen tool
      register(
        {
          title: "List Test Cases (NextGen)",
          summary: "List test cases using NextGen API with enhanced filtering",
          parameters: [
            {
              name: "projectKey",
              type: z.string(),
              description: "JIRA project key",
              required: true,
            },
            {
              name: "folderId",
              type: z.number().optional(),
              description: "Optional folder ID to filter by",
              required: false,
            },
            {
              name: "maxResults",
              type: z.number().optional(),
              description: "Maximum number of results (default: 50, max: 100)",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.projectKey) throw new Error("projectKey argument is required");
          const response = await listTestCasesNextGen(this.apiService, {
            projectKey: args.projectKey,
            limit: args.maxResults,
            cursor: undefined
          });
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register update test case tool
      register(
        {
          title: "Update Test Case",
          summary: "Update an existing test case in Zephyr",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "updateData",
              type: z.object({
                name: z.string().optional().describe("Updated test case name"),
                objective: z.string().optional().describe("Updated test case objective"),
                precondition: z.string().optional().describe("Updated test precondition"),
                estimatedTime: z.number().optional().describe("Updated estimated duration in milliseconds (e.g., 60000 for 1 minute)"),
                componentId: z.number().optional().describe("Updated component ID"),
                priorityId: z.number().optional().describe("Updated priority ID (numeric)"),
                statusId: z.number().optional().describe("Updated status ID (numeric)"),
                folderId: z.number().optional().describe("Updated folder ID"),
                ownerId: z.string().optional().describe("Updated owner ID"),
                labels: z.array(z.string()).optional().describe("Updated test case labels"),
                customFields: z.record(z.any()).optional().describe("Updated custom fields")
              }),
              description: "Fields to update with new values",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          if (!args.updateData) throw new Error("updateData argument is required");
          const response = await updateTestCase(this.apiService, args.testCaseKey, args.updateData);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register link test case to issue tool
      register(
        {
          title: "Link Test Case to Issue",
          summary: "Create a link between a test case and a JIRA issue",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "issueId",
              type: z.number(),
              description: "JIRA issue ID (e.g., 10100)",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          if (!args.issueId) throw new Error("issueId argument is required");
          const response = await linkTestCaseToIssue(this.apiService, args.testCaseKey, args.issueId);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register add test script tool - FIXED SCHEMA
      register(
        {
          title: "Add Test Script",
          summary: "Add a test script to an existing test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "text",
              type: z.string(),
              description: "Test script content",
              required: true,
            },
            {
              name: "type",
              type: z.enum(["plain", "bdd"]).default("plain"),
              description: "Test script type - must be 'plain' or 'bdd'. Defaults to 'plain'.",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          if (!args.text) throw new Error("text argument is required");
          const testScript = {
            type: args.type || "plain",
            text: args.text
          };
          const response = await addTestScript(this.apiService, args.testCaseKey, testScript);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register add test steps tool
      register(
        {
          title: "Add Test Steps",
          summary: "Add test steps to an existing test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "testSteps",
              type: z.array(z.object({
                description: z.string().describe("Step description"),
                testData: z.string().optional().describe("Test data for this step"),
                expectedResult: z.string().describe("Expected result")
              })),
              description: "Array of test steps with descriptions and expected results",
              required: true,
            },
            {
              name: "mode",
              type: z.enum(["APPEND", "OVERWRITE"]).optional(),
              description: "Mode for adding steps. APPEND (default) adds new steps to the end of existing test steps (safe, recommended). OVERWRITE deletes all existing test steps and replaces with provided steps. WARNING: OVERWRITE permanently deletes attachments for removed steps. Use with caution.",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          if (!args.testSteps || args.testSteps.length === 0) throw new Error("testSteps argument is required and cannot be empty");
          const response = await addTestSteps(this.apiService, args.testCaseKey, {
            steps: args.testSteps,
            mode: args.mode
          });
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register get test case links tool
      register(
        {
          title: "Get Test Case Links",
          summary: "Get all links for a test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          const response = await getTestCaseLinks(this.apiService, args.testCaseKey);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register create test case web link tool
      register(
        {
          title: "Create Test Case Web Link",
          summary: "Create a web link for a test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "webLinkData",
              type: z.object({
                url: z.string().describe("Web link URL (must start with http:// or https://)"),
                description: z.string().optional().describe("Optional description for the web link")
              }),
              description: "Web link data with URL and optional description",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          if (!args.webLinkData) throw new Error("webLinkData argument is required");
          const response = await createTestCaseWebLink(this.apiService, args.testCaseKey, args.webLinkData);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register list test case versions tool
      register(
        {
          title: "List Test Case Versions",
          summary: "List all versions of a test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "maxResults",
              type: z.number().int().min(1).max(1000).optional(),
              description: "Maximum number of results (default: 10, max: 1000)",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          const response = await listTestCaseVersions(this.apiService, args.testCaseKey, args.maxResults);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register get test case version tool
      register(
        {
          title: "Get Test Case Version",
          summary: "Get a specific version of a test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "version",
              type: z.number().int().min(1),
              description: "Version number of the test case to retrieve",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          if (!args.version) throw new Error("version argument is required");
          const response = await getTestCaseVersion(this.apiService, args.testCaseKey, args.version);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register get test case test script tool
      register(
        {
          title: "Get Test Case Test Script",
          summary: "Get the test script for a test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          const response = await getTestCaseTestScript(this.apiService, args.testCaseKey);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register get test case test steps tool
      register(
        {
          title: "Get Test Case Test Steps",
          summary: "Get test steps for a test case",
          parameters: [
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key in Zephyr format (e.g., PROJECT-T123)",
              required: true,
            },
            {
              name: "maxResults",
              type: z.number().int().min(1).max(1000).optional(),
              description: "Maximum number of results (default: 10, max: 1000)",
              required: false,
            },
            {
              name: "startAt",
              type: z.number().int().min(0).max(1000000).optional(),
              description: "Zero-indexed starting position (default: 0)",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          const response = await getTestCaseTestSteps(this.apiService, args.testCaseKey, args.maxResults, args.startAt);
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register create test execution tool
      register(
        {
          title: "Create Test Execution",
          summary: "Record test execution results linking test case to test cycle",
          parameters: [
            {
              name: "projectKey",
              type: z.string(),
              description: "JIRA project key",
              required: true,
            },
            {
              name: "testCaseKey",
              type: z.string(),
              description: "Test case key (format: PROJECT-T123)",
              required: true,
            },
            {
              name: "testCycleKey",
              type: z.string(),
              description: "Test cycle key (format: PROJECT-R123 or PROJECT-C123)",
              required: true,
            },
            {
              name: "statusName",
              type: z.string(),
              description: "Execution status (e.g., Pass, Fail, Blocked, In Progress, Not Executed)",
              required: true,
            },
            {
              name: "comment",
              type: z.string().optional(),
              description: "Execution comments or failure details",
              required: false,
            },
            {
              name: "environmentName",
              type: z.string().optional(),
              description: "Environment where test was executed (e.g., DEV, QA, STAGING, PROD)",
              required: false,
            },
            {
              name: "actualEndDate",
              type: z.string().optional(),
              description: "End date timestamp in ISO format (e.g., 2024-01-01T10:00:00.000Z)",
              required: false,
            },
            {
              name: "executionTime",
              type: z.number().int().min(0).optional(),
              description: "Execution time in milliseconds",
              required: false,
            },
            {
              name: "executedById",
              type: z.string().optional(),
              description: "Jira user account ID of executor",
              required: false,
            },
            {
              name: "assignedToId",
              type: z.string().optional(),
              description: "Jira user account ID of assignee",
              required: false,
            },
            {
              name: "testScriptResults",
              type: z.array(z.object({
                statusName: z.string(),
                actualEndDate: z.string().optional(),
                actualResult: z.string().optional(),
              })).optional(),
              description: "Array of test script step results with status and actual result details",
              required: false,
            },
            {
              name: "customFields",
              type: z.record(z.any()).optional(),
              description: "Custom field values as key-value pairs",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.projectKey) throw new Error("projectKey argument is required");
          if (!args.testCaseKey) throw new Error("testCaseKey argument is required");
          if (!args.testCycleKey) throw new Error("testCycleKey argument is required");
          if (!args.statusName) throw new Error("statusName argument is required");
          const response = await createTestExecution(this.apiService, {
            projectKey: args.projectKey,
            testCaseKey: args.testCaseKey,
            testCycleKey: args.testCycleKey,
            statusName: args.statusName,
            comment: args.comment,
            environmentName: args.environmentName,
            actualEndDate: args.actualEndDate,
            executionTime: args.executionTime,
            executedById: args.executedById,
            assignedToId: args.assignedToId,
            testScriptResults: args.testScriptResults,
            customFields: args.customFields,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      // Register update test execution tool
      register(
        {
          title: "Update Test Execution",
          summary: "Update test execution results with new status, comments, or execution metadata",
          parameters: [
            {
              name: "executionId",
              type: z.number().int().positive(),
              description: "ID of the test execution to update",
              required: true,
            },
            {
              name: "statusName",
              type: z.string().optional(),
              description: "Updated execution status",
              required: false,
            },
            {
              name: "comment",
              type: z.string().optional(),
              description: "Updated comments or failure details",
              required: false,
            },
            {
              name: "environmentName",
              type: z.string().optional(),
              description: "Updated environment name",
              required: false,
            },
            {
              name: "actualEndDate",
              type: z.string().optional(),
              description: "Updated end date timestamp in ISO format",
              required: false,
            },
            {
              name: "executionTime",
              type: z.number().int().min(0).optional(),
              description: "Updated execution time in milliseconds",
              required: false,
            },
            {
              name: "executedById",
              type: z.string().optional(),
              description: "Updated executor ID",
              required: false,
            },
            {
              name: "assignedToId",
              type: z.string().optional(),
              description: "Updated assignee ID",
              required: false,
            },
          ],
        },
        async (args, _extra) => {
          if (!args.executionId) throw new Error("executionId argument is required");
          const response = await updateTestExecution(this.apiService, args.executionId, {
            statusName: args.statusName,
            comment: args.comment,
            environmentName: args.environmentName,
            actualEndDate: args.actualEndDate,
            executionTime: args.executionTime,
            executedById: args.executedById,
            assignedToId: args.assignedToId,
          });
          return {
            content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          };
        },
      );
      registeredCount++;

      console.log(`[ZephyrClient] Successfully registered ${registeredCount} tools`);
    } catch (error) {
      console.error(`[ZephyrClient] Tool registration failed after ${registeredCount} tools:`, error);
      throw error;
    }
  }
}