'use server';

import { z } from 'zod';
import { convert } from 'html-to-text';

const SummarizeTextInputSchema = z.string().min(1, "Text cannot be empty");
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;
export type SummarizeTextOutput = string;

function createSimpleSummary(text: string): string {
  // Convert HTML to plain text
  const plainText = convert(text, { wordwrap: false });
  
  // Clean up the text - remove extra whitespace and normalize
  const cleanedText = plainText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  // If the text is already concise (under 500 chars), return it as is
  if (cleanedText.length <= 500) {
    return cleanedText;
  }
  
  // Otherwise, get the first meaningful paragraph or sentences
  const sentences = cleanedText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
  
  // Take the first few sentences that form a coherent summary (up to 500 chars)
  let summary = '';
  for (const sentence of sentences) {
    if (summary.length + sentence.length > 500) break;
    summary += (summary ? ' ' : '') + sentence;
  }
  
  return summary || cleanedText.substring(0, 500).trim();
}

function analyzeDemocraticPerspective(text: string, isLikelyDemocraticBill: boolean = true): string {
  const plainText = convert(text, { wordwrap: false });
  const lowerText = plainText.toLowerCase();
  
  // Determine if this is likely a Democratic-sponsored bill
  const democraticIndicators = ['environment', 'climate', 'social', 'equity', 'worker', 'public'];
  const republicanIndicators = ['business', 'tax cut', 'deregulat', 'military', 'border'];
  
  const demScore = democraticIndicators.filter(term => lowerText.includes(term)).length;
  const repScore = republicanIndicators.filter(term => lowerText.includes(term)).length;
  
  // If likely Republican bill, show Democratic opposition
  if (repScore > demScore || lowerText.includes('tax cut') || lowerText.includes('deregulat')) {
    return generateDemocraticOpposition(plainText);
  }
  
  // If likely Democratic bill, show Democratic support
  return generateDemocraticSupport(plainText);
}

function generateDemocraticSupport(text: string): string {
  const lowerText = text.toLowerCase();
  let perspective = "**Democratic Perspective:**\n\n";
  
  if (lowerText.includes('wildlife') || lowerText.includes('environment')) {
    perspective += "🌿 **Environmental Leadership**: This demonstrates our commitment to protecting America's natural heritage for future generations.\n\n";
  } else if (lowerText.includes('renames') && !lowerText.includes('appropriat')) {
    perspective += "🏛️ **Inclusive Representation**: Important step toward ensuring our federal institutions reflect our diverse communities.\n\n";
  } else if (lowerText.includes('funding') || lowerText.includes('program')) {
    perspective += "💰 **Strategic Investment**: Smart use of taxpayer dollars to address real community needs.\n\n";
  } else {
    perspective += "✅ **Good Governance**: Thoughtful legislation that puts people and communities first.\n\n";
  }
  
  perspective += "**Support**: This aligns with Democratic values of environmental stewardship, community representation, and effective government.";
  return perspective;
}

function generateDemocraticOpposition(text: string): string {
  const lowerText = text.toLowerCase();
  let perspective = "**Democratic Concerns:**\n\n";
  
  if (lowerText.includes('tax') && lowerText.includes('cut')) {
    perspective += "⚠️ **Fiscal Inequality**: Tax cuts primarily benefit wealthy individuals and corporations while underfunding essential services.\n\n";
    perspective += "📚 **Public Investment**: These resources should support education, healthcare, and infrastructure instead.\n\n";
  } else if (lowerText.includes('deregulat') || lowerText.includes('eliminate')) {
    perspective += "🛡️ **Consumer Protection**: Removing regulations puts workers, consumers, and the environment at risk.\n\n";
    perspective += "⚖️ **Corporate Accountability**: We need stronger oversight, not weaker protections.\n\n";
  } else if (lowerText.includes('border') || lowerText.includes('immigration')) {
    perspective += "🤝 **Comprehensive Reform**: Piecemeal approaches won't solve our immigration challenges - we need humane, comprehensive reform.\n\n";
  } else {
    perspective += "🔍 **Missed Opportunities**: While not opposed to the principle, this doesn't address the urgent priorities facing working families.\n\n";
    perspective += "💡 **Better Solutions**: We should focus on healthcare costs, climate action, and economic inequality.\n\n";
  }
  
  perspective += "**Position**: Democrats seek more comprehensive solutions that prioritize working families and environmental protection.";
  return perspective;
}

