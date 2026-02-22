# Community Fridge Stock Tracker — WhatsApp Bot
## Product Requirements Document (PRD)
**Version:** 0.2
**Status:** In Planning
**Last Updated:** 22 February 2026
**Initiative Type:** Non-profit / Community

---

## 1. Overview

A WhatsApp-based bot that allows community fridge coordinators to photograph fridge contents, have AI identify the stock, verify the list, and make it retrievable by users — including elderly and less tech-savvy residents in Singapore. The system supports multiple fridge locations, multilingual output, and optional voice messages.

### Vision
Reduce food waste and improve food access by making community fridge stock information easily accessible to those who need it most, via a familiar channel (WhatsApp) with minimal friction.

---

## 2. Users

### Coordinators
- Volunteers or staff responsible for stocking and monitoring community fridges
- Need a fast, low-effort way to log fridge contents
- Primary action: photograph fridge → verify AI-generated list → publish

### End Users (Public)
- Residents, including elderly and less tech-savvy individuals, who want to know what's available before making a trip
- Need simple, clear, accessible information
- May prefer Mandarin, Malay, or Tamil over English
- May prefer voice messages over reading text

---

## 3. Core Principles

- **Near-zero operating cost** — target under $5/month at launch scale
- **WhatsApp-first** — no app downloads, no logins; meets users where they already are
- **Accessibility-first** — design for elderly users; simple menus, voice support, multilingual
- **Coordinator-verified data** — AI assists, humans confirm; no unverified data reaches users
- **Pull-based architecture** — users query when they want; no unsolicited push messages (keeps WhatsApp costs in free tier)

---

## 4. Tech Stack

| Component | Tool | Rationale |
|---|---|---|
| Backend / Webhook hosting | Vercel (free tier) | Serverless functions, no server to maintain, 100k invocations/month free, auto-deploys from GitHub |
| WhatsApp API | Meta WhatsApp Business Cloud API | Direct, no Twilio markup, free tier covers launch |
| AI Vision | Gemini 2.0 Flash | Free tier (1,500 requests/day), fast (~1s), good vision quality |
| Translation | Same AI model (single prompt call) | Free, no extra integration |
| Text-to-Speech | Google Cloud TTS | Best quality for Mandarin/Malay/Tamil; 1M chars/month free |
| Database | Supabase (free tier) | Stores fridge locations, stock snapshots, user prefs, coordinator sessions |
| Audio file storage | Supabase Storage | Temporary storage for TTS audio files before WhatsApp delivery |

### Why Vercel over n8n?
- **No server required** — n8n needs a machine running 24/7; Vercel runs only when messages arrive
- **Free tier is generous** — 100k function invocations/month, more than enough for pilot
- **Auto-deploys from GitHub** — push code, it's live
- **Trade-off**: Code-based (JavaScript) instead of visual workflow builder, but Claude Code can help maintain it

### Why Gemini Flash over Claude?
- **Free** — 1,500 requests/day free tier vs paid-per-use
- **Faster** — ~1 second response time, stays well under Vercel's 10-second timeout
- **Cheaper if we exceed free tier** — $0.10/1M tokens vs $1/1M tokens (10x cheaper)
- **Trade-off**: Using Google's API instead of Anthropic's; both work fine for food identification

### Estimated Monthly Cost at Launch
- Vercel hosting: **$0** (within free tier)
- WhatsApp API (user-initiated, <1k conversations): **$0**
- AI Vision with Gemini Flash (10 photos/day): **$0** (within free tier)
- Google Cloud TTS: **$0** (within free tier)
- Supabase: **$0** (within free tier)
- **Total: $0/month** (fully within free tiers)

---

## 5. Data Model

### `fridges`
```
fridge_id         string   PK
name              string   e.g. "Toa Payoh Blk 123"
address           string
latitude          float
longitude         float
coordinator_phones string[] WhatsApp numbers authorised to update this fridge
active            boolean
created_at        timestamp
```

