/**
 * Unit tests for issue coverage analysis tools.
 *
 * Covers API integration, parameter validation, response handling,
 * and error scenarios for issue coverage functionality.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getIssueCoverage, createIssueCoverageTools } from "../../../zephyr/tools/issue-coverage.js";
import type { ApiService } from "../../../zephyr/services/api.js";
import type { TestCaseKeyAndVersion } from "../../../zephyr/types.js";

// Mock ApiService
const mockApiService: ApiService = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
} as any;

describe('Issue Coverage Tools', () => {
    /**
     * Test suite for issue coverage analysis functionality.
     */

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getIssueCoverage', () => {
        const validIssueKey = "PROJ-123";
        const mockTestCaseKeys: TestCaseKeyAndVersion[] = [
            {
                key: "PROJ-T1",
                version: 1,
                self: "https://api.zephyrscale.smartbear.com/v2/testcases/PROJ-T1/versions/1"
            },
            {
                key: "PROJ-T2",
                version: 1,
                self: "https://api.zephyrscale.smartbear.com/v2/testcases/PROJ-T2/versions/1"
            }
        ];

        describe('API integration', () => {
            it('should make API request with correct endpoint', async () => {
                vi.mocked(mockApiService.get).mockResolvedValue(mockTestCaseKeys);

                await getIssueCoverage(mockApiService, validIssueKey);

                expect(mockApiService.get).toHaveBeenCalledWith(
                    `/issuelinks/${validIssueKey}/testcases`,
                    {}
                );
            });

            it('should include projectKey in API request when provided', async () => {
                vi.mocked(mockApiService.get).mockResolvedValue(mockTestCaseKeys);

                await getIssueCoverage(mockApiService, validIssueKey, "PROJ");

                expect(mockApiService.get).toHaveBeenCalledWith(
                    `/issuelinks/${validIssueKey}/testcases`,
                    { projectKey: "PROJ" }
                );
            });

            it('should return test case keys from API response', async () => {
                vi.mocked(mockApiService.get).mockResolvedValue(mockTestCaseKeys);

                const result = await getIssueCoverage(mockApiService, validIssueKey);

                expect(result).toEqual(mockTestCaseKeys);
            });

            it('should handle empty test case array', async () => {
                vi.mocked(mockApiService.get).mockResolvedValue([]);

                const result = await getIssueCoverage(mockApiService, validIssueKey);

                expect(result).toEqual([]);
            });
        });

        describe('parameter validation', () => {
            it('should throw error for missing apiService', async () => {
                // @ts-expect-error Testing invalid input
                await expect(getIssueCoverage(null, validIssueKey)).rejects.toThrow(
                    "ApiService is required"
                );
            });

            it('should throw error for empty issue key', async () => {
                await expect(getIssueCoverage(mockApiService, "")).rejects.toThrow(
                    "Issue key is required and cannot be empty"
                );
            });

            describe('issue key format validation', () => {
                const invalidKeys = [
                    "invalid-key",
                    "proj-123", // lowercase
                    "123-PROJ", // number first
                    "PROJ_123", // underscore instead of dash
                ];

                it.each(invalidKeys)('should throw error for invalid issue key: %s', async (invalidKey) => {
                    await expect(getIssueCoverage(mockApiService, invalidKey)).rejects.toThrow(
                        `Invalid issue key format: ${invalidKey}. Expected format: PROJECT-123`
                    );
                });

                const validKeys = [
                    "A-1",
                    "PROJ-123",
                    "ABC123-456"
                ];

                it.each(validKeys)('should accept valid issue key: %s', async (validKey) => {
                    vi.mocked(mockApiService.get).mockResolvedValue([]);

                    await expect(getIssueCoverage(mockApiService, validKey)).resolves.not.toThrow();
                });
            });
        });

        describe('error handling', () => {
            it('should handle 404 error with specific message', async () => {
                const error = new Error("HTTP 404: Not Found");
                vi.mocked(mockApiService.get).mockRejectedValue(error);

                await expect(getIssueCoverage(mockApiService, validIssueKey)).rejects.toThrow(
                    "Issue not found: PROJ-123. Verify the issue key exists and is accessible."
                );
            });

            it('should handle 403 error with specific message', async () => {
                const error = new Error("HTTP 403: Forbidden");
                vi.mocked(mockApiService.get).mockRejectedValue(error);

                await expect(getIssueCoverage(mockApiService, validIssueKey)).rejects.toThrow(
                    "Access denied for issue: PROJ-123. Ensure the user account associated with the token has the required permissions (JIRA Browse projects and Zephyr Cloud access)."
                );
            });

            it('should handle network errors', async () => {
                const networkError = new Error("Network connection failed");
                vi.mocked(mockApiService.get).mockRejectedValue(networkError);

                await expect(getIssueCoverage(mockApiService, validIssueKey)).rejects.toThrow(
                    "Network connection failed"
                );
            });
        });
    });

    describe('createIssueCoverageTools', () => {
        it('should return array of tool definitions', () => {
            const tools = createIssueCoverageTools();

            expect(Array.isArray(tools)).toBe(true);
            expect(tools.length).toBeGreaterThan(0);
        });

        it('should create issue coverage tool definition', () => {
            const tools = createIssueCoverageTools();
            const issueCoverageTool = tools.find(tool => tool.name === "zephyr_get_issue_coverage");

            expect(issueCoverageTool).toBeDefined();
        });

        it('should have proper tool definition structure', () => {
            const tools = createIssueCoverageTools();
            const issueCoverageTool = tools[0];

            expect(issueCoverageTool).toMatchObject({
                name: expect.any(String),
                description: expect.any(String),
                inputSchema: expect.objectContaining({
                    type: "object",
                    properties: expect.any(Object),
                    required: expect.any(Array),
                    additionalProperties: false
                })
            });
        });

        it('should have required fields defined', () => {
            const tools = createIssueCoverageTools();
            const issueCoverageTool = tools[0];

            expect(issueCoverageTool.inputSchema.required).toContain("issueKey");
            expect(issueCoverageTool.inputSchema.required).not.toContain("projectKey");
        });
    });
});