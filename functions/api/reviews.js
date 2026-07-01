// Cloudflare Pages Function: /api/reviews
// Bewaart reviews gedeeld voor alle bezoekers in een Cloudflare KV namespace.
// Vereist een KV binding met de naam LOOS_KV (zie README voor de setup).

const SLEUTEL = "reviews";
const MAX_LENGTE_TEKST = 300;
const MAX_LENGTE_NAAM = 40;
const MAX_AANTAL = 200;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function laadReviews(kv) {
  const ruw = await kv.get(SLEUTEL);
  return ruw ? JSON.parse(ruw) : [];
}

export async function onRequestGet({ env }) {
  if (!env.LOOS_KV) {
    return json({ fout: "KV niet geconfigureerd" }, 500);
  }
  const reviews = await laadReviews(env.LOOS_KV);
  return json(reviews);
}

export async function onRequestPost({ request, env }) {
  if (!env.LOOS_KV) {
    return json({ fout: "KV niet geconfigureerd" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ fout: "Ongeldige data" }, 400);
  }

  const score = Number(body.score);
  const tekst = String(body.tekst || "").trim().slice(0, MAX_LENGTE_TEKST);
  const naam = String(body.naam || "").trim().slice(0, MAX_LENGTE_NAAM);

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return json({ fout: "Score moet tussen 1 en 5 liggen" }, 400);
  }
  if (!tekst) {
    return json({ fout: "Tekst mag niet leeg zijn" }, 400);
  }

  const reviews = await laadReviews(env.LOOS_KV);
  reviews.push({ naam, tekst, score, datum: Date.now() });

  // Houd de lijst niet oneindig groot
  while (reviews.length > MAX_AANTAL) reviews.shift();

  await env.LOOS_KV.put(SLEUTEL, JSON.stringify(reviews));
  return json({ ok: true }, 201);
}
