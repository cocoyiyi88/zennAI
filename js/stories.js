// Cerita benih (seed) zennAI
const GENRES = ["Romance", "Fantasi", "Misteri", "Aksi", "Slice of Life"];

const SEED_STORIES = [
  {
    id: "vilain-gym",
    title: "Villain Haven Gym",
    tagline: "Gym hancur dikuasai para penjahat, tersisa tiga pelatih cantik.",
    genre: "Aksi",
    coverPrompt: "anime ruined gym interior, muscular villain silhouettes, three gorgeous female trainers standing brave, dramatic lighting, dynamic composition",
    premise: "Kamu mewarisi gym tua yang sekarang dikuasai sekelompok penjahat yang menjadikannya markas. Tiga pelatih — Rena, Sari, dan Laila — menolak menyerah dan mengajakmu merebut kembali tempat ini.",
    characters: "Rena (tegas, bekas atlet), Sari (ceria, ahli taktik), Laila (dingin, misterius).",
    opening: "Pagi masih berkabut saat kamu membuka pintu gym. Di dalam, tiga penjahat bersandar santai di atas bangku bench press, menyeringai. Dari sudut, Rena menatapmu, mata menyala: \"Kamu pasti pewaris tempat ini. Bantu kami mengusir mereka — atau biarkan gym ini jadi sarang mereka.\""
  },
  {
    id: "warung-ciuman",
    title: "Warung Delinquent",
    tagline: "Tiga gadis nakal yang merampok warungmu malah jadi pegawai.",
    genre: "Slice of Life",
    coverPrompt: "anime convenience store interior night, three delinquent girls in school uniforms working, warm neon light, comedic cozy mood",
    premise: "Warung kamu dirampok tiga gadis delinquent. Alih-alih lapor polisi, kamu tawari mereka kerja untuk membayar ganti rugi. Sekarang mereka pegawai dadakanmu — dan kekacauan tak pernah berhenti.",
    characters: "Momo (keras kepala), Chika (rewel tapi rajin), Aya (pendiam, jago masak).",
    opening: "\"Kita bisa kerja di sini, kan?\" Momo menatapmu setengah menantang, setengah canggung. Di belakangnya Chika sudah mulai merapikan rak mie instan, dan Aya diam-diam menyalakan kompor. Warungmu belum pernah seramai ini."
  },
  {
    id: "log-karam",
    title: "Castaway Log",
    tagline: "Bertahan hidup di atas rakit.",
    genre: "Aksi",
    coverPrompt: "anime person on a small wooden raft in vast ocean, storm clouds, cinematic scale, hopeful figures",
    premise: "Kapalmu karam. Kamu terbangun di rakit kayu kecil, sendirian di tengah lautan. Sekawanan burung, sampah laut, dan secercah pulau di kejauhan adalah satu-satunya harapanmu.",
    characters: "Kamu (korban karam), seekor camar tua yang setia menemani, sinyal suar yang tak berbunyi.",
    opening: "Air asin membangunkanmu. Rakit bergoyang pelan. Di ujung cakrawala, titik hijau kecil — mungkin pulau. Burung camar tua hinggap di tiangmu, seolah berkata: \"Jangan menyerah dulu.\""
  },
  {
    id: "biro-jujutsu",
    title: "Biro Urusan Jujutsu",
    tagline: "Atasi ledakan roh terkutuk di Seoul.",
    genre: "Fantasi",
    coverPrompt: "anime modern Seoul at night, cursed spirits glowing purple, young sorcerer team confronting, dramatic cityscape",
    premise: "Roh terkutuk meledak membanjiri Seoul. Kau anggota muda Biro Urusan Jujutsu yang ditugaskan membereskan krisis ini sebelum meluas. Setiap pilihan menentukan siapa yang selamat.",
    characters: "Kang (senior yang dingin), Hana (ahli barrier yang ceria), roh terkutuk yang menyamar sebagai manusia.",
    opening: "Sirine berbunyi. Di layar markas, peta Seoul berkedip merah di distrik Itaewon. Kang menggenggam pedangnya: \"Ini bukan latihan. Ikuti aku — dan jangan percaya siapa pun yang kau temui di sana.\""
  },
  {
    id: "kenangan-sekolah",
    title: "Kenangan Kelas 3A",
    tagline: "Ujian terakhir SMA, dan perasaan yang belum sempat diucap.",
    genre: "Romance",
    coverPrompt: "anime high school classroom golden afternoon light, students, shy boy and girl sharing a desk, cherry blossoms outside window",
    premise: "Tinggal tiga bulan menuju kelulusan. Kamu harus memutuskan: mengejar nilai, mengungkapkan perasaan, atau membiarkan semua berlalu begitu saja.",
    characters: "Raka (teman sebangku, diam-diam menyukaimu), Bu Guru Sinta (yang selalu tahu), teman-teman sekelas yang punya drama sendiri.",
    opening: "Kelas 3A sepi saat pulang sekolah. Raka menaruh secangkir kopi di mejamu tanpa bicara. Di luar, bunga sakura mulai gugur. \"Kamu mau ikut belajar kelompok nanti malam?\" tanyanya akhirnya."
  },
  {
    id: "benteng-malam",
    title: "Benteng Malam",
    tagline: "Markas rahasia tiga pemuda nakal, dipisah satu pintu.",
    genre: "Romance",
    coverPrompt: "anime cozy secret hideout room at night, three delinquent boys, warm lamp light, one door, intimate mood",
    premise: "Kamu tinggal di kamar kos sebelah markas rahasia tiga pemuda nakal. Hanya dipisah satu pintu dinding — dan ketiganya mulai menyadari kehadiranmu.",
    characters: "Dio (pemimpin, flirty), Farel (pendiam, protektif), Ojan (cerewet, paling jujur).",
    opening: "Saat tengah malam, kamu mendengar suara bisikan dari balik dinding. \"Psst... kau dengar itu?\" Suara Dio. Dinding tipis itu tiba-tiba terasa sangat tipis."
  }
];

function loadLibrary() {
  try { return JSON.parse(localStorage.getItem("zenn_lib")) || {}; }
  catch (e) { return {}; }
}
function saveLibrary(lib) { localStorage.setItem("zenn_lib", JSON.stringify(lib)); }

// tandai cerita dewasa (21+) — disembunyikan saat safe mode ON
const MATURE = {
  "vilain-gym": true,
  "benteng-malam": true
};
function isMature(story) { return MATURE[story.id] === true; }
