# ProductPix

AI-powered product photo generator for e-commerce sellers. Transform ordinary product images into professional studio-quality photos for Poshmark, eBay, Etsy, and Amazon.

## Features

- **AI Image Generation**: Professional product photos using Google Gemini
- **Background Replacement**: Clean white backgrounds, lifestyle settings, studio looks
- **Multiple Aspect Ratios**: 1:1, 4:3, 16:9, and more for different platforms
- **Credit System**: Pay-per-generation pricing model
- **Image Gallery**: Manage, favorite, and download your generated images
- **Prompt Testing**: A/B test prompt templates with statistical analysis

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: Supabase (PostgreSQL with RLS)
- **Storage**: Cloudflare R2 (S3-compatible, zero egress)
- **AI**: Vercel AI SDK + Google Gemini
- **Evaluation**: Anthropic Claude (prompt testing)
- **Styling**: Tailwind CSS v4
- **Testing**: Jest with ts-jest

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Development Commands

```bash
bun dev          # Start dev server
bun build        # Production build
bun test         # Run tests
bun lint         # Run ESLint
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `ANTHROPIC_API_KEY` — Claude API key (for evaluation)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `R2_*` — Cloudflare R2 credentials

## Documentation

- [R2 CORS Setup](docs/r2-cors-setup.md) — Configure Cloudflare R2 for browser uploads
- [Prompt Techniques](docs/image-generation-prompt-techniques-for-ecommerce.md) — AI prompt engineering for product photography

## License

Private — All rights reserved.
