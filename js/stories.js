// Cerita benih (seed) zennAI
const GENRES = ["Romance", "Fantasi", "Misteri", "Aksi", "Slice of Life", "Harem", "Isekai", "Horror", "Komedi", "Binal"];

const SEED_STORIES = [
  {
    id: "vilain-gym",
    title: "Villain Haven Gym",
    tagline: "Gym hancur dikuasai para penjahat, tersisa tiga pelatih cantik.",
    genre: "Aksi",
    gender: "m",
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
    gender: "m",
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
    gender: "all",
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
    gender: "all",
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
    gender: "f",
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
    gender: "f",
    coverPrompt: "anime cozy secret hideout room at night, three delinquent boys, warm lamp light, one door, intimate mood",
    premise: "Kamu tinggal di kamar kos sebelah markas rahasia tiga pemuda nakal. Hanya dipisah satu pintu dinding — dan ketiganya mulai menyadari kehadiranmu.",
    characters: "Dio (pemimpin, flirty), Farel (pendiam, protektif), Ojan (cerewet, paling jujur).",
    opening: "Saat tengah malam, kamu mendengar suara bisikan dari balik dinding. \"Psst... kau dengar itu?\" Suara Dio. Dinding tipis itu tiba-tiba terasa sangat tipis."
  },
  {
    id: "harem-asrama",
    title: "Asrama Grand Harem",
    tagline: "Satu-satunya cowok di asrama cewek — dan tiga masalah besar.",
    genre: "Harem",
    gender: "m",
    coverPrompt: "anime mixed dorm common room, one boy surrounded by many cute girls, vibrant playful mood, colorful lighting",
    premise: "Kamu satu-satunya siswa cowok yang dapat kamar di Asrama Putri Akatsuki akibat kesalahan administrasi. Manajemen membiarkanmu tinggal asal kamu mau menolong tiga penghuni paling bermasalah.",
    characters: "Luna (ketua asrama, tsundere), Mei (gadis antisosial yang jenius), Suki (sporty cheerleader).",
    opening: "\"Kamu tuh siapa?\" Luna menghadangmu di lorong, tangan bertumpu di pinggang. \"Asrama ini khusus cewek. Tapi... manager bilang kamu boleh tinggal kalau mau nolongin tiga masalah besar kami.\""
  },
  {
    id: "isekai-game",
    title: "Re:Start — Masuk ke Game",
    tagline: "Dunia game yang kau mainkan ternyata nyata.",
    genre: "Isekai",
    gender: "all",
    coverPrompt: "anime fantasy RPG world, hero stepping through glowing portal, floating game screens, epic scale",
    premise: "Saat kamu menekan tombol 'New Game' terakhir kali, layar menyala dan menelanmu. Kamu terbangun di dunia game yang pernah kau taklukkan. Tapi sekarang, setiap kematianmu permanen.",
    characters: "Navi (pemandu digital yang menyebalkan), Raja Iblis yang ternyata mengenalmu, guild tempatmu bergabung.",
    opening: "\"Selamat datang, Player 1.\" Suara dingin menyambutmu. \"Ini bukan game. Ini duniamu sekarang. Dan musuhmu sudah tahu namamu.\""
  },
  {
    id: "horror-asrama",
    title: "Asrama 13",
    tagline: "Jam tiga pagi, koridor lantai tiga.",
    genre: "Horror",
    gender: "all",
    coverPrompt: "dark abandoned boarding school hallway at night, flickering lights, eerie shadows, suspense",
    premise: "SMA Nusa punya legenda: asrama lama nomor 13, yang ditutup sejak 30 tahun lalu. Sebagai ketua piket malam, kamu harus menjaga koridor yang katanya berhantu.",
    characters: "Bang Umar (satpam tua yang tahu banyak), Risa (teman yang ikut piket, mulai aneh), sosok tanpa bayangan.",
    opening: "\"Jam tiga pagi, koridor lantai tiga.\" Bisik itu terdengar jelas meski tak ada orang. Lampu berkedip. Langkah kaki mendekat dari ujung lorong — tanpa bayangan."
  },
  {
    id: "komedi-kos",
    title: "Tiga Sahabat Kos",
    tagline: "Satu kos, tiga sekawan, nol akal sehat.",
    genre: "Komedi",
    gender: "all",
    coverPrompt: "chaotic shared house living room, three friends arguing over remote, cozy messy warm light",
    premise: "Kamu tinggal sekos dengan Udin dan Raka, dua sahabat yang selalu bikin keributan. Dari rebutan remote sampai resep masakan eksperimen, hidup kos tak pernah sepi.",
    characters: "Udin (pemalas tapi cerewet), Raka (panik setiap ada tugas), Ibu Kos yang tiba-tiba muncul.",
    opening: "\"Gue gak terima kalau gorengan lu yang nongkrong di sofa.\" Udin menuding ember keripik. \"Itu punya gue!\" Teriak Raka. Kamu cuma bisa menghela napas — kos tiga sekawan memang selalu begitu."
  },
  {
    id: "binal-cafe",
    title: "Café Midnight",
    tagline: "Bar eksklusif yang cuma buka tengah malam.",
    genre: "Binal",
    gender: "f",
    mature: true,
    coverPrompt: "moody upscale night cafe interior, elegant female bartender, dim seductive lighting, film noir",
    premise: "Kamu kerja shift malam di Café Midnight, bar eksklusif yang hanya buka tengah malam. Tamu-tamu penuh teka-teki, dan atasanmu punya aura misterius yang sulit diabaikan.",
    characters: "Vanya (manajer bar, dingin namun menggoda), Damar (pelanggan tetap yang penuh rahasia).",
    opening: "\"Shift malam, ya?\" Vanya menyeringai tipis, cahaya redup menerangi wajahnya. \"Di sinilah rahasia-rahasia kota dibayar. Jangan sampai ketagihan.\""
  },
  {
    id: "binal-penthouse",
    title: "Penthouse Sang Pewaris",
    tagline: "Satu atap, tiga wanita karismatik memperebutkanmu.",
    genre: "Binal",
    gender: "m",
    mature: true,
    coverPrompt: "luxurious penthouse party at night, charismatic young man, glamorous women, neon glow, high-end",
    premise: "Kamu pewaris penthouse mewah milik pamanmu. Tiga wanita karismatik — mantan kekasih, kolega bisnis, dan tetangga misterius — terus berebut perhatianmu di bawah satu atap.",
    characters: "Selena (CEO tajam yang ambisius), Dara (tetangga flirty), Krisna (mantan yang tiba-tiba comeback).",
    opening: "Pesta pindahan belum dimulai, tapi tiga wanita sudah antre di depan pintu penthouse. Kepala pelayan berbisik: \"Tuan muda, malam ini bakal panjang.\""
  },
  {
    id: "rahasia-lantai7",
    title: "Rahasia Lantai 7",
    tagline: "Elevator yang sering macet, dan dia yang selalu naik di jam yang sama.",
    genre: "Romance",
    gender: "f",
    coverPrompt: "modern office at dusk, young professional woman and handsome colleague sharing elevator, soft tension",
    premise: "Kantormu punya elevator yang sering macet di lantai 7. Dan dia — rekan tim yang tampan dan dingin — selalu naik di jam yang sama. Setiap macet, jeda hening itu terasa lama.",
    characters: "Arka (Senior Analyst yang dingin tapi perhatian), Bu Ratna (HR yang sok tahu).",
    opening: "Elevator bergetar. Lampu mati. Di senja kantor yang sepi, suara Arka rendah: \"Jangan panik. Gue ada di sini.\""
  },
  {
    id: "bandar-bayangan",
    title: "Bandar di Kota Bayangan",
    tagline: "Satu langkah salah, kamu ketahuan.",
    genre: "Aksi",
    gender: "all",
    coverPrompt: "rainy neon city street at night, undercover agent chasing shadowy figure, cinematic intense",
    premise: "Kamu penyamar internal di jaringan bandar ilegal Kota Bayangan. Setiap malam adalah taruhan nyawa, dan setiap orang punya dua wajah.",
    characters: "Pak Elang (atasan misterius), Rara (agen dua sisi yang tak bisa dipercaya).",
    opening: "\"Misi malam ini: masuk gudang nomor 7.\" Pak Elang menyerahkan peta tua. \"Kalau tertangkap, kami tidak kenal kamu.\""
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
function isMature(story) { return story.mature === true || MATURE[story.id] === true; }
