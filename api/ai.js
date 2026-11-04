// Vercel Serverless Function — AI proxy ke OpenRouter
// Key aman di env var OPENROUTER_API_KEY, nggak ke-expose ke browser

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "recursive/flint-v1.0:free";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization, apikey");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { messages, safe, model } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: "messages required" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "server AI key not configured" });

  const useModel = (model && typeof model === "string") ? model : DEFAULT_MODEL;

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
    messages: [system, ...messages.slice(-12)],
    temperature: 0.9,
    response_format: { type: "json_object" },
  };

  try {
    const r = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "HTTP-Referer": "https://khusus-jomblo.vercel.app/",
        "X-Title": "zennAI",
      },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    if (!r.ok) return res.status(502).json({ error: "upstream " + r.status + ": " + text.slice(0, 120) });
    const j = JSON.parse(text);
    const content = j.choices?.[0]?.message?.content || "";
    return res.status(200).json({ content });
  } catch (e) {
    return res.status(500).json({ error: "ai error: " + e.message });
  }
}
