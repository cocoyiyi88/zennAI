// zennAI — logika utama
// ===== state & util =====
const $ = (sel, el) => (el || document).querySelector(sel);
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

let state = {
  view: "home",
  genre: "ALL",
  searchQuery: "",
  activeStory: null,
  sending: false,
  custom: null
};

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

// ===== Toast Notification System =====
function showToast(message, type = "info", duration = 3000) {
  let container = $("#toasts");
  if (!container) {
    container = document.createElement("div");
    container.id = "toasts";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== Favorites System =====
function getFavorites() {
  try { return JSON.parse(localStorage.getItem("zenn_favs")) || []; }
  catch (e) { return []; }
}

function isFavorite(storyId) {
  return getFavorites().includes(storyId);
}

function toggleFavorite(storyId) {
  const favs = getFavorites();
  const idx = favs.indexOf(storyId);
  let added = false;
  if (idx > -1) {
    favs.splice(idx, 1);
    if (SB.ready && SB.session && DB.removeFavorite) DB.removeFavorite(storyId);
  } else {
    favs.push(storyId);
    added = true;
    if (SB.ready && SB.session && DB.addFavorite) DB.addFavorite(storyId);
  }
  localStorage.setItem("zenn_favs", JSON.stringify(favs));
  showToast(added ? "❤️ Ditambahkan ke favorit" : "🤍 Dihapus dari favorit", "info");
  render();
}

// ===== Cerita = seed + custom =====
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
  if (SB.ready && SB.session) {
    list.forEach(st => DB.upsertStory(st));
  }
}

function deleteCustomStory(storyId) {
  const custom = loadCustomStories().filter(s => s.id !== storyId);
  saveCustomStories(custom);
  deleteSession(storyId);
  showToast("Cerita kustom telah dihapus.", "info");
  render();
}

// ===== Session cerita =====
function getSessions() { return loadLibrary(); }

function getSession(storyId) {
  const lib = getSessions();
  if (!lib[storyId]) {
    const story = allStories().find(s => s.id === storyId);
    if (!story) return null;
    lib[storyId] = {
      id: storyId,
      createdAt: Date.now(),
      messages: [{ role: "ai", sit: story.opening, text: story.opening, img: imageUrl(story.coverPrompt, 640, 760, 101) }]
    };
    saveLibrary(lib);
  }
  return lib[storyId];
}

function saveSession(sess) {
  if (!sess || !sess.id) return;
  const lib = getSessions();
  lib[sess.id] = sess;
  saveLibrary(lib);
  if (SB.ready && SB.session) DB.saveSession(sess.id, sess.messages);
}

function deleteSession(storyId) {
  const lib = getSessions();
  delete lib[storyId];
  saveLibrary(lib);
  if (SB.ready && SB.session) DB.deleteSession(storyId);
  showToast("Riwayat percakapan dihapus.", "info");
  render();
}

// ===== Supabase auth + hydrate =====
async function hydrateFromCloud() {
  if (!SB.ready) return;
  const s = await SBsession();
  if (!s) return;

  const prof = await DB.getProfile();
  if (prof) {
    const c = loadConfig();
    if (prof.safe_mode !== null && prof.safe_mode !== undefined) c.safe = prof.safe_mode;
    if (prof.age_ok !== null && prof.age_ok !== undefined) c.ageOk = prof.age_ok;
    if (prof.model) c.model = prof.model;
    saveConfig(c);
  }

  if (DB.getFavorites) {
    const f = await DB.getFavorites();
    if (Array.isArray(f)) {
      localStorage.setItem("zenn_favs", JSON.stringify(f));
    }
  }

  const cloudStories = await DB.listStories();
  if (cloudStories) {
    const custom = cloudStories.map(r => ({
      id: r.id, title: r.title, tagline: r.tagline, genre: r.genre,
      coverPrompt: r.coverPrompt, premise: r.premise, characters: r.characters,
      opening: r.opening, mature: !!r.mature, custom: true
    }));
    saveCustomStories(custom);
  }

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
    maybeAskGender();
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
      if (mode === "in") {
        await SBsignIn(email.value.trim(), pass.value);
        await hydrateFromCloud();
        el.remove();
        showToast("Berhasil masuk!", "success");
        render();
        maybeAskGender();
      } else {
        const sess = await SBsignUp(email.value.trim(), pass.value);
        if (sess) {
          await hydrateFromCloud();
          el.remove();
          showToast("Pendaftaran berhasil!", "success");
          render();
          maybeAskGender();
        } else {
          note.style.color = "var(--ok)";
          note.textContent = "✓ Pendaftaran berhasil! Silakan cek email kamu untuk konfirmasi, lalu Masuk.";
          note.style.display = "block";
          mode = "in";
          btn.textContent = "Masuk";
          toggle.textContent = "Belum punya akun? Daftar";
        }
      }
    } catch (e) {
      note.textContent = "Gagal: " + (e.message || e.error_description || "coba lagi");
      note.style.display = "block";
    }
  });
}