### `stock_snapshots`
```
snapshot_id       string   PK
fridge_id         string   FK → fridges
stock_text_en     string   Verified English stock list
stock_text_zh     string   Mandarin translation
stock_text_ms     string   Malay translation
stock_text_ta     string   Tamil translation
photo_url         string   Stored image reference
verified          boolean  False until coordinator confirms
verified_at       timestamp
coordinator_phone string
user_reports      jsonb    Array of user-submitted updates (Model 3)
created_at        timestamp
```

### `coordinator_sessions`
```
coordinator_phone string   PK
state             string   e.g. "idle", "awaiting_fridge_selection", "awaiting_confirmation"
fridge_id         string   FK → fridges (fridge being updated in this session)
pending_draft_en  string   AI-generated draft awaiting coordinator confirmation
pending_photo_url string
last_updated      timestamp
```

### `users`
```
user_phone        string   PK
language_pref     string   "en", "zh", "ms", "ta"
output_pref       string   "text", "voice"
onboarded_at      timestamp
last_active       timestamp
```

---

## 6. Phased Rollout Plan

### Phase 1 — Core Bot (Launch MVP)
Single location, English only, text only, coordinator upload + verification, user text query.

**Scope:**
- Coordinator sends photo → AI identifies items → draft returned to coordinator for approval → on CONFIRM, stock saved to Supabase
- User messages bot → bot returns latest verified stock list for the one active fridge
- Timestamp shown on every stock response ("Last verified 3 hours ago")

**Success criteria:** At least one coordinator can complete the upload-verify flow without assistance. At least 10 users can retrieve stock info successfully.

---

### Phase 2 — Multi-Location + Location Queries
Add multiple fridge locations. Users can find nearest fridge.

**Scope:**
- Fridge registry in Supabase with coordinates
- Coordinator flow updated: after uploading photo, bot asks "Which fridge is this for?" with numbered menu
- User query flow:
  - Option A (launch): Numbered menu listing all active fridges
  - Option B (upgrade): User shares WhatsApp location → bot calculates nearest fridges using Haversine formula → returns top 3
- Coordinator session state management (tracks which fridge each coordinator is updating, handles concurrent sessions)

**Open question:** How many fridge locations at launch? This affects whether numbered menu (Option A) is sufficient or location-based query (Option B) is needed from the start.

---

### Phase 3 — Multilingual Support
Add Mandarin, Malay, Tamil translations.

**Scope:**
- User onboarding flow: on first message, bot presents language selection menu (1. English, 2. 中文, 3. Bahasa Melayu, 4. தமிழ்)
- Language preference stored in `users` table
- All stock responses returned in user's preferred language
- Translation generated at snapshot creation time (not per-query) to reduce API calls
- Food vocabulary glossary baked into AI prompt for common Singapore community fridge items (e.g. tau kwa, nasi lemak, bee hoon)

**Open question:** Who reviews translation quality for Malay and Tamil? Identify a native speaker volunteer to review the prompt glossary before Phase 3 launch.

---

### Phase 4 — Voice Output
Add text-to-speech option for users who prefer audio.

**Scope:**
- User onboarding updated to include output preference (text or voice)
- TTS flow: stock text → Google Cloud TTS → audio file stored temporarily → sent as WhatsApp voice message
- Voice kept short: location name, timestamp, item list only (no UI chrome)
- Preference stored in `users` table

**Open question:** WhatsApp voice message size limits and audio format requirements to be confirmed before implementation.

---

## 7. Key Flows

### 7.1 Coordinator Upload Flow

```
Coordinator sends photo to WhatsApp bot number
  ↓
Vercel serverless function receives webhook
  ↓
[If multiple fridges] Bot asks: "Which fridge is this for?" → Coordinator replies with number
  ↓
Image sent to Gemini Flash Vision API with food identification prompt
  ↓
AI returns structured stock list (draft)
  ↓
Bot sends draft back to coordinator:
  "Here's what I detected:
   • 3 apples
   • 1 loaf of bread
   • Cooked rice dish (unverified contents)
   ⚠️ Partially visible: possible tofu block at back

   Reply CONFIRM to publish, or edit e.g:
   EDIT: remove tofu, add 2 bananas"
  ↓
Coordinator replies CONFIRM or EDIT [corrections]
  ↓
[If EDIT] Bot applies corrections, shows updated list, asks for CONFIRM again
  ↓
[On CONFIRM] Stock saved to Supabase as verified snapshot
  ↓
Bot confirms: "✅ Toa Payoh Blk 123 stock updated. Thank you!"
```

