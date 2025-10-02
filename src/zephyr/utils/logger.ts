/**
 * Centralized logging interface for all Zephyr tools.
 */

/**
 * Logging interface for Zephyr module operations.
 *
 * Provides methods for different log levels: debug, info, warning, error.
 * Each method outputs to the appropriate console method.
 */
export interface Logger {
    debug(message: string): void;
    info(message: string): void;
    warning(message: string): void;
    error(message: string, error?: any): void;
}

/**
 * Create a logger instance for Zephyr operations.
 *
 * Returns a logger that outputs to console with appropriate methods
 * for different log levels. The logger uses console.debug, console.info,
 * console.warn, and console.error respectively.
 *
 * @returns Logger instance with debug, info, warning, and error methods.
 *
 * @example
 * const logger = createLogger();
 * logger.info("Operation completed");
 * logger.error("Operation failed", new Error("Connection timeout"));
 */
export function createLogger(): Logger {
    return {
        debug: (message: string): void => {
            console.debug(message);
        },
        info: (message: string): void => {
            console.info(message);
        },
        warning: (message: string): void => {
            console.warn(message);
        },
        error: (message: string, error?: any): void => {
            console.error(message, error);
        }
    };
}

/**
 * Default logger instance for convenience.
 *
 * Pre-created logger instance that can be imported directly
 * without needing to call createLogger().
 */
export const logger: Logger = createLogger();