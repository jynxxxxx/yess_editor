import type { AssistantResult } from "../types";
import { diffChars } from "diff";
import Tooltip from "./Tooltip";
import { UserIcon, AIIcon } from "./Icons";

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="self-end max-w-[80%] flex gap-2 ">
      <div className="inline-block bg-slate-200 text-gray-900 dark:bg-slate-700 dark:text-white px-4 py-2 rounded-2xl shadow-sm animate-fade-in">
        {text}
      </div>
      <div className="self-end">
        <UserIcon />
      </div>
    </div>
  );
}

export function AIBubbleStreaming({ text }: { text: string  | React.ReactNode }) {
  return (
    <div className="self-start max-w-[80%]">
      <div className="inline-block bg-neutral-100 text-neutral-900 dark:bg-gray-700 dark:text-white px-4 py-2 rounded-2xl shadow-sm animate-fade-in">
        <span>{text}</span>
      </div>
    </div>
  );
}

export function AIBubbleFinal({
  userOriginal,
  result
}: {
  userOriginal: string;
  result: AssistantResult;
}) {
   /* -------------------------------------------------
   * Build two arrays of React nodes:
   * origChars  – characters of the original sentence
   * fixedChars – characters of the corrected sentence
   * ------------------------------------------------- */

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
      origIdx += part.count || 0;
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

  const renderLine = (chars: string[], highlights: (string | null)[], isOrig: boolean) => {
    const elements: React.ReactNode[] = [];
    let buffer = "";
    let currentHighlight: string | null = null;

    const pushBuffer = () => {
      if (!buffer) return;
      if (currentHighlight) {
        elements.push(
          <Tooltip key={elements.length} title={currentHighlight}>
            <span 
              className={`px-0.5 ${
                isOrig
                  ? "bg-red-400 text-white dark:bg-red-700"
                  : "bg-green-600 text-white dark:bg-green-700"
              }`}
              style={{ userSelect: "text" }}
            >
              {buffer}
            </span>
          </Tooltip>
        );
      } else {
        elements.push(
          <span key={elements.length} style={{ userSelect: "text" }}>
            {buffer}
          </span>
        );
      }
      buffer = "";
    };

    for (let i = 0; i < chars.length; i++) {
      if (highlights[i] === currentHighlight) {
        buffer += chars[i];
      } else {
        pushBuffer();
        currentHighlight = highlights[i];
        buffer += chars[i];
      }
    }
    pushBuffer();

    return elements;
  };

  const origLine = renderLine(origChars, origHighlights, true);
  const fixedLine = renderLine(fixedChars, fixedHighlights, false);

  return (
    <div className="self-start max-w-[90%] flex gap-2">
      <div className="self-end">
        <AIIcon />
      </div>
      <div className="bg-neutral-100 dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-sm animate-fade-in space-y-1">
        <div className="bg-red-200 text-neutral-900 dark:bg-red-400/80 dark:text-white  px-2 py-1 rounded-md whitespace-pre-wrap break-words">
          <span className="font-bold mr-1">-</span> {origLine}
        </div>
        <div className="bg-green-200 text-neutral-900 dark:bg-green-400/80 dark:text-white px-2 py-1 rounded-md whitespace-pre-wrap break-words">
          <span className="font-bold mr-1">+</span> {fixedLine}
        </div>
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-300 flex gap-2">
          <CopyButton text={result.correctedText} />
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    // small UX: show toast in production — omitted for brevity
  };
  return (
    <button onClick={copy} className="text-xs underline text-neutral-500 dark:text-white/70">
      Copy corrected text
    </button>
  );
}
