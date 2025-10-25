type RawCorrection = {
  original: string;
  corrected: string;
  reason?: string;
};

export function indexCorrections(userText: string, parsed: any) {
  // parsed expected shape: { correctedText: string, corrections: [ {original, corrected, reason} ] }
  const result: any = {
    correctedText: parsed.correctedText ?? parsed,
    corrections: []
  };

  const corrections: RawCorrection[] = Array.isArray(parsed.corrections)
    ? parsed.corrections
    : [];

  let searchStart = 0;
  for (const c of corrections) {
    const original = c.original;
    let idx = userText.indexOf(original, searchStart);
    if (idx === -1) {
      // fallback: try anywhere
      idx = userText.indexOf(original);
    }
    if (idx === -1) {
      // If still not found, push without indices and continue
      result.corrections.push({
        ...c,
        start: -1,
        end: -1
      });
    } else {
      result.corrections.push({
        ...c,
        start: idx,
        end: idx + original.length
      });
      searchStart = idx + original.length;
    }
  }

  return result;
}
