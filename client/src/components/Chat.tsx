import { useState, useEffect, useRef } from "react";
import { useSSEChat } from "../hooks/useSSEChat";
import { UserBubble, AIBubbleStreaming, AIBubbleFinal } from "./MessageBubble";
import LoadingDots from "./LoadingDots";
import type { Message } from "../types";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { streaming, currentTokens, result, start } = useSSEChat();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const newestMsgRef = useRef<HTMLDivElement | null>(null);

  // when result arrives, append assistant final and possibly show highlighted
  useEffect(() => {
    // When a new result comes in, replace the last streaming placeholder
    if (result) {
      setMessages((msgs) => {
        const cleaned = msgs.filter(
          (m) => !(m.role === "assistant" && !m.result)
        );
        return [
          ...cleaned,
          {
            role: "assistant",
            text: result.correctedText,
            result
          }
        ];
      });
    }
  }, [result]);

  
  useEffect(() => {
    if (chatContainerRef.current && newestMsgRef.current) {
      chatContainerRef.current.scrollTo({
        top: newestMsgRef.current.offsetTop,
        behavior: "smooth",
      });
    }
  }, [messages, result]);

  function send() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    // append placeholder assistant streaming message
    setMessages((m) => [...m, { role: "assistant", text: "__STREAMING__" }]);

    start(trimmed).catch((e) => {
      console.error(e);
      console.log(e.status)
      // replace streaming placeholder with an error message
      setMessages((m) => {
        const cleaned = m.filter((x) => x.text !== "__STREAMING__");
        return [...cleaned, { role: "assistant", text: "Error streaming response." }];
      });
    });
    setInput("");
    inputRef.current?.focus();
    console.log("Message sent:", messages);
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-900">
      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center gap-4">
        <header className="flex justify-between py-4">
          <h1 className="text-lg font-semibold">Yess — Korean Spell Correction</h1>
          <div className="text-sm text-neutral-500">Model: gpt-4.1-mini</div>
        </header>

        <main ref={chatContainerRef} className="w-9/10 mx-auto flex-1 overflow-auto flex flex-col gap-3 p-4 rounded-md border border-neutral-100 bg-white max-h-[70vh]">
          <div className="flex flex-col gap-3 w-full">
            {messages.map((m, idx) => {
              if (m.role === "user") return <UserBubble key={idx} text={m.text} />;
              // assistant:
              // Assistant streaming placeholder
              if (m.text === "__STREAMING__") {
                return (
                  <AIBubbleStreaming
                    key={idx}
                    text={currentTokens || <LoadingDots />}
                  />
                );
              }

              // Assistant final message
              if (m.result) {
                // find the user message that corresponds to this AI message
                const userMsg =
                  [...messages]
                    .slice(0, idx)
                    .reverse()
                    .find((x) => x.role === "user")?.text || "";
                return (
                  <AIBubbleFinal
                    key={idx}
                    userOriginal={userMsg}
                    result={m.result}
                  />
                );
              }

              return null;
            })}
          </div>
        </main>
        
        <footer className="py-4 w-9/10 mx-auto">
          <div ref={newestMsgRef} />
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type your Korean text here..."
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none"
            />
            <button
              onClick={send}
              disabled={streaming || input.trim() === ""}
              className="px-4 py-2 rounded-md bg-slate-800 text-white disabled:opacity-50"
            >
              {streaming ? (
                <span className="flex items-center gap-2"><LoadingDots /></span>
              ) : (
                "Send"
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
