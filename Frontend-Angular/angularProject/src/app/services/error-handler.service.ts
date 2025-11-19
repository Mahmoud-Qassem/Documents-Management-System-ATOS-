import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface BackendError {
  statusCode?: string | number;
  error?: string;
  message?: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
  fieldError?: Record<string, string>;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  /**
   * Extract meaningful error message from backend error response
   * Handles the backend error structure:
   * {
   *   "statusCode": "404",
   *   "error": "User not found",
   *   "message": "User not found: hacker@gmail.com",
   *   "timestamp": "2025-11-16T13:29:00.7034918"
   * }
   */
  getErrorMessage(error: any): string {
    // If it's an HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      const errorData = error.error as BackendError;

      // Priority 1: detailed message from backend
      if (errorData?.message && typeof errorData.message === 'string') {
        return errorData.message;
      }

      // Priority 2: error type from backend
      if (errorData?.error && typeof errorData.error === 'string') {
        return errorData.error;
      }

      // Priority 3: HTTP status message
      if (error.statusText && error.statusText !== 'Unknown Error') {
        return error.statusText;
      }

      // Priority 4: Angular HTTP error message
      if (error.message) {
        return error.message;
      }

      // Fallback
      return 'An unexpected error occurred. Please try again.';
    }

    // If it's a plain object with error properties
    if (error && typeof error === 'object') {
      if (error.message && typeof error.message === 'string') {
        return error.message;
      }
      if (error.error && typeof error.error === 'string') {
        return error.error;
      }
    }

    // If it's a string
    if (typeof error === 'string') {
      return error;
    }

    // Fallback
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Extract field-level errors from backend response
   * Returns a dictionary of field names to error messages
   */
  getFieldErrors(error: any): Record<string, string> {
    if (!error) return {};

    const errorData = error instanceof HttpErrorResponse ? error.error : error;

    if (!errorData || typeof errorData !== 'object') {
      return {};
    }

    // Check for fieldErrors or fieldError properties
    if (errorData.fieldErrors && typeof errorData.fieldErrors === 'object') {
      return errorData.fieldErrors;
    }

    if (errorData.fieldError && typeof errorData.fieldError === 'object') {
      return errorData.fieldError;
    }

    return {};
  }

  /**
   * Check if error is due to authentication/authorization
   */
  isAuthError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 401 || error.status === 403;
    }
    return false;
  }

  /**
   * Check if error is due to bad request
   */
  isBadRequestError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 400;
    }
    return false;
  }

  /**
   * Check if error is due to not found
   */
  isNotFoundError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 404;
    }
    return false;
  }

  /**
   * Check if error is due to server error
   */
  isServerError(error: any): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status >= 500;
    }
    return false;
  }

  /**
   * Get HTTP status code from error
   */
  getStatusCode(error: any): number | null {
    if (error instanceof HttpErrorResponse) {
      return error.status;
    }

    const errorData = error?.error as BackendError;
    if (errorData?.statusCode) {
      const code = parseInt(String(errorData.statusCode), 10);
      return isNaN(code) ? null : code;
    }

    return null;
  }
}
