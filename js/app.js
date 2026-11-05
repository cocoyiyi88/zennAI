// zennAI — State Engine & BagelChat RPG Client
// Tanpa virtual currency: Bebas chat tanpa koin/energi

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const state = {
  view: "home", // home | create | library | settings | play
  activeStory: null,
  activeGenre: "Semua",
  activeTag: null,
  searchQuery: "",
  sending: false,
  activeModal: null, // persona | scenario | album | status | zoom
  zoomImageUrl: null,
};

// URL helper Pollinations
function imageUrl(prompt, w = 640, h = 760, seed) {
  const p = encodeURIComponent(String(prompt || "anime scene").trim());
  const s = seed !== undefined ? seed : Math.floor(Math.random() * 100000);
  return `https://image.pollinations.ai/prompt/${p}?width=${w}&height=${h}&seed=${s}&nologo=true`;
}

function avatarUrl(prompt, seed = 42) {
  const p = encodeURIComponent(String(prompt || "anime character portrait face").trim());
  return `https://image.pollinations.ai/prompt/${p}?width=150&height=150&seed=${seed}&nologo=true`;
}

// Data cerita
function allStories() {
  return [...SEED_STORIES, ...getUserStories()];
}

// Inisialisasi State RPG untuk sesi cerita
function getStoryRPGState(storyId) {
  const key = "zenn_rpg_" + storyId;
  const story = allStories().find(s => s.id === storyId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Buat initial RPG state dari seed story
  const initial = {
    env: story && story.env ? { ...story.env } : { day: "Hari Ini", time: "12:00", location: "Dunia Cerita", status: "Aktif" },
    mission: story && story.mission ? { ...story.mission } : { title: "Petualangan Baru", client: "Diri Sendiri", objective: "Jelajahi alur cerita" },
    worldStats: story && story.worldStats ? { ...story.worldStats } : { reputation: "Pendatang Baru", members: "100%" },
    affection: {}
  };

  if (story && Array.isArray(story.charactersList)) {
    story.charactersList.forEach(c => {
      initial.affection[c.name] = c.heart || 10;
    });
  }
  saveStoryRPGState(storyId, initial);
  return initial;
}

function saveStoryRPGState(storyId, rpg) {
  localStorage.setItem("zenn_rpg_" + storyId, JSON.stringify(rpg));
}

// Session Chat Messages
function getSession(storyId) {
  const story = allStories().find(s => s.id === storyId);
  const key = "zenn_sess_" + storyId;
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (s && Array.isArray(s.messages)) return s;
  } catch (e) {}

  const openingMsg = (story && story.opening) || (story && story.premise) || "Cerita dimulai.";
  const defaultSug = ["Lanjutkan perlahan dan amati sekeliling", "Bicara langsung dengan orang di dekatmu", "Ambil inisiatif untuk bertindak"];
  
  const initial = {
    storyId,
    messages: [
      {
        role: "ai",
        sender: story ? (story.charactersList && story.charactersList[0] ? story.charactersList[0].name : story.title) : "Narator",
        text: openingMsg,
        img: story && story.coverPrompt ? imageUrl(story.coverPrompt, 640, 760, 101) : null,
        sugg: defaultSug,
        delta: null
      }
    ]
  };
  saveSession(initial);
  if (initial.messages[0].img) {
    saveStoryAlbum(storyId, initial.messages[0].img, "Adegan Awal: " + (story ? story.title : ""));
  }
  return initial;
}

function saveSession(sess) {
  localStorage.setItem("zenn_sess_" + sess.storyId, JSON.stringify(sess));
}

// Render Utama
function render() {
  const cfg = getConfig();
  const nav = $("#nav");
  if (nav) {
    nav.innerHTML = `
      <button class="navbtn ${state.view === "home" ? "active" : ""}" data-view="home">Beranda</button>
      <button class="navbtn ${state.view === "library" ? "active" : ""}" data-view="library">Koleksi (${Object.keys(loadLibrary()).length})</button>
      <button class="navbtn ${state.view === "create" ? "active" : ""}" data-view="create">+ Buat Cerita</button>
      <button class="navbtn ${state.view === "settings" ? "active" : ""}" data-view="settings">Pengaturan</button>
    `;
  }

  const v = $("#view");
  if (!v) return;

  switch (state.view) {
    case "home": v.innerHTML = viewHome(); bindHome(); break;
    case "create": v.innerHTML = viewCreate(); bindCreate(); break;
    case "library": v.innerHTML = viewLibrary(); bindLibrary(); break;
    case "settings": v.innerHTML = viewSettings(); bindSettings(); break;
    case "play": v.innerHTML = viewPlay(); bindPlay(); break;
    default: v.innerHTML = viewHome(); bindHome(); break;
  }
  renderModals();
}

