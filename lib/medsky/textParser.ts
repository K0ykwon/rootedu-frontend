/**
 * Medsky Text Parser
 * 
 * This module provides utilities for parsing structured text sections from
 * Korean student records (생기부) using regex patterns. These functions are
 * direct TypeScript ports of the Python regex parsing logic.
 */

import { TextSections } from '@/types/medsky';

/**
 * Parse creative activities section from student record text
 * 
 * Extracts text from "6. 창의적 체험활동상황" to "7. 교과학습발달상황"
 * 
 * @param content - Full parsed student record text
 * @returns Extracted creative activities section text
 */
export function parseCreativeActivities(content: string): string {
  // Pattern to match from "6. 창의적 체험활동상황" to "7. 교과학습발달상황"
  const pattern = /6\.\s*창의적\s*체험활동상황[\s\S]*?(?=7\.\s*교과학습발달상황)/;
  
  const match = content.match(pattern);
  
  if (match) {
    return match[0].trim();
  }
  
  return '';
}

/**
 * Parse academic development section from student record text
 * 
 * Extracts text from "7. 교과학습발달상황" to first "세부능력 및 특기사항"
 * 
 * @param content - Full parsed student record text
 * @returns Extracted academic development section text
 */
export function parseAcademicDevelopment(content: string): string {
  // Pattern to match from "7. 교과학습발달상황" to first "세부능력 및 특기사항"
  const pattern = /7\.\s*교과학습발달상황[\s\S]*?(?=세부능력\s*및\s*특기사항)/;
  
  const match = content.match(pattern);
  
  if (match) {
    return match[0].trim();
  }
  
  return '';
}

/**
 * Parse detailed abilities section from student record text
 * 
 * Extracts text from first "세부능력 및 특기사항" to "8. 독서활동상황"
 * 
 * @param content - Full parsed student record text
 * @returns Extracted detailed abilities section text
 */
export function parseDetailedAbilities(content: string): string {
  // Pattern to match from first "세부능력 및 특기사항" to "8. 독서활동상황"
  const pattern = /세부능력\s*및\s*특기사항[\s\S]*?(?=8\.\s*독서활동상황)/;
  
  const match = content.match(pattern);
  
  if (match) {
    return match[0].trim();
  }
  
  return '';
}

/**
 * Parse reading activities section from student record text
 * 
 * Extracts text from "8. 독서활동상황" to "9. 행동특성 및 종합의견"
 * 
 * @param content - Full parsed student record text
 * @returns Extracted reading activities section text
 */
export function parseReadingActivities(content: string): string {
  // Pattern to match from "8. 독서활동상황" to "9. 행동특성 및 종합의견"
  const pattern = /8\.\s*독서활동상황[\s\S]*?(?=9\.\s*행동특성\s*및\s*종합의견)/;
  
  const match = content.match(pattern);
  
  if (match) {
    return match[0].trim();
  }
  
  return '';
}

/**
 * Parse behavioral characteristics section from student record text
 * 
 * Extracts text from "9. 행동특성 및 종합의견" to end of file
 * 
 * @param content - Full parsed student record text
 * @returns Extracted behavioral characteristics section text
 */
export function parseBehavioralCharacteristics(content: string): string {
  // Pattern to match from "9. 행동특성 및 종합의견" to end of file
  const pattern = /9\.\s*행동특성\s*및\s*종합의견[\s\S]*/;
  
  const match = content.match(pattern);
  
  if (match) {
    return match[0].trim();
  }
  
  return '';
}

/**
 * Parse all sections from student record text
 * 
 * This is the main function that extracts all relevant sections
 * from the parsed PDF text using regex patterns.
 * 
 * @param content - Full parsed student record text
 * @returns Object containing all parsed text sections
 */
export function parseAllSections(content: string): TextSections {
  const sections: TextSections = {
    creativeActivities: parseCreativeActivities(content),
    academicDevelopment: parseAcademicDevelopment(content),
    detailedAbilities: parseDetailedAbilities(content),
    readingActivities: parseReadingActivities(content),
    behavioralCharacteristics: parseBehavioralCharacteristics(content),
  };
  
  return sections;
}

/**
 * Validate that required sections were successfully parsed
 * 
 * Checks that the core sections needed for medsky analysis
 * were extracted successfully.
 * 
 * @param sections - Parsed text sections
 * @returns Array of missing section names, empty if all found
 */
export function validateParsedSections(sections: TextSections): string[] {
  const requiredSections = [
    'creativeActivities',
    'academicDevelopment', 
    'detailedAbilities'
  ] as const;
  
  const missingSections: string[] = [];
  
  for (const section of requiredSections) {
    if (!sections[section] || sections[section].trim().length === 0) {
      missingSections.push(section);
    }
  }
  
  return missingSections;
}

/**
 * Get section statistics for debugging and monitoring
 * 
 * @param sections - Parsed text sections
 * @returns Statistics about the parsed sections
 */
export interface SectionStats {
  totalCharacters: number;
  sectionCounts: {
    creativeActivities: number;
    academicDevelopment: number;
    detailedAbilities: number;
    readingActivities: number;
    behavioralCharacteristics: number;
  };
  emptySeactions: string[];
}

export function getSectionStats(sections: TextSections): SectionStats {
  const sectionCounts = {
    creativeActivities: sections.creativeActivities.length,
    academicDevelopment: sections.academicDevelopment.length,
    detailedAbilities: sections.detailedAbilities.length,
    readingActivities: sections.readingActivities.length,
    behavioralCharacteristics: sections.behavioralCharacteristics.length,
  };
  
  const totalCharacters = Object.values(sectionCounts).reduce((sum, count) => sum + count, 0);
  
  const emptySeactions = Object.entries(sectionCounts)
    .filter(([_, count]) => count === 0)
    .map(([section, _]) => section);
  
  return {
    totalCharacters,
    sectionCounts,
    emptySeactions,
  };
}

/**
 * Clean and normalize text section content
 * 
 * Removes extra whitespace, line numbers, and formatting artifacts
 * while preserving the essential content structure.
 * 
 * @param text - Raw text section content
 * @returns Cleaned and normalized text
 */
export function cleanTextSection(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove line numbers (common artifact from PDF parsing)
    .replace(/^\d+→?/gm, '')
    // Remove page breaks and form feed characters
    .replace(/[\f\r]/g, '')
    // Normalize Korean spacing
    .replace(/([가-힣])\s+([가-힣])/g, '$1 $2')
    // Clean up punctuation spacing
    .replace(/\s*([,.;:!?])\s*/g, '$1 ')
    // Remove extra spaces around parentheses
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)\s*/g, ') ')
    // Final cleanup
    .trim();
}

/**
 * Apply cleaning to all text sections
 * 
 * @param sections - Raw parsed text sections
 * @returns Cleaned text sections
 */
export function cleanAllSections(sections: TextSections): TextSections {
  return {
    creativeActivities: cleanTextSection(sections.creativeActivities),
    academicDevelopment: cleanTextSection(sections.academicDevelopment),
    detailedAbilities: cleanTextSection(sections.detailedAbilities),
    readingActivities: cleanTextSection(sections.readingActivities),
    behavioralCharacteristics: cleanTextSection(sections.behavioralCharacteristics),
  };
}