function showGenderOverlay() {
  if (document.querySelector(".gendermodal")) return;
  const el = document.createElement("div");
  el.className = "gendermodal";
  el.innerHTML = `
    <div class="gendermodal-box">
      <div class="agegate-logo"><span class="logo">zenn</span>AI</div>
      <h2>Pilih Preferensi Cerita</h2>
      <p>Biar otomatis tampil cerita yang paling cocok buat kamu. Bisa diubah kapan aja di Pengaturan.</p>
      <button class="genderchoice" data-gender="m">💪 Cowok</button>
      <button class="genderchoice" data-gender="f">🌸 Cewek</button>
      <button class="genderchoice" data-gender="all">🌓 Semua</button>
    </div>`;
  document.body.appendChild(el);
  el.querySelectorAll(".genderchoice").forEach(b => b.addEventListener("click", () => {
    const cfg = getConfig();
    cfg.gender = b.dataset.gender;
    cfg.genderChosen = true;
    saveConfig(cfg);
    el.remove();
    render();
  }));
}

function maybeAskGender() {
  const cfg = getConfig();
  if (!cfg.genderChosen) showGenderOverlay();
}

// ===== Share Helper =====
function shareStory(story) {
  const url = window.location.origin + window.location.pathname;
  const text = `Mainkan cerita "${story.title}" di zennAI: ${story.tagline}`;
  if (navigator.share) {
    navigator.share({ title: story.title, text: text, url: url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
      showToast("Tautan cerita berhasil disalin ke papan klip!", "success");
    }).catch(() => {
      showToast("Gagal menyalin tautan.", "error");
    });
  } else {
    showToast("Fitur berbagi tidak didukung di perangkat ini.", "info");
  }
}

// ===== Render Root =====
function render() {
  const v = $("#view");
  const navs = $$(".navbtn");
  navs.forEach(n => n.classList.toggle("active", n.dataset.view === state.view));

  const bnavs = $$(".bottomnav button");
  bnavs.forEach(n => n.classList.toggle("active", n.dataset.view === state.view));

  if (state.view === "home") v.innerHTML = viewHome();
  else if (state.view === "create") v.innerHTML = viewCreate();
  else if (state.view === "library") v.innerHTML = viewLibrary();
  else if (state.view === "profile") v.innerHTML = viewProfile();
  else if (state.view === "settings") v.innerHTML = viewSettings();
  else v.innerHTML = viewPlay();

  bind(v);
}