// View: Home
function viewHome() {
  const cfg = getConfig();
  const all = allStories();

  // Filter Safe Mode & Gender
  let list = all.filter(s => {
    if (cfg.safe && isMature(s)) return false;
    if (cfg.gender === "m" && s.gender === "f") return false;
    if (cfg.gender === "f" && s.gender === "m") return false;
    return true;
  });

  // Filter Genre
  if (state.activeGenre && state.activeGenre !== "Semua") {
    list = list.filter(s => s.genre === state.activeGenre);
  }

  // Filter Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(s => s.title.toLowerCase().includes(q) || (s.tagline && s.tagline.toLowerCase().includes(q)) || (s.tags && s.tags.some(t => t.toLowerCase().includes(q))));
  }

  const chipsHtml = ["Semua", ...GENRES].map(g =>
    `<button class="chip ${state.activeGenre === g ? "active" : ""}" data-genre="${esc(g)}">${esc(g)}</button>`
  ).join("");

  const cardsHtml = list.length ? list.map(s => {
    const matureTag = isMature(s) ? `<span class="badge21">21+</span>` : "";
    const tagsHtml = (s.tags || []).slice(0, 3).map(t => `<span class="card-tag">${esc(t)}</span>`).join("");
    const statsHtml = s.stats ? `<div class="card-stats"><span>🎨 ${s.stats.assets || 100}+</span><span>💬 ${s.stats.chats || '1K'}</span></div>` : "";
    
    return `
      <div class="card" data-story="${esc(s.id)}">
        <img class="cover" src="${imageUrl(s.coverPrompt, 400, 260, 42)}" alt="${esc(s.title)}" loading="lazy">
        <div class="body">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>${esc(s.title)} ${matureTag}</h3>
            <span class="g" style="font-size:11px;color:var(--accent3);font-weight:700">${esc(s.genre)}</span>
          </div>
          <div class="tagline">${esc(s.tagline || s.premise)}</div>
          ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ""}
          ${statsHtml}
        </div>
      </div>
    `;
  }).join("") : `<div class="empty">Tidak ada cerita ditemukan.<br><button class="cta" data-view="create">Buat Cerita Baru</button></div>`;

  return `
    <div class="hero">
      <h1>Rasakan Cerita <span class="grad">Interaktif Visual</span></h1>
      <p>Karakter hidup, pilihan berdampak, afeksi dinamis, tanpa batasan token atau koin virtual.</p>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:20px">
        <input id="search-input" style="max-width:320px;padding:10px 16px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--fg);font-size:14px;outline:none" placeholder="Cari judul, tag, tema..." value="${esc(state.searchQuery)}">
      </div>
    </div>
    <div class="chips">${chipsHtml}</div>
    <div class="grid">${cardsHtml}</div>
  `;
}

function bindHome() {
  $$(".chip").forEach(c => c.addEventListener("click", () => {
    state.activeGenre = c.dataset.genre;
    render();
  }));

  const sinp = $("#search-input");
  if (sinp) {
    sinp.addEventListener("input", e => {
      state.searchQuery = e.target.value;
      // render live search
      const cfg = getConfig();
      let list = allStories().filter(s => {
        if (cfg.safe && isMature(s)) return false;
        if (cfg.gender === "m" && s.gender === "f") return false;
        if (cfg.gender === "f" && s.gender === "m") return false;
        return true;
      });
      if (state.activeGenre !== "Semua") list = list.filter(s => s.genre === state.activeGenre);
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        list = list.filter(s => s.title.toLowerCase().includes(q) || (s.tagline && s.tagline.toLowerCase().includes(q)) || (s.tags && s.tags.some(t => t.toLowerCase().includes(q))));
      }
      const grid = $(".grid");
      if (grid) {
        grid.innerHTML = list.length ? list.map(s => `
          <div class="card" data-story="${esc(s.id)}">
            <img class="cover" src="${imageUrl(s.coverPrompt, 400, 260, 42)}" alt="${esc(s.title)}" loading="lazy">
            <div class="body">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <h3>${esc(s.title)} ${isMature(s) ? `<span class="badge21">21+</span>` : ""}</h3>
                <span class="g" style="font-size:11px;color:var(--accent3);font-weight:700">${esc(s.genre)}</span>
              </div>
              <div class="tagline">${esc(s.tagline || s.premise)}</div>
              ${s.tags ? `<div class="card-tags">${s.tags.slice(0, 3).map(t => `<span class="card-tag">${esc(t)}</span>`).join("")}</div>` : ""}
            </div>
          </div>
        `).join("") : `<div class="empty">Tidak ada cerita ditemukan.</div>`;
        bindCardClicks();
      }
    });
  }

  bindCardClicks();
}

function bindCardClicks() {
  $$(".card").forEach(c => c.addEventListener("click", () => {
    state.activeStory = c.dataset.story;
    state.view = "play";
    // catat ke koleksi jika belum ada
    const lib = loadLibrary();
    if (!lib[state.activeStory]) {
      lib[state.activeStory] = { addedAt: Date.now() };
      saveLibrary(lib);
    }
    render();
  }));
}

// View: Library
function viewLibrary() {
  const lib = loadLibrary();
  const ids = Object.keys(lib);
  const stories = allStories().filter(s => ids.includes(s.id));

  return `
    <h2 class="sectiontitle">Koleksi Cerita Saya (${stories.length})</h2>
    <div class="grid">
      ${stories.length ? stories.map(s => `
        <div class="card" data-story="${esc(s.id)}">
          <img class="cover" src="${imageUrl(s.coverPrompt, 400, 260, 55)}" alt="${esc(s.title)}">
          <div class="body">
            <h3>${esc(s.title)}</h3>
            <div class="tagline">${esc(s.tagline || s.premise)}</div>
          </div>
        </div>
      `).join("") : `<div class="empty">Belum ada cerita yang dimainkan.<br><button class="cta" data-view="home">Cari Cerita</button></div>`}
    </div>
  `;
}
function bindLibrary() { bindCardClicks(); }

