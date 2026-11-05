// zennAI config & settings
const DEFAULT_MODEL = "recursive/flint-v1.0:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function loadConfig() {
  try { return JSON.parse(localStorage.getItem("zenn_cfg")) || {}; }
  catch (e) { return {}; }
}
function saveConfig(c) { localStorage.setItem("zenn_cfg", JSON.stringify(c)); }
function getConfig() {
  const c = loadConfig();
  return {
    apiKey: c.apiKey || "",
    model: c.model || DEFAULT_MODEL,
    baseUrl: c.baseUrl || "",
    safe: c.safe !== false,        // safe mode default ON
    ageOk: c.ageOk === true,        // konfirmasi usia 21+
    gender: c.gender || "all",     // 'm' | 'f' | 'all'
    genderChosen: c.genderChosen === true,
    personaName: c.personaName || "Raja",
    personaGender: c.personaGender || c.gender || "m",
    personaBio: c.personaBio || "Cerdik, tenang, berwibawa",
    fontSize: c.fontSize || "normal", // 'small' | 'normal' | 'large'
    showStats: c.showStats !== false,
    activeTab: c.activeTab || "featured"
  };
}

// maybeinations: gratis, tanpa key. url gambar dari prompt.
function imageUrl(prompt, w, h, seed) {
  const s = seed || Math.floor(Math.random() * 999999);
  return "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt) +
    "?width=" + (w || 640) + "&height=" + (h || 760) +
    "&seed=" + s + "&nologo=true&model=flux";
}
