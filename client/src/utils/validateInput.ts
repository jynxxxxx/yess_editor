export function validateInput(
  text: string
): { valid: boolean; reason?: string; message?: string } {
  if (!text) return { valid: false, reason: "empty", message: "입력이 비어 있습니다." };

  const t = text.trim();

  if (t.length < 5) return { valid: false, reason: "too_short", message: "입력이 너무 짧습니다." };
  if (t.length > 5000) return { valid: false, reason: "too_long", message: "입력이 너무 깁니다." };

  const repeated = /(.)\1{5,}|(\b\w+\b)(?:\s+\2){2,}/;
  if (repeated.test(t)) return { valid: false, reason: "repetitive_text", message: "같은 문자가 반복되어 있습니다." };

  const symbolRatio = (t.match(/[^가-힣a-zA-Z0-9\s.,!?'"()]/g) || []).length / t.length;
  if (symbolRatio > 0.3) return { valid: false, reason: "nonlinguistic_content", message: "문장에 알파벳/한글 외 문자가 많습니다." };

  const uniqueChars = new Set(t);
  const diversity = uniqueChars.size / t.length;
  if (diversity < 0.15) return { valid: false, reason: "low_entropy", message: "문자의 다양성이 낮습니다." };

  if (!t.includes(" ") && t.length > 15) return { valid: false, reason: "no_spaces_long_text", message: "공백 없이 긴 문장입니다." };

  const newlines = (t.match(/\n/g) || []).length;
  if (newlines > 5 && newlines / t.length > 0.05) return { valid: false, reason: "too_many_linebreaks", message: "줄바꿈이 너무 많습니다." };

  if (t.split(/\s+/).some(w => w.length > 50)) return { valid: false, reason: "long_word", message: "너무 긴 단어가 포함되어 있습니다." };

  if (/(.)\1{5,}/.test(t.replace(/[\w\s]/g, ""))) return { valid: false, reason: "repeated_punctuation", message: "문장부호가 반복되어 있습니다." };

  if (/^[^a-zA-Z가-힣]+$/.test(t)) return { valid: false, reason: "nonlinguistic_only", message: "한글/영문이 포함되어 있지 않습니다." };

  if (/^\s+$/.test(t)) return { valid: false, reason: "whitespace_only", message: "공백만 입력되었습니다." };

  const lines = t.split("\n").map(l => l.trim()).filter(Boolean);
  const repeatedLines = lines.filter((v, i, a) => a.indexOf(v) !== i);
  if (lines.length > 1 && repeatedLines.length / lines.length > 0.5) return { valid: false, reason: "repeated_lines", message: "같은 문장이 반복되어 있습니다." };

  if (/^<[^>]+>$/.test(t)) return { valid: false, reason: "html_only", message: "HTML 태그만 포함되어 있습니다." };

  return { valid: true };
}
