/**
 * Utility functions for generating unique identifiers
 */
export class IdGenerator {
  /**
   * Generate a study ID from the title
   */
  static generateStudyId(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now();
  }
}