// View: Create
function viewCreate() {
  return `
    <h2 class="sectiontitle">Buat Cerita RPG Sendiri</h2>
    <div class="form cardbox" style="padding:24px;border-radius:18px;background:var(--card);border:1px solid var(--line)">
      <div class="field">
        <label>Judul Cerita *</label>
        <input id="c_title" placeholder="Cth: Rahasia Kafe Hantu">
      </div>
      <div class="field">
        <label>Genre</label>
        <select id="c_genre">${GENRES.map(g => `<option value="${g}">${g}</option>`).join("")}</select>
      </div>
      <div class="field">
        <label>Premis / Sinopsis Singkat *</label>
        <textarea id="c_premise" placeholder="Ceritakan latar belakang dan konflik utama..."></textarea>
      </div>
      <div class="field">
        <label>Karakter Utama (Nama, peran, sifat)</label>
        <textarea id="c_chars" placeholder="Cth: Rena (Pelatih senior galak), Laila (Instruktur dingin)"></textarea>
      </div>
      <div class="field">
        <label>Prompt Visual Cover (Bahasa Inggris)</label>
        <input id="c_cover" placeholder="anime cozy cafe at night, mysterious female barista, warm ambient lighting">
      </div>
      <button class="btn block" id="btn-save-story" style="margin-top:10px">Terbitkan Cerita</button>
    </div>
  `;
}
function bindCreate() {
  const b = $("#btn-save-story");
  if (b) {
    b.addEventListener("click", () => {
      const title = $("#c_title").value.trim();
      const premise = $("#c_premise").value.trim();
      if (!title || !premise) return alert("Judul dan Premis wajib diisi!");
      const newStory = {
        id: "user-" + Date.now(),
        title,
        genre: $("#c_genre").value,
        premise,
        tagline: premise.slice(0, 80) + "...",
        characters: $("#c_chars").value.trim() || "Karakter Misterius",
        charactersList: [
          { name: "Partner", role: "Rekan Utama", heart: 10, bio: "Selalu mendampingimu.", avatarPrompt: "anime handsome friendly companion" }
        ],
        coverPrompt: $("#c_cover").value.trim() || "anime aesthetic cinematic background, vibrant style",
        env: { day: "Hari ke-1", time: "10:00", location: "Awal Petualangan", status: "Bersiap" },
        mission: { title: "Langkah Pertama", client: "Diri Sendiri", objective: "Mulai perjalanan baru" },
        worldStats: { reputation: "Petualang Pemula", members: "100%" },
        opening: `Kamu memulai kisah baru: "${title}". Angin berhembus lembut menyambut keputusanmu.`
      };
      saveUserStory(newStory);
      state.activeStory = newStory.id;
      state.view = "play";
      render();
    });
  }
}

// View: Settings
function viewSettings() {
  const cfg = getConfig();
  const authBar = SB.user ? `
    <div class="authbar">
      <div>Masuk sebagai: <span class="email">${esc(SB.user.email)}</span></div>
      <button class="logout" id="logoutbtn">Keluar</button>
    </div>` : `
    <div class="authbar">
      <div>Akun Tamu (Tersimpan Lokal)</div>
      <button class="btn" style="padding:6px 14px;font-size:12px" id="loginshowbtn">Masuk Supabase</button>
    </div>`;

  return `
    <h2 class="sectiontitle">Pengaturan Akun & Model AI</h2>
    <div class="settings">
      ${authBar}
      <div class="cardbox">
        <h3>Safe Mode <span class="badge">${cfg.safe ? "AKTIF" : "NONAKTIF"}</span></h3>
        <div class="desc">Saat ON, konten dewasa (21+) disembunyikan. Saat OFF, cerita 21+ tampil bebas.</div>
        <label class="switchrow">
          <input type="checkbox" id="cfg_safe" ${cfg.safe ? "checked" : ""}>
          <span>Mode Aman — filter konten 21+</span>
        </label>
      </div>

      <div class="cardbox">
        <h3>Preferensi Gender Cerita <span class="badge">${cfg.gender === "m" ? "Cowok" : cfg.gender === "f" ? "Cewek" : "Semua"}</span></h3>
        <div class="desc">Menyesuaikan rekomendasi cerita di halaman beranda.</div>
        <button class="btn" id="btn_gender_toggle">Ubah Preferensi</button>
      </div>

      <div class="cardbox">
        <h3>Persona Karakter Pemain (User)</h3>
        <div class="desc">Informasi yang dibaca oleh AI saat kamu berinteraksi di dalam cerita.</div>
        <div class="field">
          <label>Nama Panggilan</label>
          <input id="cfg_persona_name" value="${esc(cfg.personaName || "Petualang")}">
        </div>
        <div class="field">
          <label>Gender / Sapaan</label>
          <select id="cfg_persona_gender">
            <option value="Pria" ${cfg.personaGender === "Pria" ? "selected" : ""}>Pria (Cowok)</option>
            <option value="Wanita" ${cfg.personaGender === "Wanita" ? "selected" : ""}>Wanita (Cewek)</option>
            <option value="Netral" ${cfg.personaGender === "Netral" ? "selected" : ""}>Netral</option>
          </select>
        </div>
        <div class="field">
          <label>Biodata / Karakteristik Diri</label>
          <textarea id="cfg_persona_bio" placeholder="Cth: Tenang, suka menolong, misterius...">${esc(cfg.personaBio || "")}</textarea>
        </div>
        <button class="btn block" id="btn_save_persona">Simpan Persona</button>
      </div>

      <div class="cardbox">
        <h3>Pilihan Model AI (OpenRouter)</h3>
        <div class="desc">Menggunakan Vercel Serverless Proxy key-shielded secara otomatis.</div>
        <div class="field">
          <label>Model LLM</label>
          <input id="cfg_model" list="model_list" value="${esc(cfg.model || DEFAULT_MODEL)}">
        </div>
        <button class="btn block" id="btn_save_model">Simpan Model</button>
      </div>
    </div>

    <datalist id="model_list">
      <option value="recursive/flint-v1.0:free">
      <option value="google/gemini-4-argon">
      <option value="anthropic/claude-sonnet-5.5">
      <option value="anthropic/claude-opus-5.5">
      <option value="openai/gpt-6-luna-pro">
      <option value="deepseek/deepseek-v4.1-flash-1017">
      <option value="mistralai/mistral-large-4-0">
      <option value="qwen/qwen3.8-max-prime">
      <option value="liquid/lfm-2.5-24b-a2b">
      <option value="nvidia/nemotron-3.5-super-vl:free">
      <option value="xingchen-agi/xing4.0-29b-a4b:free">
    </datalist>
  `;
}

