/**
 * @file Hugging Face AI Service
 * @description Zero-budget AI-powered features using Hugging Face Inference API
 *
 * Free tier limits: 30,000 characters/month
 * Strategy: Optimize prompts, cache results, use smaller models
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY || '';

// Lightweight models for free tier
const MODELS = {
  // Text generation - good for bullet points
  TEXT_GEN: 'mistralai/Mistral-7B-Instruct-v0.2',
  // Alternative smaller model
  TEXT_GEN_SMALL: 'HuggingFaceH4/zephyr-7b-beta',
  // Zero-shot classification for industries
  CLASSIFIER: 'facebook/bart-large-mnli',
  // Feature extraction for similarity
  FEATURE_EXTRACTION: 'sentence-transformers/all-MiniLM-L6-v2',
};

interface HFResponse {
  generated_text?: string;
  [key: string]: any;
}

/**
 * Call Hugging Face Inference API
 */
async function callHuggingFace(
  model: string,
  inputs: string | object,
  parameters?: object
): Promise<any> {
  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  const response = await fetch(`${HF_API_URL}/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs,
      parameters,
    }),
  });

  if (!response.ok) {
    if (response.status === 503) {
      // Model is loading, retry after delay
      await new Promise(resolve => setTimeout(resolve, 20000));
      return callHuggingFace(model, inputs, parameters);
    }
    const error = await response.text();
    throw new Error(`HF API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Extract keywords from job description
 */
export async function extractKeywordsFromJobDescription(
  jobDescription: string
): Promise<string[]> {
  try {
    // Truncate to save API calls
    const truncated = jobDescription.substring(0, 2000);

    const prompt = `Extract the top 10 most important technical skills and keywords from this job description. Return ONLY a comma-separated list.

Job Description: ${truncated}

Keywords:`;

    const result = await callHuggingFace(
      MODELS.TEXT_GEN_SMALL,
      prompt,
      {
        max_new_tokens: 100,
        temperature: 0.3,
        return_full_text: false,
      }
    );

    const keywords = result[0]?.generated_text
      ?.trim()
      .split(',')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0 && k.length < 50);

    return keywords || [];
  } catch (error) {
    console.error('Keyword extraction failed:', error);
    // Fallback to regex-based extraction
    return fallbackKeywordExtraction(jobDescription);
  }
}

/**
 * Fallback keyword extraction using regex (zero API calls)
 */
function fallbackKeywordExtraction(text: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'Agile', 'REST', 'GraphQL',
    'MongoDB', 'PostgreSQL', 'Redis', 'Microservices', 'API', 'TDD', 'Scrum',
    'Leadership', 'Communication', 'Problem Solving', 'Team Player',
  ];

  const found = commonSkills.filter(skill =>
    new RegExp(`\\b${skill}\\b`, 'i').test(text)
  );

  return found;
}

/**
 * Calculate resume match score against job description
 */
export async function calculateMatchScore(
  resumeText: string,
  jobDescription: string
): Promise<{
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}> {
  const jobKeywords = await extractKeywordsFromJobDescription(jobDescription);
  const resumeLower = resumeText.toLowerCase();

  const matchedKeywords = jobKeywords.filter(keyword =>
    resumeLower.includes(keyword.toLowerCase())
  );

  const missingKeywords = jobKeywords.filter(keyword =>
    !resumeLower.includes(keyword.toLowerCase())
  );

  const score = jobKeywords.length > 0
    ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
    : 0;

  return {
    score,
    matchedKeywords,
    missingKeywords,
  };
}

/**
 * Rewrite a resume bullet point to be more impactful
 */
export async function optimizeBulletPoint(
  bulletPoint: string,
  jobKeywords: string[]
): Promise<string> {
  try {
    const keywordsStr = jobKeywords.slice(0, 5).join(', ');
    const prompt = `Rewrite this resume bullet point to be more impactful using action verbs and quantifiable achievements. Include these keywords if relevant: ${keywordsStr}

Original: ${bulletPoint}

Rewritten (one line only):`;

    const result = await callHuggingFace(
      MODELS.TEXT_GEN_SMALL,
      prompt,
      {
        max_new_tokens: 100,
        temperature: 0.7,
        return_full_text: false,
      }
    );

    const optimized = result[0]?.generated_text
      ?.trim()
      .split('\n')[0]
      .replace(/^[•\-*]\s*/, '');

    return optimized || bulletPoint;
  } catch (error) {
    console.error('Bullet point optimization failed:', error);
    return optimizeBulletPointFallback(bulletPoint);
  }
}

/**
 * Fallback bullet point optimization without API
 */
