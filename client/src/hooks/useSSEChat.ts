import { useState, useRef, useEffect } from "react";
import type { AssistantResult } from "../types";

export function useSSEChat() {
  const [streaming, setStreaming] = useState(false);
  const [currentTokens, setCurrentTokens] = useState<string>("");
  const [result, setResult] = useState<AssistantResult | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);

  async function start(message: string) {
    // create an EventSource-like connection by making a POST that creates SSE
    setStreaming(true);
    setCurrentTokens("");
    setResult(null);

    // Fetch a text/event-stream. We will use EventSource on a provided URL that expects a POST.
    // EventSource doesn't support POST by default, so we'll use fetch + streaming reader on the client side.
    // Simpler approach: server expects POST and will return event-stream. We'll use fetch and read
    // the stream manually here using ReadableStream.
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    if (!res.ok || !res.body) {
      const txt = await res.text();
      setStreaming(false);
      throw new Error(`Server error: ${res.status} - ${txt}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      if (doneReading) {
        done = true;
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log(`[STAGE 1: CHUNK] Received ${chunk.length} raw characters.`);
      buffer += chunk;

      // SSE parser: split by double newline
      let pos;
      while ((pos = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, pos);
        buffer = buffer.slice(pos + 2);
        console.log(`[STAGE 2: RAW EVENT] Processing buffer:\n---${rawEvent}---`);
        // parse event: lines "event: name" and "data: {...}"
        const lines = rawEvent.split(/\r?\n/);
        let eventName = "message";
        let dataLines: string[] = [];
        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventName = line.replace(/^event:\s*/, "").trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.replace(/^data:\s*/, ""));
          }
        }
        const dataStr = dataLines.join("\n");
        try {
          const parsed = JSON.parse(dataStr);
          if (eventName === "token") {
            console.log(`[STAGE 3: TOKEN] Appending token: "${parsed.chunk}"`);
            setCurrentTokens((t) => t + parsed.chunk);
          } else if (eventName === "result") {
            console.log(`[STAGE 3: RESULT] Final result received:`, parsed);
            setResult(parsed);
          } else if (eventName === "error") {
            console.error("Server error:", parsed);
          } else if (eventName === "done") {
            // done
          }
        } catch (e) {
          // sometimes data is plain text
          if (eventName === "token") {
            console.log(`[STAGE 3: TOKEN] Appending plain text token: "${dataStr}"`);
            setCurrentTokens((t) => t + dataStr);
          }
        }
      }
    }
    console.log("[END] Streaming finished, setting state to false.");
    setStreaming(false);
  }

  return {
    streaming,
    currentTokens,
    result,
    start
  };
}
