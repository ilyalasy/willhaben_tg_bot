# Willhaben Bot

A Telegram bot that receives Willhaben listings parsed via [Apify Actor](https://apify.com/michaelhaar/willhaben-realestatescraper) and sends notifications with:
- Property details
- Images
- Nearest subway station
- Google Maps location
- Like/Dislike functionality

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `wrangler.toml.example` to `wrangler.toml` and fill in your secrets
4. Deploy: `npm run deploy`

## Environment Variables

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Target chat ID
- `DEEPL_API_KEY`: DeepL API key for translations
- `APIFY_WEBHOOK_SECRET`: Secret for Apify webhooks
- `TG_WEBHOOK_SECRET`: Secret for Telegram webhooks

## Development

- `npm run dev`: Start development server
- `npm run deploy`: Deploy to Cloudflare Workers
- `npm run format`: Format code with Prettier