function bindSettings() {
  const safeCb = $("#cfg_safe");
  if (safeCb) safeCb.addEventListener("change", e => {
    const c = getConfig(); c.safe = e.target.checked; saveConfig(c);
  });

  const bGender = $("#btn_gender_toggle");
  if (bGender) bGender.addEventListener("click", () => showGenderModal());

  const bPersona = $("#btn_save_persona");
  if (bPersona) bPersona.addEventListener("click", () => {
    const c = getConfig();
    c.personaName = $("#cfg_persona_name").value.trim() || "Petualang";
    c.personaGender = $("#cfg_persona_gender").value;
    c.personaBio = $("#cfg_persona_bio").value.trim();
    saveConfig(c);
    alert("Persona pemain berhasil diperbarui!");
  });

  const bModel = $("#btn_save_model");
  if (bModel) bModel.addEventListener("click", () => {
    const c = getConfig();
    c.model = $("#cfg_model").value.trim() || DEFAULT_MODEL;
    saveConfig(c);
    alert("Model tersimpan: " + c.model);
  });

  const lOut = $("#logoutbtn");
  if (lOut) lOut.addEventListener("click", async () => {
    await SBlogout();
    location.reload();
  });

  const lIn = $("#loginshowbtn");
  if (lIn) lIn.addEventListener("click", () => showAuthOverlay());
}

