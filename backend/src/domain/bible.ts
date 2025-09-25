/**
 * Bible book metadata and domain knowledge
 */

export const BIBLE_BOOKS: { [key: string]: number } = {
  // New Testament
  'philippians': 4,
  'ephesians': 6,
  'galatians': 6,
  'colossians': 4,
  'james': 5,
  '1 peter': 5,
  '2 peter': 3,
  '1 john': 5,
  'jude': 1,
  'philemon': 1,
  'titus': 3,
  'romans': 16,
  'matthew': 28,
  'mark': 16,
  'luke': 24,
  'john': 21,
  'acts': 28,
  '1 corinthians': 16,
  '2 corinthians': 13,
  '1 thessalonians': 5,
  '2 thessalonians': 3,
  '1 timothy': 6,
  '2 timothy': 4,
  'hebrews': 13,
  '2 john': 1,
  '3 john': 1,
  'revelation': 22,

  // Old Testament (partial - can be expanded)
  'genesis': 50,
  'exodus': 40,
  'leviticus': 27,
  'numbers': 36,
  'deuteronomy': 34,
  'psalms': 150,
  'proverbs': 31,
  'ecclesiastes': 12,
  'isaiah': 66,
  'jeremiah': 52,
  'ezekiel': 48,
  'daniel': 12
};

const BOOK_NAME_VARIATIONS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
  'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

/**
 * Bible book utilities and domain logic
 */
export class BibleBook {
  /**
   * Extract biblical book name from topic string
   */
  static extractBookName(topic: string): string | null {
    const topicLower = topic.toLowerCase();
    for (const book of BOOK_NAME_VARIATIONS) {
      if (topicLower.includes(book.toLowerCase())) {
        return book;
      }
    }
    return null;
  }

  /**
   * Get the chapter count for a biblical book
   */
  static getChapterCount(bookName: string): number {
    return BIBLE_BOOKS[bookName.toLowerCase()] || 0;
  }

  /**
   * Check if a string contains a biblical book name
   */
  static containsBookName(topic: string): boolean {
    return this.extractBookName(topic) !== null;
  }

  /**
   * Get all supported book names
   */
  static getSupportedBooks(): string[] {
    return BOOK_NAME_VARIATIONS;
  }

  /**
   * Normalize book name to standard form
   */
  static normalizeBookName(bookName: string): string {
    const extracted = this.extractBookName(bookName);
    return extracted || bookName;
  }
}