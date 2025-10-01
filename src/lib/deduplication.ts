/**
 * Database query deduplication utilities
 * Provides functions to ensure unique records are returned from database queries
 */

export interface DeduplicationOptions {
  /** Field to use for deduplication (default: '_id') */
  uniqueField?: string;
  /** Additional fields to consider for uniqueness (for compound keys) */
  compoundFields?: string[];
  /** Whether to preserve the first occurrence or last occurrence of duplicates */
  keepFirst?: boolean;
  /** Custom comparison function for complex deduplication logic */
  compareFn?: (a: any, b: any) => boolean;
}

/**
 * Deduplicates an array of objects based on specified criteria
 * @param items Array of objects to deduplicate
 * @param options Deduplication options
 * @returns Deduplicated array
 */
export function deduplicateArray<T = any>(
  items: T[],
  options: DeduplicationOptions = {}
): T[] {
  const {
    uniqueField = '_id',
    compoundFields = [],
    keepFirst = true,
    compareFn
  } = options;

  if (!Array.isArray(items) || items.length === 0) {
    return items;
  }

  // Use custom comparison function if provided
  if (compareFn) {
    const seen = new Set();
    return items.filter((item, index) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Use field-based deduplication
  const seen = new Map<string, number>();
  const result: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as any;
    
    // Create unique key from specified fields
    let key: string;
    if (compoundFields.length > 0) {
      const keyParts = compoundFields.map(field => {
        const value = getNestedValue(item, field);
        return value ? String(value) : '';
      });
      key = keyParts.join('|');
    } else {
      const value = getNestedValue(item, uniqueField);
      key = value ? String(value) : `index_${i}`;
    }

    // Check if we've seen this key before
    const existingIndex = seen.get(key);
    if (existingIndex === undefined) {
      // First occurrence
      seen.set(key, i);
      result.push(item);
    } else if (!keepFirst) {
      // Replace with newer occurrence
      result[existingIndex] = item;
    }
    // If keepFirst is true and we've seen this key, skip this item
  }

  return result;
}

/**
 * Helper function to get nested object values using dot notation
 * @param obj Object to traverse
 * @param path Dot-separated path (e.g., 'user.name')
 * @returns Value at the specified path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * MongoDB aggregation pipeline stage for deduplication
 * @param uniqueField Field to use for deduplication
 * @param compoundFields Additional fields for compound uniqueness
 * @returns MongoDB aggregation stage
 */
export function getDeduplicationPipeline(
  uniqueField: string = '_id',
  compoundFields: string[] = []
): any[] {
  const groupFields: any = {};
  const firstFields: any = {};

  // Add the unique field to group by
  groupFields[uniqueField] = `$${uniqueField}`;
  firstFields[uniqueField] = `$${uniqueField}`;

  // Add compound fields if specified
  compoundFields.forEach(field => {
    groupFields[field] = `$${field}`;
    firstFields[field] = `$${field}`;
  });

  // Add all other fields using $first to get the first occurrence
  firstFields._id = '$_id';
  firstFields.createdAt = '$createdAt';
  firstFields.updatedAt = '$updatedAt';

  return [
    {
      $group: {
        _id: groupFields,
        ...firstFields
      }
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$$ROOT',
            {
              _id: '$_id'
            }
          ]
        }
      }
    }
  ];
}

/**
 * Common deduplication patterns for different data types
 */
export const DeduplicationPatterns = {
  /**
   * Deduplicate products by name and brand
   */
  products: {
    uniqueField: '_id',
    compoundFields: ['name', 'brand'],
    keepFirst: true
  },

  /**
   * Deduplicate orders by orderNumber
   */
  orders: {
    uniqueField: 'orderNumber',
    keepFirst: true
  },

  /**
   * Deduplicate users by email
   */
  users: {
    uniqueField: 'email',
    keepFirst: true
  },

  /**
   * Deduplicate SEO queries by query and type
   */
  seoQueries: {
    uniqueField: '_id',
    compoundFields: ['query', 'type'],
    keepFirst: true
  },

  /**
   * Deduplicate SEO products by title and link
   */
  seoProducts: {
    uniqueField: '_id',
    compoundFields: ['title', 'link'],
    keepFirst: true
  },

  /**
   * Deduplicate analytics events by type and userId
   */
  analyticsEvents: {
    uniqueField: '_id',
    compoundFields: ['type', 'userId'],
    keepFirst: true
  }
};

/**
 * Apply deduplication to a MongoDB query result
 * @param items Query result array
 * @param pattern Predefined deduplication pattern
 * @returns Deduplicated array
 */
export function applyDeduplication<T = any>(
  items: T[],
  pattern: keyof typeof DeduplicationPatterns
): T[] {
  return deduplicateArray(items, DeduplicationPatterns[pattern]);
}

/**
 * Create a deduplication wrapper for database queries
 * @param queryFn Original query function
 * @param pattern Deduplication pattern to apply
 * @returns Wrapped function with deduplication
 */
export function withDeduplication<T = any>(
  queryFn: () => Promise<T[]>,
  pattern: keyof typeof DeduplicationPatterns
): () => Promise<T[]> {
  return async () => {
    const results = await queryFn();
    return applyDeduplication(results, pattern);
  };
}