function bind(root) {
  // chip genre
  $$(".chip", root).forEach(c => c.addEventListener("click", () => {
    state.genre = c.dataset.genre;
    render();
  }));

  // search input
  const sInp = $("#storySearch", root);
  if (sInp) {
    sInp.addEventListener("input", e => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      // Update grid without losing input focus
      const grid = $("#storyGrid");
      if (grid) {
        grid.innerHTML = renderStoryCards();
        bindStoryCards(grid);
      }
    });
  }

  // Favorite buttons
  $$("[data-fav]", root).forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    toggleFavorite(b.dataset.fav);
  }));

  // Share buttons
  $$("[data-share]", root).forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    const st = allStories().find(s => s.id === b.dataset.share);
    if (st) shareStory(st);
  }));

  // Buka cerita
  $$("[data-open]", root).forEach(c => c.addEventListener("click", () => {
    const story = allStories().find(s => s.id === c.dataset.open);
    if (story) {
      state.activeStory = story.id;
      state.view = "play";
      render();
    }
  }));

  // Hapus session dari library
  $$("[data-del-session]", root).forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    const id = b.dataset.delSession;
    if (confirm("Hapus riwayat obrolan cerita ini?")) {
      deleteSession(id);
    }
  }));

  // Hapus custom story
  $$("[data-del-story]", root).forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    const id = b.dataset.delStory;
    if (confirm("Hapus cerita ini secara permanen?")) {
      deleteCustomStory(id);
    }
  }));

  // Kembali dari Play View
  const backBtn = $("#backToLib", root);
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      state.view = "library";
      render();
    });
  }

  // Form buat cerita
  const cf = $("#customform", root);
  const premiseEl = $("#cf_premise", root);
  const charCountEl = $("#charCount", root);
  if (premiseEl && charCountEl) {
    premiseEl.addEventListener("input", () => {
      const len = premiseEl.value.length;
      charCountEl.textContent = `${len}/500 karakter`;
      charCountEl.classList.toggle("over", len > 500);
    });
  }

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
      id,
      title: title || "Cerita Tanpa Judul",
      tagline: tagline || "Sebuah cerita baru.",
      genre: genre || "Misteri",
      coverPrompt: (premise || title) + ", cinematic anime key visual",
      premise: premise || "Kamu memulai cerita baru.",
      characters: chars || "Kamu adalah tokoh utamanya.",
      opening: premise ? premise : "Cerita dimulai. Kamu belum tahu apa yang menantimu — tapi sesuatu di udara terasa berbeda.",
      custom: true
    };
    const custom = loadCustomStories();
    custom.unshift(st);
    saveCustomStories(custom);
    showToast("Cerita berhasil dibuat!", "success");
    state.activeStory = st.id;
    state.view = "play";
    render();
  });

  // Composer di Play View
  const inp = $("#chatinput", root);
  const sb = $("#sendbtn", root);
  if (sb) sb.addEventListener("click", () => {
    if (inp.value.trim() && !state.sending) sendMessage(inp.value.trim());
  });
  if (inp) inp.addEventListener("keydown", e => {
    if (e.key === "Enter" && inp.value.trim() && !state.sending) {
      e.preventDefault();
      sendMessage(inp.value.trim());
    }
  });

  // Suggestion buttons di Play View
  $$(".sug", root).forEach(b => b.addEventListener("click", () => {
    if (!state.sending && b.dataset.sug) {
      sendMessage(b.dataset.sug);
    }
  }));

  // Settings Save
  const savebtn = $("#savecfg", root);
  if (savebtn) savebtn.addEventListener("click", () => {
    const cfg = getConfig();
    const keyEl = $("#cfg_key");
    if (keyEl) cfg.apiKey = keyEl.value.trim();
    const modelEl = $("#cfg_model");
    if (modelEl) cfg.model = modelEl.value.trim();
    const urlEl = $("#cfg_url");
    if (urlEl) cfg.baseUrl = urlEl.value.trim();
    saveConfig(cfg);
    if (SB.ready && SB.session) DB.saveProfile(cfg);
    showToast("Pengaturan berhasil disimpan!", "success");
    const ok = $("#cfgok");
    if (ok) {
      ok.style.display = "block";
      setTimeout(() => { ok.style.display = "none"; }, 2200);
    }
  });

  // Logout
  const logoutBtn = $("#logoutBtn", root);
  if (logoutBtn) logoutBtn.addEventListener("click", async () => {
    await SBsignOut();
    showToast("Berhasil keluar akun.", "info");
    render();
  });

  // Login dari settings/profile
  const loginBtn = $("#loginBtn", root);
  if (loginBtn) loginBtn.addEventListener("click", () => {
    showAuthOverlay();
  });

  // Gender Modal trigger
  const genderBtn = $("#gender_btn", root);
  if (genderBtn) genderBtn.addEventListener("click", () => {
    showGenderOverlay();
  });

  // Safe Mode Toggle
  const safeToggle = $("#safe_toggle", root);
  if (safeToggle) safeToggle.addEventListener("click", () => {
    const cfg = getConfig();
    cfg.safe = !cfg.safe;
    saveConfig(cfg);
    if (SB.ready && SB.session) DB.saveProfile(cfg);
    showToast(cfg.safe ? "Safe Mode AKTIF: Konten 21+ disembunyikan" : "Safe Mode NONAKTIF: Konten 21+ ditampilkan", "info");
    render();
  });
}

