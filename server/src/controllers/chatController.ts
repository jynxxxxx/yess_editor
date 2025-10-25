import type { Request, Response } from "express";
import { streamOpenAIResponse } from "../services/openAI.js";

export const chatController = async (req: Request, res: Response) => {
  console.log("chatController invoked");
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  console.log("chatController invoked, message:", message)

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    await streamOpenAIResponse(message, {
      onToken: (tokenChunk) => {
        // send incremental token as SSE event
        res.write(`event: token\n`);
        // JSON encode to avoid breaking SSE
        res.write(`data: ${JSON.stringify({ chunk: tokenChunk })}\n\n`);
      },
      onResult: (parsed) => {
        console.log(`[SSE OUT] Event: result, Data: ${JSON.stringify(parsed)}`);
        res.write(`event: result\n`);
        res.write(`data: ${JSON.stringify(parsed)}\n\n`);
      },
      onError: (errMsg) => {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      }
    });

    res.write(`event: done\n`);
    res.write(`data: {}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("chatController error:", err);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: err.message || String(err) })}\n\n`);
    res.end();
  }
};
