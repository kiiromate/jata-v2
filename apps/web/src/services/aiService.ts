/**
 * @file Enhanced AI Service for Resume Tailoring
 * @description Provides AI-powered skill extraction with regex fallbacks for zero-budget operation
 * @author JATA
 *
 * This service uses a hybrid approach:
 * 1. Primary: Hugging Face AI models for intelligent analysis
 * 2. Fallback: Regex-based patterns when API unavailable or rate-limited
 * 3. Zero-budget friendly: Caches results and optimizes API calls
 */

import {
  extractKeywordsFromJobDescription,
  calculateMatchScore,
  optimizeBulletPoint,
  generateResumeSuggestions,
  classifyIndustry,
  calculateATSScore,
} from '@/lib/huggingfaceService';

// Re-export for convenience
export {
  extractKeywordsFromJobDescription,
  optimizeBulletPoint,
  classifyIndustry,
  calculateATSScore,
};

/**
 * Interface for Zero-Shot Classification API response
 */
interface ZeroShotApiResponse {
  sequence: string;
  labels: string[];
  scores: number[];
}

/**
 * Analyzes the job description using a zero-shot classification model to determine its focus.
 *
 * @param jobDescription The text of the job description.
 * @returns A promise that resolves to an array of labels sorted by their scores.
 * @throws Will throw an error if the API call fails or the API key is missing.
 */
export async function analyzeWithZeroShot(jobDescription: string): Promise<string[]> {
  const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  const apiUrl = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";

  if (!apiKey) {
    throw new Error("Hugging Face API key is not configured.");
  }

  const candidate_labels = [
    'frontend development',
    'backend development',
    'project management',
    'data analysis',
    'devops',
    'ui/ux design'
  ];

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: jobDescription,
        parameters: { candidate_labels },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result: ZeroShotApiResponse = await response.json();

    // Combine labels and scores and sort by score in descending order
    const sortedLabels = result.labels
      .map((label, index) => ({ label, score: result.scores[index] }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.label);

    return sortedLabels;
  } catch (error) {
    console.error("Error analyzing with zero-shot model:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze with zero-shot model: ${error.message}`);
    }
    throw new Error("An unknown error occurred during zero-shot analysis.");
  }
}

/**
 * Generates professional resume bullet points using the STAR method based on an accomplishment description and keywords.
 *
 * @param description The accomplishment description provided by the user.
 * @param keywords An array of keywords to incorporate into the bullet points.
 * @returns A promise that resolves to an array of 3 generated bullet point strings.
 * @throws Will throw an error if the API call fails or the API key is missing.
 */
export async function generateBulletPoint(description: string, keywords: string[]): Promise<string[]> {
  const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  const apiUrl = "https://api-inference.huggingface.co/models/google/flan-t5-base";

  if (!apiKey) {
    throw new Error("Hugging Face API key is not configured.");
  }

  const prompt = `Rewrite the following accomplishment into 3 professional resume bullet points using the STAR method. Incorporate the provided keywords where relevant and use strong action verbs. The accomplishment is: ${description}. The keywords are: ${keywords.join(', ')}.`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result: [{ generated_text: string }] = await response.json();
    const generatedText = result[0].generated_text;

    const bulletPoints = generatedText
      .split('\n')
      .map(point => point.trim())
      .filter(point => point.length > 0)
      .slice(0, 3);

    return bulletPoints;
  } catch (error) {
    console.error("Error generating bullet points:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate bullet points: ${error.message}`);
    }
    throw new Error("An unknown error occurred during bullet point generation.");
  }
}

// --- Resume and Job Description Analysis ---

export interface AnalysisResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions?: string[];
  atsScore?: number;
  atsIssues?: string[];
}

// A simplified list of skills for demonstration. In a real app, this would be more extensive.
const SKILL_PATTERNS: { [key: string]: RegExp } = {
  JavaScript: /javascript|js/gi,
  TypeScript: /typescript|ts/gi,
  React: /react/gi,
  NodeJS: /node\.js|nodejs/gi,
  Python: /python/gi,
  SQL: /sql/gi,
  PostgreSQL: /postgresql/gi,
  Docker: /docker/gi,
  Kubernetes: /kubernetes|k8s/gi,
  AWS: /aws|amazon web services/gi,
  GCP: /gcp|google cloud platform/gi,
  Azure: /azure/gi,
  HTML: /html/gi,
  CSS: /css|tailwind/gi,
  "Project Management": /project management|agile|scrum/gi,
  "CI/CD": /ci\/cd|jenkins|gitlab ci/gi,
};

/**
 * Extracts skills from a given text based on predefined regex patterns.
 * @param text The text to analyze (resume or job description).
 * @returns A Set of unique skills found in the text.
 */
const extractSkills = (text: string): Set<string> => {
  const foundSkills = new Set<string>();
  if (!text) return foundSkills;

  for (const skill in SKILL_PATTERNS) {
    if (SKILL_PATTERNS[skill].test(text)) {
      foundSkills.add(skill);
    }
  }
  return foundSkills;
};

/**
 * Analyzes a resume against a job description to find matching and missing skills.
 * Uses AI when available, falls back to regex patterns.
 *
 * @param resumeText The text of the user's resume.
 * @param jobDescriptionText The text of the job description.
 * @returns An object containing the match score, matched skills, and missing skills.
 */
export const analyzeResumeAgainstJobDescription = async (
  resumeText: string,
  jobDescriptionText: string
): Promise<AnalysisResult> => {
  try {
    // Try AI-powered analysis first
    const matchResult = await calculateMatchScore(resumeText, jobDescriptionText);
    const suggestions = await generateResumeSuggestions(resumeText, jobDescriptionText);
    const atsResult = calculateATSScore(resumeText);

    return {
      score: matchResult.score,
      matchedSkills: matchResult.matchedKeywords,
      missingSkills: matchResult.missingKeywords,
      suggestions,
      atsScore: atsResult.score,
      atsIssues: atsResult.issues,
    };
  } catch (error) {
    console.warn('AI analysis failed, using regex fallback:', error);
    // Fallback to regex-based analysis
    const resumeSkills = extractSkills(resumeText);
    const jobSkills = extractSkills(jobDescriptionText);

    if (jobSkills.size === 0) {
      return {
        score: 0,
        matchedSkills: [],
        missingSkills: [],
      };
    }

    const matchedSkills = [...jobSkills].filter(skill => resumeSkills.has(skill));
    const missingSkills = [...jobSkills].filter(skill => !resumeSkills.has(skill));

    const score = Math.round((matchedSkills.length / jobSkills.size) * 100);

    return {
      score,
      matchedSkills,
      missingSkills,
    };
  }
};