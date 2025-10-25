import type { AssistantResult } from "../types";
import { UserIcon, AIIcon } from "./Icons";
import CopyButton from "./CopyButton";
import renderLine from "../utils/renderLine";
import computeHighlights from "../utils/computeHighlights";

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
  const { origChars, fixedChars, origHighlights, fixedHighlights } = computeHighlights(
    userOriginal,
    result
  );

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