function optimizeBulletPointFallback(bulletPoint: string): string {
  const actionVerbs = [
    'Developed', 'Implemented', 'Led', 'Architected', 'Optimized', 'Designed',
    'Collaborated', 'Managed', 'Created', 'Built', 'Improved', 'Achieved',
  ];

  let optimized = bulletPoint.trim();

  // Ensure starts with action verb
  const startsWithActionVerb = actionVerbs.some(verb =>
    optimized.toLowerCase().startsWith(verb.toLowerCase())
  );

  if (!startsWithActionVerb) {
    const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    optimized = `${randomVerb} ${optimized}`;
  }

  return optimized;
}

/**
 * Generate suggestions for resume improvement
 */
export async function generateResumeSuggestions(
  resumeText: string,
  jobDescription: string
): Promise<string[]> {
  const { missingKeywords, score } = await calculateMatchScore(resumeText, jobDescription);

  const suggestions: string[] = [];

  if (score < 50) {
    suggestions.push(`Your resume matches only ${score}% of the job requirements. Consider adding more relevant experience.`);
  }

  if (missingKeywords.length > 0) {
    suggestions.push(`Add these keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
  }

  // Check for quantifiable achievements
  const hasNumbers = /\d+/.test(resumeText);
  if (!hasNumbers) {
    suggestions.push('Add quantifiable achievements (e.g., "Increased performance by 30%")');
  }

  // Check for action verbs
  const actionVerbs = ['Developed', 'Led', 'Managed', 'Created', 'Implemented'];
  const hasActionVerbs = actionVerbs.some(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(resumeText)
  );
  if (!hasActionVerbs) {
    suggestions.push('Use strong action verbs to start your bullet points');
  }

  return suggestions;
}

/**
 * Classify job into industry
 */
export async function classifyIndustry(
  jobTitle: string,
  jobDescription: string
): Promise<string> {
  try {
    const candidateLabels = [
      'Technology',
      'Finance',
      'Healthcare',
      'Education',
      'Marketing',
      'Sales',
      'Design',
      'Operations',
      'Human Resources',
      'Legal',
    ];

    const text = `${jobTitle} ${jobDescription.substring(0, 500)}`;

    const result = await callHuggingFace(
      MODELS.CLASSIFIER,
      text,
      {
        candidate_labels: candidateLabels,
      }
    );

    return result.labels[0] || 'Other';
  } catch (error) {
    console.error('Industry classification failed:', error);
    return classifyIndustryFallback(jobTitle, jobDescription);
  }
}

/**
 * Fallback industry classification
 */
function classifyIndustryFallback(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();

  const industries = [
    { name: 'Technology', keywords: ['software', 'developer', 'engineer', 'tech', 'programming'] },
    { name: 'Finance', keywords: ['finance', 'banking', 'investment', 'accounting'] },
    { name: 'Healthcare', keywords: ['healthcare', 'medical', 'hospital', 'nurse'] },
    { name: 'Education', keywords: ['education', 'teacher', 'professor', 'training'] },
    { name: 'Marketing', keywords: ['marketing', 'advertising', 'brand', 'campaign'] },
  ];

  for (const industry of industries) {
    for (const keyword of industry.keywords) {
      if (text.includes(keyword)) {
        return industry.name;
      }
    }
  }

  return 'Other';
}

/**
 * Calculate ATS compatibility score
 */
export function calculateATSScore(resumeText: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  // Check for contact information
  if (!/@/.test(resumeText)) {
    issues.push('Missing email address');
    score -= 15;
  }

  if (!/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(resumeText)) {
    issues.push('Missing phone number');
    score -= 10;
  }

  // Check for section headers
  const requiredSections = ['experience', 'education', 'skills'];
  for (const section of requiredSections) {
    if (!new RegExp(section, 'i').test(resumeText)) {
      issues.push(`Missing "${section}" section`);
      score -= 10;
    }
  }

  // Check resume length
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 200) {
    issues.push('Resume is too short (aim for 400-800 words)');
    score -= 15;
  } else if (wordCount > 1000) {
    issues.push('Resume is too long (aim for 400-800 words)');
    score -= 10;
  }

  // Check for action verbs
  const actionVerbs = ['achieved', 'improved', 'developed', 'led', 'managed', 'created'];
  const hasActionVerbs = actionVerbs.some(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(resumeText)
  );
  if (!hasActionVerbs) {
    issues.push('Use more action verbs (e.g., achieved, improved, led)');
    score -= 10;
  }

  // Check for quantifiable metrics
  const hasMetrics = /\d+%|\d+x|increased|decreased|reduced/i.test(resumeText);
  if (!hasMetrics) {
    issues.push('Add quantifiable achievements (e.g., "increased sales by 25%")');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
  };
}
