const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

class StudyContentService {
  constructor() {
    this.studiesPath = process.env.STUDIES_PATH || './studies';
  }

  /**
   * Get study manifest (metadata only)
   */
  async getStudyManifest(studyId) {
    try {
      const manifestPath = path.join(this.studiesPath, studyId, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      return JSON.parse(manifestContent);
    } catch (error) {
      throw new Error(`Study manifest not found: ${studyId}`);
    }
  }

  /**
   * Get study content structure (list of weeks/days available)
   */
  async getStudyStructure(studyId) {
    try {
      const manifest = await this.getStudyManifest(studyId);
      const studyPath = path.join(this.studiesPath, studyId);

      if (manifest.studyStructure === 'weekly') {
        return await this.getWeeklyStructure(studyPath);
      } else {
        return await this.getDailyStructure(studyPath);
      }
    } catch (error) {
      throw new Error(`Failed to get study structure: ${error.message}`);
    }
  }

  /**
   * Get weekly study structure
   */
  async getWeeklyStructure(studyPath) {
    const entries = await fs.readdir(studyPath);
    const weeks = [];

    for (const entry of entries) {
      if (entry.startsWith('week-')) {
        const weekNum = parseInt(entry.split('-')[1]);
        const weekPath = path.join(studyPath, entry);
        const weekFiles = await fs.readdir(weekPath);

        const days = weekFiles
          .filter(file => file.startsWith('day-') && file.endsWith('.md'))
          .map(file => parseInt(file.split('-')[1].split('.')[0]))
          .sort((a, b) => a - b);

        weeks.push({
          week: weekNum,
          daysAvailable: days,
          hasOverview: weekFiles.includes('overview.md')
        });
      }
    }

    return {
      type: 'weekly',
      weeks: weeks.sort((a, b) => a.week - b.week)
    };
  }

  /**
   * Get daily study structure
   */
  async getDailyStructure(studyPath) {
    const entries = await fs.readdir(studyPath);
    const days = entries
      .filter(file => file.startsWith('day-') && file.endsWith('.md'))
      .map(file => parseInt(file.split('-')[1].split('.')[0]))
      .sort((a, b) => a - b);

    return {
      type: 'daily',
      daysAvailable: days
    };
  }

  /**
   * Get week overview content
   */
  async getWeekOverview(studyId, weekNumber) {
    try {
      const weekPath = path.join(this.studiesPath, studyId, `week-${weekNumber}`, 'overview.md');
      const content = await fs.readFile(weekPath, 'utf8');
      const parsed = matter(content);

      return {
        week: weekNumber,
        ...parsed.data,
        content: marked(parsed.content)
      };
    } catch (error) {
      throw new Error(`Week overview not found: ${studyId}/week-${weekNumber}`);
    }
  }

  /**
   * Get specific day content
   */
  async getDayContent(studyId, dayNumber, weekNumber = null) {
    try {
      let dayPath;

      if (weekNumber) {
        // Weekly study structure
        dayPath = path.join(this.studiesPath, studyId, `week-${weekNumber}`, `day-${dayNumber}.md`);
      } else {
        // Daily study structure
        dayPath = path.join(this.studiesPath, studyId, `day-${dayNumber}.md`);
      }

      const content = await fs.readFile(dayPath, 'utf8');
      const parsed = matter(content);

      // Parse the content sections
      const sections = this.parseStudyContent(parsed.content);

      return {
        day: dayNumber,
        week: weekNumber,
        ...parsed.data,
        ...sections
      };
    } catch (error) {
      throw new Error(`Day content not found: ${studyId}/day-${dayNumber}`);
    }
  }

  /**
   * Parse markdown content into structured sections
   */
  parseStudyContent(markdown) {
    const sections = {};
    const lines = markdown.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // Save previous section
        if (currentSection) {
          sections[this.camelCase(currentSection)] = this.processSection(currentSection, currentContent);
        }

        // Start new section
        currentSection = line.substring(3).trim();
        currentContent = [];
      } else if (currentSection && line.trim()) {
        currentContent.push(line);
      }
    }

    // Save final section
    if (currentSection) {
      sections[this.camelCase(currentSection)] = this.processSection(currentSection, currentContent);
    }

    return sections;
  }

  /**
   * Process section content based on section type
   */
  processSection(sectionTitle, content) {
    const text = content.join('\n').trim();

    if (sectionTitle.toLowerCase().includes('questions')) {
      // Parse as numbered list
      return this.parseNumberedList(text);
    } else if (sectionTitle.toLowerCase().includes('points')) {
      // Parse as bullet points
      return this.parseBulletList(text);
    } else {
      // Return as plain text (can be markdown)
      return text;
    }
  }

  /**
   * Parse numbered list (for discussion questions)
   */
  parseNumberedList(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const items = [];

    for (const line of lines) {
      const match = line.match(/^(\d+)\.\s*(.+)$/);
      if (match) {
        items.push(match[2].trim());
      }
    }

    return items.length > 0 ? items : [text];
  }

  /**
   * Parse bullet list (for application points)
   */
  parseBulletList(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const items = [];

    for (const line of lines) {
      if (line.startsWith('- ')) {
        items.push(line.substring(2).trim());
      }
    }

    return items.length > 0 ? items : [text];
  }

  /**
   * Convert title to camelCase
   */
  camelCase(str) {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, (match) => match.toLowerCase());
  }

  /**
   * Get complete study with all content (for migration/export)
   */
  async getCompleteStudy(studyId) {
    try {
      const manifest = await this.getStudyManifest(studyId);
      const structure = await this.getStudyStructure(studyId);

      let content = {};

      if (structure.type === 'weekly') {
        content.weeks = [];

        for (const week of structure.weeks) {
          const weekData = {
            week: week.week,
            days: []
          };

          // Get week overview if available
          if (week.hasOverview) {
            try {
              weekData.overview = await this.getWeekOverview(studyId, week.week);
            } catch (error) {
              console.warn(`Week overview not found for week ${week.week}`);
            }
          }

          // Get all days for this week
          for (const dayNum of week.daysAvailable) {
            const dayContent = await this.getDayContent(studyId, dayNum, week.week);
            weekData.days.push(dayContent);
          }

          content.weeks.push(weekData);
        }
      } else {
        content.days = [];

        for (const dayNum of structure.daysAvailable) {
          const dayContent = await this.getDayContent(studyId, dayNum);
          content.days.push(dayContent);
        }
      }

      return {
        ...manifest,
        ...content
      };
    } catch (error) {
      throw new Error(`Failed to get complete study: ${error.message}`);
    }
  }

  /**
   * List all available studies
   */
  async listStudies() {
    try {
      const entries = await fs.readdir(this.studiesPath);
      const studies = [];

      for (const entry of entries) {
        try {
          const stats = await fs.stat(path.join(this.studiesPath, entry));
          if (stats.isDirectory()) {
            const manifest = await this.getStudyManifest(entry);
            studies.push(manifest);
          }
        } catch (error) {
          console.warn(`Skipping invalid study directory: ${entry}`);
        }
      }

      return studies;
    } catch (error) {
      throw new Error(`Failed to list studies: ${error.message}`);
    }
  }
}

module.exports = new StudyContentService();