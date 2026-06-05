const SAFETY_BOUNDARY = 'Human Review Required';
const CLAIMS_HEADING = 'Claims to Verify Before Sending';

export interface ParsedCoverLetter {
  body: string;
  claimsToVerify: string[];
}

/**
 * Splits AI-generated cover letter text into the sendable body and safety
 * review claims. Exporters use this to render claims in red at the bottom of
 * exported documents instead of leaving them embedded in the letter body.
 */
export function parseCoverLetterText(text: string): ParsedCoverLetter {
  const boundaryIdx = text.indexOf(SAFETY_BOUNDARY);
  if (boundaryIdx === -1) {
    return { body: text.trim(), claimsToVerify: [] };
  }

  const body = text.slice(0, boundaryIdx).trim();
  const safetyBlock = text.slice(boundaryIdx);
  const claimsIdx = safetyBlock.indexOf(CLAIMS_HEADING);

  if (claimsIdx === -1) {
    return { body, claimsToVerify: [] };
  }

  const afterHeading = safetyBlock.slice(claimsIdx + CLAIMS_HEADING.length);
  const nextSection = afterHeading.search(/\n\n[A-Z]/);
  const claimsBlock = nextSection === -1 ? afterHeading : afterHeading.slice(0, nextSection);

  const claims = claimsBlock
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  return { body, claimsToVerify: claims };
}
