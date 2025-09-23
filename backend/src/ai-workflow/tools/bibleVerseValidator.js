const { query } = require('../../config/database');
const fetch = require('node-fetch');

/**
 * Bible Verse Validation Tool
 *
 * This tool validates Bible verse references using the existing Bible API
 * and caches results in the database for performance and offline access.
 */

class BibleVerseValidator {
  constructor() {
    this.baseUrl = 'https://bible-api.com';
    this.cacheTtl = parseInt(process.env.BIBLE_API_CACHE_TTL) || 86400; // 24 hours default
  }

  /**
   * Validate a single Bible verse reference
   * @param {string} reference - Bible verse reference (e.g., "John 3:16", "Genesis 1:1-3")
   * @returns {Promise<Object>} Validation result
   */
  async validateReference(reference) {
    try {
      console.log(`Validating Bible reference: ${reference}`);

      // Normalize the reference
      const normalizedRef = this.normalizeReference(reference);

      // Check cache first
      const cachedResult = await this.getCachedValidation(normalizedRef);
      if (cachedResult && !this.isCacheExpired(cachedResult)) {
        console.log(`Using cached validation for: ${reference}`);
        return this.formatValidationResult(cachedResult);
      }

      // Fetch from API
      const apiResult = await this.fetchFromBibleApi(reference);

      // Cache the result
      await this.cacheValidation(reference, normalizedRef, apiResult);

      return this.formatValidationResult(apiResult);

    } catch (error) {
      console.error(`Error validating reference ${reference}:`, error);

      // Try to return cached result even if expired
      const normalizedRef = this.normalizeReference(reference);
      const cachedResult = await this.getCachedValidation(normalizedRef);
      if (cachedResult) {
        console.log(`Using expired cache for: ${reference} due to API error`);
        return this.formatValidationResult(cachedResult);
      }

      // Return error result
      return {
        reference,
        normalizedReference: normalizedRef,
        isValid: false,
        validationStatus: 'api_error',
        errorMessage: error.message,
        verseText: null,
        apiResponse: null
      };
    }
  }

