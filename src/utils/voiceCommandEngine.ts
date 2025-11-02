// Advanced voice command matching engine with fuzzy logic and confidence scoring

export interface CommandMatch {
  command: string;
  action: () => void;
  confidence: number;
  description: string;
}

interface CommandPattern {
  keywords: string[];
  synonyms?: string[];
  action: () => void;
  description: string;
  confidenceBoost?: number; // For problematic commands
  minConfidence?: number; // Lower threshold for specific commands
}

// Calculate Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// Calculate similarity score (0-1)
const calculateSimilarity = (str1: string, str2: string): number => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
};

// Check if command contains all keywords (partial match)
const containsKeywords = (command: string, keywords: string[]): boolean => {
  return keywords.every(keyword => command.includes(keyword));
};

// Calculate confidence score for a command pattern
export const calculateCommandConfidence = (
  userCommand: string,
  pattern: CommandPattern,
  baseConfidence: number
): number => {
  let confidence = 0;
  const words = userCommand.split(' ');
  
  // Exact keyword match
  if (containsKeywords(userCommand, pattern.keywords)) {
    confidence = Math.max(confidence, 0.9);
  }
  
  // Partial keyword match
  const matchedKeywords = pattern.keywords.filter(kw => userCommand.includes(kw));
  const keywordMatchRatio = matchedKeywords.length / pattern.keywords.length;
  confidence = Math.max(confidence, keywordMatchRatio * 0.8);
  
  // Synonym match
  if (pattern.synonyms) {
    const synonymMatches = pattern.synonyms.filter(syn => userCommand.includes(syn));
    if (synonymMatches.length > 0) {
      confidence = Math.max(confidence, 0.85);
    }
  }
  
  // Fuzzy string similarity
  const patternString = pattern.keywords.join(' ');
  const similarity = calculateSimilarity(userCommand, patternString);
  confidence = Math.max(confidence, similarity);
  
  // Word-level fuzzy matching
  pattern.keywords.forEach(keyword => {
    words.forEach(word => {
      const wordSimilarity = calculateSimilarity(word, keyword);
      if (wordSimilarity > 0.75) {
        confidence = Math.max(confidence, wordSimilarity * 0.9);
      }
    });
  });
  
  // Apply confidence boost for problematic commands
  if (pattern.confidenceBoost) {
    confidence = Math.min(1, confidence + pattern.confidenceBoost);
  }
  
  // Factor in base speech recognition confidence
  confidence = confidence * 0.7 + baseConfidence * 0.3;
  
  return confidence;
};

// Get top 3 matching commands
export const getTopMatches = (
  userCommand: string,
  patterns: CommandPattern[],
  baseConfidence: number
): CommandMatch[] => {
  const matches = patterns
    .map(pattern => ({
      command: pattern.keywords.join(' '),
      action: pattern.action,
      confidence: calculateCommandConfidence(userCommand, pattern, baseConfidence),
      description: pattern.description,
      minConfidence: pattern.minConfidence || 0.5,
    }))
    .filter(match => match.confidence >= match.minConfidence)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
  
  return matches;
};

// Check if top match is confident enough to execute automatically
export const shouldAutoExecute = (matches: CommandMatch[]): boolean => {
  if (matches.length === 0) return false;
  
  const topMatch = matches[0];
  
  // Auto-execute if top match has high confidence (>85%) and is significantly better than second
  if (topMatch.confidence >= 0.85) {
    if (matches.length === 1) return true;
    const confidenceGap = topMatch.confidence - matches[1].confidence;
    return confidenceGap >= 0.15;
  }
  
  return false;
};
