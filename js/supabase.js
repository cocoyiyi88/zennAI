// Supabase integration layer for zennAI.
// Saat dikonfigurasi (url+anonKey) & user login: data pergi ke cloud (sync cross-device).
// Tanpa konfigurasi: fallback ke localStorage (mode lama tetap jalan).
const SB = {
  ready: false,
  client: null,
  session: null,
  config: window.__SUPABASE_CONFIG || {},
};

// init: panggil sekali di boot
function SBinit() {
  if (!SB.config || !SB.config.url || !SB.config.anonKey) return false;
  if (typeof supabase === "undefined") return false;
  try {
    SB.client = supabase.createClient(SB.config.url, SB.config.anonKey);
    SB.ready = true;
    return true;
  } catch (e) { return false; }
}

async function SBsession() {
  if (!SB.ready) return null;
  if (SB.session !== null) return SB.session;
  const { data } = await SB.client.auth.getSession();
  SB.session = data.session || null;
  return SB.session;
}

async function SBsignIn(email, password) {
  const { data, error } = await SB.client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  SB.session = data.session;
  return data.session;
}
async function SBsignUp(email, password) {
  const { data, error } = await SB.client.auth.signUp({ email, password });
  if (error) throw error;
  SB.session = data.session;
  return data.session;
}
async function SBsignOut() {
  await SB.client.auth.signOut();
  SB.session = null;
}

// ===== DB facade (dipakai app.js). Semua method aman dipanggil tanpa login. =====
async function _uid() {
  if (!SB.ready) return null;
  const s = await SBsession();
  return s ? s.user.id : null;
}

const DB = {
  // --- profil/pengaturan ---
  async getProfile() {
    const uid = await _uid(); if (!uid) return null;
    const { data, error } = await SB.client.from("profiles")
      .select("safe_mode, age_ok, model").eq("id", uid).maybeSingle();
    return error ? null : (data || {});
  },
  async saveProfile(p) {
    const uid = await _uid(); if (!uid) return;
    await SB.client.from("profiles").update({
      safe_mode: !!p.safe, age_ok: !!p.ageOk, model: p.model || null,
    }).eq("id", uid);
  },
  // --- cerita buatan user (seluruh objek disimpan di kolom data) ---
  async listStories() {
    const uid = await _uid(); if (!uid) return null;
    const { data, error } = await SB.client.from("stories")
      .select("id, title, tagline, genre, cover_prompt, premise, characters, opening, is_mature, data")
      .eq("owner", uid).order("created_at", { ascending: false });
    if (error) return null;
    return (data || []).map(r => ({
      ...(r.data || {}),
      id: r.id, title: r.title, tagline: r.tagline, genre: r.genre,
      coverPrompt: r.cover_prompt, premise: r.premise, characters: r.characters,
      opening: r.opening, mature: !!r.is_mature,
    }));
  },
  async upsertStory(st) {
    const uid = await _uid(); if (!uid) return;
    const { error } = await SB.client.from("stories").upsert({
      id: st.id, owner: uid, title: st.title, tagline: st.tagline,
      genre: st.genre, cover_prompt: st.coverPrompt, premise: st.premise,
      characters: typeof st.characters === "string" ? st.characters : "",
      opening: st.opening, is_mature: !!st.mature, data: st,
    });
    if (error) console.warn("upsertStory:", error.message);
  },
  // --- sesi chat ---
  async listSessions() {
    const uid = await _uid(); if (!uid) return null;
    const { data, error } = await SB.client.from("sessions")
      .select("story_id, messages").eq("owner", uid);
    return error ? null : (data || []).map(r => ({ story_id: r.story_id, messages: r.messages || [] }));
  },
  async saveSession(storyId, messages) {
    const uid = await _uid(); if (!uid) return;
    const { error } = await SB.client.from("sessions").upsert(
      { owner: uid, story_id: storyId, messages, updated_at: new Date().toISOString() },
      { onConflict: "owner,story_id" });
    if (error) console.warn("saveSession:", error.message);
  },
  async deleteSession(storyId) {
    const uid = await _uid(); if (!uid) return;
    await SB.client.from("sessions").delete().eq("owner", uid).eq("story_id", storyId);
  },
  // --- state RPG (afeksi, env, misi) + album ---
  async listRPG() {
    const uid = await _uid(); if (!uid) return null;
    const { data, error } = await SB.client.from("rpg_states")
      .select("story_id, state, album").eq("owner", uid);
    return error ? null : (data || []);
  },
  async saveRPG(storyId, state, album) {
    const uid = await _uid(); if (!uid) return;
    const { error } = await SB.client.from("rpg_states").upsert(
      { owner: uid, story_id: storyId, state, album: album || [], updated_at: new Date().toISOString() },
      { onConflict: "owner,story_id" });
    if (error) console.warn("saveRPG:", error.message);
  },
  // --- favorit ---
  async getFavorites() {
    const uid = await _uid(); if (!uid) return [];
    const { data } = await SB.client.from("favorites").select("story_id").eq("owner", uid);
    return (data || []).map(r => r.story_id);
  },
  async addFavorite(storyId) {
    const uid = await _uid(); if (!uid) return;
    await SB.client.from("favorites").upsert({ owner: uid, story_id: storyId });
  },
  async removeFavorite(storyId) {
    const uid = await _uid(); if (!uid) return;
    await SB.client.from("favorites").delete().eq("owner", uid).eq("story_id", storyId);
  },
};