### 7.2 User Query Flow

```
User messages bot ("What's in the fridge?" or any message)
  ↓
[If new user] Onboarding flow: language preference → output preference → stored in users table
  ↓
[Phase 1] Bot returns latest verified snapshot for the single active fridge
[Phase 2+] Bot asks user to select fridge by number, or accepts location share
  ↓
Bot returns stock in user's language preference:
  "🥬 Toa Payoh Blk 123
   Last verified: 2 hours ago

   Produce: 3 apples, 1 bunch kangkong
   Cooked food: Rice dish, curry (contents unverified)
   Packaged: 1 loaf bread, 2 instant noodles

   Community reports: Items may have been taken in the last hour."
  ↓
[If voice preference] Stock text sent to Google Cloud TTS → audio file → WhatsApp voice message
```

### 7.3 User Stock Report Flow (Model 3 — Crowdsourced with low trust)

```
User replies "I took 2 apples and the bread"
  ↓
AI parses freeform text into structured deduction
  ↓
Stored in stock_snapshots.user_reports (NOT modifying verified stock list)
  ↓
Shown to subsequent users as: "Community reports: Items may have been taken recently"
  ↓
[Model 4 extension] If report indicates significant depletion ("fridge is empty"),
  bot notifies coordinator via WhatsApp: "⚠️ User reported fridge may be empty. Please check."
```

---

## 8. AI Prompt Design

### Vision / Food Identification Prompt
```
You are helping catalogue a community fridge in Singapore. Analyse this photo and return a structured list of all visible food items.

Format your response as JSON:
{
  "items": [
    { "category": "produce|cooked|packaged|dairy|other", "name": "item name", "quantity": "estimated quantity or null", "confidence": "high|medium|low", "notes": "any relevant notes" }
  ],
  "partially_visible": ["list of items that may be present but not fully visible"],
  "warnings": ["any food safety concerns visible e.g. items that appear expired or improperly stored"]
}

Guidelines:
- Common Singapore items: tau kwa (firm tofu block), nasi lemak (rice in banana leaf), bee hoon (rice vermicelli), char siew (BBQ pork), lontong, kueh
- Label home-cooked food as "cooked [type] dish (contents unverified)" rather than guessing ingredients
- If you see a wrapped banana leaf parcel, label it "nasi lemak (unverified)"
- Do not identify tau kwa as "tofu block" — use "tau kwa"
- Flag items at back of fridge or partially obscured in partially_visible
- Be conservative: if uncertain, lower confidence rather than guess
```

### Translation Prompt Addition
```
Also return the items array translated into:
- zh: Simplified Chinese
- ms: Bahasa Melayu
- ta: Tamil

Use natural, everyday food vocabulary. Preserve brand names in English.
```

---

## 9. Open Questions

| # | Question | Owner | Priority |
|---|---|---|---|
| 1 | How many fridge locations at Phase 2 launch? Determines if numbered menu is sufficient or location queries needed immediately | Initiative lead | High |
| 2 | Who are the coordinator volunteers? Need to whitelist their phone numbers in the system | Initiative lead | High |
| 3 | Native speaker review for Malay and Tamil food vocabulary in AI prompt | Phase 3 prep | Medium |
| 4 | WhatsApp Business Account verified? Meta approval can take days-weeks | Initiative lead | High |
| 5 | How frequently do coordinators plan to update? Affects staleness UX copy | Initiative lead | Medium |
| 6 | Should coordinators be able to update from the same fridge multiple times per day (e.g. after restocking)? | Initiative lead | Medium |
| 7 | WhatsApp voice message format and size limits to confirm with Meta API docs | Developer | Low (Phase 4) |
| 8 | Data retention policy — how long to keep old stock snapshots and user data? PDPA considerations for Singapore | Initiative lead + legal check | Medium |
| 9 | What happens if AI confidence is very low on an item? Auto-flag for coordinator or include with warning? | Product decision | Medium |
| 10 | Should the bot support English queries like "any vegetables?" or is full list retrieval sufficient for Phase 1? | Phase 2+ consideration | Low |

