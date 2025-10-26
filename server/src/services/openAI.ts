import { indexCorrections } from "../utils/correctionIndexer.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

type Callbacks = {
  onToken: (chunk: string) => void;
  onResult: (parsed: any) => void;
  onError: (msg: string) => void;
};

export async function streamOpenAIResponse(
  userMessage: string,
  callbacks: Callbacks,
  timeoutMs: number = 60000 
) {
  /**
   * Stream a response from OpenAI for proofreading a Korean text.
   * Sends partial tokens to the client as they arrive, then delivers
   * the final structured JSON with corrections.
  */
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
      throw new Error("Configuration Error: OpenAI API Key is missing.");
  }

  const prompt = `
    You are a world-class, highly rigorous Korean language proofreader and editor (한국어 교정 전문가).
    Your task is to identify and correct **every** spelling, grammar, spacing (띄어쓰기), punctuation, and stylistic error in the given text.
    Follow the strictest rules of **standard Korean (표준어)** and **formal business/academic writing** at all times.

    CRITICAL RULES:
    1. Each correction must contain **only the smallest exact text span** that changed — not the whole sentence.
      - Example: if "제안서을" → "제안서를", then only that word pair appears.
      - Example: if a missing period should be added after "안녕하세요", use:
        "original": "안녕하세요"
        "corrected": "안녕하세요."
    2. Do **NOT** include an entire sentence or paragraph inside "original" or "corrected" for punctuation or stylistic fixes.
    3. If multiple punctuation marks are missing, create **separate entries** for each.
    4. Never combine unrelated corrections into one block.
    5. Return **only valid JSON** — no commentary, no markdown, no surrounding text.

    REQUIREMENTS:
    - Detect and correct all issues (spelling, grammar, spacing, punctuation, and formal tone).
    - Do not modify text without an actual error.
    - The final "correctedText" must fully reflect all improvements.
    - The "reason" must **always** be written in Korean, clearly explaining the rule or reason.

    OUTPUT FORMAT (strictly follow this):

    {
      "correctedText": "최종 교정된 전체 문장",
      "corrections": [
        {
          "original": "잘못된 부분 (최소 단위만)",
          "corrected": "수정된 부분 (최소 단위만)",
          "reason": "수정 이유 (항상 한국어로 작성)"
        }
      ]
    }
  `;

  // Build request body
  const body = {
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0.0,
    stream: true
  };

  const abortController = new AbortController();

  // Timeout: auto-abort if streaming hangs
  let timeout = setTimeout(() => {
    console.error(`[streamOpenAIResponse] Aborting due to ${timeoutMs}ms timeout`);
    abortController.abort();
  }, timeoutMs);

  // create fetch request
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok || !res.body) {
      const txt = await res.text();
      console.error("[streamOpenAIResponse] Error body:", txt);
      callbacks.onError(`OpenAI error: ${res.status} ${txt}`);
      return;
    }

    // Stream reader
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let assistantText = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      if (doneReading) {
        done = true;
        break;
      }

      // 🕐 reset timeout each time we receive data
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.error(`[streamOpenAIResponse] No data for ${timeoutMs}ms – aborting`);
        abortController.abort();
      }, timeoutMs);

      const chunk = decoder.decode(value, { stream: true });
      assistantText += chunk;

      // Extract and deliver partial tokens to client immediately
      // OpenAI streams "delta" JSON objects like:
      //     data: {"choices":[{"delta":{"content":"corrected"}}]}
      // Then extract "content" fields using regex
      const possibleMatches = [...chunk.matchAll(/"content":\s*"((?:\\.|[^"\\])*)"/g)];
      for (const m of possibleMatches) {
        const raw = m[1];
        if (raw !== undefined) {
          try {
            const decoded = raw.replace(/\\"/g, '"').replace(/\\n/g, "\n");
            callbacks.onToken(decoded);
          } catch (e) {
            callbacks.onToken(raw);
          }
        }
      }
    }

    // --- done streaming ---
    clearTimeout(timeout);

    // After streaming is complete, combine all "content" matches across whole assistantText and join them.
    const allContentMatches = [...assistantText.matchAll(/"content":\s*"((?:\\.|[^"\\])*)"/g)];
    const joined = allContentMatches
      .map((m) => m[1])
      .filter((s): s is string => s !== undefined) // keep only defined
      .map((s) => s.replace(/\\"/g, '"').replace(/\\n/g, "\n"))
      .join("");

    // The assistant is instructed to output JSON; parse it
    let parsed;
    try {
      parsed = JSON.parse(joined);
    } catch (e) {
      // If JSON parse fails, try to extract JSON-like substring from joined
      const firstBrace = joined.indexOf("{");
      const lastBrace = joined.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const substring = joined.substring(firstBrace, lastBrace + 1);
        try {
          parsed = JSON.parse(substring);
        } catch (err) {
          callbacks.onError("Failed to parse JSON from assistant response.");
          callbacks.onResult({
            correctedText: joined,
            corrections: []
          });
          return;
        }
      } else {
        callbacks.onError("No JSON found in assistant response.");
        callbacks.onResult({
          correctedText: joined,
          corrections: []
        });
        return;
      }
    }

    // Enrich corrections with positions in the original userMessage
    const enriched = indexCorrections(userMessage, parsed);

    callbacks.onResult(enriched);
  } catch (err: any) {
    if (err.name === "AbortError") {
      callbacks.onError(`Stream aborted after ${timeoutMs}ms (timeout)`);
    } else {
      console.error("[streamOpenAIResponse] Error:", err);
      callbacks.onError(`Unexpected error: ${err.message || err}`);
    }
  } finally {
    clearTimeout(timeout);
  }

}