function bindStoryCards(container) {
  $$("[data-fav]", container).forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    toggleFavorite(b.dataset.fav);
  }));
  $$("[data-open]", container).forEach(c => c.addEventListener("click", () => {
    const story = allStories().find(s => s.id === c.dataset.open);
    if (story) {
      state.activeStory = story.id;
      state.view = "play";
      render();
    }
  }));
}

// ===== VIEWS =====

// Helper: render cards list
function renderStoryCards() {
  const cfg = getConfig();
  let list = allStories();

  if (cfg.safe) list = list.filter(s => !isMature(s));

  if (cfg.gender && cfg.gender !== "all") {
    list = list.filter(s => s.gender === cfg.gender || s.gender === "all" || !s.gender);
  }

  if (state.genre !== "ALL") {
    list = list.filter(s => s.genre === state.genre);
  }

  if (state.searchQuery) {
    list = list.filter(s =>
      s.title.toLowerCase().includes(state.searchQuery) ||
      (s.tagline && s.tagline.toLowerCase().includes(state.searchQuery)) ||
      (s.premise && s.premise.toLowerCase().includes(state.searchQuery))
    );
  }

  if (!list.length) {
    return `<div class="empty" style="grid-column: 1/-1;">
      <p>Tidak ada cerita yang cocok dengan filter pencarian.</p>
    </div>`;
  }

  return list.map(s => {
    const matureTag = isMature(s) ? `<span class="mature">21+</span>` : "";
    const favActive = isFavorite(s.id) ? "❤️" : "🤍";
    return `
      <div class="card" data-open="${s.id}">
        <button class="fav-btn" data-fav="${s.id}" title="Favorit">${favActive}</button>
        <img class="cover" loading="lazy" src="${imageUrl(s.coverPrompt, 640, 760, 42)}" alt="${esc(s.title)}">
        <div class="body">
          <h3>${esc(s.title)}</h3>
          <div class="tagline">${esc(s.tagline)}</div>
          <div class="meta">
            <span class="g">${esc(s.genre)}</span>
            ${matureTag}
          </div>
        </div>
      </div>`;
  }).join("");
}

function viewHome() {
  const cfg = getConfig();
  const safeBanner = cfg.safe ? `
    <div class="safe-banner">
      🛡️ <b>Safe Mode Aktif</b> — Konten 21+ disembunyikan. Matikan di Pengaturan jika ingin membuka semua konten.
    </div>` : "";

  // Favorites section
  const favIds = getFavorites();
  let favSection = "";
  if (favIds.length > 0) {
    const favStories = allStories().filter(s => favIds.includes(s.id) && (!cfg.safe || !isMature(s)));
    if (favStories.length > 0) {
      const favCards = favStories.map(s => `
        <div class="card" data-open="${s.id}">
          <button class="fav-btn" data-fav="${s.id}" title="Hapus Favorit">❤️</button>
          <img class="cover" loading="lazy" src="${imageUrl(s.coverPrompt, 640, 760, 42)}" alt="${esc(s.title)}">
          <div class="body">
            <h3>${esc(s.title)}</h3>
            <div class="tagline">${esc(s.tagline)}</div>
            <div class="meta"><span class="g">${esc(s.genre)}</span></div>
          </div>
        </div>`).join("");
      favSection = `
        <div class="fav-section">
          <h3>❤️ Cerita Favoritmu</h3>
          <div class="grid">${favCards}</div>
        </div>`;
    }
  }

  return `
    <section class="hero">
      <h1>Tonton Ceritamu <span class="grad">Terungkap</span></h1>
      <p>Jelajahi petualangan interaktif berbasis AI visual. Setiap pilihan mengubah takdir duniamu.</p>
      <div>
        <button class="cta" data-open="${SEED_STORIES[0].id}">Mulai Cerita Pilihan</button>
        <button class="cta ghost" data-view="create">Tulis Sendiri</button>
      </div>
    </section>

    ${safeBanner}

    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input type="text" id="storySearch" class="search-input" placeholder="Cari judul, karakter, atau genre..." value="${esc(state.searchQuery)}">
    </div>

    <div class="chips">
      <button class="chip ${state.genre === 'ALL' ? 'active' : ''}" data-genre="ALL">Semua</button>
      ${GENRES.map(g => `<button class="chip ${state.genre === g ? 'active' : ''}" data-genre="${g}">${g}</button>`).join("")}
    </div>

    ${favSection}

    <h2 class="sectiontitle" style="margin-top:20px;">Daftar Cerita</h2>
    <div class="grid" id="storyGrid">${renderStoryCards()}</div>`;
}

