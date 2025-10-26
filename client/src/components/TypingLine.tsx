import React, { useEffect, useState } from "react";
import Tooltip from "../components/Tooltip";

interface TypingLineProps {
  chars: string[];
  highlights: (string | null)[];
  isOrig: boolean;
  speed?: number;
  onComplete?: () => void;
}

export function TypingLine({ chars, highlights, isOrig, speed = 30, onComplete }: TypingLineProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < chars.length) {
      const timeout = setTimeout(() => setVisibleCount(visibleCount + 1), speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [visibleCount, chars.length, speed, onComplete]);

  return (
    <>
      {chars.slice(0, visibleCount).map((char, i) => {
        const highlight = highlights[i];
        if (highlight) {
          return (
            <Tooltip key={i} title={highlight}>
              <span
                className={`${
                  isOrig
                    ? "bg-red-400 text-white dark:bg-red-700"
                    : "bg-green-600 text-white dark:bg-green-700"
                }`}
                style={{ userSelect: "text" }}
              >
                {char}
              </span>
            </Tooltip>
          );
        } else {
          return (
            <span key={i} style={{ userSelect: "text" }}>
              {char}
            </span>
          );
        }
      })}
    </>
  );
}