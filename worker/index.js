// Worker entrypoint voor de nieuwe "Workers met static assets" opzet
// van Cloudflare. Handelt /api/reviews en /api/suggesties zelf af,
// en laat al de rest gewoon doorlopen naar de statische site (dist).
// Vereist een KV binding met de naam LOOS_KV.

const SLEUTEL_REVIEWS = "reviews";
const SLEUTEL_SUGGESTIES = "suggesties";
const MAX_LENGTE_TEKST_REVIEW = 5000;
const MAX_LENGTE_NAAM = 40;
const MAX_LENGTE_TEKST_SUGGESTIE = 150;
const MAX_AANTAL = 200;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function laadLijst(kv, sleutel) {
  const ruw = await kv.get(sleutel);
  return ruw ? JSON.parse(ruw) : [];
}

async function handleReviews(request, env) {
  if (!env.LOOS_KV) return json({ fout: "KV niet geconfigureerd" }, 500);

  if (request.method === "GET") {
    const reviews = await laadLijst(env.LOOS_KV, SLEUTEL_REVIEWS);
    return json(reviews);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ fout: "Ongeldige data" }, 400);
    }

    const score = Number(body.score);
    const tekst = String(body.tekst || "").trim().slice(0, MAX_LENGTE_TEKST_REVIEW);
    const naam = String(body.naam || "").trim().slice(0, MAX_LENGTE_NAAM);

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return json({ fout: "Score moet tussen 1 en 5 liggen" }, 400);
    }
    if (!tekst) {
      return json({ fout: "Tekst mag niet leeg zijn" }, 400);
    }

    const reviews = await laadLijst(env.LOOS_KV, SLEUTEL_REVIEWS);
    reviews.push({ naam, tekst, score, datum: Date.now() });
    while (reviews.length > MAX_AANTAL) reviews.shift();
    await env.LOOS_KV.put(SLEUTEL_REVIEWS, JSON.stringify(reviews));
    return json({ ok: true }, 201);
  }

  return json({ fout: "Methode niet toegestaan" }, 405);
}

async function handleSuggesties(request, env) {
  if (!env.LOOS_KV) return json({ fout: "KV niet geconfigureerd" }, 500);

  if (request.method === "GET") {
    const suggesties = await laadLijst(env.LOOS_KV, SLEUTEL_SUGGESTIES);
    return json(suggesties);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ fout: "Ongeldige data" }, 400);
    }

    const tekst = String(body.tekst || "").trim().slice(0, MAX_LENGTE_TEKST_SUGGESTIE);
    if (!tekst) {
      return json({ fout: "Tekst mag niet leeg zijn" }, 400);
    }

    const suggesties = await laadLijst(env.LOOS_KV, SLEUTEL_SUGGESTIES);
    suggesties.push({ tekst, datum: Date.now() });
    while (suggesties.length > MAX_AANTAL) suggesties.shift();
    await env.LOOS_KV.put(SLEUTEL_SUGGESTIES, JSON.stringify(suggesties));
    return json({ ok: true }, 201);
  }

  return json({ fout: "Methode niet toegestaan" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/reviews") {
      return handleReviews(request, env);
    }
    if (url.pathname === "/api/suggesties") {
      return handleSuggesties(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
