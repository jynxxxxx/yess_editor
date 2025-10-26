import { useMemo, useState } from "react";
import type { AssistantResult } from "../types";
import { UserIcon, AIIcon } from "./Icons";
import CopyButton from "./CopyButton";
import computeHighlights from "../utils/computeHighlights";
import LoadingDots from "./LoadingDots";
import { TypingLine } from "./TypingLine";

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
 
export function AIBubbleStreaming()  {
  return (
    <div className="self-start max-w-[80%] flex gap-2">
      <div className="self-end">
        <AIIcon />
      </div>
      <div className="inline-block bg-neutral-100 dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm animate-fade-in whitespace-pre-wrap break-words space-y-1">
        <LoadingDots />
      </div>
    </div>
  );
}

export function AIBubbleError({ text }: { text: string }) {
  return (
    <div className="self-start max-w-[80%] flex gap-2">
      <div className="self-end">
        <AIIcon />
      </div>
      <div className="inline-block bg-neutral-100 dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm animate-fade-in whitespace-pre-wrap break-words space-y-1">
        {text}
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
    const { origChars, fixedChars, origHighlights, fixedHighlights } = useMemo(() => {
    try {
      return computeHighlights(userOriginal, result);
    } catch (err) {
      // Defensive fallback so UI doesn't break if computeHighlights throws.
      console.error("computeHighlights failed:", err);
      return {
        origChars: [],
        fixedChars: [],
        origHighlights: [],
        fixedHighlights: [],
      } as any;
    }
  }, [userOriginal, (result as any).correctedText ?? (result as any).text ?? result]);
  const [showFixed, setShowFixed] = useState(false);

  return (
    <div className="self-start max-w-[90%] flex gap-2">
      <div className="self-end">
        <AIIcon />
      </div>
      <div className="bg-neutral-100 dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-sm animate-fade-in space-y-1">
        <div className="bg-red-200 text-neutral-900 dark:bg-red-400/80 dark:text-white px-2 py-1 rounded-md whitespace-pre-wrap break-words">
          <span className="font-bold mr-1">-</span> 
          <TypingLine
            chars={origChars}
            highlights={origHighlights}
            isOrig={true}
            speed={30}
            onComplete={() => setShowFixed(true)}
          />
        </div>
        <div className="whitespace-pre-wrap break-words">
          {showFixed && (
          <div className="bg-green-200 text-neutral-900 dark:bg-green-400/80 dark:text-white px-2 py-1 rounded-md whitespace-pre-wrap break-words">
            <span className="font-bold mr-1">+</span>
            <TypingLine chars={fixedChars} highlights={fixedHighlights} isOrig={false} speed={30} />
          </div>
        )}
        </div>
        <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-300 flex gap-2">
          <CopyButton text={result.correctedText} />
        </div>
      </div>
    </div>
  );
}

