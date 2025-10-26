import { useState, useEffect, useRef } from "react";
import { useSSEChat } from "../hooks/useSSEChat";
import { UserBubble, AIBubbleStreaming, AIBubbleFinal, AIBubbleError } from "./MessageBubble";
import LoadingDots from "./LoadingDots";
import type { Message } from "../types";
import { validateAndNotify } from "../utils/validateAndNotify";
 
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const { streaming, result, start } = useSSEChat();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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

    if (!validateAndNotify(trimmed)) {
      setInput("")
      return;
    }

    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    // append placeholder assistant streaming message
    setMessages((m) => [...m, { role: "assistant", text: "__STREAMING__" }]);

    start(trimmed).catch((e) => {
      console.error(e);
      setMessages((m) => {
        const cleaned = m.filter((x) => x.text !== "__STREAMING__");
        return [...cleaned, { role: "assistant", text: "Error streaming response.", error: true }];
      });
    });
    setInput("");
    textareaRef.current?.focus();
  }

  return (
   <div className="max-w-4xl 2xl:max-w-[60vw] mx-auto my-4 flex flex-1 flex-col justify-center">
      <div className="flex flex-col gap-4 p-4 rounded-lg bg-slate-200 dark:bg-gray-800 min-h-[80vh]">
        <div ref={chatContainerRef} className="flex-1 overflow-auto flex flex-col gap-2 p-4 rounded-md border border-neutral-100 dark:border-gray-600 bg-white dark:bg-black/20 max-h-[67vh] 2xl:max-h-[75vh]">
          <div className="flex-1 flex flex-col gap-3 w-full">
            {messages.map((m, idx) => {
              if (m.role === "user") return <UserBubble key={idx} text={m.text} />;
              // assistant streaming:
              if (m.text === "__STREAMING__") {
                return (
                  <AIBubbleStreaming />
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

              if (m.error) {
                return (
                  <AIBubbleError text={m.text} />
                );
              }

              return null;
            })}
          </div>
        </div>
        
        <div className="">
          <div ref={newestMsgRef} />
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 94)}px`; //(≈5 lines)
              }}
              disabled={streaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();

                  // reset height after submit
                  if (textareaRef.current) {
                    textareaRef.current.style.height = "2.5rem";
                  }
                }
              }}
              placeholder="문장을 입력하세요..."
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none resize-none bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                send();

                // reset height after submit
                if (textareaRef.current) {
                  textareaRef.current.style.height = "2.5rem";
                }
              }}
              disabled={streaming || input.trim() === ""}
              className="px-4 py-2 rounded-md bg-slate-400 dark:bg-black/40 text-white disabled:opacity-50 hover:bg-black/70"
            >
              {streaming ? (
                <span className="flex items-center gap-2"><LoadingDots /></span>
              ) : (
                "전송"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
