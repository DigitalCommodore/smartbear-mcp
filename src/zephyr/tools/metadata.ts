/**
 * System metadata retrieval including statuses, priorities, and environments.
 */

import type { ApiService } from "../services/api.js";
import type { CacheService } from "../services/cache.js";
import type { Status, Priority, Environment, ToolDefinition } from "../types.js";
import { getCachedResource } from "../utils/cache-helpers.js";
import { isValidProjectKey } from "../utils/validation.js";

export async function getStatuses(apiService: ApiService, cacheService: CacheService, projectKey?: string): Promise<Status[]> {
    /**
     * Get available test execution statuses.
     *
     * Retrieves the list of valid test execution statuses for the project.
     * Results are cached for performance.
     *
     * Parameters
     * ----------
     * apiService : ApiService
     *     API service for HTTP calls.
     * cacheService : CacheService
     *     Cache service for storage.
     * projectKey : string, optional
     *     Optional project key to filter statuses.
     *
     * Returns
     * -------
     * Promise<Status[]>
     *     Array of test status objects.
     *
     * Raises
     * ------
     * Error
     *     If API call fails or validation fails.
     */
    return getCachedResource<Status>(
        apiService,
        cacheService,
        "/statuses",
        "statuses",
        projectKey
    );
}

export async function getPriorities(apiService: ApiService, cacheService: CacheService, projectKey?: string): Promise<Priority[]> {
    /**
     * Get available test priorities.
     *
     * Retrieves the list of valid test priorities for the project.
     * Results are cached for performance.
     *
     * Parameters
     * ----------
     * apiService : ApiService
     *     API service for HTTP calls.
     * cacheService : CacheService
     *     Cache service for storage.
     * projectKey : string, optional
     *     Optional project key to filter priorities.
     *
     * Returns
     * -------
     * Promise<Priority[]>
     *     Array of test priority objects.
     *
     * Raises
     * ------
     * Error
     *     If API call fails or validation fails.
     */
    return getCachedResource<Priority>(
        apiService,
        cacheService,
        "/priorities",
        "priorities",
        projectKey
    );
}

export async function getEnvironments(apiService: ApiService, cacheService: CacheService, projectKey?: string): Promise<Environment[]> {
    /**
     * Get available test environments.
     *
     * Retrieves the list of valid test environments for the project.
     * Results are cached for performance.
     *
     * Parameters
     * ----------
     * apiService : ApiService
     *     API service for HTTP calls.
     * cacheService : CacheService
     *     Cache service for storage.
     * projectKey : string, optional
     *     Optional project key to filter environments.
     *
     * Returns
     * -------
     * Promise<Environment[]>
     *     Array of test environment objects.
     *
     * Raises
     * ------
     * Error
     *     If API call fails or validation fails.
     */
    return getCachedResource<Environment>(
        apiService,
        cacheService,
        "/environments",
        "environments",
        projectKey
    );
}

export function createMetadataTools(): ToolDefinition[] {
    /**
     * Create MCP tool definitions for metadata operations.
     *
     * Returns comprehensive tool definitions for status, priority,
     * and environment retrieval with caching examples.
     *
     * Returns
     * -------
     * ToolDefinition[]
     *     Array containing metadata tool definitions
     */
    return [
        {
            name: "zephyr_get_statuses",
            description: "Retrieve available test case and execution status options. Results are cached for improved performance.",
            inputSchema: {
                type: "object",
                properties: {
                    projectKey: {
                        type: "string",
                        description: "Optional project key to filter project-specific statuses",
                        pattern: "^[A-Z][A-Z0-9]*$",
                        examples: ["PROJ", "DEV", "QA"]
                    }
                },
                additionalProperties: false
            }
        },
        {
            name: "zephyr_get_priorities",
            description: "Retrieve available test case priority levels for organizing test importance. Results are cached for performance.",
            inputSchema: {
                type: "object",
                properties: {
                    projectKey: {
                        type: "string",
                        description: "Optional project key to filter project-specific priorities",
                        pattern: "^[A-Z][A-Z0-9]*$",
                        examples: ["PROJ", "DEV", "QA"]
                    }
                },
                additionalProperties: false
            }
        },
        {
            name: "zephyr_get_environments",
            description: "Retrieve available testing environments for test execution configuration. Cached results improve response times.",
            inputSchema: {
                type: "object",
                properties: {
                    projectKey: {
                        type: "string",
                        description: "Optional project key to filter project-specific environments",
                        pattern: "^[A-Z][A-Z0-9]*$",
                        examples: ["PROJ", "DEV", "QA"]
                    }
                },
                additionalProperties: false
            }
        }
    ];
}