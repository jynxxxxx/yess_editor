import React from "react";

export default function Tooltip({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span className="relative group">
      {children}
      {title ? (
        <span 
          className="w-[12vw] pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm bg-gray-800 dark:bg-black text-white px-2 py-1 rounded-md whitespace-pre-wrap z-50"
          style={{ userSelect: "none" }}
        >
          {title}
        </span>
      ) : null}
    </span>
  );
}