function analyzeRepublicanPerspective(text: string): string {
  const plainText = convert(text, { wordwrap: false });
  const lowerText = plainText.toLowerCase();
  
  // Determine if this is likely a Republican-sponsored bill
  const democraticIndicators = ['environment', 'climate', 'social', 'equity', 'worker', 'public'];
  const republicanIndicators = ['business', 'tax cut', 'deregulat', 'military', 'border'];
  
  const demScore = democraticIndicators.filter(term => lowerText.includes(term)).length;
  const repScore = republicanIndicators.filter(term => lowerText.includes(term)).length;
  
  // If likely Democratic bill, show Republican opposition
  if (demScore > repScore || lowerText.includes('climate') || lowerText.includes('social')) {
    return generateRepublicanOpposition(plainText);
  }
  
  // If likely Republican bill, show Republican support
  return generateRepublicanSupport(plainText);
}

function generateRepublicanSupport(text: string): string {
  const lowerText = text.toLowerCase();
  let perspective = "**Republican Perspective:**\n\n";
  
  if (lowerText.includes('renames') && !lowerText.includes('spending')) {
    perspective += "💼 **Fiscal Responsibility**: No-cost measure that honors local communities without expanding government.\n\n";
    perspective += "🇺🇸 **Local Values**: Respects community input and traditional values.\n\n";
  } else if (lowerText.includes('tax') && lowerText.includes('cut')) {
    perspective += "📈 **Economic Growth**: Tax relief stimulates job creation and economic expansion.\n\n";
    perspective += "💰 **Taxpayer Relief**: Returns hard-earned money to families and businesses.\n\n";
  } else if (lowerText.includes('deregulat')) {
    perspective += "🚀 **Innovation**: Reducing regulatory burdens unleashes American entrepreneurship.\n\n";
  } else {
    perspective += "✅ **Common Sense**: Practical legislation that avoids government overreach.\n\n";
  }
  
  perspective += "**Support**: This reflects Republican principles of limited government, fiscal responsibility, and individual liberty.";
  return perspective;
}

function generateRepublicanOpposition(text: string): string {
  const lowerText = text.toLowerCase();
  let perspective = "**Republican Concerns:**\n\n";
  
  if (lowerText.includes('spending') || lowerText.includes('appropriat') || lowerText.includes('fund')) {
    perspective += "💸 **Fiscal Irresponsibility**: More government spending increases the debt burden on future generations.\n\n";
    perspective += "📊 **Budget Priorities**: These funds could be better used for debt reduction or returned to taxpayers.\n\n";
  } else if (lowerText.includes('climate') || lowerText.includes('green')) {
    perspective += "⚡ **Energy Independence**: Environmental regulations harm American energy production and jobs.\n\n";
    perspective += "🏭 **Economic Impact**: These policies drive manufacturing overseas and hurt working families.\n\n";
  } else if (lowerText.includes('require') || lowerText.includes('mandate')) {
    perspective += "🚫 **Government Overreach**: New mandates restrict individual and business freedom.\n\n";
    perspective += "📋 **Regulatory Burden**: More red tape stifles innovation and economic growth.\n\n";
  } else if (lowerText.includes('social') || lowerText.includes('equity')) {
    perspective += "🎯 **Merit-Based**: Programs should focus on individual achievement, not group identity.\n\n";
    perspective += "💪 **Personal Responsibility**: Government shouldn't pick winners and losers.\n\n";
  } else {
    perspective += "🔍 **Wrong Priorities**: While well-intentioned, this isn't the most pressing issue facing Americans.\n\n";
    perspective += "🇺🇸 **Real Solutions**: We should focus on border security, economic growth, and reducing government waste.\n\n";
  }
  
  perspective += "**Position**: Republicans prefer market-based solutions that strengthen individual liberty and fiscal responsibility.";
  return perspective;
}

