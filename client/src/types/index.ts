export type Correction = {
  original: string;
  corrected: string;
  reason?: string;
  start: number;
  end: number;
};

export type AssistantResult = {
  correctedText: string;
  corrections: Correction[];
};

export type Message = (
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; result?: AssistantResult }
);