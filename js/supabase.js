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

// ===== DB facade (dipakai app.js) =====
const DB = {
  // --- profile/settings ---
  async getProfile() {
    if (!SB.ready) return null;
    const s = await SBsession();
    if (!s) return null;
    const { data, error } = await SB.client.from("profiles")
      .select("safe_mode, age_ok, model").eq("id", s.user.id).maybeSingle();
    return error ? null : (data || {});
  },
  async saveProfile(p) {
    if (!SB.ready) return;
    const s = await SBsession();
    if (!s) return;
    await SB.client.from("profiles").update({
      safe_mode: !!p.safe, age_ok: !!p.ageOk, model: p.model || null,
    }).eq("id", s.user.id);
  },
  // --- custom stories ---
  async listStories() {
    if (!SB.ready) return null;
    const s = await SBsession();
    if (!s) return null;
    const { data, error } = await SB.client.from("stories")
      .select("id, title, tagline, genre, cover_prompt, premise, characters, opening, is_mature")
      .or(`owner.eq.${s.user.id},owner.is.null`)
      .order("created_at", { ascending: false });
    if (error) return null;
    return (data || []).map(r => ({
      id: r.id, title: r.title, tagline: r.tagline, genre: r.genre,
      coverPrompt: r.cover_prompt, premise: r.premise, characters: r.characters,
      opening: r.opening, mature: !!r.is_mature,
    }));
  },
  async upsertStory(st) {
    if (!SB.ready) return;
    const s = await SBsession();
    if (!s) return;
    await SB.client.from("stories").upsert({
      id: st.id, owner: s.user.id, title: st.title, tagline: st.tagline,
      genre: st.genre, cover_prompt: st.coverPrompt, premise: st.premise,
      characters: st.characters, opening: st.opening, is_mature: !!st.mature,
    });
  },
  // --- sessions ---
  async getSession(storyId) {
    if (!SB.ready) return null;
    const s = await SBsession();
    if (!s) return null;
    const { data } = await SB.client.from("sessions")
      .select("messages").eq("owner", s.user.id).eq("story_id", storyId).maybeSingle();
    return data ? { messages: data.messages || [] } : null;
  },
  async saveSession(storyId, messages) {
    if (!SB.ready) return;
    const s = await SBsession();
    if (!s) return;
    await SB.client.from("sessions").upsert({
      owner: s.user.id, story_id: storyId, messages, updated_at: new Date().toISOString(),
    });
  },
  async deleteSession(storyId) {
    if (!SB.ready) return;
    const s = await SBsession();
    if (!s) return;
    await SB.client.from("sessions").delete().eq("owner", s.user.id).eq("story_id", storyId);
  },
  // --- favorites ---
  async getFavorites() {
    if (!SB.ready) return [];
    const s = await SBsession();
    if (!s) return [];
    const { data } = await SB.client.from("favorites")
      .select("story_id").eq("owner", s.user.id);
    return (data || []).map(r => r.story_id);
  },
  async addFavorite(storyId) {
    if (!SB.ready) return;
    const s = await SBsession();
    if (!s) return;
    await SB.client.from("favorites").upsert({ owner: s.user.id, story_id: storyId });
  },
  async removeFavorite(storyId) {
    if (!SB.ready) return;
    const s = await SBsession();
    if (!s) return;
    await SB.client.from("favorites").delete().eq("owner", s.user.id).eq("story_id", storyId);
  },
};
