## Yess — Korean Spell Correction (Chat)

A production-quality starter for an AI-based spell-correction chat app.

---

## Table of Contents

1. [Features](#features)  
2. [Quick start](#quick-start)  
3. [How it works](#how-it-works)  
4. [Notes and Further Improvements](#notes-and-further-improvements)  
5. [Example Interaction](#example-interaction)  
6. [Security & Secrets](#security-&-secrets)  

---
## Features

- Real-time streaming AI responses (SSE)
- Spell correction highlighting: original (red) → corrected (green)
- Hover tooltips explaining corrections
- Send/Disable input while streaming
- Copy corrected text button
- Clean client/server TypeScript code

## Quick start
Clone repo

### 1. Server (Node.js)
Create .env.local file
```
cd server
cp .env.local.example .env.local
EDIT .env.local and set OPENAI_API_KEY and PORT
```

Install dependencies:
```
npm install
```

### 2. Client (React)
Install dependencies:
```
cd client
npm install
```

### 3. Run
Root uses concurrently to run both

In root folder
```
npm run start
```


Open [http://localhost:5173](http://localhost:5173)

## How it works

- Client posts to /api/chat. Server opens SSE and calls OpenAI chat completions with stream: true.
- Server forwards token chunks to the client as token SSE events and accumulates the assistant content.
- At end of stream, server parses assistant JSON, enriches corrections with indices into the user's original text, and sends result SSE event with full parsed structure.
- Client replaces streaming placeholder with highlighted message using the corrections.


## Notes and Further Improvements

- The indexer uses naive substring matching; for production consider returning indices from the model, or use a diff library to compute spans robustly.
- Add authentication and server-side rate limiting for production.
- Improve streaming parsing resilience (partial JSON tokens in stream).
- Add unit + integration tests for server streaming and SSE handling.
- Add language auto-detection: call a language detection model or use heuristics before sending to the proofreader system prompt.
- Batch and flush token updates on the client (already implemented) to prevent UI lag.  
- Handle **very long outputs** gracefully — consider partial streaming or truncation.  
- Add **retry / resume UI** for interrupted or failed streams.  

## Example Interaction

- User input: "저는 어제 학교에 가써요."
- Server (assistant JSON):
```
{
    "correctedText": "저는 어제 학교에 갔어요.",
    "corrections": [
        {
            "original": "가써요",
            "corrected": "갔어요",
            "reason": "‘가써요’는 과거 시제 ‘갔어요’로 수정해야 올바른 표현입니다."
        }
    ]
}
```
- Client shows streaming text while model streams. Final view: 저는 어제 학교에 갔어요

## Security & Secrets

- Do not commit server/.env.local with your API key.
- Rotate keys if committed inadvertently.


## Final Notes
This codebase is production-ready as a starter: it's clean, typed, and built to be extended. 

The two most fragile parts you will encounter in production are\
&nbsp;&nbsp;&nbsp;&nbsp;(1) streaming parsing from OpenAI and\
&nbsp;&nbsp;&nbsp;&nbsp;(2) finding indices for corrections. 

Both are correctable:\
&nbsp;&nbsp;&nbsp;&nbsp;for (1) add robust SSE/token parsing with retries;\
&nbsp;&nbsp;&nbsp;&nbsp;for (2) have the model include start & end indices (or character offsets) in its JSON output or use a deterministic diff algorithm with better heuristics.