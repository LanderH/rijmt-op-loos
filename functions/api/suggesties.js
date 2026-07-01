// Cloudflare Pages Function: /api/suggesties
// Bewaart suggesties gedeeld voor alle bezoekers in een Cloudflare KV namespace.
// Vereist een KV binding met de naam LOOS_KV (zie README voor de setup).

const SLEUTEL = "suggesties";
const MAX_LENGTE_TEKST = 150;
const MAX_AANTAL = 200;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function laadSuggesties(kv) {
  const ruw = await kv.get(SLEUTEL);
  return ruw ? JSON.parse(ruw) : [];
}

export async function onRequestGet({ env }) {
  if (!env.LOOS_KV) {
    return json({ fout: "KV niet geconfigureerd" }, 500);
  }
  const suggesties = await laadSuggesties(env.LOOS_KV);
  return json(suggesties);
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

  const tekst = String(body.tekst || "").trim().slice(0, MAX_LENGTE_TEKST);
  if (!tekst) {
    return json({ fout: "Tekst mag niet leeg zijn" }, 400);
  }

  const suggesties = await laadSuggesties(env.LOOS_KV);
  suggesties.push({ tekst, datum: Date.now() });

  while (suggesties.length > MAX_AANTAL) suggesties.shift();

  await env.LOOS_KV.put(SLEUTEL, JSON.stringify(suggesties));
  return json({ ok: true }, 201);
}