function viewCreate() {
  return `
    <h2 class="sectiontitle">Buat Cerita Baru</h2>
    <form id="customform" class="cardbox">
      <div class="field">
        <label>Judul Cerita</label>
        <input id="cf_title" placeholder="cth. Petualangan di Kota Terlarang" required>
      </div>
      <div class="field">
        <label>Tagline / Ringkasan Singkat</label>
        <input id="cf_tagline" placeholder="cth. Menjelajahi kota mati penuh rahasia masa lalu.">
      </div>
      <div class="field">
        <label>Genre</label>
        <select id="cf_genre">
          ${GENRES.map(g => `<option>${g}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Premis / Latar Cerita</label>
        <textarea id="cf_premise" maxlength="500" placeholder="Ceritakan awal ceritamu: siapa kamu, di mana tempatnya, apa tantangan utamanya. AI akan menyusun visual dan arah karakter dari sini."></textarea>
        <div id="charCount" class="char-count">0/500 karakter</div>
        <div class="hint">Penjelasan di sini menjadi adegan pembuka dan arah cerita.</div>
      </div>
      <div class="field">
        <label>Karakter (opsional)</label>
        <input id="cf_chars" placeholder="cth. Rara (peneliti jenius), Dimas (kapten ekspedisi)">
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

  const validCards = ids.map(id => {
    const s = allStories().find(x => x.id === id);
    const sess = lib[id];
    if (!s || !sess) return "";
    const n = sess.messages ? sess.messages.length : 0;
    const progressPct = Math.min(100, Math.max(10, n * 8));
    const isCustom = !!s.custom;

    return `
      <div class="card" data-open="${id}">
        <button class="del-btn" data-del-session="${id}" title="Hapus riwayat">✕</button>
        <img class="cover" loading="lazy" src="${imageUrl(s.coverPrompt, 640, 760, 7)}" alt="${esc(s.title)}">
        <div class="body">
          <h3>${esc(s.title)}</h3>
          <div class="tagline">${esc(s.tagline)}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPct}%"></div>
          </div>
          <div class="meta" style="margin-top:8px;">
            <span class="g">${esc(s.genre)}</span>
            <span class="ic">💬 ${n} pesan</span>
            ${isCustom ? `<span style="color:var(--accent3);font-size:11px;">[Kustom]</span>` : ""}
          </div>
        </div>
      </div>`;
  }).filter(Boolean).join("");

  return `
    <h2 class="sectiontitle">Perpustakaan Cerita</h2>
    <div class="grid">${validCards}</div>`;
}

