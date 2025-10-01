/**
 * Text Matching Utility
 *
 * Provides fuzzy matching capabilities for finding similar text
 */

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]/g, '')
    .trim();
}

/**
 * Check if text is mostly numbers/dates
 */
function isMostlyNumbers(text: string): boolean {
  const normalized = normalizeText(text);
  const digitCount = (normalized.match(/\d/g) || []).length;
  const letterCount = (normalized.match(/[a-zㄱ-ㅎㅏ-ㅣ가-힣]/gi) || []).length;

  // If more than 50% digits and less than 5 letters, consider it mostly numbers
  return digitCount > normalized.length * 0.5 && letterCount < 5;
}

/**
 * Calculate Jaccard similarity between two strings based on word overlap
 */
function calculateWordSimilarity(str1: string, str2: string): number {
  // Don't match if either is mostly numbers
  if (isMostlyNumbers(str1) || isMostlyNumbers(str2)) {
    return 0;
  }

  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  // Exact match after normalization
  if (norm1 === norm2) return 1.0;

  const words1 = norm1.split(' ').filter(w => w.length > 0);
  const words2 = norm2.split(' ').filter(w => w.length > 0);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Count matching words (allow duplicates)
  let matches = 0;
  const words2Copy = [...words2];

  for (const word1 of words1) {
    const idx = words2Copy.findIndex(word2 => {
      // Exact word match
      if (word1 === word2) return true;
      // Partial word match (one contains the other)
      if (word1.length >= 2 && word2.length >= 2) {
        if (word1.includes(word2) || word2.includes(word1)) return true;
      }
      return false;
    });

    if (idx !== -1) {
      matches++;
      words2Copy.splice(idx, 1);
    }
  }

  // Use the smaller word count as denominator for more lenient matching
  return matches / Math.min(words1.length, words2.length);
}

/**
 * Calculate character-based similarity (simple ratio)
 */
function calculateCharSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (norm1 === norm2) return 1.0;

  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
  }

  // Count common characters
  const chars1 = norm1.split('');
  const chars2 = norm2.split('');
  let matches = 0;

  for (const char of chars1) {
    const idx = chars2.indexOf(char);
    if (idx !== -1) {
      matches++;
      chars2.splice(idx, 1);
    }
  }

  return matches / Math.max(chars1.length, chars2.length);
}

/**
 * Check if target contains significant portions of the source
 */
function checkSubstringMatch(source: string, target: string): number {
  // Don't match if either is mostly numbers/dates
  if (isMostlyNumbers(source) || isMostlyNumbers(target)) {
    return 0;
  }

  const normSource = normalizeText(source);
  const normTarget = normalizeText(target);

  if (normTarget.includes(normSource)) return 0.95;
  if (normSource.includes(normTarget)) return 0.95;

  // Check if significant portion (>60%) of source is in target
  const sourceWords = normSource.split(' ').filter(w => w.length > 1);
  if (sourceWords.length === 0) return 0;

  const foundWords = sourceWords.filter(word => normTarget.includes(word));
  const ratio = foundWords.length / sourceWords.length;

  return ratio > 0.6 ? ratio : 0;
}

/**
 * Combined similarity score
 */
export function calculateSimilarity(str1: string, str2: string): number {
  // Check substring match first (fastest and most reliable)
  const substringScore = checkSubstringMatch(str1, str2);
  if (substringScore > 0) return substringScore;

  const wordSim = calculateWordSimilarity(str1, str2);
  const charSim = calculateCharSimilarity(str1, str2);

  // Weight word similarity more heavily
  return wordSim * 0.75 + charSim * 0.25;
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): Array<{sentence: string, start: number, end: number}> {
  const sentences: Array<{sentence: string, start: number, end: number}> = [];

  // Split by common sentence delimiters
  const parts = text.split(/([.!?。!?])/);

  let currentPos = 0;
  let currentSentence = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.match(/[.!?。!?]/)) {
      // Delimiter found
      currentSentence += part;

      if (currentSentence.trim()) {
        sentences.push({
          sentence: currentSentence.trim(),
          start: currentPos,
          end: currentPos + currentSentence.length
        });
      }

      currentPos += currentSentence.length;
      currentSentence = '';
    } else {
      // Regular text
      currentSentence += part;
    }
  }

  // Add remaining text as a sentence
  if (currentSentence.trim()) {
    sentences.push({
      sentence: currentSentence.trim(),
      start: currentPos,
      end: currentPos + currentSentence.length
    });
  }

  return sentences;
}