// ================= VIEW: GAME PLAY (BagelChat Style) =================
function viewPlay() {
  const story = allStories().find(s => s.id === state.activeStory);
  if (!story) { state.view = "home"; return ""; }

  const sess = getSession(story.id);
  const rpg = getStoryRPGState(story.id);
  const cfg = getConfig();

  // Render list pesan
  const msgsHtml = sess.messages.map((m, idx) => {
    if (m.role === "user") {
      return `
        <div class="chat-row user-row">
          <div class="chat-avatar chat-avatar-user">${esc((cfg.personaName || "U")[0].toUpperCase())}</div>
          <div class="chat-bubble-wrap">
            <div class="chat-sender-name">${esc(cfg.personaName || "Kamu")}</div>
            <div class="chat-bubble">${esc(m.text)}</div>
          </div>
        </div>
      `;
    }

    // AI message
    const charName = m.sender || story.title;
    const charObj = (story.charactersList || []).find(c => c.name.toLowerCase() === charName.toLowerCase()) || (story.charactersList && story.charactersList[0]);
    const avPrompt = charObj ? charObj.avatarPrompt : "anime visual novel character portrait";
    const deltaTag = m.delta ? `<div class="affection-delta">❤️ +${m.delta} Kasih Sayang (${esc(charName)})</div>` : "";

    return `
      <div class="chat-row ai-row">
        <img class="chat-avatar" src="${avatarUrl(avPrompt, idx + 10)}" alt="${esc(charName)}" loading="lazy">
        <div class="chat-bubble-wrap">
          <div class="chat-sender-name">${esc(charName)}</div>
          <div class="chat-bubble">${esc(m.text)}</div>
          ${m.img ? `
            <div class="scene-img-card" data-img-zoom="${esc(m.img)}">
              <img src="${m.img}" alt="Ilustrasi adegan" loading="lazy">
              <span class="scene-img-badge">🔍 Perbesar / Simpan</span>
            </div>` : ""}
          ${deltaTag}
        </div>
      </div>
    `;
  }).join("");

  // Opsi Saran Terakhir
  const lastAi = sess.messages.filter(m => m.role === "ai").pop();
  const suggestions = (lastAi && lastAi.sugg && lastAi.sugg.length) ? lastAi.sugg : [
    "Tanyakan apa langkah kita berikutnya",
    "Sentuh atau dekati dengan hangat",
    "Periksa area sekitar dengan cermat"
  ];

  const suggHtml = `
    <div class="game-suggestions">
      <div class="sugg-header">
        <span>⚡ Pilihan Respons Cepat</span>
        <button class="sugg-refresh-btn" id="btn-refresh-sugg">🔄 Minta Saran Baru</button>
      </div>
      <div class="sugg-list">
        ${suggestions.map((s, i) => `
          <button class="sugg-btn" data-sugg="${esc(s)}">
            <span class="sugg-btn-num">${String.fromCharCode(65 + i)}</span>
            <span>${esc(s)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  return `
    <div class="game-topbar">
      <div class="game-topbar-left">
        <button class="icon-btn" id="btn-back-home" title="Kembali ke Beranda">←</button>
        <div>
          <div class="game-topbar-title">${esc(story.title)}</div>
          <div style="font-size:11px;color:var(--muted)">📍 ${esc(rpg.env.location || "Dalam Cerita")} · ${esc(rpg.env.time || "")}</div>
        </div>
      </div>
      <div class="game-topbar-actions">
        <button class="icon-btn" id="btn-open-persona" title="Persona Karakter Kamu">👤</button>
        <button class="icon-btn" id="btn-open-scenario" title="Skenario & Lingkungan">🗺️</button>
        <button class="icon-btn" id="btn-open-album" title="Album Koleksi Gambar">🖼️</button>
        <button class="icon-btn" id="btn-open-status" title="Status Afeksi & Misi">📊</button>
      </div>
    </div>

    <div class="game-container">
      <div class="game-chat-scroll" id="game-chat-box">
        ${msgsHtml}
      </div>
      ${suggHtml}
      <div class="game-composer">
        <input class="game-composer-input" id="game-input" placeholder="Ketik aksi, dialog, atau respons bebasmu..." autocomplete="off">
        <button class="sendbtn" id="btn-send-game">➤</button>
      </div>
    </div>
  `;
}

function bindPlay() {
  const story = allStories().find(s => s.id === state.activeStory);
  if (!story) return;

  // Back button
  const back = $("#btn-back-home");
  if (back) back.addEventListener("click", () => {
    state.view = "home";
    render();
  });

  // Action icons modal trigger
  $("#btn-open-persona")?.addEventListener("click", () => { state.activeModal = "persona"; renderModals(); });
  $("#btn-open-scenario")?.addEventListener("click", () => { state.activeModal = "scenario"; renderModals(); });
  $("#btn-open-album")?.addEventListener("click", () => { state.activeModal = "album"; renderModals(); });
  $("#btn-open-status")?.addEventListener("click", () => { state.activeModal = "status"; renderModals(); });

  // Suggestion buttons click
  $$(".sugg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const text = btn.dataset.sugg;
      if (text && !state.sending) sendGameMessage(text);
    });
  });

  // Refresh suggestion button
  $("#btn-refresh-sugg")?.addEventListener("click", async () => {
    const sess = getSession(story.id);
    const lastAi = sess.messages.filter(m => m.role === "ai").pop();
    if (!lastAi) return;
    lastAi.sugg = [
      "Bicarakan rencana rahasia bersamanya",
      "Perhatikan ekspresi wajahnya yang malu-malu",
      "Ambil langkah berani tak terduga"
    ];
    saveSession(sess);
    render();
  });

  // Send input click & Enter
  const input = $("#game-input");
  const sendBtn = $("#btn-send-game");
  if (sendBtn && input) {
    sendBtn.addEventListener("click", () => {
      const val = input.value.trim();
      if (val && !state.sending) {
        input.value = "";
        sendGameMessage(val);
      }
    });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });
    input.focus();
  }

  // Image zoom click
  $$("[data-img-zoom]").forEach(el => {
    el.addEventListener("click", () => {
      state.zoomImageUrl = el.dataset.imgZoom;
      state.activeModal = "zoom";
      renderModals();
    });
  });

  // Auto-scroll chat to bottom
  const box = $("#game-chat-box");
  if (box) box.scrollTop = box.scrollHeight;
}

// Kirim Pesan & Panggil AI RPG
async function sendGameMessage(userText) {
  const story = allStories().find(s => s.id === state.activeStory);
  if (!story) return;

  const sess = getSession(story.id);
  const rpg = getStoryRPGState(story.id);
  const cfg = getConfig();

  sess.messages.push({ role: "user", text: userText });
  saveSession(sess);
  state.sending = true;
  render();

  // Scroll to bottom
  const box = $("#game-chat-box");
  if (box) {
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.id = "active-typing";
    typing.style.padding = "10px 20px";
    typing.textContent = "AI sedang menyusun kelanjutan cerita & reaksi karakter...";
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
  }

  try {
    const result = await requestAIRPGResponse(story, sess, rpg, cfg);
    
    // Update RPG state (Affection, Scene, Album)
    if (result.affection_delta && story.charactersList && story.charactersList.length) {
      const primeChar = story.charactersList[0].name;
      rpg.affection[primeChar] = (rpg.affection[primeChar] || 10) + result.affection_delta;
      saveStoryRPGState(story.id, rpg);
    }

    if (result.image) {
      saveStoryAlbum(story.id, result.image, result.reply.slice(0, 50));
    }

    sess.messages.push({
      role: "ai",
      sender: (story.charactersList && story.charactersList[0]) ? story.charactersList[0].name : story.title,
      text: result.reply,
      img: result.image,
      sugg: result.suggestions,
      delta: result.affection_delta
    });
    saveSession(sess);
  } catch (err) {
    console.error("AI Error:", err);
    sess.messages.push({
      role: "ai",
      sender: "Sistem",
      text: "Terjadi gangguan saat memproses balasan: " + err.message + ". Silakan ulangi pilihanmu.",
      sugg: ["Ulangi aksi sebelumnya", "Coba respon alternatif", "Tanyakan apa yang terjadi"]
    });
    saveSession(sess);
  } finally {
    state.sending = false;
    render();
  }
}

