import Tooltip from "../components/Tooltip";

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

export default renderLine;