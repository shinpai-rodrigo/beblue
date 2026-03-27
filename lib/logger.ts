/**
 * Centralized error logger that prevents leaking full error objects
 * (stack traces, internal paths, sensitive data) in production logs.
 */

const isProduction = process.env.NODE_ENV === 'production';

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    if (isProduction) {
      // In production, only log the error name and message, not the full stack
      return `${error.name}: ${error.message}`;
    }
    // In development, include the stack trace
    return error.stack || `${error.name}: ${error.message}`;
  }
  if (typeof error === 'string') {
    return error;
  }
  // Avoid logging arbitrary objects that may contain sensitive data
  return 'Unknown error (non-Error object)';
}

export function logError(context: string, error: unknown): void {
  console.error(`[ERROR] ${context}: ${sanitizeError(error)}`);
}

export function logWarn(context: string, message: string): void {
  console.warn(`[WARN] ${context}: ${message}`);
}

export function logInfo(context: string, message: string): void {
  if (!isProduction) {
    console.log(`[INFO] ${context}: ${message}`);
  }
}