---

## 10. Constraints and Risks

**WhatsApp free tier limit:** 1,000 user-initiated conversations/month. Monitor usage and alert at 800 to avoid surprise costs. Proactive/push messages are paid — avoid in architecture.

**AI hallucination on food items:** The model may misidentify items, especially home-cooked food and items partially obscured at the back. Coordinator verification step is the primary mitigation. Prompt engineering with location-specific food vocabulary reduces errors over time.

**Data freshness:** Stock can turn over in 2–3 hours on busy days. Always show "last verified [X] ago" timestamp. Reframe product positioning as "recently stocked with X" not "currently contains X".

**Coordinator reliability:** The system depends on coordinators uploading photos consistently. Tech is not the bottleneck here — onboarding, training, and motivation of coordinator volunteers is. Consider a simple coordinator dashboard (Phase 2+) showing last update time to prompt action.

**PDPA compliance:** User phone numbers and language preferences are personal data. Supabase data must be stored in an appropriate region. Users should be informed on first contact that their phone number is stored for service delivery. Add a FORGET ME command that deletes user record.

---

## 11. Security Considerations

### Rate Limiting
- Maximum 20 messages per phone number per hour to prevent abuse
- Alert when WhatsApp conversation count reaches 800/month

### Coordinator Verification
- Phone numbers whitelisted in `coordinator_phones` array
- Consider optional PIN for sensitive actions in future phases
- Session timeout after 30 minutes of inactivity

### Data Protection
- Photo storage: Supabase bucket must be private; use signed URLs with expiry
- Input sanitization: All user input sanitized before database storage
- Logs should mask last 4 digits of phone numbers

### PDPA Compliance
- First-contact message includes data collection notice
- `FORGET ME` command deletes all user data within 24 hours
- Stock snapshots older than 30 days auto-deleted
- Coordinator photos retained for 7 days only
- Supabase region: ap-southeast-1 (Singapore)

---

## 12. User Discovery Strategy

Phase 1 relies on coordinator word-of-mouth. Before Phase 2:
- QR code poster designed for display at fridge locations
- WhatsApp number printed on fridge signage
- Coordinator script for introducing bot to residents during restocking
- Partnership with community centres to distribute information

---

## 13. Out of Scope (for now)

- Web interface or dashboard for coordinators or public
- Expiry date tracking (AI cannot reliably read dates; requires close-up photos or manual entry)
- Push notifications / proactive restocking alerts (triggers paid WhatsApp tier)
- Integration with food bank or donation management systems
- User accounts or authentication beyond phone number identification
- Analytics dashboard

---

## 14. Implementation Notes

When implementing this system, prioritise in this order:

1. **Set up Vercel project first** — connect GitHub repo, confirm deploys work
2. **Test the WhatsApp Business API** with a simple echo bot before adding AI calls
3. **Build the coordinator flow first** — it is the data source; without it nothing works
4. **Use environment variables** for all API keys (Gemini, Google Cloud TTS, Supabase, WhatsApp token) — set these in Vercel dashboard
5. **Log everything in early stages** — AI vision responses, coordinator messages, state transitions — to debug edge cases
6. **Handle WhatsApp message types explicitly** — text, image, location, and audio are all different webhook payloads
7. **Session state timeout** — coordinator sessions should expire after 30 minutes of inactivity and reset to idle to avoid stale state bugs

### Vercel Project Structure
```
community-fridge-bot/
├── api/
│   └── webhook.js          ← Main entry point, receives all WhatsApp messages
├── lib/
│   ├── router.js           ← Routes to coordinator or user flow based on phone number
│   ├── coordinator.js      ← Coordinator upload flow logic
│   ├── user.js             ← User query flow logic
│   ├── gemini.js           ← Gemini Flash API calls for vision
│   ├── supabase.js         ← Database helpers
│   └── whatsapp.js         ← WhatsApp API send helpers
├── vercel.json             ← Config
└── package.json
```

---

*This document should be updated as open questions are resolved and decisions are made.*

---

**Last synced:** 22-02-2026 by Alana (updated to Vercel + Gemini Flash)
**Source of truth:** Notion (for collaboration with Asiyah)
