// zennAI — logika utama
// ===== state & util =====
const $ = (sel, el) => (el || document).querySelector(sel);
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

let state = {
  view: "home",
  genre: "ALL",
  activeStory: null,
  sending: false,
  custom: null // data cerita custom sementara
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

// cerita = seed + custom (custom disimpan di localStorage)
function allStories() {
  const custom = loadCustomStories();
  return custom.concat(SEED_STORIES);
}
function loadCustomStories() {
  try { return JSON.parse(localStorage.getItem("zenn_custom")) || []; }
  catch (e) { return []; }
}
function saveCustomStories(list) {
  localStorage.setItem("zenn_custom", JSON.stringify(list));
  // push ke cloud kalau authed
  if (SB.ready && SB.session) {
    list.forEach(st => DB.upsertStory(st));
  }
}

// session cerita
function getSessions() { return loadLibrary(); }
function getSession(storyId) {
  const lib = getSessions();
  if (!lib[storyId]) {
    const story = allStories().find(s => s.id === storyId);
    lib[storyId] = {
      id: storyId, createdAt: Date.now(),
      messages: [{ role: "ai", sit: story.opening, text: story.opening, img: imageUrl(story.coverPrompt, 640, 760, 101) }]
    };
    saveLibrary(lib);
  }
  return lib[storyId];
}
function saveSession(sess) {
  const lib = getSessions();
  lib[sess.id] = sess;
  saveLibrary(lib);
  // push ke cloud kalau authed
  if (SB.ready && SB.session) DB.saveSession(sess.id, sess.messages);
}
function deleteSession(storyId) {
  const lib = getSessions();
  delete lib[storyId];
  saveLibrary(lib);
  if (SB.ready && SB.session) DB.deleteSession(storyId);
}

// ===== Supabase auth + hydrate =====
async function hydrateFromCloud() {
  if (!SB.ready) return;
  const s = await SBsession();
  if (!s) return;
  // profile -> cfg mirror
  const prof = await DB.getProfile();
  if (prof) {
    const c = loadConfig();
    if (prof.safe_mode !== null && prof.safe_mode !== undefined) c.safe = prof.safe_mode;
    if (prof.age_ok !== null && prof.age_ok !== undefined) c.ageOk = prof.age_ok;
    if (prof.model) c.model = prof.model;
    saveConfig(c);
  }
  // custom stories -> storage mirror
  const cloudStories = await DB.listStories();
  if (cloudStories) {
    // simpan custom milik user (dengan is_mature) + seed lokal tetap ada
    const custom = cloudStories.map(r => ({
      id: r.id, title: r.title, tagline: r.tagline, genre: r.genre,
      coverPrompt: r.coverPrompt, premise: r.premise, characters: r.characters,
      opening: r.opening, mature: !!r.mature,
    }));
    saveCustomStories(custom);
  }
  // sessions -> library mirror (biar lanjut cross-device)
  const lib = getSessions();
  const ids = new Set(allStories().map(x => x.id));
  for (const id of ids) {
    const sess = await DB.getSession(id);
    if (sess && sess.messages && sess.messages.length) {
      lib[id] = { id, createdAt: lib[id] ? lib[id].createdAt : Date.now(), messages: sess.messages };
    }
  }
  saveLibrary(lib);
}

function showAuthOverlay() {
  if (document.querySelector(".authmodal")) return;
  const el = document.createElement("div");
  el.className = "authmodal";
  el.innerHTML = `
    <div class="authmodal-box">
      <div class="agegate-logo"><span class="logo">zenn</span>AI</div>
      <h2>Masuk ke akun</h2>
      <p>Data ceritamu tersimpan di cloud & sinkron lintas device.</p>
      <input id="auth_email" type="email" placeholder="Email" autocomplete="email">
      <input id="auth_pass" type="password" placeholder="Kata sandi" autocomplete="current-password">
      <button class="btn block" id="auth_btn">Masuk</button>
      <button class="authtoggle" id="auth_toggle">Belum punya akun? Daftar</button>
      <div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px">
        <button class="authtoggle" id="auth_skip" style="color:var(--muted)">Lanjut tanpa login (mode lokal)</button>
      </div>
      <div class="authnote" id="auth_note"></div>
    </div>`;
  document.body.appendChild(el);

  let mode = "in";
  const email = el.querySelector("#auth_email");
  const pass = el.querySelector("#auth_pass");
  const note = el.querySelector("#auth_note");
  const toggle = el.querySelector("#auth_toggle");
  const skip = el.querySelector("#auth_skip");
  const btn = el.querySelector("#auth_btn");

  if (skip) skip.addEventListener("click", () => {
    el.remove();
  });

  toggle.addEventListener("click", () => {
    mode = mode === "in" ? "up" : "in";
    btn.textContent = mode === "in" ? "Masuk" : "Daftar";
    toggle.textContent = mode === "in" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk";
    note.textContent = "";
  });

  btn.addEventListener("click", async () => {
    note.textContent = "Tunggu...";
    try {
      if (mode === "in") await SBsignIn(email.value.trim(), pass.value);
      else await SBsignUp(email.value.trim(), pass.value);
      await hydrateFromCloud();
      el.remove();
      render();
    } catch (e) {
      note.textContent = "Gagal: " + (e.message || e.error_description || "coba lagi");
      note.style.display = "block";
    }
  });
}

// ===== render root =====
function render() {
  const v = $("#view");
  const navs = $$(".navbtn");
  navs.forEach(n => n.classList.toggle("active", n.dataset.view === state.view));
  if (state.view === "home") v.innerHTML = viewHome();
  else if (state.view === "create") v.innerHTML = viewCreate();
  else if (state.view === "library") v.innerHTML = viewLibrary();
  else if (state.view === "settings") v.innerHTML = viewSettings();
  else v.innerHTML = viewPlay();
  bind(v);
}

function bind(root) {
  // chip genre
  $$(".chip", root).forEach(c => c.addEventListener("click", () => {
    state.genre = c.dataset.genre; render();
  }));

  // buka cerita
  $$("[data-open]", root).forEach(c => c.addEventListener("click", () => {
    const story = allStories().find(s => s.id === c.dataset.open);
    if (story) { state.activeStory = story.id; state.view = "play"; render(); }
  }));

  // form buat
  const cf = $("#customform");
  if (cf) cf.addEventListener("submit", e => {
    e.preventDefault();
    const title = $("#cf_title").value.trim();
    const tagline = $("#cf_tagline").value.trim();
    const genre = $("#cf_genre").value;
    const premise = $("#cf_premise").value.trim();
    const chars = $("#cf_chars").value.trim();
    if (!title) return;
    const id = "custom-" + Date.now();
    const st = {
      id, title: title || "Cerita Tanpa Judul",
      tagline: tagline || "Sebuah cerita baru.",
      genre: genre || "Misteri",
      coverPrompt: (premise || title) + ", cinematic anime key visual",
      premise: premise || "Kamu memulai cerita baru.",
      characters: chars || "Kamu adalah tokoh utamanya.",
      opening: premise
        ? premise
        : "Cerita dimulai. Kamu belum tahu apa yang menantimu — tapi sesuatu di udara terasa berbeda."
    };
    const custom = loadCustomStories();
    custom.unshift(st);
    saveCustomStories(custom);
    state.activeStory = st.id; state.view = "play"; render();
  });

  // composer
  const inp = $("#chatinput");
  const sb = $("#sendbtn");
  if (sb) sb.addEventListener("click", () => {
    if (inp.value.trim() && !state.sending) sendMessage(inp.value.trim());
  });
  if (inp) inp.addEventListener("keydown", e => {
    if (e.key === "Enter" && inp.value.trim() && !state.sending) {
      e.preventDefault(); sendMessage(inp.value.trim());
    }
  });

  // settings save
  const savebtn = $("#savecfg");
  if (savebtn) savebtn.addEventListener("click", () => {
    const cfg = getConfig();
    const keyEl = $("#cfg_key");
    if (keyEl) cfg.apiKey = keyEl.value.trim();
    cfg.model = $("#cfg_model").value.trim();
    const urlEl = $("#cfg_url");
    if (urlEl) cfg.baseUrl = urlEl.value.trim();
    saveConfig(cfg);
    // juga simpan ke cloud
    if (SB.ready && SB.session) DB.saveProfile(cfg);
    const ok = $("#cfgok");
    ok.style.display = "block";
    setTimeout(() => { ok.style.display = "none"; }, 2200);
  });

  // logout
  const logoutBtn = $("#logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", async () => {
    await SBsignOut();
    render();
  });

  // login dari settings
  const loginBtn = $("#loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", () => {
    showAuthOverlay();
  });

  // safe mode toggle
  const safeToggle = $("#cfg_safe");
  if (safeToggle) safeToggle.addEventListener("change", () => {
    const cfg = getConfig();
    cfg.safe = safeToggle.checked;
    saveConfig(cfg);
    render();
  });

  // konfirmasi usia
  const ageBtn = $("#age_confirm");
  if (ageBtn) ageBtn.addEventListener("click", () => {
    const cfg = getConfig();
    cfg.ageOk = true;
    saveConfig(cfg);
    render();
  });
}

// ===== views =====
function viewHome() {
  const cfg = getConfig();
  let stories = allStories();
  if (cfg.safe) stories = stories.filter(s => !isMature(s)); // safe mode: sembunyikan 21+
  const filtered = state.genre === "ALL" ? stories : stories.filter(s => s.genre === state.genre);
  const chips = ["ALL"].concat(GENRES).map(g =>
    `<button class="chip ${state.genre === g ? "active" : ""}" data-genre="${g}">${g}</button>`
  ).join("");

  const cards = filtered.map(s => {
    const n = (getSessions()[s.id] || { messages: [] }).messages.length;
    const matureBadge = (!cfg.safe && isMature(s))
      ? `<span class="badge21">21+</span>` : "";
    return `<div class="card" data-open="${s.id}">
      <img class="cover" loading="lazy" src="${imageUrl(s.coverPrompt, 640, 760, 7)}" alt="${esc(s.title)}">
      <div class="body">
        <h3>${esc(s.title)} ${matureBadge}</h3>
        <div class="tagline">${esc(s.tagline)}</div>
        <div class="meta">
          <span class="g">${esc(s.genre)}</span>
          <span class="ic">◔ ${n} pesan</span>
        </div>
      </div>
    </div>`;
  }).join("");

  return `
    <section class="hero">
      <h1>Tonton Ceritamu <span class="grad">Terungkap</span></h1>
      <p>Pilih skenario, ngobrol dengan karakter AI yang menjawab dengan teks dan gambar. Kamu yang tentukan arah ceritanya.</p>
      <button class="cta" data-view="create">Buat Cerita Baru</button>
      <button class="cta ghost" data-view="library">Lanjutkan Cerita</button>
    </section>
    <div class="chips">${chips}</div>
    <div class="grid">${cards || '<div class="empty">Tidak ada cerita di genre ini.</div>'}</div>`;
}

function viewCreate() {
  return `
    <h2 class="sectiontitle">Buat Cerita Baru</h2>
    <form class="form" id="customform">
      <div class="field">
        <label>Judul</label>
        <input id="cf_title" placeholder="cth. Drakor Kantor — Rahasia Lantai 7">
      </div>
      <div class="field">
        <label>Tagline (slogan singkat)</label>
        <input id="cf_tagline" placeholder="cth. Setiap rahasia punya harga.">
      </div>
      <div class="field">
        <label>Genre</label>
        <select id="cf_genre">
          ${GENRES.map(g => `<option>${g}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Premis / latar cerita</label>
        <textarea id="cf_premise" placeholder="Ceritakan awal ceritamu: siapa kamu, di mana, apa yang terjadi. AI akan membangun dunia dan karakter dari sini."></textarea>
        <div class="hint">Penjelasan di sini menjadi adegan pembuka dan arah cerita.</div>
      </div>
      <div class="field">
        <label>Karakter (opsional)</label>
        <input id="cf_chars" placeholder="cth. Rara (HRD licik), Dimas (karyawan baru), Bos Surya (misterius)">
      </div>
      <button type="submit" class="btn block">Mulai Cerita</button>
    </form>`;
}

function viewLibrary() {
  const lib = getSessions();
  const ids = Object.keys(lib);
  if (!ids.length) {
    return `<div class="empty">
      <p>Belum ada cerita yang dimulai.</p>
      <button class="cta" data-view="home">Pilih Cerita</button>
    </div>`;
  }
  const cards = ids.map(id => {
    const s = allStories().find(x => x.id === id);
    const sess = lib[id];
    if (!s) return "";
    const n = sess.messages.length;
    return `<div class="card" data-open="${id}">
      <img class="cover" loading="lazy" src="${imageUrl(s.coverPrompt, 640, 760, 7)}" alt="${esc(s.title)}">
      <div class="body">
        <h3>${esc(s.title)}</h3>
        <div class="tagline">${esc(s.tagline)}</div>
        <div class="meta">
          <span class="g">${esc(s.genre)}</span>
          <span class="ic">◔ ${n} pesan</span>
        </div>
      </div>
    </div>`;
  }).join("");
  return `<h2 class="sectiontitle">Perpustakaan</h2><div class="grid">${cards}</div>`;
}

function viewSettings() {
  const cfg = getConfig();
  const hasAuth = SB.ready && SB.session;
  const authBar = hasAuth
    ? `<div class="authbar">
        <span class="email">👤 ${esc(SB.session.user.email)}</span>
        <button class="logout" id="logoutBtn">Keluar</button>
       </div>`
    : (SB.ready
        ? `<div class="authbar">
            <span class="email" style="color:var(--muted)">Belum masuk — data hanya di browser ini.</span>
            <button class="btn" id="loginBtn" style="font-size:13px">Masuk / Daftar</button>
           </div>`
        : "");
  const apiSection = hasAuth
    ? `<div class="cardbox">
        <h3>AI Backend <span class="badge">server-side ✓</span></h3>
        <div class="desc">Key OpenRouter tersimpan aman di server. Tidak perlu input API key manual.</div>
        <div class="field">
          <label>Model (opsional)</label>
          <input id="cfg_model" placeholder="cth. recursive/flint-v1.0:free" value="${esc(cfg.model)}">
          <div class="hint">Biarkan default atau ganti ke model gratis lain dari OpenRouter.</div>
        </div>
        <button class="btn block" id="savecfg">Simpan</button>
        <div class="note" id="cfgok" style="display:none;margin-top:12px">✓ Tersimpan.</div>
       </div>`
    : `<div class="cardbox">
        <h3>API Key <span class="badge">wajib untuk AI beneran</span></h3>
        <div class="desc">Disimpan hanya di browser kamu (localStorage). Tidak dikirim ke server mana pun.</div>
        <div class="field">
          <label>API Key</label>
          <input id="cfg_key" type="password" placeholder="sk-or-v1-..." value="${esc(cfg.apiKey)}">
        </div>
        <div class="field">
          <label>Model</label>
          <input id="cfg_model" placeholder="cth. recursive/flint-v1.0:free" value="${esc(cfg.model)}">
          <div class="hint">Untuk DeepSeek: isi <b>deepseek/deepseek-chat</b> dan ganti Endpoint ke https://api.deepseek.com/v1 (DeepSeek berbayar tipis).</div>
        </div>
        <div class="field">
          <label>Endpoint (biarkan kosong = OpenRouter)</label>
          <input id="cfg_url" placeholder="https://openrouter.ai/api/v1" value="${esc(cfg.baseUrl || "")}">
        </div>
        <button class="btn block" id="savecfg">Simpan</button>
        <div class="note" id="cfgok" style="display:none;margin-top:12px">✓ Tersimpan.</div>
       </div>`;
  return `
    <h2 class="sectiontitle">Pengaturan AI</h2>
    <div class="settings">
      ${authBar}
      <div class="cardbox">
        <h3>Safe Mode <span class="badge">${cfg.safe ? "AKTIF" : "NONAKTIF"}</span></h3>
        <div class="desc">Saat ON, konten dewasa (21+) disembunyikan dan AI menjaga cerita tetap aman untuk semua umur. Saat OFF, cerita 21+ tampil dan AI diizinkan menyajikan tema dewasa.</div>
        <label class="switchrow">
          <input type="checkbox" id="cfg_safe" ${cfg.safe ? "checked" : ""}>
          <span>Mode Aman — filter konten 21+</span>
        </label>
        <div class="field" style="margin-top:14px">
          <label>Konfirmasi usia</label>
          <div class="desc" style="margin-bottom:6px">${cfg.ageOk ? "✓ Sudah terkonfirmasi 21+." : "Belum dikonfirmasi — gate usia akan muncul saat pembukaan."}</div>
          <button class="btn" id="age_confirm">Saya sudah berusia 21+</button>
        </div>
      </div>
      ${apiSection}
    </div>`;
}

// ===== layar main =====
function viewPlay() {
  const story = allStories().find(s => s.id === state.activeStory);
  if (!story) { state.view = "home"; return ""; }
  const sess = getSession(story.id);

  const msgs = sess.messages.map(m => {
    if (m.role === "ai") {
      return `<div class="msg ai">
        <div class="who">${esc(story.title)}</div>
        <div>${esc(m.text)}</div>
        ${m.img ? `<img class="img" src="${m.img}" alt="adegan">` : ""}
      </div>`;
    }
    return `<div class="msg user">${esc(m.text)}</div>`;
  }).join("");

  const lastAi = sess.messages.filter(m => m.role === "ai").pop();
  const sugg = (lastAi && lastAi.sugg) || [];
  const suggHtml = sugg.length ? `
    <div class="sugg">
      <div class="suglabel">Pilih jawaban:</div>
      ${sugg.map((s, i) => `<button class="sug" data-sug="${esc(s)}"><span class="num">${String.fromCharCode(65 + i)}</span>${esc(s)}</button>`).join("")}
    </div>` : "";

  return `
    <div class="storyhead">
      <img class="cover" src="${imageUrl(story.coverPrompt, 640, 760, 7)}" alt="${esc(story.title)}">
      <div class="info">
        <div><span class="genrebadge">${esc(story.genre)}</span></div>
        <h2>${esc(story.title)}</h2>
        <div class="premise">${esc(story.premise)}</div>
        <div class="chars"><b>Karakter:</b> ${esc(story.characters)}</div>
      </div>
    </div>
    <div class="chat" id="chatbox">${msgs}${suggHtml}</div>
    <div class="composer">
      <input id="chatinput" placeholder="Tulis arah cerita..." autocomplete="off">
      <button class="sendbtn" id="sendbtn">➤</button>
    </div>`;
}

function sendMessage(text) {
  const story = allStories().find(s => s.id === state.activeStory);
  const sess = getSession(story.id);
  sess.messages.push({ role: "user", text });
  saveSession(sess);
  state.sending = true;
  rerenderChat();

  const box = $("#chatbox");
  const typing = document.createElement("div");
  typing.className = "typing"; typing.textContent = "Karakter menulis...";
  box.appendChild(typing);
  box.scrollTop = box.scrollHeight;

  askAI(story, sess).then(res => {
    sess.messages.push({ role: "ai", text: res.reply, img: res.img, sugg: res.sugg });
    saveSession(sess);
  }).catch(err => {
    sess.messages.push({ role: "ai", text: "(AI gagal: " + err.message + ")", sugg: [] });
    saveSession(sess);
  }).finally(() => {
    state.sending = false;
    rerenderChat();
  });
}

function rerenderChat() {
  const story = allStories().find(s => s.id === state.activeStory);
  if (!story) return;
  const sess = getSession(story.id);
  const msgs = sess.messages.map(m => {
    if (m.role === "ai") {
      return `<div class="msg ai">
        <div class="who">${esc(story.title)}</div>
        <div>${esc(m.text)}</div>
        ${m.img ? `<img class="img" src="${m.img}" alt="adegan">` : ""}
      </div>`;
    }
    return `<div class="msg user">${esc(m.text)}</div>`;
  }).join("");
  const lastAi = sess.messages.filter(m => m.role === "ai").pop();
  const sugg = (lastAi && lastAi.sugg) || [];
  const suggHtml = sugg.length ? `
    <div class="sugg">
      <div class="suglabel">Pilih jawaban:</div>
      ${sugg.map((s, i) => `<button class="sug" data-sug="${esc(s)}"><span class="num">${String.fromCharCode(65 + i)}</span>${esc(s)}</button>`).join("")}
    </div>` : "";
  $("#chatbox").innerHTML = msgs + suggHtml;
  // bind saran
  $$(".sug").forEach(b => b.addEventListener("click", () => {
    if (!state.sending) sendMessage(b.dataset.sug);
  }));
  const inp = $("#chatinput");
  if (inp) inp.focus();
  const box = $("#chatbox");
  if (box) box.scrollTop = box.scrollHeight;
}

// ===== AI =====
async function askAI(story, sess) {
  const cfg = getConfig();

  // path Supabase + Vercel proxy: AI call lewat server (key aman)
  if (SB.ready) {
    const s = await SBsession();
    if (s) {
      const recent = sess.messages.slice(-12).map(m =>
        (m.role === "user" ? "Pemain: " : story.title + ": ") + m.text
      ).join("\n");

      // sistem prompt dengan konteks cerita
      const sysContent = `Kamu penutur AI untuk cerita interaktif visual berjudul "${story.title}".
Genre: ${story.genre}. Premis: ${story.premise}. Karakter: ${story.characters}.
Lanjutkan narasi imersif orang kedua, 2-4 kalimat. Berikan 3 opsi aksi (A/B/C). Sertakan satu prompt gambar singkat (Inggris).
Kebijakan konten: ${cfg.safe ? "SAFE MODE — jaga cerita tetap aman untuk semua umur." : "MODE 21+ — konten dewasa diperbolehkan, tetap naratif."}
Balas HANYA JSON valid: {"reply":"<narasi>","suggestions":["<opsi A>","<opsi B>","<opsi C>"],"image":"<prompt gambar singkat>"}`;

      const payload = {
        messages: [
          { role: "system", content: sysContent },
          { role: "user", content: recent }
        ],
        safe: cfg.safe,
        model: cfg.model || DEFAULT_MODEL,
      };
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const j = await res.json();
        if (!res.ok) throw new Error("HTTP " + res.status + " " + (j.error || ""));
        const content = j.content || "";
        const parsed = parseAI(content);
        return {
          reply: (parsed && parsed.reply) || content.slice(0, 600),
          sugg: (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length)
            ? parsed.suggestions.slice(0, 3).map(s => String(s).trim())
            : defaultSug(parsed),
          img: (parsed && parsed.image) ? imageUrl(parsed.image) : null,
        };
      } catch (e) { throw e; }
    }
  }

  // fallback: panggil langsung dari browser (key di localStorage)
  const recent = sess.messages.slice(-10).map(m =>
    (m.role === "user" ? "Pemain: " : story.title + ": ") + m.text
  ).join("\n");

  const system = `Kamu adalah penutur AI untuk cerita interaktif visual berjudul "${story.title}".
Genre: ${story.genre}.
Premis: ${story.premise}.
Karakter: ${story.characters}.
Tugasmu: lanjutkan cerita sebagai narasi imersif orang kedua ("kamu"). Jawaban singkat 2-4 kalimat, hidup, tidak bertele-tele. Berikan 3 opsi aksi berbeda (A/B/C) yang bisa dipilih pemain untuk melanjutkan alur. Sertakan juga satu prompt gambar singkat (Inggris) yang menggambarkan adegan saat ini untuk di-generate.

Kebijakan konten: ${cfg.safe ? "SAFE MODE — jaga cerita tetap aman untuk semua umur; HINDARI tema dewasa, kekerasan eksplisit, dan konten seksual." : "MODE 21+ — konten dewasa diperbolehkan sesuai arah pemain, tetap naratif dan tidak eksplisit berlebihan."}

Balas HANYA JSON valid dengan format:
{"reply":"<narasi>","suggestions":["<opsi A>","<opsi B>","<opsi C>"],"image":"<prompt gambar singkat>"}`;

  const user = recent;

  if (!cfg.apiKey) {
    return localNarrator(story, user);
  }

  const url = (cfg.baseUrl || OPENROUTER_URL).replace(/\/$/, "") + "/chat/completions";
  const body = {
    model: cfg.model || DEFAULT_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.9,
    response_format: { type: "json_object" }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + cfg.apiKey
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error("HTTP " + res.status + " — " + t.slice(0, 160));
  }
  const j = await res.json();
  const content = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";

  let parsed = null;
  try { parsed = JSON.parse(content); }
  catch (e) {
    // coba ekstrak JSON
    const m = content.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} }
  }

  const reply = (parsed && parsed.reply) || content.slice(0, 600);
  const sugg = (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length)
    ? parsed.suggestions.slice(0, 3).map(s => String(s).trim())
    : defaultSug(parsed);
  const img = (parsed && parsed.image) ? imageUrl(parsed.image) : null;
  return { reply, sugg, img };
}

function parseAI(content) {
  try { return JSON.parse(content); } catch (e) {}
  const m = content.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
  return null;
}

function defaultSug(parsed) {
  const r = (parsed && parsed.reply) || "";
  return [
    "Selidiki lebih dalam apa yang terjadi di sini.",
    "Berbicara langsung dengan karakter yang ada.",
    "Tunggu sebentar dan perhatikan sekelilingmu."
  ];
}

// penutur lokal (mode demo tanpa key)
function localNarrator(story, user) {
  const lastUser = user.split("\n").pop() || "";
  const g = story.genre;
  let reply;
  if (g === "Romance") {
    reply = "Kamu menghela napas, menatap orang di seberangmu. Ada sesuatu yang ingin diucapkan — tapi kata-kata itu tersangkut di tenggorokan. Hati berdebar pelan, dan jarak di antara kalian terasa begitu dekat sekaligus begitu jauh.";
  } else if (g === "Aksi") {
    reply = "Serangan itu meleset beberapa senti dari wajahmu. Udara berdesis. Kamu menyadari tidak ada waktu untuk ragu — setiap detik membawa konsekuensi baru. Sesuatu bergerak di kegelapan di belakangmu.";
  } else if (g === "Fantasi") {
    reply = "Cahaya biru menyala di telapak tanganmu, lalu memudar. Dunia di sekitarmu berdenyut seperti jantung. Kamu tahu: begitu melangkah, tidak ada jalan kembali. Tapi di sinilah kau harus berada.";
  } else {
    reply = "Segalanya terasa hening sejenak. Lalu suara langkah kaki memecah keheningan. Kamu mengerjap — situasi ini baru saja berubah dengan cara yang tak terduga.";
  }
  const sugg = [
    "Dekati dan bicara langsung.",
    "Periksa sekeliling dengan hati-hati.",
    "Tarik napas dalam, lalu ambil keputusan."
  ];
  return { reply, sugg, img: imageUrl(story.coverPrompt + ", scene continuation", 640, 760, 404) };
}

// boot
// delegasi global: navigasi via data-view (nav atas + cta)
document.addEventListener("click", e => {
  const el = e.target.closest("[data-view]");
  if (el) { state.view = el.dataset.view; render(); }
});
render();

// supabase: init, kalau siap + belum login -> minta login; kalau sudah -> hydrate
SBinit();
if (SB.ready) {
  (async () => {
    try {
      const s = await SBsession();
      if (s) { await hydrateFromCloud(); render(); }
      else showAuthOverlay();
    } catch (e) {}
  })();
}

// fallback gambar: kalau Pollinations gagal/lambat, ganti gradient
const FALLBACK_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="760">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#6b4096"/><stop offset="1" stop-color="#2a2340"/>' +
  '</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>');
document.addEventListener("error", e => {
  if (e.target && e.target.tagName === "IMG" && !e.target.dataset.fb) {
    e.target.dataset.fb = "1";
    e.target.src = FALLBACK_SVG;
  }
}, true);

// gate usia 21+ (sekali, sampai dikonfirmasi)
(function ageGate() {
  if (getConfig().ageOk) return;
  const overlay = document.createElement("div");
  overlay.className = "agegate";
  overlay.innerHTML = `
    <div class="agegate-box">
      <div class="agegate-logo"><span class="logo">zenn</span>AI</div>
      <h2>Konten Dewasa 21+</h2>
      <p>zennAI menyediakan cerita dengan tema dewasa (21+). Dengan melanjutkan, kamu menyatakan sudah berusia 21 tahun atau lebih dan menyetujui konten tersebut.</p>
      <button class="cta" id="ageOkBtn">Saya sudah berusia 21+</button>
      <div class="agegate-note">Safe Mode default AKTIF — konten 21+ disembunyikan kecuali dinonaktifkan di Pengaturan.</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#ageOkBtn").addEventListener("click", () => {
    const c = getConfig(); c.ageOk = true; saveConfig(c);
    overlay.remove();
  });
})();