// Handler Pemanggilan AI via Proxy Vercel atau Direct OpenRouter
async function requestAIRPGResponse(story, sess, rpg, cfg) {
  const personaName = cfg.personaName || "Pemain";
  const personaGender = cfg.personaGender || "Netral";
  const personaBio = cfg.personaBio || "Seseorang yang berjiwa petualang.";

  const recentHistory = sess.messages.slice(-8).map(m =>
    (m.role === "user" ? `${personaName}: ` : `${m.sender || story.title}: `) + m.text
  ).join("\n");

  const systemPrompt = `Kamu adalah game master RPG dan penutur visual novel imersif untuk cerita "${story.title}".
Genre: ${story.genre}.
Latar Tempat: ${rpg.env.location || "Area Utama"}. Waktu: ${rpg.env.time || "Siang"}. Hari: ${rpg.env.day || "Hari ini"}.
Misi Saat Ini: ${rpg.mission.objective || "Jelajahi alur"}.
Persona Pemain: Nama: "${personaName}", Gender: "${personaGender}", Sifat/Bio: "${personaBio}".
Daftar Karakter: ${JSON.stringify(story.charactersList || story.characters)}.

INSTRUKSI:
1. Lanjutkan cerita dengan gaya visual novel interaktif yang hidup, deskriptif, dan memikat (2-4 kalimat).
2. Libatkan reaksi emosional karakter terhadap pilihan ${personaName}.
3. Tentukan pertambahan afeksi (affection_delta) integer antara 1 sampai 5 jika tindakan pemain menyenangkan/menarik, atau 0.
4. Berikan tepat 3 opsi aksi cepat (suggestions) yang logis dan variatif untuk pemain.
5. Buat prompt visual singkat bahasa Inggris (image) yang menggambarkan momen krusial saat ini.
Kebijakan Konten: ${cfg.safe ? "SAFE MODE: Hindari konten seksual dan kekerasan ekstrem." : "MODE BEBAS 21+: Bolehkan nuansa romansa dewasa, ketegangan intens, dan binal naratif."}

KEMBALIKAN HANYA JSON VALID:
{
  "reply": "narasi respons cerita...",
  "suggestions": ["opsi 1", "opsi 2", "opsi 3"],
  "image": "anime scene prompt english",
  "affection_delta": 2
}`;

  // Coba Vercel Proxy /api/ai
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: recentHistory }
        ],
        safe: cfg.safe,
        model: cfg.model || DEFAULT_MODEL
      })
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.content || "";
      const parsed = parseAIContent(content);
      if (parsed) {
        return {
          reply: parsed.reply || content.slice(0, 500),
          suggestions: (Array.isArray(parsed.suggestions) && parsed.suggestions.length) ? parsed.suggestions.slice(0, 3) : defaultQuickSugg(),
          image: parsed.image ? imageUrl(parsed.image, 640, 760) : null,
          affection_delta: typeof parsed.affection_delta === "number" ? parsed.affection_delta : 1
        };
      }
    }
  } catch (proxyErr) {
    console.warn("Proxy call failed, fallback local/direct:", proxyErr);
  }

  // Fallback Direct OpenRouter jika ada API Key di config
  if (cfg.apiKey) {
    const directRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.apiKey
      },
      body: JSON.stringify({
        model: cfg.model || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: recentHistory }
        ],
        temperature: 0.85,
        response_format: { type: "json_object" }
      })
    });
    if (directRes.ok) {
      const dj = await directRes.json();
      const c = dj.choices && dj.choices[0] && dj.choices[0].message && dj.choices[0].message.content;
      const parsed = parseAIContent(c);
      if (parsed) {
        return {
          reply: parsed.reply,
          suggestions: parsed.suggestions || defaultQuickSugg(),
          image: parsed.image ? imageUrl(parsed.image, 640, 760) : null,
          affection_delta: parsed.affection_delta || 1
        };
      }
    }
  } catch (e) {
    // Lewati jika lokal atau endpoint vercel tidak ada
  }

  // Fallback cerdas offline simulator jika offline atau API limit
  return simulateOfflineStory(story, userText);
}

function parseAIContent(content) {
  if (!content) return null;
  try { return JSON.parse(content); } catch (e) {}
  const match = content.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch (e2) {}
  }
  return null;
}

function defaultQuickSugg() {
  return [
    "Dekati dia dan tanyakan perasaannya",
    "Fokus pada misi dan abaikan godaan",
    "Buat keputusan tak terduga yang mengejutkan"
  ];
}

function simulateOfflineStory(story, userText) {
  const replies = [
    `Tatapan matanya tertuju langsung padamu. Menanggapi perkataanmu, suasana seketika terasa semakin intim. "Kamu selalu tahu cara membuat situasi jadi menarik," bisiknya pelan.`,
    `Langkahmu terbukti tepat. Keadaan di sekitar perlahan berubah sesuai arahanmu, dan rekanmu mengangguk mantap menunjukkan kepercayaan penuh kepadamu.`,
    `Sentuhan kecil di lenganmu menyadarkanmu dari lamunan. "Jangan lengah sekarang," ucapnya sambil tersenyum tipis yang penuh makna.`
  ];
  const randReply = replies[Math.floor(Math.random() * replies.length)];
  return {
    reply: randReply,
    suggestions: defaultQuickSugg(),
    image: imageUrl(story.coverPrompt + ", dramatic close up character emotion scene", 640, 760),
    affection_delta: 2
  };
}

