import { BibleBook } from '../domain/bible.js';

/**
 * Business logic for study planning and duration calculations
 */
export class StudyPlanningService {
  /**
   * Calculate appropriate duration scope instructions based on book chapters and requested days
   */
  static calculateDurationInstructions(
    bookName: string | null,
    durationDays: number,
    chapterCount: number
  ): string {
    if (!bookName || chapterCount === 0) {
      return 'Structure the content appropriately for the requested duration.';
    }

    if (durationDays === 1) {
      return `CRITICAL: This is a 1-day study. Focus ONLY on Chapter 1 of ${bookName} with deep, comprehensive exposition. Do NOT attempt to cover the entire book.`;
    } else if (durationDays < chapterCount) {
      return `This ${durationDays}-day study must cover ${chapterCount} chapters. Group chapters thoughtfully (e.g., combine shorter chapters, focus on key sections).`;
    } else if (durationDays === chapterCount) {
      return `Perfect match: ${durationDays} days for ${chapterCount} chapters. Dedicate one day to each chapter for thorough exposition.`;
    } else {
      return `With ${durationDays} days for ${chapterCount} chapters, include introduction, review, and application days alongside chapter studies.`;
    }
  }

  /**
   * Determine the target audience from special requirements or default audience
   */
  static determineTargetAudience(specialRequirements?: string, defaultAudience?: string): string {
    if (specialRequirements?.includes('teenage') || specialRequirements?.includes('athlete')) {
      return specialRequirements;
    }
    return defaultAudience || 'general audience';
  }

  /**
   * Generate focus passage reference for book studies based on duration
   */
  static generateFocusPassage(
    bookName: string | null,
    durationDays: number,
    chapterCount: number,
    day: number = 1
  ): string {
    if (!bookName) {
      return '[appropriate passage]';
    }

    if (durationDays === 1) {
      return `${bookName} 1:1-[end of chapter 1]`;
    } else if (durationDays === chapterCount) {
      return `${bookName} ${day}:1-[end]`;
    } else if (durationDays < chapterCount) {
      // Multiple chapters per day
      const chaptersPerDay = Math.ceil(chapterCount / durationDays);
      const startChapter = (day - 1) * chaptersPerDay + 1;
      const endChapter = Math.min(startChapter + chaptersPerDay - 1, chapterCount);
      return startChapter === endChapter
        ? `${bookName} ${startChapter}:1-[end]`
        : `${bookName} ${startChapter}-${endChapter}`;
    } else {
      // More days than chapters - can focus on individual chapters
      return day <= chapterCount
        ? `${bookName} ${day}:1-[end]`
        : `${bookName} [review/application]`;
    }
  }

  /**
   * Generate appropriate day title for book studies
   */
  static generateDayTitle(
    durationDays: number,
    day: number,
    bookName?: string
  ): string {
    if (durationDays === 1) {
      return 'Chapter 1: [Title/Theme]';
    }
    return `Day ${day}: [Title/Theme]`;
  }

  /**
   * Validate study duration against book constraints
   */
  static validateStudyDuration(
    bookName: string | null,
    durationDays: number
  ): { isValid: boolean; warning?: string } {
    if (!bookName) {
      return { isValid: true };
    }

    const chapterCount = BibleBook.getChapterCount(bookName);

    if (durationDays > chapterCount * 3) {
      return {
        isValid: false,
        warning: `${durationDays} days is too long for ${bookName} (${chapterCount} chapters). Consider a shorter duration or different book.`
      };
    }

    if (durationDays === 1 && chapterCount > 10) {
      return {
        isValid: true,
        warning: `1-day study of ${bookName} (${chapterCount} chapters) will focus only on Chapter 1. Consider a longer duration for comprehensive coverage.`
      };
    }

    return { isValid: true };
  }
}