function viewProfile() {
  const hasAuth = SB.ready && SB.session;
  const email = hasAuth ? SB.session.user.email : "Tamu (Mode Lokal)";
  const firstLetter = email.charAt(0).toUpperCase();

  const lib = getSessions();
  const totalStories = Object.keys(lib).length;
  let totalMsgs = 0;
  Object.values(lib).forEach(s => {
    if (s.messages) totalMsgs += s.messages.length;
  });

  const favCount = getFavorites().length;

  return `
    <div class="profile-header">
      <div class="avatar">${firstLetter}</div>
      <h2 style="margin:0 0 6px;">${esc(email)}</h2>
      <div style="color:var(--muted);font-size:14px;">${hasAuth ? "Akun Cloud Terverifikasi ✓" : "Penyimpanan Browser Lokal"}</div>
      
      ${!hasAuth && SB.ready ? `
        <button class="cta" id="loginBtn" style="margin-top:16px;padding:8px 20px;font-size:13px;">Masuk / Daftar Akun Cloud</button>
      ` : ""}
    </div>

    <div class="profile-stats">
      <div class="stat-card">
        <div class="stat-num">📖 ${totalStories}</div>
        <div class="stat-label">Cerita Dimainkan</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">💬 ${totalMsgs}</div>
        <div class="stat-label">Pesan Cerita</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">❤️ ${favCount}</div>
        <div class="stat-label">Favorit</div>
      </div>
    </div>

    <div class="cardbox" style="margin-top:24px;">
      <h3 style="margin-top:0;">Menu Cepat</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button class="genderchoice" data-view="library" style="text-align:left;display:flex;justify-content:space-between;">
          <span>📚 Kelola Riwayat Cerita</span>
          <span>➜</span>
        </button>
        <button class="genderchoice" data-view="create" style="text-align:left;display:flex;justify-content:space-between;">
          <span>✍️ Tulis Cerita Sendiri</span>
          <span>➜</span>
        </button>
        <button class="genderchoice" data-view="settings" style="text-align:left;display:flex;justify-content:space-between;">
          <span>⚙️ Pengaturan AI & Safe Mode</span>
          <span>➜</span>
        </button>
      </div>
    </div>`;
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
          <input id="cfg_model" list="model_list" placeholder="cth. recursive/flint-v1.0:free" value="${esc(cfg.model)}">
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
          <input id="cfg_model" list="model_list" placeholder="cth. recursive/flint-v1.0:free" value="${esc(cfg.model)}">
          <div class="hint">Untuk DeepSeek: isi <b>deepseek/deepseek-chat</b> dan ganti Endpoint ke https://api.deepseek.com/v1.</div>
        </div>
        <div class="field">
          <label>Endpoint (biarkan kosong = OpenRouter)</label>
          <input id="cfg_url" placeholder="https://openrouter.ai/api/v1" value="${esc(cfg.baseUrl || "")}">
        </div>
        <button class="btn block" id="savecfg">Simpan</button>
        <div class="note" id="cfgok" style="display:none;margin-top:12px">✓ Tersimpan.</div>
       </div>`;

  return `
    <h2 class="sectiontitle">Pengaturan Aplikasi</h2>
    <div class="settings">
      ${authBar}
      <div class="cardbox">
        <h3>Safe Mode <span class="badge">${cfg.safe ? "AKTIF" : "NONAKTIF"}</span></h3>
        <div class="desc">Saat ON, konten dewasa (21+) disembunyikan dan AI menjaga cerita tetap aman untuk semua umur. Matikan untuk membuka cerita dewasa.</div>
        <button class="btn ${cfg.safe ? "danger" : ""}" id="safe_toggle">
          ${cfg.safe ? "Matikan Safe Mode" : "Aktifkan Safe Mode"}
        </button>
      </div>

      <div class="cardbox">
        <h3>Preferensi Cerita <span class="badge">${cfg.gender === "m" ? "💪 Cowok" : cfg.gender === "f" ? "🌸 Cewek" : "🌓 Semua"}</span></h3>
        <div class="desc">Menyaring cerita benih berdasarkan target pembaca di beranda.</div>
        <button class="btn" id="gender_btn">Ubah Preferensi</button>
      </div>

      ${apiSection}
    </div>

    <datalist id="model_list">
      <option value="recursive/flint-v1.0:free">
      <option value="deepseek/deepseek-chat">
      <option value="meta-llama/llama-3.3-70b-instruct:free">
      <option value="google/gemini-2.0-flash-exp:free">
      <option value="mistralai/mistral-7b-instruct:free">
      <option value="qwen/qwen-2.5-72b-instruct:free">
      <option value="openai/gpt-4o-mini">
    </datalist>`;
}

function viewPlay() {
  const story = allStories().find(s => s.id === state.activeStory);
  if (!story) { state.view = "home"; return ""; }
  const sess = getSession(story.id);

  const msgs = (sess.messages || []).map(m => {
    if (m.role === "ai") {
      return `<div class="msg ai">
        <div class="who">${esc(story.title)}</div>
        <div>${esc(m.text)}</div>
        ${m.img ? `<img class="img" src="${m.img}" alt="adegan" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'640\\' height=\\'360\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%231a1724\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%239b95b8\\' font-family=\\'sans-serif\\' font-size=\\'16\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>Gambar sedang diproses...</text></svg>'">` : ""}
      </div>`;
    }
    return `<div class="msg user">${esc(m.text)}</div>`;
  }).join("");

  const lastAi = (sess.messages || []).filter(m => m.role === "ai").pop();
  const sugg = (lastAi && lastAi.sugg) || [];
  const suggHtml = sugg.length ? `
    <div class="sugg">
      <div class="suglabel">Pilih respon cepat:</div>
      ${sugg.map((s, i) => `<button class="sug" data-sug="${esc(s)}"><span class="num">${String.fromCharCode(65 + i)}</span>${esc(s)}</button>`).join("")}
    </div>` : "";

  return `
    <button class="back-btn" id="backToLib">← Kembali ke Perpustakaan</button>
    <div class="storyhead">
      <img class="cover" src="${imageUrl(story.coverPrompt, 640, 760, 7)}" alt="${esc(story.title)}">
      <div class="info">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="genrebadge">${esc(story.genre)}</span>
          <button class="share-btn" data-share="${story.id}">🔗 Bagikan</button>
        </div>
        <h2>${esc(story.title)}</h2>
        <div class="premise">${esc(story.premise)}</div>
        <div class="chars"><b>Karakter:</b> ${esc(story.characters)}</div>
      </div>
    </div>
    <div class="chat" id="chatbox">${msgs}${suggHtml}</div>
    <div class="composer">
      <input id="chatinput" placeholder="Tulis aksi atau arah ceritamu..." autocomplete="off">
      <button class="sendbtn" id="sendbtn">➤</button>
    </div>`;
}

function sendMessage(text) {
  const story = allStories().find(s => s.id === state.activeStory);
  if (!story) return;
  const sess = getSession(story.id);
  sess.messages.push({ role: "user", text });
  saveSession(sess);
  state.sending = true;
  rerenderChat();

  const box = $("#chatbox");
  if (box) {
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.textContent = "Karakter sedang berpikir & menulis...";
    box.appendChild(typing);
    box.scrollTop = box.scrollHeight;
  }

  askAI(story, sess).then(res => {
    sess.messages.push({ role: "ai", text: res.reply, img: res.img, sugg: res.sugg });
    saveSession(sess);
  }).catch(err => {
    sess.messages.push({ role: "ai", text: "(AI belum berhasil merespon: " + err.message + ")", sugg: defaultSug() });
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
  const msgs = (sess.messages || []).map(m => {
    if (m.role === "ai") {
      return `<div class="msg ai">
        <div class="who">${esc(story.title)}</div>
        <div>${esc(m.text)}</div>
        ${m.img ? `<img class="img" src="${m.img}" alt="adegan" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'640\\' height=\\'360\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%231a1724\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%239b95b8\\' font-family=\\'sans-serif\\' font-size=\\'16\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>Gambar sedang diproses...</text></svg>'">` : ""}
      </div>`;
    }
    return `<div class="msg user">${esc(m.text)}</div>`;
  }).join("");

  const lastAi = (sess.messages || []).filter(m => m.role === "ai").pop();
  const sugg = (lastAi && lastAi.sugg) || [];
  const suggHtml = sugg.length ? `
    <div class="sugg">
      <div class="suglabel">Pilih respon cepat:</div>
      ${sugg.map((s, i) => `<button class="sug" data-sug="${esc(s)}"><span class="num">${String.fromCharCode(65 + i)}</span>${esc(s)}</button>`).join("")}
    </div>` : "";

  const box = $("#chatbox");
  if (box) {
    box.innerHTML = msgs + suggHtml;
    box.scrollTop = box.scrollHeight;
    $$(".sug", box).forEach(b => b.addEventListener("click", () => {
      if (!state.sending && b.dataset.sug) {
        sendMessage(b.dataset.sug);
      }
    }));
  }
}

// ===== AI ENGINE =====
async function askAI(story, sess) {
  const cfg = getConfig();

  // 1. Coba Vercel Serverless Function `/api/ai`
  try {
    const vRes = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: buildPrompt(story, sess),
        safe: cfg.safe,
        model: cfg.model
      })
    });
    if (vRes.ok) {
      const data = await vRes.json();
      if (data && data.content) return parseAI(data.content);
    }
  } catch (e) {
    // Lewati jika lokal atau endpoint vercel tidak ada
  }

  // 2. Direct client call jika apiKey diset
  if (cfg.apiKey) {
    let endpoint = cfg.baseUrl || OPENROUTER_URL;
    if (!endpoint.endsWith("/chat/completions")) {
      endpoint = endpoint.replace(/\/+$/, "") + "/chat/completions";
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.apiKey,
        "HTTP-Referer": window.location.href,
        "X-Title": "zennAI"
      },
      body: JSON.stringify({
        model: cfg.model || DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt(story, cfg.safe) },
          ...buildPrompt(story, sess)
        ],
        temperature: 0.85,
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Server AI (${res.status}): ${txt.slice(0, 100)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return parseAI(content);
  }

  // 3. Fallback narator lokal
  await new Promise(r => setTimeout(r, 600));
  return localNarrator(story, sess);
}

function systemPrompt(story, safe) {
  const policy = safe
    ? "SAFE MODE: Hindari konten vulgar, kekerasan sadis, dan topik tidak pantas untuk usia di bawah 21 tahun."
    : "MODE DEWASA: Cerita diperuntukkan untuk pembaca 21+. Kembangkan konflik, romansa, dan ketegangan secara mendalam dan realistis.";
  return `Kamu adalah penutur AI untuk visual novel interaktif berjudul "${story.title}".
Latar: ${story.premise}
Karakter: ${story.characters}
Aturan:
1. Teruskan cerita dari sudut pandang orang kedua ("Kamu").
2. Tulis narasi singkat 2-4 kalimat yang hidup, penuh atmosfer dan emosi.
3. Berikan 3 opsi respon/aksi singkat untuk pemain (A, B, C).
4. Buat prompt gambar dalam bahasa Inggris yang mendeskripsikan adegan terkini.
${policy}
Balas HANYA dalam JSON valid:
{"reply": "<narasi>", "suggestions": ["<opsi A>", "<opsi B>", "<opsi C>"], "image": "<prompt gambar bahasa inggris>"}`;
}

function buildPrompt(story, sess) {
  const history = (sess.messages || []).slice(-10).map(m => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.text
  }));
  return history;
}

function parseAI(raw) {
  try {
    const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(clean);
    return {
      reply: parsed.reply || parsed.text || "Kamu terdiam mengamati sekeliling.",
      sugg: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : defaultSug(),
      img: parsed.image ? imageUrl(parsed.image + ", cinematic visual novel art", 640, 760) : null
    };
  } catch (e) {
    return {
      reply: raw.replace(/\{.*?\}/gs, "").trim() || "Cerita terus berjalan ke arah tak terduga.",
      sugg: defaultSug(),
      img: null
    };
  }
}

function defaultSug() {
  return ["Lanjutkan melangkah", "Tanyakan kebenarannya", "Waspada dan perhatikan sekitar"];
}

function localNarrator(story, sess) {
  const lastUser = (sess.messages || []).filter(m => m.role === "user").pop();
  const txt = lastUser ? lastUser.text.toLowerCase() : "";

  let reply = "Langkahmu membawa alur baru. Udara di sekitarmu berubah hening sejenak saat konsekuensi dari tindakanmu mulai terlihat.";
  if (txt.includes("bantu") || txt.includes("tolong")) {
    reply = "Kamu memutuskan untuk mengulurkan tangan. Senyum tipis terukir di wajah mereka — kepercayaan mulai terbangun perlahan di antara kalian.";
  } else if (txt.includes("lawan") || txt.includes("serang") || txt.includes("usir")) {
    reply = "Suasana seketika memanas. Ketegangan memuncak saat mereka menyadari bahwa kamu bukan lawan yang bisa diremehkan.";
  } else if (txt.includes("bicara") || txt.includes("tanya")) {
    reply = "Pertanyaanmu membuat mereka terdiam beberapa detik, sebelum akhirnya mengungkap sebagian kecil dari rahasia yang tersembunyi.";
  }

  return {
    reply,
    sugg: defaultSug(),
    img: imageUrl(story.coverPrompt + ", cinematic moment", 640, 760)
  };
}

// ===== AGE GATE (21+) =====
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