// ================= MODALS & DRAWERS =================
function renderModals() {
  // Bersihkan modal lama jika ada
  const existing = $("#active-rpg-modal");
  if (existing) existing.remove();

  if (!state.activeModal) return;

  const story = allStories().find(s => s.id === state.activeStory);
  const rpg = story ? getStoryRPGState(story.id) : null;
  const cfg = getConfig();

  const wrap = document.createElement("div");
  wrap.className = "rpg-modal";
  wrap.id = "active-rpg-modal";

  let bodyHtml = "";
  let modalTitle = "";

  if (state.activeModal === "persona") {
    modalTitle = "👤 Persona Karakter Kamu";
    bodyHtml = `
      <div class="field">
        <label>Nama Karakter Kamu</label>
        <input id="modal_p_name" value="${esc(cfg.personaName || "Petualang")}">
      </div>
      <div class="field">
        <label>Gender / Panggilan</label>
        <select id="modal_p_gender">
          <option value="Pria" ${cfg.personaGender === "Pria" ? "selected" : ""}>Pria</option>
          <option value="Wanita" ${cfg.personaGender === "Wanita" ? "selected" : ""}>Wanita</option>
          <option value="Netral" ${cfg.personaGender === "Netral" ? "selected" : ""}>Netral</option>
        </select>
      </div>
      <div class="field">
        <label>Sifat / Bio (AI akan merespons ini)</label>
        <textarea id="modal_p_bio">${esc(cfg.personaBio || "")}</textarea>
      </div>
      <button class="btn block" id="btn-save-modal-persona">Simpan Persona</button>
    `;
  } else if (state.activeModal === "scenario") {
    modalTitle = "🗺️ Pengaturan Skenario Cerita";
    bodyHtml = `
      <div class="field">
        <label>Hari / Waktu Saat Ini</label>
        <input id="modal_sc_time" value="${esc(rpg.env.day || "")} - ${esc(rpg.env.time || "")}">
      </div>
      <div class="field">
        <label>Lokasi Adegan</label>
        <input id="modal_sc_loc" value="${esc(rpg.env.location || "")}">
      </div>
      <div class="field">
        <label>Status Suasana</label>
        <input id="modal_sc_status" value="${esc(rpg.env.status || "")}">
      </div>
      <button class="btn block" id="btn-save-modal-scenario">Perbarui Skenario</button>
    `;
  } else if (state.activeModal === "album") {
    modalTitle = "🖼️ Album Koleksi Cerita";
    const album = loadStoryAlbum(story ? story.id : "");
    bodyHtml = album.length ? `
      <div class="desc" style="font-size:12px;color:var(--muted)">Gambar adegan yang berhasil di-unlock sepanjang percakapan:</div>
      <div class="album-grid">
        ${album.map(item => `
          <div class="album-item" data-zoom-url="${esc(item.url)}">
            <img src="${item.url}" alt="${esc(item.caption)}" loading="lazy">
          </div>
        `).join("")}
      </div>
    ` : `<div class="empty">Belum ada adegan yang di-unlock dalam cerita ini. Teruslah mengobrol untuk mengoleksi ilustrasi!</div>`;
  } else if (state.activeModal === "status") {
    modalTitle = "📊 Status Afeksi & Misi";
    const charsHtml = (story.charactersList || []).map(c => {
      const heart = (rpg.affection && rpg.affection[c.name]) || c.heart || 10;
      const pct = Math.min(100, Math.max(0, heart));
      return `
        <div class="char-card-row">
          <img class="char-card-avatar" src="${avatarUrl(c.avatarPrompt, 88)}" alt="${esc(c.name)}">
          <div class="char-card-info">
            <div class="char-card-name">${esc(c.name)}</div>
            <div class="char-card-role">${esc(c.role || "Rekan")}</div>
            <div class="char-card-bio">${esc(c.bio || "")}</div>
            <div class="affection-progress-wrap">
              <div class="affection-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="affection-progress-label">
              <span>Tingkat Afeksi</span>
              <span>❤️ ${heart} / 100</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    bodyHtml = `
      <div>
        <h4 style="margin:0 0 10px;font-size:14px;color:var(--accent3)">🎯 Misi Aktif</h4>
        <div style="background:var(--card2);border:1px solid var(--line);border-radius:12px;padding:12px 14px">
          <div style="font-weight:700;font-size:14px">${esc(rpg.mission.title || "Tugas Utama")}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Pemberi: ${esc(rpg.mission.client || "Diri Sendiri")}</div>
          <div style="font-size:13px;color:var(--fg);margin-top:6px">${esc(rpg.mission.objective || "Lanjutkan petualangan.")}</div>
        </div>
      </div>
      <div>
        <h4 style="margin:16px 0 10px;font-size:14px;color:var(--accent2)">❤️ Tingkat Hubungan Karakter</h4>
        <div style="display:flex;flex-direction:column;gap:10px">${charsHtml || '<div class="desc">Tidak ada karakter spesifik.</div>'}</div>
      </div>
      <div>
        <h4 style="margin:16px 0 10px;font-size:14px;color:var(--ok)">🌐 Reputasi Dunia</h4>
        <div style="display:flex;justify-content:space-between;background:var(--card2);padding:10px 14px;border-radius:10px;font-size:13px">
          <span>Status Sosial:</span>
          <b>${esc(rpg.worldStats.reputation || "Netral")}</b>
        </div>
      </div>
    `;
  } else if (state.activeModal === "zoom") {
    modalTitle = "🔍 Ilustrasi Adegan Penuh";
    bodyHtml = `
      <div style="text-align:center">
        <img src="${state.zoomImageUrl}" style="max-width:100%;max-height:65vh;border-radius:14px;border:1px solid var(--line)" alt="Zoom">
        <div style="margin-top:14px;display:flex;gap:10px;justify-content:center">
          <a href="${state.zoomImageUrl}" target="_blank" download="zennai-scene.jpg" class="btn" style="text-decoration:none;display:inline-block">Unduh Gambar</a>
        </div>
      </div>
    `;
  }

  wrap.innerHTML = `
    <div class="rpg-modal-card">
      <div class="rpg-modal-header">
        <h3>${modalTitle}</h3>
        <button class="rpg-modal-close" id="btn-close-modal">✕</button>
      </div>
      <div class="rpg-modal-body">
        ${bodyHtml}
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  // Bindings
  wrap.querySelector("#btn-close-modal").addEventListener("click", () => {
    state.activeModal = null;
    wrap.remove();
  });
  wrap.addEventListener("click", e => {
    if (e.target === wrap) {
      state.activeModal = null;
      wrap.remove();
    }
  });

  // Persona Save
  const saveP = wrap.querySelector("#btn-save-modal-persona");
  if (saveP) saveP.addEventListener("click", () => {
    const c = getConfig();
    c.personaName = wrap.querySelector("#modal_p_name").value.trim() || "Petualang";
    c.personaGender = wrap.querySelector("#modal_p_gender").value;
    c.personaBio = wrap.querySelector("#modal_p_bio").value.trim();
    saveConfig(c);
    state.activeModal = null;
    wrap.remove();
    render();
  });

  // Scenario Save
  const saveSc = wrap.querySelector("#btn-save-modal-scenario");
  if (saveSc && story) {
    saveSc.addEventListener("click", () => {
      rpg.env.location = wrap.querySelector("#modal_sc_loc").value.trim() || rpg.env.location;
      rpg.env.status = wrap.querySelector("#modal_sc_status").value.trim() || rpg.env.status;
      saveStoryRPGState(story.id, rpg);
      state.activeModal = null;
      wrap.remove();
      render();
    });
  }

  // Album item zoom
  wrap.querySelectorAll("[data-zoom-url]").forEach(item => {
    item.addEventListener("click", () => {
      state.zoomImageUrl = item.dataset.zoomUrl;
      state.activeModal = "zoom";
      renderModals();
    });
  });
}

// User-created stories
function getUserStories() {
  try { return JSON.parse(localStorage.getItem("zenn_user_stories")) || []; }
  catch (e) { return []; }
}
function saveUserStory(story) {
  const list = getUserStories();
  list.unshift(story);
  localStorage.setItem("zenn_user_stories", JSON.stringify(list));
}

// Global Nav delegation
document.addEventListener("click", e => {
  const el = e.target.closest("[data-view]");
  if (el) { state.view = el.dataset.view; render(); }
});

// Booting App
render();

// Supabase Init
SBinit();
if (SB.ready) {
  (async () => {
    try {
      const s = await SBsession();
      if (s) { await hydrateFromCloud(); render(); maybeAskGender(); }
      else showAuthOverlay();
    } catch (e) {}
  })();
} else {
  maybeAskGender();
}

// Fallback image
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

// Gate usia 21+
(function ageGate() {
  if (getConfig().ageOk) return;
  const overlay = document.createElement("div");
  overlay.className = "agegate";
  overlay.innerHTML = `
    <div class="agegate-box">
      <div class="agegate-logo"><span class="logo">zenn</span>AI</div>
      <h2>Konten Dewasa 21+</h2>
      <p>zennAI menyediakan cerita interaktif yang beberapa di antaranya memuat tema dewasa (21+). Dengan melanjutkan, kamu menyatakan telah berusia 21 tahun atau lebih.</p>
      <button class="cta" id="ageOkBtn">Saya Berusia 21 Tahun atau Lebih</button>
      <div class="agegate-note">Safe Mode default AKTIF — konten 21+ disaring secara otomatis kecuali dinonaktifkan di Pengaturan.</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#ageOkBtn").addEventListener("click", () => {
    const c = getConfig();
    c.ageOk = true;
    saveConfig(c);
    overlay.remove();
    showToast("Selamat datang di zennAI!", "success");
  });
})();

// ===== BOOTSTRAP =====
window.addEventListener("DOMContentLoaded", async () => {
  // Setup navigasi atas & bawah
  document.addEventListener("click", e => {
    const btn = e.target.closest("[data-view]");
    if (btn) {
      state.view = btn.dataset.view;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // Init Supabase
  SBinit();
  if (SB.ready) {
    await hydrateFromCloud();
  }

  render();
});
