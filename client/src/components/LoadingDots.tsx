export default function LoadingDots({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`} aria-hidden>
      <span className="animate-bounce mr-0.5">.</span>
      <span className="animate-bounce mr-0.5" style={{ animationDelay: "0.1s" }}>
        .
      </span>
      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
        .
      </span>
      <style>
        {`.animate-bounce { animation: y 1s infinite; } @keyframes y { 0%{transform:translateY(0)} 50%{transform:translateY(-6px)} 100%{transform:translateY(0)} }`}
      </style>
    </span>
  );
}
