/**
 * @file Enhanced AI Service for Resume Tailoring
 * @description Provides robust, regex-based skill extraction and analysis for resume optimization.
 * @author JATA
 * 
 * This service uses a three-stage pipeline:
 * 1. Text Pre-processing: Cleans and standardizes input text
 * 2. Regex-Based Skill Extraction: Uses deterministic patterns to identify skills
 * 3. Post-processing and Filtering: Removes noise and irrelevant results
 */

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