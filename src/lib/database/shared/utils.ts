import { DatabaseError, DatabaseResult, ValidationRule, ValidationResult, LogEntry } from './types';

// Error handling utilities
export const createDatabaseError = (
  message: string,
  code?: string,
  details?: string,
  hint?: string
): DatabaseError => {
  const error = new Error(message) as DatabaseError;
  error.code = code;
  error.details = details;
  error.hint = hint;
  return error;
};

export const createSuccessResult = <T>(data: T): DatabaseResult<T> => ({
  data,
  error: null,
  success: true,
});

export const createErrorResult = <T>(error: DatabaseError): DatabaseResult<T> => ({
  data: null,
  error,
  success: false,
});

// Logging utilities
export const createLogger = (moduleName: string) => {
  const log = (level: LogEntry['level'], message: string, functionName: string, metadata?: Record<string, any>) => {
    const entry: LogEntry = {
      level,
      message,
      module: moduleName,
      function: functionName,
      timestamp: new Date().toISOString(),
      metadata,
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === 'error' ? console.error : 
                       level === 'warn' ? console.warn : 
                       level === 'debug' ? console.debug : console.log;
      
      logMethod(`[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.module}.${entry.function}: ${entry.message}`, metadata || '');
    }

    // In production, you might want to send to a logging service
    // TODO: Implement production logging service integration
  };

  return {
    info: (message: string, functionName: string, metadata?: Record<string, any>) => 
      log('info', message, functionName, metadata),
    warn: (message: string, functionName: string, metadata?: Record<string, any>) => 
      log('warn', message, functionName, metadata),
    error: (message: string, functionName: string, metadata?: Record<string, any>) => 
      log('error', message, functionName, metadata),
    debug: (message: string, functionName: string, metadata?: Record<string, any>) => 
      log('debug', message, functionName, metadata),
  };
};

// Validation utilities
export const validateData = (data: Record<string, any>, rules: ValidationRule[]): ValidationResult => {
  const errors: Array<{ field: string; message: string }> = [];

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: rule.field,
        message: `${rule.field} is required`,
      });
      continue;
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rule.type) {
      let isValidType = true;
      switch (rule.type) {
        case 'string':
          isValidType = typeof value === 'string';
          break;
        case 'number':
          isValidType = typeof value === 'number' && !isNaN(value);
          break;
        case 'boolean':
          isValidType = typeof value === 'boolean';
          break;
        case 'date':
          isValidType = value instanceof Date || !isNaN(Date.parse(value));
          break;
        case 'email':
          isValidType = typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          break;
        case 'url':
          try {
            new URL(value);
            isValidType = true;
          } catch {
            isValidType = false;
          }
          break;
      }

      if (!isValidType) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be a valid ${rule.type}`,
        });
        continue;
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at least ${rule.minLength} characters long`,
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be no more than ${rule.maxLength} characters long`,
        });
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({
        field: rule.field,
        message: `${rule.field} format is invalid`,
      });
    }

    // Custom validation
    if (rule.customValidator) {
      const result = rule.customValidator(value);
      if (result !== true) {
        errors.push({
          field: rule.field,
          message: typeof result === 'string' ? result : `${rule.field} is invalid`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Utility functions for common operations
export const generateId = (): string => {
  return crypto.randomUUID();
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const normalizeString = (str: string): string => {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Pagination utilities
export const calculateOffset = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

export const calculateTotalPages = (totalRecords: number, limit: number): number => {
  return Math.ceil(totalRecords / limit);
};

// Date utilities
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Object utilities
export const omitFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Omit<T, keyof T> => {
  const result = { ...obj };
  fields.forEach(field => delete result[field]);
  return result;
};

export const pickFields = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  fields: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  fields.forEach(field => {
    if (field in obj) {
      result[field] = obj[field];
    }
  });
  return result;
};

// Retry utility for database operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// Debounce utility for search operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};