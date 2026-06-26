// Cloudflare Worker: weather + stock-quote proxy for the new-tab page.
//
// The OpenWeatherMap API key lives only here, as a Worker secret named
// OWM_API_KEY, set with:
//
//     wrangler secret put OWM_API_KEY
//
// The browser calls this Worker instead of the upstream APIs directly, so the
// key never ships to the client and we sidestep CORS. Responses are cached so
// we stay well within the free tier.
//
//   GET /            -> current weather (default)
//   GET /?symbol=VOO -> latest quote for an ETF/stock (Yahoo Finance, no key)

const ALLOWED_ORIGIN = "https://ankitsachdeva.com";
const WEATHER_URL =
  "https://api.openweathermap.org/data/2.5/weather?id=4671654&units=imperial";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const cors = {
      "Access-Control-Allow-Origin":
        origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const symbol = new URL(request.url).searchParams.get("symbol");
    if (symbol) {
      return stockQuote(symbol, cors);
    }

    const upstream = await fetch(`${WEATHER_URL}&appid=${env.OWM_API_KEY}`);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=600",
      },
    });
  },
};

// Fetch a single quote from Yahoo Finance and return a trimmed
// { symbol, price, previousClose } payload. No API key required.
async function stockQuote(symbol, cors) {
  const sym = symbol.toUpperCase().replace(/[^A-Z0-9.\-]/g, "").slice(0, 8);
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });

  try {
    const upstream = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?range=1d&interval=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!upstream.ok) return json(upstream.status, { error: "upstream", symbol: sym });

    const data = await upstream.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return json(502, { error: "no data", symbol: sym });

    return json(200, {
      symbol: sym,
      price: meta.regularMarketPrice ?? null,
      previousClose: meta.chartPreviousClose ?? meta.previousClose ?? null,
    });
  } catch (err) {
    return json(502, { error: String(err), symbol: sym });
  }
}
