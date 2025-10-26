import type { AssistantResult } from "../types";
import { diffChars } from "diff";

export default function computeHighlights(
  userOriginal: string,
  result: AssistantResult
) {
  const origChars = userOriginal.split("");
  const fixedChars = result.correctedText.split("");

  const origHighlights: (string | null)[] = Array(origChars.length).fill(null);
  const fixedHighlights: (string | null)[] = Array(fixedChars.length).fill(null);

  // Mark original mistakes
  result.corrections.forEach((c) => {
    for (let i = c.start; i < c.end && i < origHighlights.length; i++) {
      origHighlights[i] = c.reason || null;
    }
  });

  // Use diff to align original -> corrected
  const diffs = diffChars(userOriginal, result.correctedText);

  let origIdx = 0;
  let fixedIdx = 0;

  diffs.forEach((part) => {
    if (part.added) {
      // This text exists only in corrected string
      for (let i = 0; i < part.value.length; i++) {
        // If any correction affects this position, mark it
        result.corrections.forEach((c) => {
          const corrected = c.corrected;
          // If this added text matches the corrected part, highlight
          if (corrected.includes(part.value[i])) {
            fixedHighlights[fixedIdx] = c.reason || null;
          }
        });
        fixedIdx++;
      }
    } else if (part.removed) {
      // Removed text exists only in original string
      for (let i = 0; i < part.value.length; i++) {
      const highlight = result.corrections.find((c) =>
        c.original.includes(part.value[i])
      )?.reason || null;

      origHighlights[origIdx] = highlight;
      origIdx++;
    }
    } else {
      // Unchanged text
      for (let i = 0; i < part.value.length; i++) {
        // Carry over highlights from original positions to fixed positions if needed
        if (origHighlights[origIdx]) {
          fixedHighlights[fixedIdx] = origHighlights[origIdx];
        }
        origIdx++;
        fixedIdx++;
      }
    }
  });

  return { origChars, fixedChars, origHighlights, fixedHighlights };
}
