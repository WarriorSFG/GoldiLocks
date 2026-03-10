Repository created for Microsoft AI Unlocked 2026. Contains source code for Phase 3 prototype of Track-5: Trustworthy AI.

# Orion

A chat interface with an integrated security middleware layer called **GoldiLocks** that screens prompts and responses through a multi-stage safety pipeline before they reach — or return from — the backend LLM.

---

## Overview

Orion is a React-based chat application that communicates with a backend LLM service. What sets it apart is an optional security pipeline — GoldiLocks — that sits between the frontend and the model. When enabled, every prompt is streamed through the middleware, which runs a series of safety checks in real time and reports each step back to the UI.

---

## Architecture

```
┌──────────┐        ┌──────────────────────────────────────────────────┐         ┌─────────┐
│          │        │              GoldiLocks Middleware               │         │         │
│  React   │  POST  │                                                  │  POST   │ Backend │
│  Client   ───────▶   Size ▸ PII ▸ Jailbreak ▸ Harms ▸ LLM ▸ CR ▸ PII ───────▶     LLM   │
│           ◀───────         (streamed NDJSON progress)                ◀───────           │
└──────────┘        └──────────────────────────────────────────────────┘         └─────────┘
                            │              │             │
                            ▼              ▼             ▼
                        Presidio     Azure Content   Azure Content
                       (PII engine)  Safety API      Safety API
```

When the security toggle is **off**, the client talks directly to the backend, bypassing all middleware checks.

---

## GoldiLocks Security Pipeline

The middleware processes every request through a sequential pipeline. If any step fails, the pipeline halts, the user's message is marked as removed in the UI, and the failure reason is displayed in the sidebar.

### Pipeline Steps (in order)

| # | Step | Module | What It Does |
|---|------|--------|--------------|
| 1 | **Prompt Size Check** | `PromptSizePass.js` | Rejects prompts longer than 1 000 characters. |
| 2 | **PII Anonymisation** | `AnonymisePII.js` | Sends the prompt to a Presidio instance that detects and replaces personal information (names, emails, phone numbers, etc.) with placeholders. A mapping is kept in memory so the response can be de-anonymised later. |
| 3 | **Jailbreak Detection** | `InstructionOverridePass.js` | Calls Azure Content Safety's `shieldPrompt` endpoint to detect prompt-injection and instruction-override attacks. |
| 4 | **Harm Analysis** | `analyseText.js` | Calls Azure Content Safety's `text:analyze` endpoint, scoring the prompt across four categories — Hate, Sexual, Self-Harm, and Violence — on a four-level severity scale. Blocks if any category reaches severity ≥ 1. |
| 5 | **LLM Request** | `FetchResponse.js` | Forwards the (now anonymised and validated) prompt to the backend LLM and retrieves the response. |
| 6 | **Copyright / Protected Material Check** | `ProtectedMaterialPass.js` | Runs the LLM's *response* through Azure Content Safety's `detectProtectedMaterial` endpoint to flag copyrighted text. |
| 7 | **Code Citation Check** | `ProtectedCodePass.js` | Runs the response through Azure's `detectProtectedMaterialForCode` endpoint, returning source-repository links if the output matches known open-source code. |
| 8 | **PII Restoration** | `AnonymisePII.js` | Replaces placeholders in the response with the original personal details using the stored mapping, so the user sees a natural reply. |

### Pipeline Visualised

```
User prompt
  │
  ▼
[1] Size check ──── too long? ──▶ BLOCK
  │
  ▼
[2] Anonymise PII (Presidio)
  │
  ▼
[3] Jailbreak detection (Azure) ──── attack? ──▶ BLOCK
  │
  ▼
[4] Harm analysis (Azure) ──── harmful? ──▶ BLOCK
  │
  ▼
[5] Forward to backend LLM
  │
  ▼
[6] Copyright check on response ──── copyrighted? ──▶ BLOCK
  │
  ▼
[7] Code citation check
  │
  ▼
[8] De-anonymise response
  │
  ▼
Stream final response + citations to client
```

---

## Project Structure

