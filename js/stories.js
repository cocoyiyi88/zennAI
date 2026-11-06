// Cerita benih (seed) zennAI — Enhanced BagelChat-style RPG metadata
const GENRES = ["Romance","Fantasi","Misteri","Aksi","Slice of Life","Harem","Isekai","Horror","Komedi","Binal"];

const SEED_STORIES = [
  {
    id:"vilain-gym", title:"Villain Haven Gym",
    tagline:"Gym hancur dikuasai para penjahat, tersisa tiga pelatih cantik.",
    genre:"Aksi", gender:"m",
    tags:["#Fitness","#Aksi","#Harem","#Boss","#Tsundere"],
    stats:{assets:250, chats:"2.4K"},
    coverPrompt:"anime ruined gym interior, muscular villain silhouettes, three gorgeous female trainers standing brave, dramatic lighting",
    premise:"Kamu mewarisi gym tua yang dikuasai penjahat. Tiga pelatih mengajakmu merebut kembali.",
    characters:"Rena (tegas, bekas atlet), Sari (ceria, ahli taktik), Laila (dingin, misterius).",
    charactersList:[
      {name:"Rena",role:"Pelatih Senior",heart:10,bio:"Tegas, bekas atlet tinju nasional.",avatarPrompt:"anime female gym trainer athletic ponytail determined fierce eyes"},
      {name:"Sari",role:"Instruktur Cardio",heart:5,bio:"Ceria, pandai membaca situasi.",avatarPrompt:"anime cheerful cute female aerobics instructor smiling energetic"},
      {name:"Laila",role:"Spesialis Yoga",heart:0,bio:"Dingin, misterius, jarang bicara.",avatarPrompt:"anime elegant slender female yoga instructor calm enigmatic glance"}
    ],
    env:{day:"Rabu, 28 Okt 2026",time:"09:00",location:"Lantai Gym / Lobi",status:"Sedang Bertugas"},
    mission:{title:"Keluhan Member",client:"Member Gym",objective:"Usir preman yang menguasai area treadmill"},
    worldStats:{reputation:"Sarang Preman",members:"37 / 100"},
    opening:"Pagi masih berkabut saat kamu membuka pintu gym. Tiga penjahat bersandar di bangku bench press, menyeringai. Rena menatapmu: \"Kamu pasti pemilik baru. Bantu kami mengusir mereka \u2014 atau biarkan gym ini jadi sarang mereka.\""
  },
  {
    id:"warung-ciuman", title:"Warung Delinquent",
    tagline:"Tiga gadis nakal yang merampok warungmu malah jadi pegawai.",
    genre:"Slice of Life", gender:"m",
    tags:["#Delinquent","#SliceOfLife","#Komedi","#Toko","#Romance"],
    stats:{assets:180, chats:"1.8K"},
    coverPrompt:"anime convenience store interior night, three delinquent girls in school uniforms working, warm neon light",
    premise:"Warung kamu dirampok tiga gadis delinquent. Kamu tawari mereka kerja untuk ganti rugi.",
    characters:"Momo (keras kepala), Chika (rewel tapi rajin), Aya (pendiam, jago masak).",
    charactersList:[
      {name:"Momo",role:"Kasir Pembangkang",heart:12,bio:"Pemimpin geng sekolah, galak tapi salah tingkah.",avatarPrompt:"anime delinquent girl sukeban short hair bandaid blush angry"},
      {name:"Chika",role:"Penata Rak",heart:8,bio:"Cerewet tapi cekatan.",avatarPrompt:"anime gyaru twin tails energetic pouting restocking shelves"},
      {name:"Aya",role:"Juru Masak",heart:15,bio:"Gadis bertudung pendiam, jago masak mie.",avatarPrompt:"anime quiet shy girl hoodie cute apron cooking ramen steam"}
    ],
    env:{day:"Senin, 10 Nov 2026",time:"22:15",location:"Warung 24 Jam",status:"Shift Malam"},
    mission:{title:"Restock Darurat",client:"Toko Sendiri",objective:"Rapikan stok sebelum inspektur datang"},
    worldStats:{reputation:"Warung Gaul",members:"Rp 850.000"},
    opening:"\"Kita beneran harus pakai celemek konyol ini?\" Momo menatapmu menantang, wajahnya memerah. Chika sibuk menata botol soda, Aya menuang kuah sup harum ke mangkukmu."
  },
  {
    id:"harem-asrama", title:"Asrama Grand Harem",
    tagline:"Satu-satunya cowok di asrama cewek \u2014 dan tiga masalah besar.",
    genre:"Harem", gender:"m",
    tags:["#Harem","#Asrama","#Romance","#Sekolah","#Tsundere"],
    stats:{assets:220, chats:"3.1K"},
    coverPrompt:"anime mixed dorm common room, one boy surrounded by many cute girls, vibrant playful mood",
    premise:"Kamu satu-satunya cowok di Asrama Putri akibat kesalahan administrasi.",
    characters:"Luna (ketua asrama, tsundere), Mei (antisosial jenius), Suki (sporty cheerleader).",
    charactersList:[
      {name:"Luna",role:"Ketua Asrama",heart:14,bio:"Gadis bangsawan ketat aturan tapi rapuh.",avatarPrompt:"anime blonde twin drill hair noble tsundere haughty blush"},
      {name:"Mei",role:"Hacker Kamar 204",heart:6,bio:"Kutubuku pemalas, butuh camilan.",avatarPrompt:"anime messy dark hair oversized sweater glasses gamer girl"},
      {name:"Suki",role:"Kapten Cheerleader",heart:18,bio:"Supel, berani kontak fisik, ekspresif.",avatarPrompt:"anime tanned athletic girl cheerleader uniform bright smile"}
    ],
    env:{day:"Jumat, 14 Nov 2026",time:"19:30",location:"Ruang Tamu Lt. 2",status:"Waktu Bebas"},
    mission:{title:"Jam Malam Ketat",client:"Pengurus Asrama",objective:"Bujuk Luna tidak mengunci pintu sebelum jam 10"},
    worldStats:{reputation:"Asrama Favorit",members:"Ketenangan: 42%"},
    opening:"\"Kamu tuh siapa?!\" Luna menghadangmu di lorong, tangan di pinggang, wajah memerah. \"Asrama ini khusus cewek! Tapi... pengawas bilang kamu boleh tinggal kalau bisa membereskan kekacauan!\""
  },
  {
    id:"binal-penthouse", title:"Penthouse Sang Pewaris",
    tagline:"Satu atap, tiga wanita karismatik memperebutkanmu.",
    genre:"Binal", gender:"m", mature:true,
    tags:["#Penthouse","#Dewasa21+","#Mewah","#Drama","#Romance"],
    stats:{assets:310, chats:"4.5K"},
    coverPrompt:"luxurious penthouse party at night, charismatic young man, glamorous women, neon glow",
    premise:"Kamu pewaris penthouse mewah. Tiga wanita berebut perhatianmu.",
    characters:"Selena (CEO ambisius), Dara (tetangga flirty), Krisna (mantan comeback).",
    charactersList:[
      {name:"Selena",role:"Direktur Investasi",heart:16,bio:"Wanita karier bergaun sutra hitam.",avatarPrompt:"anime seductive mature businesswoman black dress champagne glass"},
      {name:"Dara",role:"Model Pintu Sebelah",heart:20,bio:"Tetangga yang suka bertamu santai.",avatarPrompt:"anime gorgeous model woman silk robe playful wink"},
      {name:"Krisna",role:"Mantan Kekasih",heart:9,bio:"Hadir kembali dengan rahasia lama.",avatarPrompt:"anime melancholic elegant woman red lipstick enigmatic gaze"}
    ],
    env:{day:"Sabtu, 21 Nov 2026",time:"23:45",location:"Balkon Penthouse Lt. 45",status:"After Party"},
    mission:{title:"Pilihan Malam",client:"Diri Sendiri",objective:"Tentukan siapa yang menemani malam pertama"},
    worldStats:{reputation:"Taipan Muda",members:"Pengaruh: 78%"},
    opening:"Lampu kota gemerlap di bawah kaca balkon. Tiga gelas sampanye beradu di meja marmer. Selena tersenyum: \"Jadi, Tuan Pewaris... dari mana kita mulai malam panjang ini?\""
  },
  {
    id:"log-karam", title:"Castaway Log",
    tagline:"Bertahan hidup di atas rakit.",
    genre:"Aksi", gender:"all",
    tags:["#Survival","#Lautan","#Petualangan","#Misteri"],
    stats:{assets:120, chats:"980"},
    coverPrompt:"anime person on a small wooden raft in vast ocean, storm clouds, cinematic scale",
    premise:"Kapalmu karam. Kamu terbangun di rakit kayu kecil, sendirian di tengah lautan.",
    characters:"Kamu (korban karam), seekor camar tua, sinyal suar yang tak berbunyi.",
    charactersList:[
      {name:"Old Gull",role:"Camar Penunjuk Arah",heart:50,bio:"Burung camar pintar yang memberi peringatan badai.",avatarPrompt:"weathered wise seagull on wooden raft mast ocean"}
    ],
    env:{day:"Hari ke-3 Karam",time:"06:30",location:"Samudra Pasifik",status:"Bertahan Hidup"},
    mission:{title:"Mencari Air Tawar",client:"Insting Hidup",objective:"Tampung embun pagi sebelum terik matahari"},
    worldStats:{reputation:"Stamina: 60%",members:"Perbekalan: 2 Hari"},
    opening:"Air asin membangunkanmu. Rakit bergoyang. Di cakrawala, siluet pulau karang samar. Camar tua bertengger di tiang, menatapmu lekat."
  },
  {
    id:"biro-jujutsu", title:"Biro Urusan Jujutsu",
    tagline:"Atasi ledakan roh terkutuk di Seoul.",
    genre:"Fantasi", gender:"all",
    tags:["#Jujutsu","#Supernatural","#Pertarungan","#Seoul"],
    stats:{assets:195, chats:"1.9K"},
    coverPrompt:"anime modern Seoul at night, cursed spirits glowing purple, young sorcerer team, dramatic cityscape",
    premise:"Roh terkutuk membanjiri Seoul. Kau anggota Biro Jujutsu yang harus membereskan krisis.",
    characters:"Kang (senior dingin), Hana (ahli barrier ceria), roh penyamar.",
    charactersList:[
      {name:"Kang",role:"Penyihir Kelas 1",heart:8,bio:"Pendekar pedang energi kutukan, selalu tenang.",avatarPrompt:"anime dark haired male exorcist black coat katana glowing blue eyes"},
      {name:"Hana",role:"Spesialis Barier",heart:16,bio:"Gadis cerdas berkacamata yang mengunci dimensi roh.",avatarPrompt:"anime female sorcerer short hair glowing talismans barrier shields"}
    ],
    env:{day:"Selasa, 17 Nov 2026",time:"01:20",location:"Stasiun Gangnam",status:"Siaga Darurat"},
    mission:{title:"Karantina Zona Merah",client:"Markas Biro",objective:"Bersihkan kutukan di peron 3 sebelum fajar"},
    worldStats:{reputation:"Agen Elit",members:"Barrier: 65%"},
    opening:"Lampu neon stasiun padam. Bau belerang dan kabut ungu dari rel kereta. Kang menghunus katana: \"Barier terpasang. Target di depan... jangan biarkan mereka kabur.\""
  },
  {
    id:"kenangan-sekolah", title:"Kenangan Kelas 3A",
    tagline:"Ujian terakhir SMA, dan perasaan yang belum sempat diucap.",
    genre:"Romance", gender:"f",
    tags:["#Sekolah","#Romance","#Shoujo","#Kenangan","#FirstLove"],
    stats:{assets:160, chats:"2.1K"},
    coverPrompt:"anime high school classroom golden afternoon light, shy boy and girl, cherry blossoms",
    premise:"Tiga bulan menuju kelulusan. Mengejar nilai, mengungkapkan perasaan, atau membiarkan berlalu?",
    characters:"Raka (teman sebangku, diam-diam suka), Bu Guru Sinta.",
    charactersList:[
      {name:"Raka",role:"Teman Sebangku",heart:25,bio:"Cowok pendiam atlet basket, selalu gugup dekatmu.",avatarPrompt:"anime handsome highschool boy messy hair slight blush warm sunset"}
    ],
    env:{day:"Kamis, 05 Nov 2026",time:"16:45",location:"Kelas 3A Senja",status:"Pulang Sekolah"},
    mission:{title:"Catatan Rahasia",client:"Hati Sendiri",objective:"Kembalikan buku catatan Raka yang terselip surat"},
    worldStats:{reputation:"82 Hari ke Lulus",members:"Keberanian: 50%"},
    opening:"Cahaya senja keemasan membanjiri meja kayu. Raka meletakkan susu cokelat hangat di mejamu tanpa bicara, pura-pura merapikan tas dengan gugup."
  },
  {
    id:"benteng-malam", title:"Benteng Malam",
    tagline:"Markas rahasia tiga pemuda nakal, dipisah satu pintu.",
    genre:"Romance", gender:"f", mature:true,
    tags:["#Badboy","#Kos","#Romance21+","#Protektif","#Dramatis"],
    stats:{assets:240, chats:"3.8K"},
    coverPrompt:"anime cozy secret hideout room at night, three delinquent boys, warm lamp light, one door",
    premise:"Kamu tinggal di kos sebelah markas tiga pemuda nakal. Dipisah satu pintu.",
    characters:"Dio (flirty), Farel (protektif), Ojan (jujur).",
    charactersList:[
      {name:"Dio",role:"Pemimpin Karismatik",heart:18,bio:"Suka menggoda, tato kecil di leher.",avatarPrompt:"anime delinquent leader handsome leather jacket piercing silver hair smirk"},
      {name:"Farel",role:"Penjaga Protektif",heart:12,bio:"Berotot, jarang senyum, selalu menjagamu aman.",avatarPrompt:"anime muscular bad boy intense gaze protective dark eyes"},
      {name:"Ojan",role:"Si Bungsu Supel",heart:15,bio:"Suka bawakan camilan malam.",avatarPrompt:"anime cheerful punk boy jacket messy blond hair playful smile"}
    ],
    env:{day:"Minggu, 08 Nov 2026",time:"23:50",location:"Kamar Kos No. 4",status:"Hening Malam"},
    mission:{title:"Ketukan Pintu",client:"Dio",objective:"Buka atau biarkan pintu rahasia yang diketuk"},
    worldStats:{reputation:"Ketegangan: 85%",members:"Privasi: 20%"},
    opening:"Tok... tok... ketukan pelan dari pintu kayu penghubung. Suara Dio berbisik: \"Belum tidur kan, tetangga manis? Boleh pinjam pemantik apimu?\""
  },
  {
    id:"isekai-game", title:"Re:Start \u2014 Masuk ke Game",
    tagline:"Dunia game yang kau mainkan ternyata nyata.",
    genre:"Isekai", gender:"all",
    tags:["#Isekai","#GameRPG","#LevelUp","#Sistem","#Fantasi"],
    stats:{assets:275, chats:"2.7K"},
    coverPrompt:"anime fantasy RPG world, hero stepping through glowing portal, floating game screens, epic scale",
    premise:"Layar menyala dan menelanmu. Kamu di dunia game, setiap kematian permanen.",
    characters:"Navi (pemandu digital cerewet), Raja Iblis yang mengenalmu, guild.",
    charactersList:[
      {name:"Navi",role:"Sistem Peri Digital",heart:30,bio:"Hologram kecil cerewet yang menghitung statistikmu.",avatarPrompt:"anime tiny glowing fairy guide floating blue wings holographic interface"}
    ],
    env:{day:"Tahun 104 Era Aethel",time:"12:00",location:"Kota Oakhaven",status:"Level 1"},
    mission:{title:"Pendaftaran Petualang",client:"Guild Master",objective:"Dapatkan lencana perunggu"},
    worldStats:{reputation:"HP: 100/100",members:"Koin: 150 G"},
    opening:"Bunyi denting digital bergema. [Sistem: Selamat Datang Pemain 1]. Dua matahari bersinar di atas kastil megah. Navi berputar: \"Bangun, bodoh! Tutorial dimulai!\""
  },
  {
    id:"horror-asrama", title:"Asrama 13",
    tagline:"Jam tiga pagi, koridor lantai tiga.",
    genre:"Horror", gender:"all",
    tags:["#Horror","#UrbanLegend","#Misteri","#Malam","#Thriller"],
    stats:{assets:140, chats:"1.1K"},
    coverPrompt:"dark abandoned boarding school hallway at night, flickering lights, eerie shadows, suspense",
    premise:"Asrama lama nomor 13, ditutup 30 tahun lalu. Kamu harus jaga koridor berhantu.",
    characters:"Bang Umar (satpam), Risa (partner piket, mulai aneh), sosok tanpa bayangan.",
    charactersList:[
      {name:"Risa",role:"Partner Piket",heart:20,bio:"Teman sekelasmu, ketakutan membawa lentera.",avatarPrompt:"anime pale frightened girl holding flashlight dark corridor"}
    ],
    env:{day:"Jumat Kliwon, 13 Nov 2026",time:"03:00",location:"Koridor Lt. 3",status:"Lampu Padam"},
    mission:{title:"Investigasi Kamar 313",client:"Satpam Umar",objective:"Kunci pintu ujung lorong sebelum ketukan ketiga"},
    worldStats:{reputation:"Kewarasan: 75%",members:"Baterai: 40%"},
    opening:"\"Ssst... kamu dengar itu?\" Risa mencengkeram lenganmu. Di ujung koridor gulita, derit engsel pintu berkarat membuka sendiri. Lampu darurat berkedip merah."
  },
  {
    id:"komedi-kos", title:"Tiga Sahabat Kos",
    tagline:"Satu kos, tiga sekawan, nol akal sehat.",
    genre:"Komedi", gender:"all",
    tags:["#Komedi","#KosKos","#Persahabatan","#Absurd","#Lucu"],
    stats:{assets:130, chats:"1.4K"},
    coverPrompt:"chaotic shared house living room, three friends arguing over remote, cozy messy warm light",
    premise:"Kamu sekos dengan Udin dan Raka. Rebutan remote, masakan eksperimen, tak pernah sepi.",
    characters:"Udin (pemalas cerewet), Raka (panik), Ibu Kos.",
    charactersList:[
      {name:"Udin",role:"Raja Mager",heart:35,bio:"Jago game, hobi pinjam celana orang.",avatarPrompt:"anime funny sleepy boy sitting on floor snack packets mess"},
      {name:"Raka",role:"Penyusun Rencana Gagal",heart:30,bio:"Ide bisnis absurd yang bikin rugi.",avatarPrompt:"anime comedic nerd boy crazy whiteboard blueprints pointing"}
    ],
    env:{day:"Minggu, 08 Nov 2026",time:"14:15",location:"Ruang TV Berantakan",status:"Rebutan Remote"},
    mission:{title:"Tagihan Ibu Kos",client:"Diri Sendiri",objective:"Sembunyikan motor modif sebelum nagih sewa"},
    worldStats:{reputation:"Rp 12.000",members:"Stok Mie: 4"},
    opening:"\"Gue gak terima gorengan lu di atas bantal gue!\" Udin lempar bungkus keripik. Klakson motor Ibu Kos tiga kali. Keduanya menatapmu panik."
  },
  {
    id:"binal-cafe", title:"Cafe Midnight",
    tagline:"Bar eksklusif yang cuma buka tengah malam.",
    genre:"Binal", gender:"f", mature:true,
    tags:["#Dewasa21+","#Bar","#Malam","#Romance","#Elegan"],
    stats:{assets:290, chats:"3.9K"},
    coverPrompt:"moody upscale night cafe interior, elegant female bartender, dim seductive lighting, film noir",
    premise:"Shift malam di Cafe Midnight. Tamu penuh teka-teki, atasanmu misterius.",
    characters:"Vanya (manajer bar), Damar (pelanggan VIP penuh rahasia).",
    charactersList:[
      {name:"Damar",role:"Pelanggan VIP",heart:15,bio:"Pria tampan berjas, selalu pesan Bourbon dan menatapmu.",avatarPrompt:"anime handsome mysterious mature man suit bourbon glass lounge bar"},
      {name:"Vanya",role:"Manajer Bar",heart:12,bio:"Wanita anggun bermata tajam.",avatarPrompt:"anime mature elegant female bartender cocktail shaker dark lighting"}
    ],
    env:{day:"Rabu, 18 Nov 2026",time:"01:30",location:"Meja Bar Utama",status:"Melayani VIP"},
    mission:{title:"Racikan Spesial",client:"Damar",objective:"Buatkan koktail non-alkohol yang menggoda"},
    worldStats:{reputation:"Tip: Rp 450K",members:"Suasana: Intim"},
    opening:"Musik jazz lembut memenuhi ruangan bar kayu mahoni. Damar menggeser gelas kristal: \"Malam ini kopimu lebih manis. Ada rahasia di balik senyumanmu?\""
  },
  {
    id:"rahasia-lantai7", title:"Rahasia Lantai 7",
    tagline:"Elevator yang sering macet, dan dia yang selalu naik di jam yang sama.",
    genre:"Romance", gender:"f",
    tags:["#Kantor","#Romance","#EnemiesToLovers","#Senior","#Manis"],
    stats:{assets:175, chats:"2.3K"},
    coverPrompt:"modern office at dusk, young professional woman and handsome colleague sharing elevator, soft tension",
    premise:"Elevator lantai 7 sering macet. Rekan tim tampan dan dingin selalu naik di jam sama.",
    characters:"Arka (Senior Analyst, dingin tapi perhatian), Bu Ratna (HR sok tahu).",
    charactersList:[
      {name:"Arka",role:"Senior Analis",heart:22,bio:"Wajah datar tapi diam-diam taruh permen favoritmu di meja.",avatarPrompt:"anime handsome office worker glasses loosened tie elevator reflection"}
    ],
    env:{day:"Kamis, 12 Nov 2026",time:"20:05",location:"Elevator Lt. 7",status:"Berhenti Mendadak"},
    mission:{title:"Bertahan di Lift",client:"Situasi Terjebak",objective:"Hubungi pemeliharaan atau ajak Arka bicara"},
    worldStats:{reputation:"Ketegangan: 60%",members:"Sinyal: 1 Bar"},
    opening:"KREEK... elevator berguncang dan berhenti. Lampu darurat kuning lembut. Arka melepas dasi: \"Tenang... gue ada di sini, jangan panik.\""
  },
  {
    id:"bandar-bayangan", title:"Bandar di Kota Bayangan",
    tagline:"Satu langkah salah, kamu ketahuan.",
    genre:"Aksi", gender:"all",
    tags:["#Undercover","#Aksi","#Mafia","#Cyberpunk","#Konspirasi"],
    stats:{assets:210, chats:"1.6K"},
    coverPrompt:"rainy neon city street at night, undercover agent chasing shadowy figure, cinematic intense",
    premise:"Penyamar internal di jaringan bandar ilegal. Setiap malam taruhan nyawa.",
    characters:"Pak Elang (atasan misterius), Rara (agen ganda).",
    charactersList:[
      {name:"Rara",role:"Agen Ganda",heart:14,bio:"Wanita lincah berjaket kulit merah, agenda tersembunyi.",avatarPrompt:"anime cyberpunk female secret agent red jacket gun neon rain"}
    ],
    env:{day:"Senin, 02 Nov 2026",time:"23:10",location:"Dermaga Sektor 9",status:"Penyamaran Aktif"},
    mission:{title:"Penyusupan Gudang 7",client:"Pak Elang",objective:"Salin data transaksi sebelum penjaga selesai merokok"},
    worldStats:{reputation:"Kecurigaan: 15%",members:"Waktu: 04:30"},
    opening:"Rintik hujan menyiram kontainer berkarat. Rara menyodorkan flashdisk terenkripsi: \"Kalau tertangkap, kita tak pernah kenal. Siap bergerak?\""
  }
];

