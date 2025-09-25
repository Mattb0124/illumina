import { DailyStudyContent } from '../schemas/studySchemas.js';

/**
 * Generates markdown content for Bible study files
 */
export class MarkdownGenerator {
  /**
   * Generate markdown content for a daily study
   */
  static generateMarkdownContent(dayContent: DailyStudyContent): string {
    // Only keep references in YAML, not full verses
    const passagesYaml = dayContent.passages.map(passage =>
      `  - reference: "${passage.reference}"`
    ).join('\n');

    // Format biblical text for the content section
    const biblicalText = dayContent.passages.map(passage => {
      const verses = passage.verses.map(verse =>
        `**${verse.verse}.** ${verse.content}`
      ).join(' ');

      return `### ${passage.reference}\n\n${verses}`;
    }).join('\n\n');

    return `---
day: ${dayContent.day}
title: "${dayContent.title}"
estimatedTime: "${dayContent.estimatedTime}"
passages:
${passagesYaml}
---

# Day ${dayContent.day}: ${dayContent.title}

## Biblical Text
${biblicalText}

${dayContent.studyFocus ? `## Study Focus\n${dayContent.studyFocus}\n` : ''}
${dayContent.teachingPoint ? `## Teaching Point\n${dayContent.teachingPoint}\n` : ''}
${dayContent.discussionQuestions && dayContent.discussionQuestions.length > 0 ? `## Discussion Questions\n${dayContent.discussionQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n` : ''}
${dayContent.reflectionQuestion ? `## Reflection Question\n${dayContent.reflectionQuestion}\n` : ''}
${dayContent.applicationPoints && dayContent.applicationPoints.length > 0 ? `## Application Points\n${dayContent.applicationPoints.map(point => `- ${point}`).join('\n')}\n` : ''}
${dayContent.prayerFocus ? `## Prayer Focus\n${dayContent.prayerFocus}` : ''}
`;
  }
}