```
frontend/
├── App.jsx                    # Main React component — chat UI, sidebar, security panel
├── App.css                    # Styling (dark theme, CSS custom properties)
└── utils/
    └── utils.js               # API helpers (SendPrompt, TestConnection, CleanResponse)

middleware/
├── Middleware.js               # Express server — pipeline orchestration & individual endpoints
├── PromptSizePass.js           # Character-length gate (≤ 1000 chars)
├── AnonymisePII.js             # Presidio integration for PII anonymisation / de-anonymisation
├── InstructionOverridePass.js  # Azure shieldPrompt — jailbreak detection
├── analyseText.js              # Azure text:analyze — harm category scoring
├── FetchResponse.js            # Forwards validated prompt to the backend LLM
├── ProtectedMaterialPass.js    # Azure detectProtectedMaterial — copyright check on output
└── ProtectedCodePass.js        # Azure detectProtectedMaterialForCode — code citation lookup

backend/
└── Server.js                   # Express server — proxies prompts to Azure OpenAI
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- A running **Presidio** instance (anonymisation engine)
- An **Azure Content Safety** resource (endpoint + key)
- A running **backend LLM** server that exposes `/SendPrompt` (POST) and `/test` (GET)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file:

```env
VITE_BACKEND_URL=http://localhost:3000
VITE_MIDDLEWARE_URL=http://localhost:5000/api/query
```

### Backend

```bash
cd backend
npm install
node Server.js
```

Create a `.env` file:

```env
PORT=3000
AZURE_ENDPOINT=https://<your-resource>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=<version>
AZURE_KEY=<your-azure-openai-key>
MODEL_NAME=<your-deployed-model-name>
```

### Middleware

```bash
cd middleware
npm install
node Middleware.js
```

Create a `.env` file:

```env
PORT=5000
BACKEND_URL=http://localhost:3000/SendPrompt
PRESIDIO=http://localhost:5002
AZURE_CONTENT_SAFETY_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com
AZURE_CONTENT_SAFETY_KEY=<your-key>
```

---

## Environment Variables

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_BACKEND_URL` | Base URL of the LLM backend |
| `VITE_MIDDLEWARE_URL` | Full URL of the middleware query endpoint |

### Middleware

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `BACKEND_URL` | LLM backend `/SendPrompt` endpoint |
| `PRESIDIO` | Presidio service base URL |
| `AZURE_CONTENT_SAFETY_ENDPOINT` | Azure Content Safety resource URL |
| `AZURE_CONTENT_SAFETY_KEY` | Azure Content Safety subscription key |

### Backend

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `5000`) |
| `AZURE_ENDPOINT` | Full Azure OpenAI chat completions URL (includes deployment name and API version) |
| `AZURE_KEY` | Azure OpenAI API key |
| `MODEL_NAME` | Deployed model name (e.g. `gpt-4o`, `DeepSeek-R1`) |

---

## API Reference

### Middleware Endpoints

#### `POST /api/query` — Full pipeline (streamed)

The primary endpoint used by the frontend. Accepts `{ prompt }` and returns **newline-delimited JSON** (NDJSON). Each line is either a progress update or the final result.

Progress update shape:
```json
{ "step": "Size Check", "message": "Prompt size was appropriate", "isError": false }
```

Final response shape:
```json
{ "finalResponse": { "restored_text": "..." }, "citations": { "CodeCitations": [...] } }
```

#### Individual check endpoints

These are exposed for standalone use or testing:

| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `/api/CheckPromptSize` | POST | `{ prompt }` | `{ validSize: bool }` |
| `/api/CheckInstructionOverride` | POST | `{ prompt }` | `{ jailbreak: bool }` |
| `/api/textAnalysis` | POST | `{ prompt }` | `{ allowed: bool, harms: {...} }` |
| `/api/CheckProtectedMaterial` | POST | `{ text }` | `{ isProtected: bool }` |
| `/api/CheckProtectedCode` | POST | `{ code }` | Azure code-detection response |
| `/api/anonymize` | POST | `{ prompt }` | `{ id, anonymized_text }` |
| `/api/deanonymize` | POST | `{ id, prompt }` | `{ text }` |

Rate limit: **30 requests per minute** per IP.

### Backend Endpoints

The backend is a thin Express server that proxies prompts to an Azure OpenAI deployment and returns the model's response. It has no authentication or safety logic of its own — that responsibility belongs to the GoldiLocks middleware.

| Endpoint | Method | Body | Returns |
|----------|--------|------|---------|
| `/api/test` | GET | — | `{ message: "Server Online!" }` |
| `/api/SendPrompt` | POST | `{ prompt }` | `{ message: "<model response>" }` |

The `/api/SendPrompt` endpoint wraps the prompt in a standard chat-completions payload with a system message (`"You are a helpful assistant."`) and forwards it to the Azure OpenAI endpoint. The `max_completion_tokens` is set to 8 192.

---

## Dependencies

### Frontend

- **React** — UI framework
- **Vite** — build tool and dev server
- **lucide-react** — icons

### Backend

- **express** — HTTP server
- **cors** — cross-origin support
- **dotenv** — environment variable loading

### Middleware

- **express** — HTTP server
- **cors** — cross-origin support
- **express-rate-limit** — request throttling
- **axios** — HTTP client (Presidio calls)
- **dotenv** — environment variable loading

### External Services

- **Microsoft Presidio** — PII detection and anonymisation
- **Azure Content Safety API** — jailbreak detection, harm analysis, protected material and code detection
