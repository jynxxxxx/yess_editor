import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ children, title }: { children: React.ReactNode; title?: string }) {
  const [visible, setVisible] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      setCoords({ top: rect.top, left: rect.left });
    }
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <>
      <span
        ref={spanRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative"
      >
        {children}
      </span>
      {title && visible &&
        createPortal(
          <div
            className="max-w-[20vw] text-sm bg-gray-700 dark:bg-gray-900 text-white p-3 rounded-md whitespace-pre-wrap z-50 shadow-lg"
            style={{
              position: "fixed",
              top: coords.top - 10, // above the element with margin
              left: coords.left,
              transform: "translateY(-100%)", // ensures it is fully above
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <div className="mb-1 font-bold">이유</div>
            <ul className="list-disc pl-4 ml-1">
              <li className="text-sm">{title}</li>
            </ul>
          </div>,
          document.body
        )
      }
    </>
  );
}
