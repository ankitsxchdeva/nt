# new-tab
This is a very simple html/css landing page to serve as my new tab.
Currently hosted at ankitsachdeva.com/new-tab

## Weather
The weather widget calls a small [Cloudflare Worker](worker/worker.js) proxy
instead of OpenWeatherMap directly, so the API key is never exposed in the
page. The key is stored as an encrypted Worker secret, not in this repo.

Setup (free — Cloudflare Workers free tier):
```sh
cd worker
npm install -g wrangler        # if you don't have it
wrangler login

# OWM_API_KEY is the secret NAME, not the value. Paste the key when prompted:
wrangler secret put OWM_API_KEY

wrangler deploy
```
First deploy only: if wrangler reports you have no `workers.dev` subdomain,
register one at the dashboard link it prints (one-time), then re-run
`wrangler deploy`.

Then put the deployed `*.workers.dev` URL into the `xhr.open(...)` call in
`index.html` (replace `YOUR-SUBDOMAIN`).

## Tickers (VOO / SMH)
The top-left stack shows the latest quote for a couple of ETFs underneath the
weather. Quotes go through the **same** Cloudflare Worker (`?symbol=VOO`), which
pulls them from Yahoo Finance — no API key needed. Change the symbols in the
`loadStock(...)` calls in `index.html` to track different tickers.

## Personalization
Feel free to use this for your own use. You will need to:
- Set your own `OWM_API_KEY` secret and weather location (the `id` in
  `worker/worker.js`)
- Point `ALLOWED_ORIGIN` in the Worker at your own domain

## Usage
- press space to enter search mode (currently google)
- press esc to exit search mode
