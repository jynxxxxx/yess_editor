import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000); // reset after 3 seconds
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={copy}
      className="text-xs underline text-neutral-500 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white/50 disabled:text-neutral-900 disabled:no-underline dark:disabled:text-white/50"
      disabled={copied}
    >
      {copied ? "복사 완료!" : "수정 내용 복사"}
    </button>
  );
}

