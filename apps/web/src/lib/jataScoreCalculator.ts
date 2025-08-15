interface Analyses {
  zeroShotResults: string[];
  resumeKeywords: string[];
  jobKeywords: string[];
  atsWarnings: { level: string }[];
}

interface JataScore {
  totalScore: number;
  breakdown: {
    contentScore: number;
    keywordScore: number;
    atsScore: number;
  };
}

export function calculateJataScore(analyses: Analyses): JataScore {
  let contentScore = 0;
  let keywordScore = 0;
  let atsScore = 20;

  const topZeroShotResults = analyses.zeroShotResults.slice(0, 3);
  if (topZeroShotResults[0] && analyses.resumeKeywords.includes(topZeroShotResults[0])) {
    contentScore += 25;
  }
  if (topZeroShotResults[1] && analyses.resumeKeywords.includes(topZeroShotResults[1])) {
    contentScore += 15;
  }
  if (topZeroShotResults[2] && analyses.resumeKeywords.includes(topZeroShotResults[2])) {
    contentScore += 10;
  }

  if (analyses.jobKeywords.length > 0) {
    const matchedKeywords = analyses.jobKeywords.filter(jobKeyword =>
      analyses.resumeKeywords.includes(jobKeyword)
    );
    const percentage = (matchedKeywords.length / analyses.jobKeywords.length);
    keywordScore = percentage * 30;
  }

  analyses.atsWarnings.forEach(warning => {
    if (warning.level === 'warn') {
      atsScore -= 5;
    }
  });
  atsScore = Math.max(0, atsScore);

  const totalScore = contentScore + keywordScore + atsScore;

  return {
    totalScore,
    breakdown: {
      contentScore,
      keywordScore,
      atsScore,
    },
  };
}