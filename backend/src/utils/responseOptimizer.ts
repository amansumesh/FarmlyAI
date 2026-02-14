/**
 * Response Optimizer Utility
 * Removes unnecessary fields from API responses to minimize payload size
 */

export interface OptimizeOptions {
  removeFields?: string[];
  keepFields?: string[];
  removeNull?: boolean;
  removeUndefined?: boolean;
  removeEmpty?: boolean;
}

/**
 * Optimizes an object by removing specified fields and empty values
 */
export function optimizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: OptimizeOptions = {}
): Partial<T> {
  const {
    removeFields = [],
    keepFields,
    removeNull = true,
    removeUndefined = true,
    removeEmpty = false,
  } = options;

  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const optimized: Record<string, unknown> = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (removeFields.includes(key)) {
      return;
    }

    if (keepFields && !keepFields.includes(key)) {
      return;
    }

    if (removeNull && value === null) {
      return;
    }

    if (removeUndefined && value === undefined) {
      return;
    }

    if (removeEmpty && (value === '' || (Array.isArray(value) && value.length === 0))) {
      return;
    }

    optimized[key] = value;
  });

  return optimized as Partial<T>;
}

/**
 * Optimizes an array of objects
 */
export function optimizeArray<T extends Record<string, unknown>>(
  arr: T[],
  options: OptimizeOptions = {}
): Partial<T>[] {
  if (!Array.isArray(arr)) {
    return arr;
  }

  return arr.map((item) => optimizeObject(item, options));
}

/**
 * Default fields to remove from MongoDB documents
 */
export const DEFAULT_REMOVE_FIELDS = ['__v', '_id'];

/**
 * Removes MongoDB-specific fields from documents
 */
export function removeMongoFields<T extends Record<string, unknown>>(
  doc: T,
  keepId = false
): Partial<T> {
  const fieldsToRemove = keepId ? ['__v'] : DEFAULT_REMOVE_FIELDS;
  return optimizeObject(doc, { removeFields: fieldsToRemove });
}

/**
 * Optimizes a Mongoose document for API response
 */
export function optimizeMongooseDocument<T extends Record<string, unknown>>(
  doc: unknown,
  options: OptimizeOptions = {}
): Partial<T> {
  if (!doc) {
    return doc as Partial<T>;
  }

  let plainObj: T;

  if (typeof doc === 'object' && 'toObject' in doc && typeof doc.toObject === 'function') {
    plainObj = doc.toObject() as T;
  } else {
    plainObj = doc as T;
  }

  return optimizeObject(plainObj, {
    removeFields: [...DEFAULT_REMOVE_FIELDS, ...(options.removeFields || [])],
    ...options,
  });
}

/**
 * Creates a lean query projection for MongoDB
 */
export function createLeanProjection(fields: string[]): Record<string, number> {
  const projection: Record<string, number> = {};
  fields.forEach((field) => {
    projection[field] = 1;
  });
  return projection;
}

/**
 * Removes sensitive fields from user objects
 */
export function sanitizeUserResponse(user: Record<string, unknown>): Record<string, unknown> {
  return optimizeObject(user, {
    removeFields: ['password', 'refreshToken', '__v', 'phoneVerified'],
  });
}
