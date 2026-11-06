// Vercel Serverless Function — AI proxy ke OpenRouter
// Key aman di env var OPENROUTER_API_KEY, nggak ke-expose ke browser

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "recursive/flint-v1.0:free";

// Hanya model di daftar ini yang boleh dipakai lewat proxy (cegah penyalahgunaan key).
// Override lewat env ALLOWED_MODELS (dipisah koma).
const ALLOWED_MODELS = (process.env.ALLOWED_MODELS ? process.env.ALLOWED_MODELS.split(",") : [
  "recursive/flint-v1.0:free", "google/gemini-4-argon", "anthropic/claude-sonnet-5.5",
  "anthropic/claude-opus-5.5", "openai/gpt-6-luna-pro", "deepseek/deepseek-v4.1-flash-1017",
  "mistralai/mistral-large-4-0", "qwen/qwen3.8-max-prime", "liquid/lfm-2.5-24b-a2b",
  "nvidia/nemotron-3.5-super-vl:free", "xingchen-agi/xing4.0-29b-a4b:free",
]).map(m => m.trim());
const MAX_CONTENT_CHARS = 12000;

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

  if (!messages.every(m => m && typeof m.content === "string" && m.content.length <= MAX_CONTENT_CHARS)) {
    return res.status(400).json({ error: "message too long or invalid" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "server AI key not configured" });

  const useModel = ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL;

  const policy = safe
    ? "SAFE MODE — jaga cerita tetap aman untuk semua umur; HINDARI tema dewasa, kekerasan eksplisit, dan konten seksual."
    : "MODE 21+ — konten dewasa diperbolehkan sesuai arah pemain, tetap naratif dan tidak eksplisit berlebihan.";

  // Cek apakah pesan pertama adalah system prompt khusus
  let finalMessages = [];
  if (messages[0]?.role === "system") {
    const customSys = messages[0].content + "\n\nKebijakan konten: " + policy;
    finalMessages = [
      { role: "system", content: customSys },
      ...messages.slice(1).slice(-12)
    ];
  } else {
    const defaultSys = `Kamu penutur AI RPG interaktif ala BagelChat. Lanjutkan narasi imersif orang kedua ("kamu"), 2-4 kalimat dengan dialog karakter jelas. Berikan 3 opsi aksi (A/B/C). Sertakan satu prompt gambar singkat (Inggris).
Kebijakan konten: ${policy}
Balas HANYA JSON valid: {"reply":"<dialog & narasi>","suggestions":["<opsi A>","<opsi B>","<opsi C>"],"image":"<prompt gambar singkat>"}`;
    finalMessages = [
      { role: "system", content: defaultSys },
      ...messages.slice(-12)
    ];
  }

  const payload = {
    model: useModel,
    messages: finalMessages,
    temperature: 0.85,
    max_tokens: 1200,
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