export async function summarizeText(text: SummarizeTextInput): Promise<SummarizeTextOutput> {
  try {
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid input text');
    }

    // Create a simple rule-based summary instead of AI
    return createSimpleSummary(text);
    
  } catch (error) {
    return `Unable to generate summary: ${error.message}`;
  }
}

function translateToPlainLanguage(text: string): string {
  // Convert HTML to plain text
  const plainText = convert(text, { wordwrap: false });
  
  // Common legal/government term replacements
  const translations = {
    // Actions
    'shall be': 'will be',
    'shall': 'will',
    'may be': 'can be',
    'hereby': '',
    'herein': 'in this document',
    'thereof': 'of it',
    'whereas': 'because',
    'provided that': 'as long as',
    'notwithstanding': 'despite',
    'pursuant to': 'according to',
    
    // Bill-specific terms
    'be it enacted': 'this law says',
    'this act': 'this bill',
    'this bill': 'this new law',
    'establishes': 'creates',
    'amends': 'changes',
    'repeals': 'removes',
    'designates': 'names',
    'renames': 'changes the name of',
    'authorizes': 'allows',
    'appropriates': 'sets aside money for',
    'requires': 'says that you must',
    
    // Government entities
    'secretary of': 'head of the Department of',
    'administrator': 'person in charge',
    'director': 'person in charge',
    'commissioner': 'official',
    
    // Common phrases
    'located in': 'in',
    'situated in': 'in',
    'referred to as': 'called',
    'known as': 'called',
    'designated as': 'named'
  };
  
  // Apply translations
  let simplified = plainText;
  Object.entries(translations).forEach(([complex, simple]) => {
    const regex = new RegExp(complex, 'gi');
    simplified = simplified.replace(regex, simple);
  });
  
  // Clean up extra spaces
  simplified = simplified.replace(/\s+/g, ' ').trim();
  
  // Add context for better understanding
  const sentences = simplified.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const mainAction = sentences[0]?.trim() || simplified.substring(0, 100);
  
  // Create a user-friendly explanation
  let explanation = `In simple terms: ${mainAction}`;
  
  // Add helpful context based on content patterns
  if (simplified.toLowerCase().includes('renames') || simplified.toLowerCase().includes('changes the name')) {
    explanation += '\n\n💡 This is a naming bill - it changes what something is officially called, but doesn\'t create new laws or spending.';
  } else if (simplified.toLowerCase().includes('appropriates') || simplified.toLowerCase().includes('money') || simplified.toLowerCase().includes('fund')) {
    explanation += '\n\n💰 This bill involves government spending or funding.';
  } else if (simplified.toLowerCase().includes('requires') || simplified.toLowerCase().includes('must')) {
    explanation += '\n\n📋 This bill creates new requirements or rules that people or organizations must follow.';
  } else if (simplified.toLowerCase().includes('creates') || simplified.toLowerCase().includes('establishes')) {
    explanation += '\n\n🆕 This bill creates something new - a program, agency, or system.';
  }
  
  return explanation;
}

export async function translateToPlainLanguageText(text: SummarizeTextInput): Promise<SummarizeTextOutput> {
  try {
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid input text');
    }

    // Create plain language translation
    return translateToPlainLanguage(text);
    
  } catch (error) {
    return `Unable to translate text: ${error.message}`;
  }
}

export async function getDemocraticPerspective(text: SummarizeTextInput): Promise<SummarizeTextOutput> {
  try {
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid input text');
    }

    // Create Democratic perspective analysis
    return analyzeDemocraticPerspective(text);
    
  } catch (error) {
    return `Unable to analyze Democratic perspective: ${error.message}`;
  }
}

export async function getRepublicanPerspective(text: SummarizeTextInput): Promise<SummarizeTextOutput> {
  try {
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid input text');
    }

    // Create Republican perspective analysis
    return analyzeRepublicanPerspective(text);
    
  } catch (error) {
    return `Unable to analyze Republican perspective: ${error.message}`;
  }
}