// Helper Library & Sessions
function loadLibrary() {
  try { return JSON.parse(localStorage.getItem("zenn_lib")) || {}; }
  catch (e) { return {}; }
}
function saveLibrary(lib) { localStorage.setItem("zenn_lib", JSON.stringify(lib)); }

// Gallery / Album Unlocked per Story
function loadStoryAlbum(storyId) {
  try {
    const all = JSON.parse(localStorage.getItem("zenn_albums")) || {};
    return all[storyId] || [];
  } catch (e) { return []; }
}
function saveStoryAlbum(storyId, imgUrl, caption) {
  if (!imgUrl) return;
  try {
    const all = JSON.parse(localStorage.getItem("zenn_albums")) || {};
    const list = all[storyId] || [];
    if (!list.some(item => item.url === imgUrl)) {
      list.push({ url: imgUrl, caption: caption || "", time: Date.now() });
      all[storyId] = list;
      localStorage.setItem("zenn_albums", JSON.stringify(all));
      if (typeof cloudSync === "function") cloudSync("rpg_" + storyId, () => DB.saveRPG(storyId, getStoryRPGState(storyId), loadStoryAlbum(storyId)));
    }
  } catch (e) {}
}

// tandai cerita dewasa (21+)
const MATURE = {"vilain-gym":true,"benteng-malam":true,"binal-penthouse":true,"binal-cafe":true};
function isMature(story) { return story.mature === true || MATURE[story.id] === true; }

function getAllTags(stories) {
  const s = new Set();
  (stories || SEED_STORIES).forEach(st => (st.tags || []).forEach(t => s.add(t)));
  return Array.from(s);
}
