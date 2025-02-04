# Willhaben Real Estate Bot

A Telegram bot that monitors Willhaben real estate listings and sends notifications with:
- Property details
- Images
- Nearest subway station
- Google Maps location
- Like/Dislike functionality

## Architecture

The project consists of two Cloudflare Workers:

### willhaben-scraper
- Runs on a daily schedule to scrape Willhaben listings
- Uses Puppeteer for web scraping
- Filters listings based on configurable criteria
- Sends filtered listings to willhaben-bot

### willhaben-bot
- Handles Telegram bot interactions
- Stores listings in D1 database
- Manages user reactions (likes/dislikes)
- Sends formatted messages with property details

## Setup

1. Clone the repository
2. Install dependencies for both workers:

3. Copy `wrangler.toml.example` to `wrangler.toml` in both directories and configure:

```bash
cd willhaben-bot && npm install
cd ../willhaben-scraper && npm install
```

### willhaben-bot
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Target chat ID
- `DEEPL_API_KEY`: DeepL API key for translations
- `APIFY_WEBHOOK_SECRET`: Secret for Apify webhooks
- `TG_WEBHOOK_SECRET`: Secret for Telegram webhooks
- `DB`: D1 database binding

### willhaben-scraper
- `WEBHOOK_SECRET`: Secret for bot communication
- `DEFAULT_URL`: Willhaben search URL
- `SCRAPER_BATCH_SIZE`: Number of listings to process in parallel
- `MYBROWSER`: Puppeteer browser binding
- `TG_BOT`: Service binding to willhaben-bot

4. Deploy both workers:

```bash
cd willhaben-bot && npx wrangler deploy
cd ../willhaben-scraper && npx wrangler deploy
```


## Development

### willhaben-bot
- `npx wrangler dev`: Start development server
- `npx wrangler deploy`: Deploy to Cloudflare Workers

### willhaben-scraper
- `npx wrangler dev`: Start development server
- `npx wrangler deploy`: Deploy to Cloudflare Workers

## Telegram Commands

- `/help` - Show available commands
- `/liked` - Show liked listings
- `/disliked` - Show disliked listings
- `/all` - Show all listings (liked and neutral)
