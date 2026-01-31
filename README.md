# reflect-buddy-chatgpt-app

A self-hosted ChatGPT App for reflection

Reflect Buddy is a tiny OpenAI Apps SDK / MCP demo meant to be run **locally**.

It adds a widget panel to ChatGPT with:

- Conversation Intent (label)
- Emotion label
- A **Mirror & Distill** button that posts a structured reflective prompt into your current chat

## Why “local-only”?

This project is designed so **each user runs it on their own machine**.
There is **no hosted MCP server**. You only expose your local server temporarily via an HTTPS tunnel so ChatGPT can reach it.

## Prereqs

- Node 18+
- ChatGPT account with Developer Mode / MCP Apps support
- An HTTPS tunnel for local dev (ngrok or Cloudflare Tunnel)

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
# prints: http://localhost:8787/mcp
```

## Expose your local MCP over HTTPS (dev tunnel)

ChatGPT cannot call localhost directly. You must tunnel it.
You can use ngrok in this case.

```bash
ngrok http 8787
```

Copy the HTTPS URL and append /mcp.
Example:
https://abcd-1234.ngrok.app/mcp

## Connect to ChatGPT (Developer Mode)

ChatGPT → Settings → Connectors → enable Developer Mode (wording may vary).
Create a new app/connector.
Paste your tunnel URL ending in /mcp.
Choose "No authentication" for this local demo.

## Use it

In a chat where the connector is enabled (use / in the chat and select 'Reflect Buddy' in the selector), ask:

> Open Reflect Buddy

Then:

Pick an Intent + Emotion
Press Submit
The widget injects a reflective prompt into the chat as a follow-up user message.
