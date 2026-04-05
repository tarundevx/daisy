# Daisy

![React](https://img.shields.io/badge/React-20232a?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwind-css&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express)
![Socket.io](https://img.shields.io/badge/Socket.io-black?logo=socket.io&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)
![HydraDB](https://img.shields.io/badge/HydraDB-Memory_Layer-DB2777?logo=databricks&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=google-gemini&logoColor=white)

## Navigation

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quickstart](#quickstart)
- [Environment variables](#environment-variables)
- [Contributing](#contributing)

## Why this exists

Most coding assessments are slow, noisy, and full of fake environments. Daisy cuts that out: run real code in the browser, track behavioral integrity, and identify debugging patterns before making hiring decisions. No BS. High signal.

## Why HydraDB? (The Engine)

Daisy was originally conceived specifically to leverage **HydraDB** to solve the blind spot in technical interviews: *understanding how a candidate thinks.* 

While standard platforms only validate if the final code compiles, Daisy uses HydraDB as a continuously evolving behavioral memory layer:
- **Semantic Telemetry:** Every terminal command (`cat /var/log/app.log`), sequence of errors, and time-to-resolution is streamed into HydraDB as semantic memory bound to the candidate's tenant profile.
- **Inferred Cognitive Patterns:** Using HydraDB's `infer: true` capabilities, Daisy automatically extracts deep behavioral profiles—diagnosing if a candidate is reading the logs methodically, identifying the root cause, or just brute-forcing terminal commands and hoping for a fix.
- **Rubric-Aware Fast Recall:** Complex DevOps scenarios (like debugging an N+1 query or an IDOR vulnerability) are embedded as knowledge bases. HydraDB uses semantic `recency_bias` search to evaluate the candidate's sequence of actions against the "ideal path" and known "red flags."

## Features

- Real in-browser sandboxing via WebContainers
- Behavioral telemetry tracking
- Live testing and orchestration
- AI-powered candidate evaluation workflows (Powered by Gemini)

### Highlights at a glance

| Area                                                                           | What you get                                    |
| ------------------------------------------------------------------------------ | ----------------------------------------------- |
| <img src="https://img.shields.io/badge/-Execution-0f172a" alt="Execution" />   | Real code execution in-browser via WebContainers|
| <img src="https://img.shields.io/badge/-HydraDB-0f172a?logo=databricks&logoColor=white" alt="HydraDB" />   | Telemetry tracking every keystroke and output   |
| <img src="https://img.shields.io/badge/-Sync-0f172a" alt="Sync" />             | Live state orchestration with Socket.IO         |
| <img src="https://img.shields.io/badge/-Assistant-0f172a" alt="Assistant" />   | AI analysis of candidate workflows              |

## Tech stack

- **Frontend:** React (Vite), Tailwind CSS, Monaco Editor, XTerm.js, WebContainers
- **Backend:** Node.js, Express, Socket.IO
- **Database:** PostgreSQL, HydraDB
- **Hosting:** Vercel

> Keep this README tight. No fluff, no marketing paragraphs, no dead sections.

## Quickstart

> local run if your API keys are ready.

### Requirements

- Node.js 18+
- PostgreSQL
- Gemini API Key
- HydraDB API Key

### 1) Configuration

Create a `.env` file in the root of the project by copying the example:

```bash
cp .env.example .env
```

Fill in the required keys in `.env` (see Environment Variables section).

### 2) Backend

From repo root, open a terminal:

```bash
cd server
npm install
npm run dev
```

### 3) Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```



## Contributing

Small PRs. Sharp diffs. Fix a real problem or don’t open it.
