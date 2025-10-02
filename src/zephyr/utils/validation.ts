/**
 * Validation utilities for Zephyr API entities.
 */

/**
 * Validate Jira project key format.
 *
 * Per API spec (project-schemas.yaml): pattern ([A-Z][A-Z_0-9]+)
 * Must start with capital letter, minimum 2 characters total,
 * subsequent characters can be capitals, underscores, or numbers.
 *
 * @param projectKey - Project key to validate.
 * @returns True if valid project key format, false otherwise.
 *
 * @example
 * isValidProjectKey("AB") // true
 * isValidProjectKey("PROJ_123") // true
 * isValidProjectKey("A") // false - too short
 * isValidProjectKey("proj") // false - lowercase
 */
export function isValidProjectKey(projectKey: string): boolean {
    if (!projectKey || typeof projectKey !== "string") {
        return false;
    }

    // Per API spec: [A-Z][A-Z_0-9]+ (minimum 2 chars, starts with capital)
    const pattern: RegExp = /^[A-Z][A-Z_0-9]+$/;
    return pattern.test(projectKey);
}

/**
 * Validate test case key format.
 *
 * Per API spec (test-schemas.yaml): pattern .+-T[0-9]+
 * Flexible project prefix followed by -T and numeric ID.
 *
 * @param testCaseKey - Test case key to validate.
 * @returns True if valid test case key format, false otherwise.
 *
 * @example
 * isValidTestCaseKey("PROJ-T123") // true
 * isValidTestCaseKey("MY_PROJECT-T1") // true
 * isValidTestCaseKey("PROJ-T") // false - missing number
 * isValidTestCaseKey("T123") // false - missing project prefix
 */
export function isValidTestCaseKey(testCaseKey: string): boolean {
    if (!testCaseKey || typeof testCaseKey !== "string") {
        return false;
    }

    // Per API spec: .+-T[0-9]+ (any prefix, then -T and numbers)
    const pattern: RegExp = /^.+-T[0-9]+$/;
    return pattern.test(testCaseKey);
}

/**
 * Validate test cycle key format.
 *
 * Per API spec (test-schemas.yaml): pattern ([0-9]+)|(.+-R[0-9]+)
 * Either numeric ID only or project prefix with -R and numeric ID.
 *
 * @param testCycleKey - Test cycle key to validate.
 * @returns True if valid test cycle key format, false otherwise.
 *
 * @example
 * isValidTestCycleKey("123") // true - numeric ID
 * isValidTestCycleKey("PROJ-R40") // true
 * isValidTestCycleKey("PROJ-R") // false - missing number
 * isValidTestCycleKey("R123") // false - missing project prefix
 */
export function isValidTestCycleKey(testCycleKey: string): boolean {
    if (!testCycleKey || typeof testCycleKey !== "string") {
        return false;
    }

    // Per API spec: either numeric only OR prefix-R[numbers]
    const numericPattern: RegExp = /^[0-9]+$/;
    const prefixPattern: RegExp = /^.+-R[0-9]+$/;

    return numericPattern.test(testCycleKey) || prefixPattern.test(testCycleKey);
}

/**
 * Validate test plan key format.
 *
 * Per API spec (test-schemas.yaml): pattern .+-P[0-9]+
 * Flexible project prefix followed by -P and numeric ID.
 *
 * @param testPlanKey - Test plan key to validate.
 * @returns True if valid test plan key format, false otherwise.
 *
 * @example
 * isValidTestPlanKey("PROJ-P10") // true
 * isValidTestPlanKey("MY_PROJECT-P1") // true
 * isValidTestPlanKey("PROJ-P") // false - missing number
 * isValidTestPlanKey("P123") // false - missing project prefix
 */
export function isValidTestPlanKey(testPlanKey: string): boolean {
    if (!testPlanKey || typeof testPlanKey !== "string") {
        return false;
    }

    // Per API spec: .+-P[0-9]+ (any prefix, then -P and numbers)
    const pattern: RegExp = /^.+-P[0-9]+$/;
    return pattern.test(testPlanKey);
}

/**
 * Validate ISO 8601 date format with flexible support.
 *
 * Accepts multiple ISO 8601 variants:
 * - Date only: YYYY-MM-DD
 * - DateTime with optional milliseconds: YYYY-MM-DDTHH:mm:ss[.sss]
 * - Optional Z suffix for UTC timezone
 *
 * @param dateString - Date string to validate.
 * @returns True if valid ISO date format, false otherwise.
 *
 * @example
 * isValidISODate("2024-01-01") // true
 * isValidISODate("2024-01-01T10:00:00") // true
 * isValidISODate("2024-01-01T10:00:00.000Z") // true
 * isValidISODate("2024/01/01") // false - wrong separator
 */
export function isValidISODate(dateString: string): boolean {
    if (!dateString || typeof dateString !== "string") {
        return false;
    }

    // ISO 8601 patterns
    const dateOnlyPattern: RegExp = /^\d{4}-\d{2}-\d{2}$/;
    const dateTimePattern: RegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z)?$/;

    if (dateOnlyPattern.test(dateString) || dateTimePattern.test(dateString)) {
        // Verify it's actually a valid date
        const date: Date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    return false;
}

/**
 * Validate any parseable date format (permissive).
 *
 * More permissive than isValidISODate - accepts any string that
 * JavaScript's Date constructor can parse. Use for API inputs where
 * the API server will handle final validation.
 *
 * @param dateString - Date string to validate.
 * @returns True if parseable as date, false otherwise.
 *
 * @example
 * isValidDateFormat("2024-01-01") // true
 * isValidDateFormat("Jan 1, 2024") // true
 * isValidDateFormat("2024/01/01") // true
 * isValidDateFormat("invalid") // false
 */
export function isValidDateFormat(dateString: string): boolean {
    if (!dateString || typeof dateString !== "string") {
        return false;
    }

    const date: Date = new Date(dateString);
    return !isNaN(date.getTime());
}

/**
 * Validate folder type value.
 *
 * Folder types are predefined by the Zephyr API.
 * Valid types: TEST_CASE, TEST_PLAN, TEST_CYCLE
 *
 * @param folderType - Folder type to validate.
 * @returns True if valid folder type, false otherwise.
 *
 * @example
 * isValidFolderType("TEST_CASE") // true
 * isValidFolderType("TEST_PLAN") // true
 * isValidFolderType("INVALID") // false
 */
export function isValidFolderType(folderType: string): boolean {
    if (!folderType || typeof folderType !== "string") {
        return false;
    }

    const validTypes: readonly string[] = ["TEST_CASE", "TEST_PLAN", "TEST_CYCLE"];
    return validTypes.includes(folderType);
}

/**
 * Validate issue key format (Jira issue key).
 *
 * Format: PROJECT-123 where PROJECT is a valid project key
 * (starts with capital, contains capitals/numbers/underscores)
 * and 123 is a numeric issue ID.
 *
 * @param issueKey - Issue key to validate.
 * @returns True if valid issue key format, false otherwise.
 *
 * @example
 * isValidIssueKey("PROJ-123") // true
 * isValidIssueKey("MY_PROJECT-456") // true
 * isValidIssueKey("PROJ") // false - missing issue number
 * isValidIssueKey("proj-123") // false - lowercase project
 */
export function isValidIssueKey(issueKey: string): boolean {
    if (!issueKey || typeof issueKey !== "string") {
        return false;
    }

    // PROJECT-NUMBER format where PROJECT follows project key rules
    const pattern: RegExp = /^[A-Z][A-Z_0-9]*-[0-9]+$/;
    return pattern.test(issueKey);
}