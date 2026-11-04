// Edge Function ai — proxy ke OpenRouter, key hanya di server
// Deploy: supabase functions deploy ai --project-ref <ref>
// Secret:  supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "recursive/flint-v1.0:free";
const MAX_HISTORY = 12;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: CORS });

  let body;
  try { body = await req.json(); } catch { return json(cors, 400, "bad json"); }

  const { messages, safe, model, dev } = body;
  if (!Array.isArray(messages) || !messages.length) return json(cors, 400, "messages required");

  const useModel = (model && typeof model === "string") ? model : MODEL;

  // mode demo (tanpa key server) — balik penutur lokal
  if (dev) {
    return json(cors, 200, {
      reply: "Kamu menghela napas, menatap ke depan. Tapi untuk sekarang, AI server belum dikonfigurasi — pakai mode demo dulu ya.",
      suggestions: ["Lanjutkan cerita", "Tanyakan sesuatu", "Ganti arah"],
      image: null,
    });
  }

  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return json(cors, 500, "server AI key not configured");

  const policy = safe
    ? "SAFE MODE — jaga cerita tetap aman untuk semua umur; HINDARI tema dewasa, kekerasan eksplisit, dan konten seksual."
    : "MODE 21+ — konten dewasa diperbolehkan sesuai arah pemain, tetap naratif dan tidak eksplisit berlebihan.";

  const system = {
    role: "system",
    content: `Kamu penutur AI untuk cerita interaktif visual. Lanjutkan narasi imersif orang kedua, 2-4 kalimat. Berikan 3 opsi aksi (A/B/C). Sertakan satu prompt gambar singkat (Inggris).
Kebijakan konten: ${policy}
Balas HANYA JSON valid: {"reply":"<narasi>","suggestions":["<opsi A>","<opsi B>","<opsi C>"],"image":"<prompt gambar singkat>"}`,
  };

  const payload = {
    model: useModel,
    messages: [system, ...messages.slice(-MAX_HISTORY)],
    temperature: 0.9,
    response_format: { type: "json_object" },
  };

  try {
    const r = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "HTTP-Referer": "https://cocoyiyi88.github.io/zennAI/",
        "X-Title": "zennAI",
      },
      body: JSON.stringify(payload),
    });
    const t = await r.text();
    if (!r.ok) return json(cors, 502, "upstream " + r.status + ": " + t.slice(0, 120));
    const j = JSON.parse(t);
    const content = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : "";
    return json(cors, 200, { content });
  } catch (e) {
    return json(cors, 500, "ai error: " + e.message);
  }
});

function json(headers, status, data) {
  return new Response(typeof data === "string" ? JSON.stringify({ error: data }) : JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
