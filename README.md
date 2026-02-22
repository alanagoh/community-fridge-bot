# Community Fridge Stock Tracker

A WhatsApp bot that helps community fridge coordinators share real-time stock information with residents who need it most.

## The Problem

Community fridges in Singapore redistribute surplus food to low-income residents. The food arrives reliably, but **the people who need it most often don't know it's there**. This is a last-mile information problem — food spoils because demand doesn't reach supply in time.

## The Solution

A two-part system:
1. **Coordinators** photograph fridge contents → AI identifies items → coordinator verifies → data published
2. **Residents** message the bot → receive current stock in their language (English, Mandarin, Malay, Tamil)

## Status

**In Planning** — currently defining requirements and validating with community partners.

## Documentation

- [Product Requirements Document (PRD)](docs/PRD.md) — full technical specification

## Tech Stack

- **n8n** (self-hosted) — workflow automation
- **WhatsApp Business Cloud API** — user interface
- **Claude/GPT-4o Vision** — food identification from photos
- **Supabase** — database and file storage
- **Google Cloud TTS** — voice message support

## Contributing

This is a community non-profit initiative. If you're interested in contributing, please reach out.

## License

TBD
