/**
 * Generic caching utility for metadata operations.
 */

import type { ApiService } from "../services/api.js";
import type { CacheService } from "../services/cache.js";
import { isValidProjectKey } from "./validation.js";

/**
 * Fetch a resource from API with caching support.
 *
 * Implements standard caching pattern: check cache, fetch if miss,
 * store result, return data. Supports optional project key filtering
 * with validation.
 *
 * @param apiService - API service instance for HTTP calls.
 * @param cacheService - Cache service instance for storage.
 * @param endpoint - API endpoint path (e.g., "/statuses").
 * @param cachePrefix - Cache key prefix for namespacing (e.g., "statuses").
 * @param projectKey - Optional project key for filtering results.
 * @returns Array of resources from API.
 * @throws Error if API service or cache service is not provided.
 * @throws Error if project key format is invalid.
 * @throws Error if API call fails or returns invalid format.
 *
 * @note Cache TTL is controlled by the CacheService (default 5 minutes).
 * Project key is validated using isValidProjectKey() if provided.
 */
export async function getCachedResource<T>(
    apiService: ApiService,
    cacheService: CacheService,
    endpoint: string,
    cachePrefix: string,
    projectKey?: string
): Promise<T[]> {
    // Validate required services
    if (!apiService) {
        throw new Error("API service is required");
    }
    if (!cacheService) {
        throw new Error("Cache service is required");
    }

    // Validate project key if provided
    if (projectKey && !isValidProjectKey(projectKey)) {
        throw new Error(`Invalid project key format: ${projectKey}`);
    }

    // Build cache key
    const cacheKey: string = projectKey
        ? `${cachePrefix}_${projectKey}`
        : cachePrefix;

    // Check cache first
    const cached: T[] | undefined = cacheService.get<T[]>(cacheKey);
    if (cached) {
        return cached;
    }

    // Build API endpoint with optional project key
    const apiEndpoint: string = projectKey
        ? `${endpoint}?projectKey=${projectKey}`
        : endpoint;

    try {
        // Fetch from API
        const response: T[] = await apiService.get<T[]>(apiEndpoint);

        // Validate response is an array
        if (!Array.isArray(response)) {
            throw new Error(`Invalid API response format: expected array, got ${typeof response}`);
        }

        // Store in cache
        cacheService.set(cacheKey, response);

        return response;
    } catch (error) {
        // Re-throw with additional context
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to fetch resource from ${endpoint}: ${errorMessage}`);
    }
}