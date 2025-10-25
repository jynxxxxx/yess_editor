import { indexCorrections } from "../utils/correctionIndexer.js";

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
// if (!OPENAI_API_KEY) {
//   console.warn("OPENAI_API_KEY not set in environment");
// }

type Callbacks = {
  onToken: (chunk: string) => void;
  onResult: (parsed: any) => void;
  onError: (msg: string) => void;
};

export async function streamOpenAIResponse(
  userMessage: string,
  callbacks: Callbacks
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
  console.log("[streamOpenAIResponse] start");
  console.log("[streamOpenAIResponse] userMessage:", userMessage);
  console.log("[DEBUG] OPENAI_API_KEY exists:", OPENAI_API_KEY);


  const prompt = `You are a professional Korean language proofreader.
    Given a user's text, identify spelling and grammar mistakes.
    Respond in JSON format as follows:
    {
      "correctedText": "...",
      "corrections": [
        {
          "original": "mistaken part",
          "corrected": "corrected part",
          "reason": "why it was corrected"
        }
      ]
    }`;

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

  console.log("[streamOpenAIResponse] Sending request to OpenAI...");
  const isBrowser = typeof globalThis !== "undefined" && typeof (globalThis as any).window !== "undefined";
  console.log("Runtime environment:", isBrowser ? "browser" : "node");

  // create fetch request
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  console.log("Auth header:", "Bearer " + OPENAI_API_KEY.slice(0, 10) + "...");
  console.log("[streamOpenAIResponse] Response status:", res.status);

  if (!res.ok || !res.body) {
    const txt = await res.text();
    console.error("[streamOpenAIResponse] Error body:", txt);
    callbacks.onError(`OpenAI error: ${res.status} ${txt}`);
    return;
  }

  console.log("[streamOpenAIResponse] Streaming response started...");
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
}
