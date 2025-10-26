import { useState, useRef, useEffect } from "react";
import type { AssistantResult } from "../types";

export function useSSEChat() {
  const [streaming, setStreaming] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [result, setResult] = useState<AssistantResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  async function start(message: string) {
    // create an EventSource-like connection by making a POST that creates SSE
    setStreaming(true);
    setCurrentText("");
    setResult(null);
    abortRef.current = new AbortController();

    // Fetch a text/event-stream. We will use EventSource on a provided URL that expects a POST.
    // EventSource doesn't support POST by default, so we'll use fetch + streaming reader on the client side.
    // Simpler approach: server expects POST and will return event-stream. We'll use fetch and read
    // the stream manually here using ReadableStream.
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const txt = await res.text();
        setStreaming(false);
        throw new Error(`Server error: ${res.status} - ${txt}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        // reset timeout on each valid data chunk (keep-alive)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            console.error("SSE timeout: No data received for too long");
            if (abortRef.current) abortRef.current.abort();
            setStreaming(false);
          }, 60000);
        }

        buffer += decoder.decode(value, { stream: true });

        // SSE parser: split by double newline
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          let eventName = "message";
          let data = "";

          for (const line of rawEvent.split(/\r?\n/)) {
            if (line.startsWith("event:")) {
              eventName = line.replace(/^event:\s*/, "").trim();
            } else if (line.startsWith("data:")) {
              data += line.replace(/^data:\s*/, "");
            }
          }

          if (!data) continue;

          try {
            const parsed = JSON.parse(data);

            switch (eventName) {
              case "token":
                // ✅ Only append text tokens, skip structured JSON artifacts
                if (typeof parsed.chunk === "string") {
                  setCurrentText((t) => t + parsed.chunk);
                }
                break;

              case "result":
                setResult(parsed);
                break;

              case "error":
                console.error("Server error event:", parsed);
                break;

              case "done":
                break;

              default:
                // fallback for unrecognized events
                if (typeof parsed === "string") {
                  setCurrentText((t) => t + parsed);
                }
                break;
            }
          } catch {
            // Fallback for plain text chunks
            if (eventName === "token" && data.trim()) {
              setCurrentText((t) => t + data);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("SSE Chat error:", err);
      }
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setStreaming(false);
    }
  }

  function stop() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStreaming(false);
  }

  return {
    streaming,
    currentText,
    result,
    start,
    stop,
  };
}