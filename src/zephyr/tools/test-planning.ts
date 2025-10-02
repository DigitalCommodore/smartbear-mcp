/**
 * Test plan and test cycle management operations.
 *
 * This module provides comprehensive test planning functionality including
 * test plan creation, test cycle management, and plan-cycle linking operations
 * for organizing and structuring test execution activities.
 */

import type { ApiService } from "../services/api.js";
import type { TestPlan, CreateTestPlanRequest, TestCycle, CreateTestCycleRequest, ToolDefinition } from "../types.js";
import { createLogger } from "../utils/logger.js";
import {
    isValidProjectKey,
    isValidTestPlanKey,
    isValidTestCycleKey,
    isValidISODate
} from "../utils/validation.js";

const logger = createLogger();

export async function createTestPlan(apiService: ApiService, planData: CreateTestPlanRequest): Promise<TestPlan> {
    /**
     * Create a new test plan for organizing test execution.
     *
     * Test plans provide high-level organization for test activities,
     * grouping related test cycles and defining overall testing objectives.
     *
     * Parameters
     * ----------
     * apiService : ApiService
     *     Configured API service for HTTP communication
     * planData : CreateTestPlanRequest
     *     Test plan data including name, description, project, and metadata
     *
     * Returns
     * -------
     * TestPlan
     *     Newly created test plan with assigned ID and key
     *
     * Raises
     * ------
     * Error
     *     If required fields are missing or API request fails
     */
    logger.debug(`Entry: createTestPlan(name=${planData?.name}, projectKey=${planData?.projectKey})`);

    try {
        // Validate required API service
        if (!apiService) {
            throw new Error("ApiService is required and cannot be null");
        }

        // Validate required plan data
        if (!planData) {
            throw new Error("Plan data is required and cannot be null");
        }

        // Validate required inputs
        if (!planData.name || planData.name.trim() === "") {
            logger.warning("Test plan name validation failed: empty name");
            throw new Error("Test plan name is required and cannot be empty");
        }

        if (!planData.projectKey || planData.projectKey.trim() === "") {
            logger.warning("Project key validation failed: empty projectKey");
            throw new Error("Project key is required and cannot be empty");
        }

        if (!isValidProjectKey(planData.projectKey)) {
            logger.warning(`Project key validation failed: invalid format '${planData.projectKey}'`);
            throw new Error("Project key must start with a capital letter and contain only capital letters, underscores, and numbers");
        }

        // Note: CreateTestPlanRequest does not include startDate/endDate fields
        // These would be managed through the test cycle scheduling instead

        logger.debug("Validation passed, creating test plan via API");
        const testPlan: TestPlan = await apiService.post<TestPlan>("/testplans", planData);

        logger.info(`Successfully created test plan: ${testPlan.key} (ID: ${testPlan.id})`);
        logger.debug(`Exit: createTestPlan() -> TestPlan(id=${testPlan.id})`);
        return testPlan;

    } catch (error) {
        if (error instanceof Error && error.message.includes("validation failed")) {
            // Re-throw validation errors without logging (already logged)
            throw error;
        }
        logger.error(`Error creating test plan: ${error instanceof Error ? error.message : String(error)}`, { error });
        throw new Error(`Failed to create test plan: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    }
}

export async function createTestCycle(apiService: ApiService, cycleData: CreateTestCycleRequest): Promise<TestCycle> {
    /**
     * Create a new test cycle for execution tracking.
     *
     * Test cycles represent specific execution phases within test plans,
     * containing test cases to be executed and tracking their results.
     *
     * Parameters
     * ----------
     * apiService : ApiService
     *     Configured API service for HTTP communication
     * cycleData : CreateTestCycleRequest
     *     Test cycle data including name, description, project, and test case assignments
     *
     * Returns
     * -------
     * TestCycle
     *     Newly created test cycle with assigned ID and key
     *
     * Raises
     * ------
     * Error
     *     If required fields are missing or API request fails
     */
    logger.debug(`Entry: createTestCycle(name=${cycleData?.name}, projectKey=${cycleData?.projectKey})`);

    try {
        // Validate required API service
        if (!apiService) {
            throw new Error("ApiService is required and cannot be null");
        }

        // Validate required cycle data
        if (!cycleData) {
            throw new Error("Cycle data is required and cannot be null");
        }

        // Validate required inputs
        if (!cycleData.name || cycleData.name.trim() === "") {
            logger.warning("Test cycle name validation failed: empty name");
            throw new Error("Test cycle name is required and cannot be empty");
        }

        if (!cycleData.projectKey || cycleData.projectKey.trim() === "") {
            logger.warning("Project key validation failed: empty projectKey");
            throw new Error("Project key is required and cannot be empty");
        }

        if (!isValidProjectKey(cycleData.projectKey)) {
            logger.warning(`Project key validation failed: invalid format '${cycleData.projectKey}'`);
            throw new Error("Project key must start with a capital letter and contain only capital letters, underscores, and numbers");
        }

        // Validate date formats if provided
        if (cycleData.plannedStartDate && !isValidISODate(cycleData.plannedStartDate)) {
            logger.warning(`Invalid start date format: ${cycleData.plannedStartDate}`);
            throw new Error("Start date must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)");
        }

        if (cycleData.plannedEndDate && !isValidISODate(cycleData.plannedEndDate)) {
            logger.warning(`Invalid end date format: ${cycleData.plannedEndDate}`);
            throw new Error("End date must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)");
        }

        // Validate date range if both dates are provided
        if (cycleData.plannedStartDate && cycleData.plannedEndDate) {
            const startDate = new Date(cycleData.plannedStartDate);
            const endDate = new Date(cycleData.plannedEndDate);
            if (startDate >= endDate) {
                logger.warning(`Invalid date range: start date ${cycleData.plannedStartDate} is not before end date ${cycleData.plannedEndDate}`);
                throw new Error("Start date must be before end date");
            }
        }

        logger.debug("Validation passed, creating test cycle via API");
        const testCycle: TestCycle = await apiService.post<TestCycle>("/testcycles", cycleData);

        logger.info(`Successfully created test cycle: ${testCycle.key} (ID: ${testCycle.id})`);
        logger.debug(`Exit: createTestCycle() -> TestCycle(id=${testCycle.id})`);
        return testCycle;

    } catch (error) {
        if (error instanceof Error && error.message.includes("validation failed")) {
            // Re-throw validation errors without logging (already logged)
            throw error;
        }
        logger.error(`Error creating test cycle: ${error instanceof Error ? error.message : String(error)}`, { error });
        throw new Error(`Failed to create test cycle: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    }
}

export async function linkTestPlanToCycle(apiService: ApiService, testPlanKey: string, testCycleKey: string): Promise<void> {
    /**
     * Link a test cycle to a test plan.
     *
     * Creates association between test plan and cycle, enabling
     * hierarchical organization of testing activities.
     *
     * Parameters
     * ----------
     * apiService : ApiService
     *     Configured API service for HTTP communication
     * testPlanKey : string
     *     Key of the test plan to link to (format: PROJECT-P123)
     * testCycleKey : string
     *     Key of the test cycle to link (format: PROJECT-R123 or PROJECT-C123)
     *
     * Raises
     * ------
     * Error
     *     If plan or cycle doesn't exist, or link already exists
     */
    logger.debug(`Entry: linkTestPlanToCycle(testPlanKey=${testPlanKey}, testCycleKey=${testCycleKey})`);

    try {
        // Validate test plan key format
        if (!testPlanKey || typeof testPlanKey !== 'string' || testPlanKey.trim().length === 0) {
            logger.warning(`Invalid test plan key: ${testPlanKey}`);
            throw new Error("Test plan key must be a non-empty string");
        }

        if (!isValidTestPlanKey(testPlanKey.trim())) {
            logger.warning(`Invalid test plan key format: ${testPlanKey}`);
            throw new Error("Test plan key must match format PROJECT-P123");
        }

        // Validate test cycle key format
        if (!testCycleKey || typeof testCycleKey !== 'string' || testCycleKey.trim().length === 0) {
            logger.warning(`Invalid test cycle key: ${testCycleKey}`);
            throw new Error("Test cycle key must be a non-empty string");
        }

        if (!isValidTestCycleKey(testCycleKey.trim())) {
            logger.warning(`Invalid test cycle key format: ${testCycleKey}`);
            throw new Error("Test cycle key must match format PROJECT-R123 or PROJECT-C123");
        }

        logger.debug("Validation passed, creating test plan to cycle link via API");
        await apiService.post<void>(`/testplans/${testPlanKey}/links/testcycles`, {
            testCycleIdOrKey: testCycleKey
        });

        logger.info(`Successfully linked test cycle ${testCycleKey} to test plan ${testPlanKey}`);
        logger.debug(`Exit: linkTestPlanToCycle() -> void`);

    } catch (error) {
        if (error instanceof Error && error.message.includes("validation failed")) {
            // Re-throw validation errors without logging (already logged)
            throw error;
        }
        logger.error(`Error linking test plan to cycle: ${error instanceof Error ? error.message : String(error)}`, { error });
        throw new Error(`Failed to link test plan to cycle: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
    }
}

export function createTestPlanningTools(): ToolDefinition[] {
    /**
     * Create MCP tool definitions for test planning operations.
     *
     * Returns comprehensive tool definitions for test plan and cycle
     * management with examples and use cases.
     *
     * Returns
     * -------
     * ToolDefinition[]
     *     Array containing test planning tool definitions
     */
    logger.debug("Entry: createTestPlanningTools()");

    const tools: ToolDefinition[] = [
        {
            name: "create-test-plan",
            description: "Create a new test plan for organizing test execution activities",
            inputSchema: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Test plan name/title (required)",
                        minLength: 1
                    },
                    description: {
                        type: "string",
                        description: "Detailed test plan description"
                    },
                    projectKey: {
                        type: "string",
                        description: "Project key where the test plan will be created",
                        pattern: "^[A-Z][A-Z0-9]*$"
                    },
                    startDate: {
                        type: "string",
                        description: "Planned start date (ISO format: YYYY-MM-DDTHH:mm:ss.sssZ)"
                    },
                    endDate: {
                        type: "string",
                        description: "Planned end date (ISO format: YYYY-MM-DDTHH:mm:ss.sssZ)"
                    }
                },
                required: ["name", "projectKey"]
            }
        },
        {
            name: "create-test-cycle",
            description: "Create a new test cycle for execution tracking within test plans",
            inputSchema: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Test cycle name/title (required)",
                        minLength: 1
                    },
                    description: {
                        type: "string",
                        description: "Detailed test cycle description"
                    },
                    projectKey: {
                        type: "string",
                        description: "Project key where the test cycle will be created",
                        pattern: "^[A-Z][A-Z0-9]*$"
                    },
                    testPlanId: {
                        type: "number",
                        description: "Optional test plan ID to associate with"
                    },
                    environment: {
                        type: "string",
                        description: "Testing environment name (e.g., DEV, QA, STAGING)"
                    },
                    startDate: {
                        type: "string",
                        description: "Planned start date (ISO format: YYYY-MM-DDTHH:mm:ss.sssZ)"
                    },
                    endDate: {
                        type: "string",
                        description: "Planned end date (ISO format: YYYY-MM-DDTHH:mm:ss.sssZ)"
                    }
                },
                required: ["name", "projectKey"]
            }
        },
        {
            name: "link-test-plan-to-cycle",
            description: "Create association between test plan and test cycle for hierarchical organization",
            inputSchema: {
                type: "object",
                properties: {
                    testPlanId: {
                        type: "number",
                        description: "ID of the test plan to link to"
                    },
                    testCycleId: {
                        type: "number",
                        description: "ID of the test cycle to link"
                    }
                },
                required: ["testPlanId", "testCycleId"]
            }
        }
    ];

    logger.debug(`Exit: createTestPlanningTools() -> ${tools.length} tool definitions`);
    return tools;
}

