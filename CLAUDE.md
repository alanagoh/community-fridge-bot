# CLAUDE.md — Community Fridge Bot

Project-specific instructions for Claude Code when working on this codebase.

## Project Overview

A WhatsApp bot that helps community fridge coordinators share real-time stock information with residents in Singapore. This is a **non-profit community initiative** with **zero budget**.

- **PRD**: See [docs/PRD.md](docs/PRD.md) for full specification
- **Status**: In planning, moving toward Phase 1 MVP

## Tech Stack

| Component | Tool | Free Tier Limit |
|-----------|------|-----------------|
| Hosting | Vercel (serverless) | 100k invocations/month |
| AI Vision | Gemini 2.0 Flash | 1,500 requests/day |
| Database | Supabase | 500MB, 50k requests/month |
| WhatsApp | Meta Cloud API | 1,000 conversations/month |
| Voice | Google Cloud TTS | 1M chars/month |

## User Context

**Alana is non-technical.** She's learning to build with AI tools and needs:

- **No jargon** — explain technical concepts in plain language
- **Clear file locations** — always specify which file and where in the project
- **Step-by-step guidance** — don't skip steps or assume knowledge
- **Visible work** — explain what code does before writing it
- **Trade-offs labeled** — when there are choices, explain impact of each option

## Working Preferences

- **Ask before writing code** — confirm the approach first
- **Explain risky operations** — especially anything involving APIs, credentials, or data
- **Keep it simple** — minimal viable solution, no over-engineering
- **One thing at a time** — don't make multiple changes without checking in
- **Test incrementally** — verify each step works before moving to the next

## Code Style

When writing JavaScript for this project:

```javascript
// ✅ DO: Clear, verbose variable names
const coordinatorPhoneNumber = message.from;
const isCoordinator = coordinatorPhones.includes(coordinatorPhoneNumber);

// ❌ DON'T: Abbreviated or clever code
const isCoord = phones.includes(msg.from);
```

```javascript
// ✅ DO: Comments explaining WHY, not what
// Gemini sometimes returns empty items array for blurry photos
if (!result.items || result.items.length === 0) {
  return askCoordinatorToRetakePhoto();
}

// ❌ DON'T: Comments stating the obvious
// Check if items is empty
if (!result.items) { ... }
```

## Project Structure

```
community-fridge-bot/
├── api/
│   └── webhook.js          ← Vercel entry point (receives WhatsApp webhooks)
├── lib/
│   ├── router.js           ← Routes messages to coordinator or user flow
│   ├── coordinator.js      ← Coordinator upload + verification logic
│   ├── user.js             ← User query logic
│   ├── gemini.js           ← Gemini Flash API integration
│   ├── supabase.js         ← Database helpers
│   └── whatsapp.js         ← WhatsApp send message helpers
├── docs/
│   └── PRD.md              ← Product requirements document
├── vercel.json             ← Vercel config
├── package.json
└── CLAUDE.md               ← This file
```

## Environment Variables

These will be set in Vercel dashboard (not committed to repo):

```
WHATSAPP_TOKEN=         # Meta WhatsApp API token
WHATSAPP_PHONE_ID=      # WhatsApp Business phone number ID
WHATSAPP_VERIFY_TOKEN=  # Webhook verification token (you create this)
GEMINI_API_KEY=         # Google AI Studio API key
SUPABASE_URL=           # Supabase project URL
SUPABASE_KEY=           # Supabase anon/service key
```

## Common Commands

```bash
# Install dependencies
npm install

# Run locally (requires Vercel CLI)
vercel dev

# Deploy to Vercel
vercel --prod

# Check Vercel logs
vercel logs
```

## Safety Reminders

- **Never commit API keys** — use environment variables
- **Never expose user phone numbers** in logs or error messages
- **Always sanitize user input** before storing in database
- **Test with your own phone first** before involving coordinators

## Documentation Sync

- **Source of truth**: Notion (shared with Asiyah)
- **GitHub**: Version-controlled archive
- **Sync process**: Export from Notion → update GitHub → commit with "Last synced: [date]"

## Phase 1 Scope (MVP)

Building only:
- Single fridge location
- English only
- Coordinator photo upload → AI identification → verification → save
- User text query → return latest stock

NOT building yet:
- Multi-location
- Multilingual
- Voice messages
- Push notifications
