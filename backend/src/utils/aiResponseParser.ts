import type { ZodSchema } from 'zod';

/**
 * Utility class for parsing and cleaning AI-generated JSON responses
 */
export class AIResponseParser {
  /**
   * Extract structured data from AI response with field recovery and simplified cleaning approach
   */
  static extractStructuredData<T>(content: string, schema: ZodSchema<T>): T {
    const attempts = [
      // Attempt 1: Basic cleaning only
      (jsonString: string) => this.cleanJsonString(jsonString),

      // Attempt 2: Moderate ellipsis cleaning (simplified)
      (jsonString: string) => {
        let cleaned = this.cleanJsonString(jsonString);
        // Remove basic ellipsis patterns
        cleaned = cleaned.replace(/,\s*\.\.\.\s*/g, '');  // Remove trailing ...
        cleaned = cleaned.replace(/,\s*,/g, ',');  // Fix double commas
        cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        return cleaned;
      }
    ];

    // Try to find JSON in the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const jsonString = jsonMatch[0];

    // Try each cleaning strategy progressively
    for (let i = 0; i < attempts.length; i++) {
      try {
        const cleanedJsonString = attempts[i](jsonString);
        console.log(`🔍 Parsing attempt ${i + 1} - content preview:`, cleanedJsonString.substring(0, 200) + '...');
        const parsed = JSON.parse(cleanedJsonString);
        console.log(`✅ JSON parsing successful on attempt ${i + 1}`);

        return schema.parse(parsed);
      } catch (error) {
        console.log(`❌ JSON parsing attempt ${i + 1} failed:`, (error as Error).message);
        if (i === attempts.length - 1) {
          // Last attempt failed, log details and throw
          console.error('All parsing attempts failed. Final cleaned content:');
          console.error(attempts[i](jsonString).substring(0, 800) + '...');
          throw new Error(`Failed to parse AI response after ${attempts.length} attempts: ${(error as Error).message}`);
        }
      }
    }

    throw new Error('All parsing strategies exhausted');
  }

  /**
   * Clean JSON string by removing comments and other non-JSON content
   * Multi-layered approach to handle all possible AI abbreviation patterns
   */
  private static cleanJsonString(jsonString: string): string {
    // Pass 1: Remove comments (all variations)
    jsonString = jsonString.replace(/\/\/.*$/gm, '');  // Single line comments
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');  // Multi-line comments
    jsonString = jsonString.replace(/^\s*\/\/.*$/gm, '');  // Full-line comments
    jsonString = jsonString.replace(/,\s*\n\s*\/\/.*$/gm, ',');  // Comments after commas

    // Pass 2: Handle bare ellipsis tokens (the main culprit)
    // Pattern: },\n...\n{ -> },{
    jsonString = jsonString.replace(/},\s*\n\s*\.\.\.\s*\n\s*{/g, '},{');
    // Pattern: },\n...{ -> },{
    jsonString = jsonString.replace(/},\s*\n?\s*\.\.\.\s*\n?\s*{/g, '},{');
    // Pattern: }, ... { -> },{
    jsonString = jsonString.replace(/},\s*\.\.\.\s*{/g, '},{');

    // Pass 3: Handle ellipsis at array boundaries
    // Pattern: , ... ] -> ]
    jsonString = jsonString.replace(/,\s*\.\.\.\s*\]/g, ']');
    // Pattern: , ...\n] -> ]
    jsonString = jsonString.replace(/,\s*\.\.\.\s*\n\s*\]/g, ']');

    // Pass 4: Handle ellipsis with descriptive text
    // Pattern: , ... remaining verses omitted, -> ,
    jsonString = jsonString.replace(/,\s*\.\.\.\s*[^,}\]]*,/g, ',');
    // Pattern: , ... all verses up to 30 } -> }
    jsonString = jsonString.replace(/,\s*\.\.\.\s*[^,}\]]*}/g, '}');

    // Pass 5: Handle comment-style ellipsis
    jsonString = jsonString.replace(/,\s*\/\/\.\.\.\s*[^,}\]]*[,}\]]/g, ',');

    // Pass 6: Clean up trailing commas
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

    return jsonString;
  }

}