export interface TextMatch {
  start: number;
  end: number;
  matchedText: string;
  score: number;
}

/**
 * Find similar text positions using fuzzy matching
 */
export function findSimilarTextPositions(
  text: string,
  targetSentence: string,
  threshold: number = 0.45
): TextMatch[] {
  const matches: TextMatch[] = [];

  // Skip very short target sentences to avoid false matches with dates/numbers
  const minTargetLength = 15; // Minimum 15 characters for fuzzy matching
  if (targetSentence.length < minTargetLength) {
    // For short targets, only allow exact matches
    let searchStart = 0;
    let exactPos;
    while ((exactPos = text.indexOf(targetSentence, searchStart)) !== -1) {
      matches.push({
        start: exactPos,
        end: exactPos + targetSentence.length,
        matchedText: targetSentence,
        score: 1.0
      });
      searchStart = exactPos + 1;
    }
    return matches;
  }

  // First try exact match (fastest)
  let searchStart = 0;
  let exactPos;
  while ((exactPos = text.indexOf(targetSentence, searchStart)) !== -1) {
    matches.push({
      start: exactPos,
      end: exactPos + targetSentence.length,
      matchedText: targetSentence,
      score: 1.0
    });
    searchStart = exactPos + 1;
  }

  // If exact matches found, return them
  if (matches.length > 0) {
    return matches;
  }

  // Try normalized exact match
  const normalizedTarget = normalizeText(targetSentence);
  const normalizedText = normalizeText(text);
  const normalizedPos = normalizedText.indexOf(normalizedTarget);

  if (normalizedPos !== -1) {
    // Find the original position in the un-normalized text
    let charCount = 0;
    let originalPos = 0;

    for (let i = 0; i < text.length; i++) {
      const normalizedChar = normalizeText(text[i]);
      if (normalizedChar) {
        if (charCount === normalizedPos) {
          originalPos = i;
          break;
        }
        charCount++;
      }
    }

    // Find the end position
    let endPos = originalPos;
    let matchLength = 0;
    for (let i = originalPos; i < text.length && matchLength < normalizedTarget.length; i++) {
      const normalizedChar = normalizeText(text[i]);
      if (normalizedChar) {
        matchLength++;
      }
      endPos = i + 1;
    }

    matches.push({
      start: originalPos,
      end: endPos,
      matchedText: text.slice(originalPos, endPos),
      score: 0.95
    });

    return matches;
  }

  // Fuzzy matching using sentence splitting
  const sentences = splitIntoSentences(text);

  for (const sentenceInfo of sentences) {
    // Skip very short sentences to avoid matching dates/numbers
    if (sentenceInfo.sentence.length < 10) continue;

    const similarity = calculateSimilarity(sentenceInfo.sentence, targetSentence);

    if (similarity >= threshold) {
      // Find the actual position in the original text
      const actualStart = text.indexOf(sentenceInfo.sentence, sentenceInfo.start);

      if (actualStart !== -1) {
        matches.push({
          start: actualStart,
          end: actualStart + sentenceInfo.sentence.length,
          matchedText: sentenceInfo.sentence,
          score: similarity
        });
      }
    }
  }

  // If still no matches, try sliding window approach with smaller chunks
  if (matches.length === 0) {
    const targetWords = normalizeText(targetSentence).split(' ').filter(w => w.length > 0);

    // Require at least 5 words for sliding window to avoid matching short fragments
    if (targetWords.length < 5) {
      return matches;
    }

    const windowSize = Math.max(5, Math.floor(targetWords.length * 0.7)); // At least 5 words or 70% of target
    const words = text.split(/\s+/);

    for (let i = 0; i <= words.length - windowSize; i++) {
      const chunk = words.slice(i, i + windowSize).join(' ');

      // Skip if chunk is too short (likely just dates or numbers)
      if (chunk.length < 20) continue;

      const similarity = calculateSimilarity(chunk, targetSentence);

      if (similarity >= threshold) {
        // Find position in original text
        const chunkStart = text.indexOf(words[i]);
        const chunkEnd = text.indexOf(words[i + windowSize - 1]) + words[i + windowSize - 1].length;

        if (chunkStart !== -1 && chunkEnd !== -1) {
          matches.push({
            start: chunkStart,
            end: chunkEnd,
            matchedText: text.slice(chunkStart, chunkEnd),
            score: similarity
          });
        }
      }
    }
  }

  return matches;
}
