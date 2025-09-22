interface BibleVerse {
  verse: number;
  content: string;
}

interface BiblePassage {
  reference: string;
  text: BibleVerse[];
}

interface BibleApiResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

class BibleService {
  private cache: Map<string, BiblePassage> = new Map();
  private readonly baseUrl = 'https://bible-api.com';

  constructor() {
    this.loadCacheFromLocalStorage();
  }

  async getPassage(reference: string): Promise<BiblePassage> {
    const cacheKey = this.normalizeReference(reference);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const passage = await this.fetchFromApi(reference);
      this.cache.set(cacheKey, passage);
      this.saveCacheToLocalStorage();
      return passage;
    } catch (error) {
      console.warn(`API fetch failed for ${reference}, using fallback:`, error);
      return this.getFallbackPassage(reference);
    }
  }

  async getMultiplePassages(references: string[]): Promise<BiblePassage[]> {
    const promises = references.map(ref => this.getPassage(ref));
    return Promise.all(promises);
  }

  async getChapter(book: string, chapter: number): Promise<BiblePassage> {
    const reference = `${book} ${chapter}`;
    return this.getPassage(reference);
  }

  async getVerseRange(book: string, chapter: number, startVerse: number, endVerse?: number): Promise<BiblePassage> {
    const reference = endVerse
      ? `${book} ${chapter}:${startVerse}-${endVerse}`
      : `${book} ${chapter}:${startVerse}`;
    return this.getPassage(reference);
  }

  private async fetchFromApi(reference: string): Promise<BiblePassage> {
    const encodedRef = encodeURIComponent(reference);
    const response = await fetch(`${this.baseUrl}/${encodedRef}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: BibleApiResponse = await response.json();

    return {
      reference: data.reference || reference,
      text: data.verses?.map(v => ({
        verse: v.verse,
        content: v.text.trim()
      })) || this.parseTextToVerses(data.text)
    };
  }

  private parseTextToVerses(text: string): BibleVerse[] {
    if (!text) return [];

    const versePattern = /(\d+)\s+([^0-9]+?)(?=\s*\d+\s+|$)/g;
    const verses: BibleVerse[] = [];
    let match;

    while ((match = versePattern.exec(text)) !== null) {
      verses.push({
        verse: parseInt(match[1]),
        content: match[2].trim()
      });
    }

    if (verses.length === 0) {
      verses.push({
        verse: 1,
        content: text.trim()
      });
    }

    return verses;
  }

  private getFallbackPassage(reference: string): BiblePassage {
    const fallbackData: Record<string, BiblePassage> = {
      "Genesis 2:18-25": {
        reference: "Genesis 2:18-25",
        text: [
          { verse: 18, content: "The Lord God said, 'It is not good for the man to be alone. I will make a helper suitable for him.'" },
          { verse: 19, content: "Now the Lord God had formed out of the ground all the wild animals and all the birds in the sky. He brought them to the man to see what he would name them; and whatever the man called each living creature, that was its name." },
          { verse: 20, content: "So the man gave names to all the livestock, the birds in the sky and all the wild animals. But for Adam no suitable helper was found." },
          { verse: 21, content: "So the Lord God caused the man to fall into a deep sleep; and while he was sleeping, he took one of the man's ribs and then closed up the place with flesh." },
          { verse: 22, content: "Then the Lord God made a woman from the rib he had taken out of the man, and he brought her to the man." },
          { verse: 23, content: "The man said, 'This is now bone of my bones and flesh of my flesh; she shall be called 'woman,' because she was taken out of man.'" },
          { verse: 24, content: "That is why a man leaves his father and mother and is united to his wife, and they become one flesh." },
          { verse: 25, content: "Adam and his wife were both naked, and they felt no shame." }
        ]
      },
      "Matthew 19:3-9": {
        reference: "Matthew 19:3-9",
        text: [
          { verse: 3, content: "Some Pharisees came to him to test him. They asked, 'Is it lawful for a man to divorce his wife for any and every reason?'" },
          { verse: 4, content: "'Haven't you read,' he replied, 'that at the beginning the Creator made them male and female,'" },
          { verse: 5, content: "and said, 'For this reason a man will leave his father and mother and be united to his wife, and the two will become one flesh'?" },
          { verse: 6, content: "So they are no longer two, but one flesh. Therefore what God has joined together, let no one separate." },
          { verse: 7, content: "'Why then,' they asked, 'did Moses command that a man give his wife a certificate of divorce and send her away?'" },
          { verse: 8, content: "Jesus replied, 'Moses permitted you to divorce your wives because your hearts were hard. But it was not this way from the beginning.'" },
          { verse: 9, content: "I tell you that anyone who divorces his wife, except for sexual immorality, and marries another woman commits adultery." }
        ]
      },
      "1 Corinthians 13:4-8": {
        reference: "1 Corinthians 13:4-8",
        text: [
          { verse: 4, content: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud." },
          { verse: 5, content: "It does not dishonor others, it is not self-seeking, it is not easily angered, it keeps no record of wrongs." },
          { verse: 6, content: "Love does not delight in evil but rejoices with the truth." },
          { verse: 7, content: "It always protects, always trusts, always hopes, always perseveres." },
          { verse: 8, content: "Love never fails. But where there are prophecies, they will cease; where there are tongues, they will be stilled; where there is knowledge, it will pass away." }
        ]
      },
      "Hebrews 11:1-6": {
        reference: "Hebrews 11:1-6",
        text: [
          { verse: 1, content: "Now faith is confidence in what we hope for and assurance about what we do not see." },
          { verse: 2, content: "This is what the ancients were commended for." },
          { verse: 3, content: "By faith we understand that the universe was formed at God's command, so that what is seen was not made out of what was visible." },
          { verse: 4, content: "By faith Abel brought God a better offering than Cain did. By faith he was commended as righteous, when God spoke well of his offerings. And by faith Abel still speaks, even though he is dead." },
          { verse: 5, content: "By faith Enoch was taken from this life, so that he did not experience death: 'He could not be found, because God had taken him away.' For before he was taken, he was commended as one who pleased God." },
          { verse: 6, content: "And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him." }
        ]
      },
      "Hebrews 11:1": {
        reference: "Hebrews 11:1",
        text: [
          { verse: 1, content: "Now faith is confidence in what we hope for and assurance about what we do not see." }
        ]
      },
      "James 2:14-26": {
        reference: "James 2:14-26",
        text: [
          { verse: 14, content: "What good is it, my brothers and sisters, if someone claims to have faith but has no deeds? Can such faith save them?" },
          { verse: 15, content: "Suppose a brother or a sister is without clothes and daily food." },
          { verse: 16, content: "If one of you says to them, 'Go in peace; keep warm and well fed,' but does nothing about their physical needs, what good is it?" },
          { verse: 17, content: "In the same way, faith by itself, if it is not accompanied by action, is dead." },
          { verse: 18, content: "But someone will say, 'You have faith; I have deeds.' Show me your faith without deeds, and I will show you my faith by my deeds." },
          { verse: 19, content: "You believe that there is one God. Good! Even the demons believe that—and shudder." },
          { verse: 20, content: "You foolish person, do you want evidence that faith without deeds is useless?" }
        ]
      },
      "James 2:17": {
        reference: "James 2:17",
        text: [
          { verse: 17, content: "In the same way, faith by itself, if it is not accompanied by action, is dead." }
        ]
      },
      "Romans 10:14-17": {
        reference: "Romans 10:14-17",
        text: [
          { verse: 14, content: "How, then, can they call on the one they have not believed in? And how can they believe in the one of whom they have not heard? And how can they hear without someone preaching to them?" },
          { verse: 15, content: "And how can anyone preach unless they are sent? As it is written: 'How beautiful are the feet of those who bring good news!'" },
          { verse: 16, content: "But not all the Israelites accepted the good news. For Isaiah says, 'Lord, who has believed our message?'" },
          { verse: 17, content: "Consequently, faith comes from hearing the message, and the message is heard through the word about Christ." }
        ]
      },
      "Romans 10:17": {
        reference: "Romans 10:17",
        text: [
          { verse: 17, content: "Consequently, faith comes from hearing the message, and the message is heard through the word about Christ." }
        ]
      }
    };

    const normalizedRef = this.normalizeReference(reference);
    const fallback = fallbackData[normalizedRef] || fallbackData[reference];

    if (fallback) {
      return fallback;
    }

    return {
      reference,
      text: [{ verse: 1, content: `Passage not available: ${reference}` }]
    };
  }

  private normalizeReference(reference: string): string {
    return reference
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/(\d+):(\d+)-(\d+)/, '$1:$2-$3')
      .replace(/(\d+):(\d+)/, '$1:$2');
  }

  private loadCacheFromLocalStorage(): void {
    try {
      const cached = localStorage.getItem('bible-cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.cache = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load Bible cache from localStorage:', error);
    }
  }

  private saveCacheToLocalStorage(): void {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem('bible-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save Bible cache to localStorage:', error);
    }
  }

  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('bible-cache');
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const bibleService = new BibleService();
export type { BiblePassage, BibleVerse };