  /**
   * Validate multiple Bible verse references
   * @param {Array<string>} references - Array of Bible verse references
   * @returns {Promise<Array<Object>>} Array of validation results
   */
  async validateReferences(references) {
    console.log(`Validating ${references.length} Bible references`);

    // Process references in batches to avoid overwhelming the API
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < references.length; i += batchSize) {
      const batch = references.slice(i, i + batchSize);
      const batchPromises = batch.map(ref => this.validateReference(ref));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to be respectful to the API
        if (i + batchSize < references.length) {
          await this.delay(500);
        }
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        // Add error results for failed batch
        batch.forEach(ref => {
          results.push({
            reference: ref,
            normalizedReference: this.normalizeReference(ref),
            isValid: false,
            validationStatus: 'api_error',
            errorMessage: error.message,
            verseText: null,
            apiResponse: null
          });
        });
      }
    }

    const validCount = results.filter(r => r.isValid).length;
    console.log(`Validation complete: ${validCount}/${results.length} references valid`);

    return results;
  }

  /**
   * Extract all Bible references from a study plan
   * @param {Object} studyPlan - The study plan object
   * @returns {Array<string>} Array of unique Bible references
   */
  extractReferencesFromStudyPlan(studyPlan) {
    const references = new Set();

    // Extract from daily plans
    if (studyPlan.dailyPlans) {
      studyPlan.dailyPlans.forEach(day => {
        if (day.primaryScripture) {
          references.add(day.primaryScripture);
        }
        if (day.supportingScriptures) {
          day.supportingScriptures.forEach(ref => references.add(ref));
        }
      });
    }

    // Extract from weekly themes
    if (studyPlan.weeklyThemes) {
      studyPlan.weeklyThemes.forEach(week => {
        if (week.keyScriptures) {
          week.keyScriptures.forEach(ref => references.add(ref));
        }
      });
    }

    return Array.from(references);
  }

  /**
   * Normalize a Bible reference for consistent caching
   * @param {string} reference - Raw Bible reference
   * @returns {string} Normalized reference
   */
  normalizeReference(reference) {
    if (!reference) return '';

    return reference
      .trim()
      .replace(/\\s+/g, ' ')
      .replace(/([0-9])\\s*:([0-9])/g, '$1:$2')
      .replace(/([0-9])\\s*-([0-9])/g, '$1-$2')
      .replace(/\\b(\\d+)\\s+(\\w)/g, '$1 $2');
  }

  /**
   * Fetch verse data from Bible API
   * @param {string} reference - Bible reference
   * @returns {Promise<Object>} API response data
   */
  async fetchFromBibleApi(reference) {
    const encodedRef = encodeURIComponent(reference);
    const url = `${this.baseUrl}/${encodedRef}`;

    const response = await fetch(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Illumina Bible Study Generator v1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      reference,
      normalizedReference: this.normalizeReference(reference),
      validationStatus: 'valid',
      isValid: true,
      verseText: data.text || '',
      apiResponse: data,
      errorMessage: null
    };
  }

  /**
   * Get cached validation result from database
   * @param {string} normalizedRef - Normalized reference
   * @returns {Promise<Object|null>} Cached result or null
   */
  async getCachedValidation(normalizedRef) {
    try {
      const result = await query(
        `SELECT * FROM bible_verse_validations
         WHERE normalized_reference = $1
         ORDER BY last_validated_at DESC
         LIMIT 1`,
        [normalizedRef]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching cached validation:', error);
      return null;
    }
  }

  /**
   * Cache validation result in database
   * @param {string} reference - Original reference
   * @param {string} normalizedRef - Normalized reference
   * @param {Object} result - Validation result
   */
  async cacheValidation(reference, normalizedRef, result) {
    try {
      const cacheExpiresAt = new Date(Date.now() + (this.cacheTtl * 1000));

      await query(
        `INSERT INTO bible_verse_validations
         (reference, normalized_reference, validation_status, api_response, verse_text,
          error_message, cache_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (reference)
         DO UPDATE SET
           validation_status = EXCLUDED.validation_status,
           api_response = EXCLUDED.api_response,
           verse_text = EXCLUDED.verse_text,
           error_message = EXCLUDED.error_message,
           last_validated_at = NOW(),
           cache_expires_at = EXCLUDED.cache_expires_at`,
        [
          reference,
          normalizedRef,
          result.validationStatus,
          JSON.stringify(result.apiResponse),
          result.verseText,
          result.errorMessage,
          cacheExpiresAt
        ]
      );

      console.log(`Cached validation for: ${reference}`);
    } catch (error) {
      console.error('Error caching validation:', error);
      // Don't throw - caching failure shouldn't break validation
    }
  }

  /**
   * Check if cached result is expired
   * @param {Object} cachedResult - Cached validation result
   * @returns {boolean} True if expired
   */
  isCacheExpired(cachedResult) {
    if (!cachedResult.cache_expires_at) return true;

    const expiryDate = new Date(cachedResult.cache_expires_at);
    return Date.now() > expiryDate.getTime();
  }

  /**
   * Format validation result for consistent output
   * @param {Object} result - Raw validation result
   * @returns {Object} Formatted result
   */
  formatValidationResult(result) {
    if (result.validation_status) {
      // Format database result
      return {
        reference: result.reference,
        normalizedReference: result.normalized_reference,
        isValid: result.validation_status === 'valid',
        validationStatus: result.validation_status,
        verseText: result.verse_text,
        apiResponse: result.api_response ? JSON.parse(result.api_response) : null,
        errorMessage: result.error_message,
        lastValidated: result.last_validated_at,
        cacheExpires: result.cache_expires_at
      };
    } else {
      // Format API result
      return {
        reference: result.reference,
        normalizedReference: result.normalizedReference,
        isValid: result.isValid,
        validationStatus: result.validationStatus,
        verseText: result.verseText,
        apiResponse: result.apiResponse,
        errorMessage: result.errorMessage,
        lastValidated: new Date(),
        cacheExpires: new Date(Date.now() + (this.cacheTtl * 1000))
      };
    }
  }

  /**
   * Clean expired cache entries
   * @returns {Promise<number>} Number of entries cleaned
   */
  async cleanExpiredCache() {
    try {
      const result = await query(
        `DELETE FROM bible_verse_validations
         WHERE cache_expires_at < NOW()`
      );

      console.log(`Cleaned ${result.rowCount} expired cache entries`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    try {
      const totalResult = await query(
        'SELECT COUNT(*) as total FROM bible_verse_validations'
      );

      const validResult = await query(
        `SELECT COUNT(*) as valid FROM bible_verse_validations
         WHERE validation_status = 'valid'`
      );

      const expiredResult = await query(
        `SELECT COUNT(*) as expired FROM bible_verse_validations
         WHERE cache_expires_at < NOW()`
      );

      return {
        total: parseInt(totalResult.rows[0].total),
        valid: parseInt(validResult.rows[0].valid),
        expired: parseInt(expiredResult.rows[0].expired),
        hitRate: 0 // This would need to be tracked separately
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { total: 0, valid: 0, expired: 0, hitRate: 0 };
    }
  }

  /**
   * Utility function for delays
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create and return a new Bible Verse Validator instance
 * @returns {BibleVerseValidator} New validator instance
 */
function createBibleVerseValidator() {
  return new BibleVerseValidator();
}

module.exports = {
  BibleVerseValidator,
  createBibleVerseValidator
};