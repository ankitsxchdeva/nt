// Cloudflare Worker: weather proxy for the new-tab page.
//
// The OpenWeatherMap API key lives only here, as a Worker secret named
// OWM_API_KEY, set with:
//
//     wrangler secret put OWM_API_KEY
//
// The browser calls this Worker instead of OpenWeatherMap directly, so the key
// never ships to the client. Responses are cached for 10 minutes to stay well
// within the free tier.

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
