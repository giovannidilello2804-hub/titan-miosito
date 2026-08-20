function getWaPhone() {
  const saved = localStorage.getItem("titan_admin_wa_phone");
  if (saved && saved.trim() && saved.trim() !== "393000000000") {
    return saved.trim();
  }
  localStorage.setItem("titan_admin_wa_phone", "393479927649");
  return "393479927649";
}

const savedSemaforo = (() => {
  try { return JSON.parse(localStorage.getItem("titan_admin_semaforo")); } catch(e) { return null; }
})();

// --------------------------------------------------------------------------
// Sistema Playlist Musicale a Rotazione Automatica (Multi-Brano)
// --------------------------------------------------------------------------
const musicPlaylist = [
  "assets/musica/brano1.mp3",
  "assets/musica/brano2.mp3",
  "assets/musica/brano3.mp3",
  "assets/musica/brano4.mp3",
  "assets/musica/musica.mp3",
  "assets/audio/bg_music.mp3",
  "assets/bg_music.mp3"
];
let currentMusicIndex = 0;

function initMusicPlayer() {
  const audio = document.getElementById("bgAudio");
  if (!audio) return;

  // Quando un brano finisce, passa automaticamente al brano successivo in rotazione
  audio.addEventListener("ended", () => {
    playNextTrackInRotation();
  });

  // Se un file non esiste, salta al successivo senza interrompere la musica
  audio.addEventListener("error", () => {
    console.log("Brano non trovato, passaggio al successivo in rotazione...");
    if (!audio.paused) {
      playNextTrackInRotation();
    }
  });
}

function playNextTrackInRotation() {
  const audio = document.getElementById("bgAudio");
  const btn = document.getElementById("bgMusicBtn");
  const status = document.getElementById("bgMusicStatus");
  if (!audio) return;

  currentMusicIndex = (currentMusicIndex + 1) % musicPlaylist.length;
  audio.src = musicPlaylist[currentMusicIndex];
  audio.volume = 0.35;
  audio.play().then(() => {
    if (status) status.textContent = `Musica ON 🔊 (Brano ${currentMusicIndex + 1})`;
    if (btn) btn.classList.add("playing");
  }).catch(err => {
    console.log("Errore riproduzione brano:", musicPlaylist[currentMusicIndex]);
  });
}

function toggleBgMusic() {
  const audio = document.getElementById("bgAudio");
  const btn = document.getElementById("bgMusicBtn");
  const status = document.getElementById("bgMusicStatus");
  if (!audio) return;

  if (audio.paused) {
    audio.volume = 0.35;
    if (!audio.src || audio.src === window.location.href) {
      audio.src = musicPlaylist[currentMusicIndex];
    }
    audio.play().then(() => {
      if (status) status.textContent = `Musica ON 🔊 (Brano ${currentMusicIndex + 1})`;
      if (btn) btn.classList.add("playing");
    }).catch(err => {
      console.error("Audio playback error:", err);
      playNextTrackInRotation();
    });
  } else {
    audio.pause();
    if (status) status.textContent = "Musica OFF 🔇";
    if (btn) btn.classList.remove("playing");
  }
}

function skipNextMusicTrack() {
  playNextTrackInRotation();
}

window.addEventListener("DOMContentLoaded", () => {
  initMusicPlayer();
});

const state = {
  kwhPrice: parseFloat(localStorage.getItem("titan_admin_kwh_price")) || 0.35,
  baseSetupFee: parseFloat(localStorage.getItem("titan_admin_base_setup")) || 5.00,
  waPhone: getWaPhone(),
  adminPassword: localStorage.getItem("titan_admin_password") || "1234",
  streamBambu: localStorage.getItem("titan_admin_stream_bambu") || "assets/timelapse_bambu/timelapse_bambu.mp4",
  streamAnycubic: localStorage.getItem("titan_admin_stream_anycubic") || "assets/timelapse_anycubic/timelapse_anycubic.mp4",
  fbChannelLink: localStorage.getItem("titan_admin_fb_channel") || "https://www.facebook.com/profile.php?id=100007422796036",
  ytChannelLink: localStorage.getItem("titan_admin_yt_channel") || "https://www.youtube.com/watch?v=NJzGKR9L8pc",
  publicTimelapse1: localStorage.getItem("titan_admin_timelapse_1") || "3DBenchy_PLA_0.2_15m9S_02.mp4",
  publicTimelapse2: localStorage.getItem("titan_admin_timelapse_2") || "assets/anycubic/timelapse_anycubic.mp4",
  selectedMaterialKey: "pla",
  selectedMaterialPrice: 0.04,
  selectedMaterialName: "PLA Standard (Bio-Amido)",
  selectedColors: ["Nero"],
  simMode: "solid",
  simColor: "#00f0ff",
  simLayer: 100,
  stlData: null,
  semaforoStatus: savedSemaforo ? savedSemaforo.status : "green",
  semaforoText: savedSemaforo ? savedSemaforo.labelText : "MACCHINE DISPONIBILI",
  semaforoSub: savedSemaforo ? savedSemaforo.subText : "2/2 Macchine Pronte"
};

// --------------------------------------------------------------------------
// IndexedDB per Persistenza Video MP4 di Grandi Dimensioni senza limiti di 5MB
// --------------------------------------------------------------------------
const DB_NAME = "Titan3DDB";
const DB_VERSION = 1;
const STORE_NAME = "video_timelapses";

function openVideoDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveVideoToIDB(key, fileOrBlob) {
  try {
    const db = await openVideoDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(fileOrBlob, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("Errore salvataggio video IndexedDB:", err);
  }
}

async function getVideoFromIDB(key) {
  try {
    const db = await openVideoDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("Errore lettura video IndexedDB:", err);
    return null;
  }
}

async function deleteVideoFromIDB(key) {
  try {
    const db = await openVideoDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("Errore cancellazione video IndexedDB:", err);
  }
}

async function loadPersistedVideos() {
  const v1 = await getVideoFromIDB("timelapse_1");
  if (v1) {
    state.publicTimelapse1 = URL.createObjectURL(v1);
  }
  const v2 = await getVideoFromIDB("timelapse_2");
  if (v2) {
    state.publicTimelapse2 = URL.createObjectURL(v2);
  }
  applySocialAndTimelapseLinks();
}

window.addEventListener("DOMContentLoaded", () => {
  loadPersistedVideos();
});

if (state.publicTimelapse1 && (state.publicTimelapse1.startsWith("[Video MP4") || state.publicTimelapse1.startsWith("Es.") || state.publicTimelapse1.startsWith("Video Caricato"))) {
  state.publicTimelapse1 = "assets/timelapse_bambu/timelapse_bambu.mp4";
  localStorage.removeItem("titan_admin_timelapse_1");
}
if (state.publicTimelapse2 && (state.publicTimelapse2.startsWith("[Video MP4") || state.publicTimelapse2.startsWith("Es.") || state.publicTimelapse2.startsWith("Video Caricato"))) {
  state.publicTimelapse2 = "assets/timelapse_anycubic/timelapse_anycubic.mp4";
  localStorage.removeItem("titan_admin_timelapse_2");
}

async function removeTimelapseVideo(slotNum) {
  const key = "timelapse_" + slotNum;
  await deleteVideoFromIDB(key);
  if (slotNum === 1) {
    state.publicTimelapse1 = "assets/timelapse_bambu/timelapse_bambu.mp4";
    localStorage.removeItem("titan_admin_timelapse_1");
    const input = document.getElementById("adminPublicTimelapse1");
    if (input) input.value = "";
  } else {
    state.publicTimelapse2 = "assets/timelapse_anycubic/timelapse_anycubic.mp4";
    localStorage.removeItem("titan_admin_timelapse_2");
    const input = document.getElementById("adminPublicTimelapse2");
    if (input) input.value = "";
  }
  applySocialAndTimelapseLinks();
  alert(`✓ Video Macchina ${slotNum} rimosso. Ripristinato il video di default.`);
}

function formatExternalUrl(url) {
  if (!url) return "#";
  let clean = url.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "https://" + clean;
  }
  return clean;
}

function formatYoutubeEmbed(url) {
  if (!url) return "";
  let clean = url.trim();
  if (clean.includes("youtube.com/watch?v=")) {
    clean = clean.replace("youtube.com/watch?v=", "youtube.com/embed/").split("&")[0];
  } else if (clean.includes("youtu.be/")) {
    const id = clean.split("youtu.be/")[1].split("?")[0];
    clean = `https://www.youtube.com/embed/${id}`;
  } else if (clean.includes("youtube.com/shorts/")) {
    const id = clean.split("youtube.com/shorts/")[1].split("?")[0];
    clean = `https://www.youtube.com/embed/${id}`;
  } else if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("assets/")) {
    clean = "https://" + clean;
  }
  if (clean.includes("youtube.com/embed/") && !clean.includes("playsinline=")) {
    clean += (clean.includes("?") ? "&" : "?") + "playsinline=1&rel=0";
  }
  return clean;
}

function renderUniversalVideoPlayer(url, title) {
  const fallbackUrl = title.includes("Anycubic") 
    ? "assets/anycubic/timelapse_anycubic.mp4" 
    : "3DBenchy_PLA_0.2_15m9S_02.mp4";

  if (!url || url.startsWith("Es.") || url.startsWith("Video Caricato") || url.startsWith("[Video MP4")) {
    if (title.includes("Bambu")) {
      url = state.publicTimelapse1 || "3DBenchy_PLA_0.2_15m9S_02.mp4";
    } else if (title.includes("Anycubic")) {
      url = state.publicTimelapse2 || "assets/anycubic/timelapse_anycubic.mp4";
    } else {
      url = fallbackUrl;
    }
  }

  const clean = url.trim();

  if (clean.includes("youtube.com") || clean.includes("youtu.be")) {
    const embedSrc = formatYoutubeEmbed(clean);
    return `
      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border-glow);">
        <iframe src="${embedSrc}" title="${title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    `;
  }

  if (clean.includes("drive.google.com")) {
    let driveSrc = clean;
    if (driveSrc.includes("/view")) driveSrc = driveSrc.replace(/\/view.*/, "/preview");
    return `
      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius-sm); border: 1px solid var(--border-glow);">
        <iframe src="${driveSrc}" title="${title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="autoplay" allowfullscreen></iframe>
      </div>
    `;
  }

  return `
    <div style="position: relative; width: 100%; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-glow); background: #000;">
      <video controls autoplay loop muted playsinline webkit-playsinline preload="metadata" style="width: 100%; height: auto; max-height: 320px; object-fit: cover; display: block;" onerror="this.parentNode.innerHTML='<iframe src=\\'${fallbackUrl}\\' style=\\'width:100%; height:250px; border:none;\\' allowfullscreen></iframe>'">
        <source src="${clean}">
        Il tuo browser non supporta la riproduzione video.
      </video>
    </div>
  `;
}

async function handleLocalVideoUpload(slotNum, files) {
  if (!files || files.length === 0) return;
  const file = files[0];
  if (file.size > 200 * 1024 * 1024) {
    alert("⚠️ Il file video supera i 200MB! Consigliamo un video MP4 più leggero.");
    return;
  }

  const key = "timelapse_" + slotNum;
  await saveVideoToIDB(key, file);

  const objectUrl = URL.createObjectURL(file);
  if (slotNum === 1) {
    state.publicTimelapse1 = objectUrl;
    const input = document.getElementById("adminPublicTimelapse1");
    if (input) input.value = "[Video MP4 Caricato: " + file.name + "]";
  } else {
    state.publicTimelapse2 = objectUrl;
    const input = document.getElementById("adminPublicTimelapse2");
    if (input) input.value = "[Video MP4 Caricato: " + file.name + "]";
  }
  applySocialAndTimelapseLinks();
  alert(`✓ Video "${file.name}" salvato PERMANENTEMENTE! Rimarrà attivo anche chiudendo il browser o riavviando il PC.`);
}

function applySocialAndTimelapseLinks() {
  const fbUrl = formatExternalUrl(state.fbChannelLink);
  const ytUrl = formatExternalUrl(state.ytChannelLink);

  const fbBtn = document.getElementById("fbChannelLink");
  if (fbBtn && state.fbChannelLink) fbBtn.href = fbUrl;

  const ytBtn = document.getElementById("ytChannelLink");
  if (ytBtn && state.ytChannelLink) ytBtn.href = ytUrl;

  const footerFb = document.getElementById("footerFbChannelLink");
  if (footerFb && state.fbChannelLink) footerFb.href = fbUrl;

  const footerYt = document.getElementById("footerYtChannelLink");
  if (footerYt && state.ytChannelLink) footerYt.href = ytUrl;

  const box1 = document.getElementById("timelapseBox1");
  if (box1) {
    box1.innerHTML = renderUniversalVideoPlayer(state.publicTimelapse1 || "3DBenchy_PLA_0.2_15m9S_02.mp4", "Timelapse Bambu Lab X1C");
  }

  const box2 = document.getElementById("timelapseBox2");
  if (box2) {
    box2.innerHTML = renderUniversalVideoPlayer(state.publicTimelapse2 || "assets/anycubic/timelapse_anycubic.mp4", "Timelapse Anycubic S1 Max");
  }
function initSemaforo() {
  let saved = null;
  try {
    const raw = localStorage.getItem("titan_admin_semaforo");
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    saved = null;
  }

  const status = saved ? saved.status : (state.semaforoStatus || "green");
  const labelText = saved ? saved.labelText : (state.semaforoText || "MACCHINE DISPONIBILI");
  const subText = saved ? saved.subText : (state.semaforoSub || "2/2 Macchine Pronte");

  setSemaforo(status, labelText, subText);
}

document.addEventListener("DOMContentLoaded", () => {
  renderMaterialCards();
  renderColorPalettes();
  init3DSimulator();
  initStlDragDrop();
  applySocialAndTimelapseLinks();
  initSemaforo();
  calculateQuote();
});

window.addEventListener("load", () => {
  initSemaforo();
});

// --------------------------------------------------------------------------
// Materials Configuration & Dynamic Spool Pricing (€/kg)
// --------------------------------------------------------------------------
const defaultMaterialsConfig = {
  pla: {
    key: "pla",
    name: "PLA Standard (Bio-Amido)",
    badge: "100% ATOSSICO",
    badgeColor: "green",
    desc: "Prototipi & Giochi",
    costPerKg: 25.00,
    pricePerGram: 0.04
  },
  pla_food: {
    key: "pla_food",
    name: "PLA Alimentare (Certificato Cibo)",
    badge: "🍎 USO ALIMENTARE",
    badgeColor: "green",
    desc: "Sicuro Contatto Cibo & Cucina",
    costPerKg: 35.00,
    pricePerGram: 0.06
  },
  petg: {
    key: "petg",
    name: "PETG Resistente (Inodore)",
    badge: "CONSIGLIATO",
    badgeColor: "",
    desc: "Meccanico & UV",
    costPerKg: 30.00,
    pricePerGram: 0.05
  },
  tpu: {
    key: "tpu",
    name: "TPU Flessibile & Traslucido (Gomma)",
    badge: "🌀 GOMMA TRASLUCIDA",
    badgeColor: "amber",
    desc: "Flessibile, Shock & Traslucida",
    costPerKg: 45.00,
    pricePerGram: 0.08
  },
  placf: {
    key: "placf",
    name: "PLA-CF Carbon Fiber",
    badge: "ULTRA RIGIDO",
    badgeColor: "",
    desc: "Fibra Carbonio PLA",
    costPerKg: 55.00,
    pricePerGram: 0.10
  },
  petgcf: {
    key: "petgcf",
    name: "PETG-CF Carbon Fiber",
    badge: "HIGH TEMP & CARBON",
    badgeColor: "cyan",
    desc: "Fibra Carbonio PETG",
    costPerKg: 65.00,
    pricePerGram: 0.12
  }
};

function getMaterialsConfig() {
  const saved = localStorage.getItem("titan_materials_config");
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return defaultMaterialsConfig;
}

function saveMaterialsConfig(config) {
  localStorage.setItem("titan_materials_config", JSON.stringify(config));
}

function renderMaterialCards() {
  const container = document.getElementById("materialCardsGrid");
  if (!container) return;

  const materials = getMaterialsConfig();
  const keys = Object.keys(materials);

  if (!state.selectedMaterialKey || !materials[state.selectedMaterialKey]) {
    state.selectedMaterialKey = "pla";
    state.selectedMaterialPrice = materials["pla"].pricePerGram;
    state.selectedMaterialName = materials["pla"].name;
  }

  container.innerHTML = keys.map(key => {
    const mat = materials[key];
    const isActive = state.selectedMaterialKey === key ? "active" : "";
    const badgeClass = mat.badgeColor ? mat.badgeColor : "";
    
    return `
      <div class="mat-card ${isActive}" data-mat="${mat.key}" data-price="${mat.pricePerGram}" data-name="${mat.name}" onclick="selectMaterialCard(this)">
        <div class="mat-badge ${badgeClass}">${mat.badge}</div>
        <div class="mat-name">${mat.name.split(" ")[0]}</div>
        <div class="mat-desc">${mat.desc}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 2px;">Spola: <strong>€${mat.costPerKg.toFixed(2)}/kg</strong></div>
        <div class="mat-price">€${mat.pricePerGram.toFixed(2)} / g</div>
      </div>
    `;
  }).join("");
}

function selectMaterialCard(cardEl) {
  document.querySelectorAll(".mat-card").forEach(c => c.classList.remove("active"));
  cardEl.classList.add("active");

  state.selectedMaterialKey = cardEl.getAttribute("data-mat");
  state.selectedMaterialPrice = parseFloat(cardEl.getAttribute("data-price"));
  state.selectedMaterialName = cardEl.getAttribute("data-name");

  renderColorPalettes();
  calculateQuote();
}

function renderAdminMaterialsPricing() {
  const container = document.getElementById("adminMaterialsPricingList");
  if (!container) return;

  const materials = getMaterialsConfig();
  const keys = Object.keys(materials);

  container.innerHTML = keys.map(key => {
    const mat = materials[key];
    return `
      <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px; align-items: center; background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: var(--radius-sm);">
        <strong style="font-size: 0.88rem;">${mat.name}</strong>
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Costo Spola (€/kg):</span>
          <input type="number" id="adminMatCost_${key}" value="${mat.costPerKg}" step="1" style="padding: 4px 8px; font-size: 0.85rem;" onchange="saveMaterialPricesFromAdmin()">
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">Tariffa Vendita (€/g):</span>
          <input type="number" id="adminMatPrice_${key}" value="${mat.pricePerGram}" step="0.01" style="padding: 4px 8px; font-size: 0.85rem;" onchange="saveMaterialPricesFromAdmin()">
        </div>
      </div>
    `;
  }).join("");
}

function saveMaterialPricesFromAdmin() {
  const materials = getMaterialsConfig();
  const keys = Object.keys(materials);

  keys.forEach(key => {
    const costEl = document.getElementById(`adminMatCost_${key}`);
    const priceEl = document.getElementById(`adminMatPrice_${key}`);
    if (costEl && priceEl) {
      const costVal = parseFloat(costEl.value);
      const priceVal = parseFloat(priceEl.value);
      if (!isNaN(costVal)) materials[key].costPerKg = costVal;
      if (!isNaN(priceVal)) materials[key].pricePerGram = priceVal;
    }
  });

  saveMaterialsConfig(materials);

  if (state.selectedMaterialKey && materials[state.selectedMaterialKey]) {
    state.selectedMaterialPrice = materials[state.selectedMaterialKey].pricePerGram;
    state.selectedMaterialName = materials[state.selectedMaterialKey].name;
  }

  renderMaterialCards();
  calculateQuote();

  const successMsg = document.getElementById("adminMatPriceSuccess");
  if (successMsg) {
    successMsg.classList.remove("hidden");
    setTimeout(() => successMsg.classList.add("hidden"), 3000);
  }
}

// --------------------------------------------------------------------------
// Dynamic Per-Material Dual Color Palette & Admin Custom Palette Manager
// --------------------------------------------------------------------------
const defaultMaterialColors = {
  pla: {
    stock: [
      { name: "Nero", hex: "#000000", inStock: true },
      { name: "Bianco", hex: "#ffffff", border: "1px solid #666", inStock: true }
    ],
    order: [
      { name: "Grigio", hex: "#8a8a8a" },
      { name: "Rosso", hex: "#ff2a5f" },
      { name: "Blu", hex: "#00f0ff" },
      { name: "Trasparente / Traslucido (PLA)", hex: "rgba(255,255,255,0.45)", border: "1px dashed #00f0ff" },
      { name: "Rosso Traslucido (PLA)", hex: "rgba(255, 42, 95, 0.65)", border: "1px dashed #ff2a5f" },
      { name: "Blu Traslucido (PLA)", hex: "rgba(0, 240, 255, 0.65)", border: "1px dashed #00f0ff" },
      { name: "Verde Traslucido (PLA)", hex: "rgba(0, 255, 136, 0.65)", border: "1px dashed #00ff88" },
      { name: "Verde Fluo", hex: "#00ff88" },
      { name: "Giallo", hex: "#ffd700" },
      { name: "Arancione", hex: "#ff9900" },
      { name: "Oro / Gold", hex: "linear-gradient(135deg, #ffd700, #b8860b)" },
      { name: "Bronzo / Rame", hex: "linear-gradient(135deg, #cd7f32, #8b4513)" },
      { name: "Viola / Purple", hex: "#9900ff" },
      { name: "Rosa / Pink", hex: "#ff007f" },
      { name: "Sfumato / Rainbow", hex: "linear-gradient(45deg, #ff0000,#00ff00,#0000ff)" }
    ]
  },
  pla_food: {
    stock: [
      { name: "Bianco Alimentare", hex: "#ffffff", border: "1px solid #666", inStock: true }
    ],
    order: [
      { name: "Trasparente / Traslucido Alimentare", hex: "rgba(255,255,255,0.6)", border: "1px dashed #00ff88" },
      { name: "Nero Alimentare", hex: "#000000" },
      { name: "Rosso Alimentare", hex: "#ff2a5f" },
      { name: "Verde Alimentare", hex: "#00ff88" },
      { name: "Blu Alimentare", hex: "#00f0ff" },
      { name: "Giallo Alimentare", hex: "#ffd700" }
    ]
  },
  petg: {
    stock: [
      { name: "Nero PETG", hex: "#000000", inStock: true }
    ],
    order: [
      { name: "Bianco PETG", hex: "#ffffff", border: "1px solid #666" },
      { name: "Trasparente / Traslucido Cristallo (PETG)", hex: "rgba(255,255,255,0.5)", border: "1px dashed #00f0ff" },
      { name: "Rosso Traslucido (PETG)", hex: "rgba(255, 42, 95, 0.65)", border: "1px dashed #ff2a5f" },
      { name: "Blu Traslucido (PETG)", hex: "rgba(0, 240, 255, 0.65)", border: "1px dashed #00f0ff" },
      { name: "Grigio PETG", hex: "#8a8a8a" },
      { name: "Verde Traslucido (PETG)", hex: "rgba(0, 255, 136, 0.65)", border: "1px dashed #00ff88" },
      { name: "Ambra / Giallo Traslucido (PETG)", hex: "rgba(255, 215, 0, 0.65)", border: "1px dashed #ffd700" },
      { name: "Rosso PETG", hex: "#ff2a5f" },
      { name: "Blu PETG", hex: "#00f0ff" },
      { name: "Verde PETG", hex: "#00ff88" },
      { name: "Giallo PETG", hex: "#ffd700" }
    ]
  },
  tpu: {
    stock: [],
    order: [
      { name: "Gomma Traslucida / Trasparente (TPU)", hex: "rgba(255,255,255,0.55)", border: "1px dashed #00f0ff" },
      { name: "Rosso Traslucido Gommoso (TPU)", hex: "rgba(255, 42, 95, 0.65)", border: "1px dashed #ff2a5f" },
      { name: "Blu Traslucido Gommoso (TPU)", hex: "rgba(0, 240, 255, 0.65)", border: "1px dashed #00f0ff" },
      { name: "Nero TPU (Gomma Opaca)", hex: "#000000" },
      { name: "Rosso TPU (Gomma Opaca)", hex: "#ff2a5f" },
      { name: "Verde Traslucido (TPU)", hex: "rgba(0, 255, 136, 0.65)", border: "1px dashed #00ff88" },
      { name: "Ambra / Giallo Traslucido (TPU)", hex: "rgba(255, 215, 0, 0.65)", border: "1px dashed #ffd700" },
      { name: "Naturale Cristallo TPU", hex: "rgba(255,255,255,0.7)", border: "1px dashed #fff" },
      { name: "Blu TPU (Gomma)", hex: "#00f0ff" },
      { name: "Giallo TPU (Gomma)", hex: "#ffd700" },
      { name: "Verde Fluo TPU", hex: "#00ff88" }
    ]
  },
  placf: {
    stock: [
      { name: "Nero Carbon (PLA-CF)", hex: "#1a1a1a", border: "1px solid #00f0ff", inStock: true }
    ],
    order: [
      { name: "Rosso Mattone (PLA-CF)", hex: "#8b3a2b" },
      { name: "Antracite (PLA-CF)", hex: "#3a3d40" },
      { name: "Verde Oliva / Militare (PLA-CF)", hex: "#4b5320" },
      { name: "Blu Notte (PLA-CF)", hex: "#1b263b" }
    ]
  },
  petgcf: {
    stock: [
      { name: "Nero Carbon (PETG-CF)", hex: "#1a1a1a", border: "1px solid #00f0ff", inStock: true }
    ],
    order: [
      { name: "Antracite (PETG-CF)", hex: "#3a3d40" },
      { name: "Rosso Mattone (PETG-CF)", hex: "#8b3a2b" },
      { name: "Verde Oliva / Militare (PETG-CF)", hex: "#4b5320" }
    ]
  }
};

function getAllMaterialColors() {
  const saved = localStorage.getItem("titan_material_colors_v5");
  if (saved) {
    try { return JSON.parse(saved); } catch(e) {}
  }
  return defaultMaterialColors;
}

function saveAllMaterialColors(colors) {
  localStorage.setItem("titan_material_colors_v5", JSON.stringify(colors));
}

function getColorsForMaterial(matKey) {
  const allColors = getAllMaterialColors();
  return allColors[matKey] || allColors["pla"];
}

function renderColorPalettes() {
  const stockContainer = document.getElementById("stockPaletteGrid");
  const orderContainer = document.getElementById("orderPaletteGrid");
  if (!stockContainer || !orderContainer) return;

  const currentMatKey = state.selectedMaterialKey || "pla";
  const matColors = getColorsForMaterial(currentMatKey);

  // 1. Render Tavolozza 1 (A Magazzino per il Materiale selezionato)
  if (matColors.stock.length > 0) {
    stockContainer.innerHTML = matColors.stock.map((col, idx) => {
      const isInStock = !!col.inStock;
      const isActive = idx === 0 ? "active" : "";
      const opacity = isInStock ? "1.0" : "0.35";
      const title = isInStock ? `${col.name} (Disponibile in casa - Pronta consegna)` : `${col.name} (Esaurito in casa - Su ordinazione)`;
      const borderStyle = col.border ? `border:${col.border};` : '';
      return `<div class="palette-swatch ${isActive}" style="background:${col.hex}; ${borderStyle} opacity:${opacity};" data-color="${col.name}" data-stock="${isInStock ? 'true' : 'false'}" title="${title}" onclick="toggleColorSwatch(this)"></div>`;
    }).join("");
  } else {
    stockContainer.innerHTML = `<div style="font-size: 0.82rem; color: var(--amber-primary); font-weight:700; padding: 6px;">⚠️ Nessun colore per questo materiale attualmente a magazzino. Seleziona una tonalità su ordinazione qui sotto (+€20 acconto bobina).</div>`;
  }

  // 2. Render Tavolozza 2 (Su Ordinazione per il Materiale selezionato)
  orderContainer.innerHTML = matColors.order.map((col, idx) => {
    const borderStyle = col.border ? `border:${col.border};` : '';
    const isActive = (matColors.stock.length === 0 && idx === 0) ? "active" : "";
    return `<div class="palette-swatch ${isActive}" style="background:${col.hex}; ${borderStyle}" data-color="${col.name}" data-stock="false" title="${col.name} (Su ordinazione)" onclick="toggleColorSwatch(this)"></div>`;
  }).join("");

  // Default active color selection
  if (matColors.stock.length > 0) {
    state.selectedColors = [matColors.stock[0].name];
    const countText = document.getElementById("selectedColorCountText");
    if (countText) countText.textContent = `1 Colore (${matColors.stock[0].name})`;
  } else if (matColors.order.length > 0) {
    state.selectedColors = [matColors.order[0].name];
    const countText = document.getElementById("selectedColorCountText");
    if (countText) countText.textContent = `1 Colore (${matColors.order[0].name})`;
  }

  renderAdminPalettesManager();
  updateColorStockStatus();
}

function renderAdminPalettesManager() {
  const selectEl = document.getElementById("adminMaterialColorSelect");
  const matKey = selectEl ? selectEl.value : "pla";

  const stockAdminContainer = document.getElementById("adminStockPaletteList");
  const orderAdminContainer = document.getElementById("adminOrderPaletteList");

  const matColors = getColorsForMaterial(matKey);

  if (stockAdminContainer) {
    stockAdminContainer.innerHTML = matColors.stock.map((col, idx) => {
      const isChecked = col.inStock ? "checked" : "";
      return `
        <div style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${col.hex}; border: 1px solid #777;"></span>
          <label style="cursor: pointer; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" ${isChecked} onchange="toggleStockColorInAdmin('${matKey}', ${idx})">
            <span>${col.name}</span>
          </label>
          <button style="background: none; border: none; color: var(--red-primary); cursor: pointer; font-size: 0.8rem; margin-left: 4px;" onclick="deleteStockColorInAdmin('${matKey}', ${idx})" title="Rimuovi colore">✕</button>
        </div>
      `;
    }).join("");
  }

  if (orderAdminContainer) {
    orderAdminContainer.innerHTML = matColors.order.map((col, idx) => {
      return `
        <div style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${col.hex}; border: 1px solid #777;"></span>
          <span style="font-size: 0.85rem; font-weight: 700;">${col.name}</span>
          <button style="background: none; border: none; color: var(--red-primary); cursor: pointer; font-size: 0.8rem; margin-left: 4px;" onclick="deleteOrderColorInAdmin('${matKey}', ${idx})" title="Rimuovi colore">✕</button>
        </div>
      `;
    }).join("");
  }
}

function toggleStockColorInAdmin(matKey, index) {
  const allColors = getAllMaterialColors();
  if (allColors[matKey] && allColors[matKey].stock[index]) {
    allColors[matKey].stock[index].inStock = !allColors[matKey].stock[index].inStock;
    saveAllMaterialColors(allColors);
    renderColorPalettes();
    calculateQuote();
  }
}

function deleteStockColorInAdmin(matKey, index) {
  const allColors = getAllMaterialColors();
  if (allColors[matKey] && allColors[matKey].stock[index]) {
    allColors[matKey].stock.splice(index, 1);
    saveAllMaterialColors(allColors);
    renderColorPalettes();
    calculateQuote();
  }
}

function addNewStockColorFromAdmin() {
  const selectEl = document.getElementById("adminMaterialColorSelect");
  const matKey = selectEl ? selectEl.value : "pla";

  const nameInput = document.getElementById("newStockColorName");
  const hexInput = document.getElementById("newStockColorHex");
  if (!nameInput || !nameInput.value.trim()) {
    alert("Per favore inserisci il nome del nuovo colore!");
    return;
  }

  const newName = nameInput.value.trim();
  const newHex = hexInput.value;

  const allColors = getAllMaterialColors();
  if (!allColors[matKey]) allColors[matKey] = { stock: [], order: [] };

  allColors[matKey].stock.push({ name: newName, hex: newHex, inStock: true });
  saveAllMaterialColors(allColors);

  nameInput.value = "";
  renderColorPalettes();
  calculateQuote();
  alert(`✓ Colore "${newName}" aggiunto con successo a Tavolozza 1 (A Magazzino)!`);
}

function deleteOrderColorInAdmin(matKey, index) {
  const allColors = getAllMaterialColors();
  if (allColors[matKey] && allColors[matKey].order[index]) {
    allColors[matKey].order.splice(index, 1);
    saveAllMaterialColors(allColors);
    renderColorPalettes();
    calculateQuote();
  }
}

function addNewOrderColorFromAdmin() {
  const selectEl = document.getElementById("adminMaterialColorSelect");
  const matKey = selectEl ? selectEl.value : "pla";

  const nameInput = document.getElementById("newOrderColorName");
  const hexInput = document.getElementById("newOrderColorHex");
  if (!nameInput || !nameInput.value.trim()) {
    alert("Per favore inserisci il nome del nuovo colore su ordinazione!");
    return;
  }

  const newName = nameInput.value.trim();
  const newHex = hexInput.value;

  const allColors = getAllMaterialColors();
  if (!allColors[matKey]) allColors[matKey] = { stock: [], order: [] };

  allColors[matKey].order.push({ name: newName, hex: newHex });
  saveAllMaterialColors(allColors);

  nameInput.value = "";
  renderColorPalettes();
  calculateQuote();
  alert(`✓ Colore "${newName}" aggiunto con successo a Tavolozza 2 (Su Ordinazione)!`);
}

function toggleColorSwatch(swatchEl) {
  const colorName = swatchEl.getAttribute("data-color");

  if (swatchEl.classList.contains("active")) {
    if (state.selectedColors.length > 1) {
      swatchEl.classList.remove("active");
      state.selectedColors = state.selectedColors.filter(c => c !== colorName);
    }
  } else {
    swatchEl.classList.add("active");
    if (!state.selectedColors.includes(colorName)) {
      state.selectedColors.push(colorName);
    }
  }

  const count = state.selectedColors.length;
  const countText = document.getElementById("selectedColorCountText");
  if (countText) {
    if (count === 1) countText.textContent = `1 Colore (${state.selectedColors[0]})`;
    else if (count === 2) countText.textContent = `2 Colori (AMS/ACE +15% purga + €3 setup)`;
    else if (count === 3) countText.textContent = `3 Colori (AMS/ACE +25% purga + €5 setup)`;
    else countText.textContent = `${count} Colori (AMS/ACE +35% purga + €8 setup)`;
  }

  updateColorStockStatus();
  calculateQuote();
}

function updateColorStockStatus() {
  const activeSwatches = document.querySelectorAll(".palette-swatch.active");
  let hasSpecialColorToOrder = false;

  activeSwatches.forEach(swatch => {
    if (swatch.getAttribute("data-stock") === "false") {
      hasSpecialColorToOrder = true;
    }
  });

  const colorInStockCheck = document.getElementById("colorInStock");
  const noticeBanner = document.getElementById("colorStockNotice");
  const noticeIcon = document.getElementById("colorStockNoticeIcon");
  const noticeText = document.getElementById("colorStockNoticeText");
  const matKey = state.selectedMaterialKey || "pla";
  const matNameShort = state.selectedMaterialName ? state.selectedMaterialName.split(" ")[0] : "PLA";
  const isCarbonFiber = matKey === "placf" || matKey === "petgcf" || (state.selectedMaterialName && state.selectedMaterialName.includes("Carbon"));

  const cfNoticeExtra = isCarbonFiber ? ` <br><span style="font-size: 0.82rem; color: #00f0ff; display: block; margin-top: 4px;">⚡ <strong>COLORI TECH CARBON FIBER:</strong> I filamenti caricati in fibra di carbonio sono disponibili nelle tonalità opache high-tech <u>Nero Carbon</u>, <u>Rosso Mattone</u>, <u>Antracite / Grigio Scuro</u> e <u>Verde Oliva / Militare</u>.</span>` : '';

  if (hasSpecialColorToOrder) {
    if (colorInStockCheck) colorInStockCheck.checked = false;
    if (noticeBanner) {
      noticeBanner.className = "color-ordinazione-banner warning";
      if (noticeIcon) noticeIcon.textContent = "📦";
      if (noticeText) {
        noticeText.innerHTML = `<strong>COLORI SU ORDINAZIONE SELEZIONATI:</strong> Uno o più colori scelti non sono a magazzino per ${matNameShort}. Verrà aggiunto l'acconto bobina (+€20) ed i tempi si allungano di +24/48h per l'approvvigionamento.${cfNoticeExtra}`;
      }
    }
  } else {
    if (colorInStockCheck) colorInStockCheck.checked = true;
    if (noticeBanner) {
      noticeBanner.className = "color-ordinazione-banner success";
      if (noticeIcon) noticeIcon.textContent = "🟢";
      if (noticeText) {
        noticeText.innerHTML = `<strong>COLORI A MAGAZZINO (${matNameShort}):</strong> Tutti i colori selezionati sono disponibili in pronta consegna! Nessun acconto ed elaborazione nei tempi standard.${cfNoticeExtra}`;
      }
    }
  }
}

// --------------------------------------------------------------------------
// Quote Pricing Calculation Engine
// --------------------------------------------------------------------------
function calculateQuote() {
  const weightInput = document.getElementById("weightInput");
  const timeInput = document.getElementById("timeInput");
  if (!weightInput || !timeInput) return;

  const weight = parseFloat(weightInput.value) || 150;
  const hours = parseFloat(timeInput.value) || 5;
  const colorCount = state.selectedColors.length;

  let purgeFactor = 1.0;
  let setupColorExtra = 0.0;
  if (colorCount === 2) { purgeFactor = 1.15; setupColorExtra = 3.0; }
  else if (colorCount === 3) { purgeFactor = 1.25; setupColorExtra = 5.0; }
  else if (colorCount >= 4) { purgeFactor = 1.35; setupColorExtra = 8.0; }

  const baseMaterialCost = (weight * state.selectedMaterialPrice) * purgeFactor;

  const avgWatts = 0.150; 
  const totalKwh = hours * avgWatts;
  const energyCost = totalKwh * state.kwhPrice;
  const machineWear = hours * 0.25; 
  const energyAndWearTotal = energyCost + machineWear;

  const setupFee = state.baseSetupFee + setupColorExtra;

  const colorInStockCheck = document.getElementById("colorInStock");
  const isColorInStock = colorInStockCheck ? colorInStockCheck.checked : true;
  const colorDeposit = isColorInStock ? 0.0 : 20.0;

  const cadNeededCheck = document.getElementById("cadNeeded");
  const isCadNeeded = cadNeededCheck ? cadNeededCheck.checked : false;
  const cadCost = isCadNeeded ? 25.0 : 0.0;

  const total = setupFee + baseMaterialCost + energyAndWearTotal + colorDeposit + cadCost;

  document.getElementById("totalAmount").textContent = `€${total.toFixed(2)}`;
  document.getElementById("priceSetup").textContent = `€${setupFee.toFixed(2)}`;
  document.getElementById("priceMaterial").textContent = `€${baseMaterialCost.toFixed(2)}`;
  document.getElementById("priceEnergy").textContent = `€${energyAndWearTotal.toFixed(2)}`;

  const matNameEl = document.getElementById("summaryMatName");
  if (matNameEl) matNameEl.textContent = state.selectedMaterialName;

  const rowColorDeposit = document.getElementById("rowColorDeposit");
  const priceColorDeposit = document.getElementById("priceColorDeposit");
  if (rowColorDeposit && priceColorDeposit) {
    if (colorDeposit > 0) {
      rowColorDeposit.classList.remove("hidden");
      priceColorDeposit.textContent = `+€${colorDeposit.toFixed(2)}`;
    } else {
      rowColorDeposit.classList.add("hidden");
    }
  }

  const rowCadService = document.getElementById("rowCadService");
  const priceCadService = document.getElementById("priceCadService");
  if (rowCadService && priceCadService) {
    if (cadCost > 0) {
      rowCadService.classList.remove("hidden");
      priceCadService.textContent = `+€${cadCost.toFixed(2)}`;
    } else {
      rowCadService.classList.add("hidden");
    }
  }

  const recMachineEl = document.getElementById("recMachine");
  if (recMachineEl) {
    const matKey = state.selectedMaterialKey || "pla";
    if (matKey === "placf" || matKey === "petgcf" || (state.selectedMaterialName && state.selectedMaterialName.includes("Carbon"))) {
      recMachineEl.textContent = "Bambu Lab X1 Carbon (Usa Ugello Indurito in Acciaio)";
    } else if (weight > 500) {
      recMachineEl.textContent = "Anycubic S1 Max (350×350×350mm Camera Chiusa)";
    } else {
      recMachineEl.textContent = "Bambu Lab X1 Carbon / Anycubic S1 Max";
    }
  }
}

function syncWeight(val) {
  const el = document.getElementById("weightVal");
  if (el) el.textContent = val;
}

function syncTime(val) {
  const el = document.getElementById("timeVal");
  if (el) el.textContent = parseFloat(val).toFixed(1);
}

function checkHeightLimit() {
  const hInput = document.getElementById("pieceHeight");
  const warn = document.getElementById("heightWarning");
  if (!hInput || !warn) return;
  const h = parseFloat(hInput.value) || 0;
  if (h > 350) warn.classList.remove("hidden");
  else warn.classList.add("hidden");
}

function checkWeaponsPolicy() {
  const chk = document.getElementById("weaponsCheck");
  const shield = document.getElementById("weaponsShield");
  const btnWa = document.getElementById("btnWhatsappSend");
  if (chk && chk.checked) {
    if (shield) shield.classList.remove("hidden");
    if (btnWa) btnWa.disabled = true;
  } else {
    if (shield) shield.classList.add("hidden");
    if (btnWa) btnWa.disabled = false;
  }
}

function checkTextNotesForWeapons() {
  const notesEl = document.getElementById("projectNotes");
  if (!notesEl) return;
  const notes = notesEl.value.toLowerCase();
  const bannedKeywords = ["arma", "pistola", "fucile", "caricatore", "grilletto", "proiettile", "silenziatore", "gun", "rifle", "trigger"];
  const chk = document.getElementById("weaponsCheck");
  const found = bannedKeywords.some(kw => notes.includes(kw));
  if (found && chk) {
    chk.checked = true;
    checkWeaponsPolicy();
  }
}

function enableCadOptionInCalc() {
  const chk = document.getElementById("cadNeeded");
  if (chk) chk.checked = true;
  calculateQuote();
}

function sendWhatsappQuote() {
  const proj = document.getElementById("projectName").value.trim() || "Progetto 3D";
  const weight = document.getElementById("weightVal").textContent;
  const time = document.getElementById("timeVal").textContent;
  const total = document.getElementById("totalAmount").textContent;
  const mat = state.selectedMaterialName;
  const colors = state.selectedColors.join(", ");
  const phone = getWaPhone();

  const text = `Ciao Giovanni! Vorrei un preventivo per la stampa 3D:\n\n📦 *Progetto:* ${proj}\n🧪 *Materiale:* ${mat}\n🎨 *Colori:* ${colors}\n⚖️ *Peso:* ${weight} g\n⏱️ *Tempo:* ${time} h\n💰 *Totale Stimato:* ${total}\n\nResto in attesa della tua conferma!`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// --------------------------------------------------------------------------
// 3D Canvas Layer-by-Layer Simulator
// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// 3D Canvas Layer-by-Layer Simulator & Mesh Renderer
// --------------------------------------------------------------------------
function generateDemo3DMesh() {
  const triangles = [];
  const slices = 20;
  const layers = 30;
  const height = 120;
  const radiusFunc = (zRatio) => {
    return 30 + 15 * Math.sin(zRatio * Math.PI * 2.5) + 6 * Math.cos(zRatio * Math.PI * 4);
  };

  for (let l = 0; l < layers; l++) {
    const z1 = (l / layers) * height;
    const z2 = ((l + 1) / layers) * height;
    const r1 = radiusFunc(l / layers);
    const r2 = radiusFunc((l + 1) / layers);

    for (let s = 0; s < slices; s++) {
      const a1 = (s / slices) * Math.PI * 2;
      const a2 = ((s + 1) / slices) * Math.PI * 2;

      const v1 = { x: Math.cos(a1) * r1, y: Math.sin(a1) * r1, z: z1 };
      const v2 = { x: Math.cos(a2) * r1, y: Math.sin(a2) * r1, z: z1 };
      const v3 = { x: Math.cos(a1) * r2, y: Math.sin(a1) * r2, z: z2 };
      const v4 = { x: Math.cos(a2) * r2, y: Math.sin(a2) * r2, z: z2 };

      triangles.push({ v1, v2, v3 });
      triangles.push({ v2, v4, v3 });
    }
  }

  return {
    fileName: "Demo_Vaso_3D_Multicolore.stl",
    triangles: triangles,
    minZ: 0,
    maxZ: height,
    center: { x: 0, y: 0, z: height / 2 },
    scale: 1.6,
    dimX: "70.0",
    dimY: "70.0",
    dimZ: "120.0"
  };
}

let cachedDemoMesh = null;
let simRotX = 0.45;
let simRotY = 0.6;
let isDraggingCanvas = false;
let lastMousePos = { x: 0, y: 0 };

function setSimMode(mode) {
  state.simMode = mode;
  document.querySelectorAll(".btn-sim-mode").forEach(b => b.classList.remove("active"));
  if (mode === "solid") document.getElementById("btnModeSolid").classList.add("active");
  if (mode === "wireframe") document.getElementById("btnModeWire").classList.add("active");
  if (mode === "layers") document.getElementById("btnModeLayers").classList.add("active");
  update3DSimulator();
}

function setSimColor(colorHex, dotEl) {
  state.simColor = colorHex;
  document.querySelectorAll(".sim-color-dot").forEach(d => d.classList.remove("active"));
  if (dotEl) dotEl.classList.add("active");
  update3DSimulator();
}

function init3DSimulator() {
  const canvas = document.getElementById("canvas3d");
  if (canvas) {
    // Mouse dragging
    canvas.addEventListener("mousedown", (e) => {
      isDraggingCanvas = true;
      lastMousePos = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("mousemove", (e) => {
      if (!isDraggingCanvas) return;
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      simRotY += dx * 0.012;
      simRotX += dy * 0.012;
      lastMousePos = { x: e.clientX, y: e.clientY };
      update3DSimulator();
    });
    window.addEventListener("mouseup", () => { isDraggingCanvas = false; });

    // Touch dragging (Mobile & Tablet)
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        isDraggingCanvas = true;
        lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!isDraggingCanvas || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMousePos.x;
      const dy = e.touches[0].clientY - lastMousePos.y;
      simRotY += dx * 0.015;
      simRotX += dy * 0.015;
      lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      update3DSimulator();
    }, { passive: true });

    window.addEventListener("touchend", () => { isDraggingCanvas = false; });
  }
  update3DSimulator();
}

function update3DSimulator() {
  const slider = document.getElementById("simLayerSlider");
  const display = document.getElementById("currentLayerDisplay");
  if (slider && display) {
    state.simLayer = parseInt(slider.value);
    display.textContent = `${state.simLayer}%`;
  }

  const canvas = document.getElementById("canvas3d");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // High-Tech Cyberpunk Background Grid
  ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
  ctx.lineWidth = 1;
  const gridStep = 30;
  for (let x = 0; x <= canvas.width; x += gridStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += gridStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2 + 25;

  const mesh = (state.stlData && state.stlData.triangles && state.stlData.triangles.length > 0)
    ? state.stlData
    : (cachedDemoMesh || (cachedDemoMesh = generateDemo3DMesh()));

  const modelHeight = (mesh.maxZ - mesh.minZ) || 120;
  const midZ = mesh.minZ + modelHeight / 2;

  const cutoffZ = mesh.minZ + (state.simLayer / 100) * modelHeight;
  const cosX = Math.cos(simRotX), sinX = Math.sin(simRotX);
  const cosY = Math.cos(simRotY), sinY = Math.sin(simRotY);

  function project(v) {
    const dx = (v.x - mesh.center.x) * mesh.scale;
    const dy = (v.y - mesh.center.y) * mesh.scale;
    const dz = (v.z - midZ) * mesh.scale;

    const x1 = dx * cosY + dz * sinY;
    const z1 = -dx * sinY + dz * cosY;

    const y2 = dy * cosX - z1 * sinX;

    return { x: cx + x1, y: cy - y2, z: z1 };
  }

  // Draw 3D Heated Print Bed Grid at Z = mesh.minZ (Esattamente alla base del pezzo)
  const bedRadius = Math.max(55, (parseFloat(mesh.dimX) || 70) * 0.75);
  const bedCorners = [
    project({ x: -bedRadius, y: -bedRadius, z: mesh.minZ }),
    project({ x: bedRadius, y: -bedRadius, z: mesh.minZ }),
    project({ x: bedRadius, y: bedRadius, z: mesh.minZ }),
    project({ x: -bedRadius, y: bedRadius, z: mesh.minZ })
  ];

  ctx.save();
  ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
  ctx.fillStyle = "rgba(0, 240, 255, 0.05)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bedCorners[0].x, bedCorners[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(bedCorners[i].x, bedCorners[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Print Bed Grid lines
  ctx.strokeStyle = "rgba(0, 240, 255, 0.22)";
  ctx.lineWidth = 1;
  const step = bedRadius / 3;
  for (let g = -bedRadius; g <= bedRadius; g += step) {
    const pA1 = project({ x: g, y: -bedRadius, z: mesh.minZ });
    const pA2 = project({ x: g, y: bedRadius, z: mesh.minZ });
    ctx.beginPath(); ctx.moveTo(pA1.x, pA1.y); ctx.lineTo(pA2.x, pA2.y); ctx.stroke();

    const pB1 = project({ x: -bedRadius, y: g, z: mesh.minZ });
    const pB2 = project({ x: bedRadius, y: g, z: mesh.minZ });
    ctx.beginPath(); ctx.moveTo(pB1.x, pB1.y); ctx.lineTo(pB2.x, pB2.y); ctx.stroke();
  }
  ctx.restore();

  // Render Triangles with Layer Slicing Cutoff
  ctx.save();
  ctx.strokeStyle = state.simColor;
  ctx.fillStyle = state.simColor;

  mesh.triangles.forEach(tri => {
    const triAvgZ = (tri.v1.z + tri.v2.z + tri.v3.z) / 3;
    if (triAvgZ > cutoffZ) return;

    const p1 = project(tri.v1);
    const p2 = project(tri.v2);
    const p3 = project(tri.v3);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();

    if (state.simMode === "solid") {
      ctx.globalAlpha = 0.65;
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (state.simMode === "wireframe") {
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (state.simMode === "layers") {
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  });

  // Hotend Nozzle Indicator Beam at Active Layer Height
  if (state.simLayer > 0 && state.simLayer < 100) {
    const nozzlePos = project({ x: 0, y: 0, z: cutoffZ });
    ctx.save();
    ctx.fillStyle = "#ff0055";
    ctx.shadowColor = "#ff0055";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(nozzlePos.x, nozzlePos.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Laser beam from nozzle
    ctx.strokeStyle = "rgba(255, 0, 85, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nozzlePos.x, nozzlePos.y - 18);
    ctx.lineTo(nozzlePos.x, nozzlePos.y);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // Overlay Info Header
  ctx.fillStyle = "var(--cyan-primary)";
  ctx.font = "bold 13px Roboto, sans-serif";
  const titleText = (state.stlData && state.stlData.fileName)
    ? `📦 ${mesh.fileName} (${mesh.dimX}×${mesh.dimY}×${mesh.dimZ} mm)`
    : `📐 Simulatore 3D Vaso Multicolore (Trascina per ruotare)`;
  ctx.fillText(titleText, 15, 25);

  ctx.fillStyle = "var(--text-muted)";
  ctx.font = "11px Roboto, sans-serif";
  const currentHeight = ((state.simLayer / 100) * parseFloat(mesh.dimZ || 120)).toFixed(1);
  ctx.fillText(`⚡ Altezza Stampa: ${currentHeight} mm / ${mesh.dimZ || 120} mm | Layer Active: ${state.simLayer}%`, 15, 42);
}

// --------------------------------------------------------------------------
// STL Drag & Drop Parser
// --------------------------------------------------------------------------
function initStlDragDrop() {
  const zone = document.getElementById("stlDropZone");
  if (!zone) return;

  ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    zone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

  ["dragenter", "dragover"].forEach(eventName => {
    zone.addEventListener(eventName, () => zone.classList.add("dragover"), false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    zone.addEventListener(eventName, () => zone.classList.remove("dragover"), false);
  });

  zone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleStlFileUpload(files);
  });
}

function handleStlFileUpload(files) {
  if (!files || files.length === 0) return;
  const file = files[0];
  if (!file.name.toLowerCase().endsWith(".stl")) {
    alert("Per favore carica un file in formato .STL!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const buffer = e.target.result;
    parseSTLBuffer(buffer, file.name);
  };
  reader.readAsArrayBuffer(file);
}

function parseSTLBuffer(buffer, fileName) {
  const dataView = new DataView(buffer);
  const isBinary = buffer.byteLength > 84;
  
  let numTriangles = 0;
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  const triangles = [];

  if (isBinary) {
    numTriangles = dataView.getUint32(80, true);
    let offset = 84;
    const step = Math.max(1, Math.floor(numTriangles / 3000));

    for (let i = 0; i < numTriangles; i++) {
      offset += 12; // Normal vector
      const v1 = { x: dataView.getFloat32(offset, true), y: dataView.getFloat32(offset + 4, true), z: dataView.getFloat32(offset + 8, true) };
      offset += 12;
      const v2 = { x: dataView.getFloat32(offset, true), y: dataView.getFloat32(offset + 4, true), z: dataView.getFloat32(offset + 8, true) };
      offset += 12;
      const v3 = { x: dataView.getFloat32(offset, true), y: dataView.getFloat32(offset + 4, true), z: dataView.getFloat32(offset + 8, true) };
      offset += 12;
      offset += 2; // Attribute byte count

      [v1, v2, v3].forEach(v => {
        if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
        if (v.z < minZ) minZ = v.z; if (v.z > maxZ) maxZ = v.z;
      });

      if (i % step === 0) {
        triangles.push({ v1, v2, v3 });
      }
    }
  }

  const dimX = Math.max(1, Math.round(maxX - minX));
  const dimY = Math.max(1, Math.round(maxY - minY));
  const dimZ = Math.max(1, Math.round(maxZ - minZ));

  const volumeCm3 = Math.round((dimX * dimY * dimZ * 0.45) / 1000);
  const estimatedWeightG = Math.max(15, Math.round(volumeCm3 * 1.25));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  const maxDim = Math.max(dimX, dimY, dimZ, 1);

  state.stlData = {
    fileName: fileName,
    numTriangles: numTriangles,
    dimX: dimX, dimY: dimY, dimZ: dimZ,
    minZ: minZ, maxZ: maxZ,
    center: { x: centerX, y: centerY, z: centerZ },
    scale: 140 / maxDim,
    triangles: triangles
  };

  document.getElementById("stlDropContent").classList.add("hidden");
  document.getElementById("stlLoadedInfo").classList.remove("hidden");

  document.getElementById("stlFileNameDisplay").textContent = fileName;
  document.getElementById("stlVolDisplay").textContent = `${volumeCm3} cm³`;
  document.getElementById("stlBoundsDisplay").textContent = `${dimX}×${dimY}×${dimZ} mm`;
  document.getElementById("stlWeightDisplay").textContent = `${estimatedWeightG} g`;

  const weightInput = document.getElementById("weightInput");
  if (weightInput) {
    weightInput.value = estimatedWeightG;
    syncWeight(estimatedWeightG);
  }

  const pieceHeightInput = document.getElementById("pieceHeight");
  if (pieceHeightInput) {
    pieceHeightInput.value = dimZ;
    checkHeightLimit();
  }

  calculateQuote();
  update3DSimulator();
}

function removeStlFile() {
  state.stlData = null;
  document.getElementById("stlLoadedInfo").classList.add("hidden");
  document.getElementById("stlDropContent").classList.remove("hidden");
  document.getElementById("stlFileInput").value = "";
  calculateQuote();
  update3DSimulator();
}

function switchPortalTab(tabName) {
  const btnLogin = document.getElementById("tabBtnLogin");
  const btnReg = document.getElementById("tabBtnRegister");
  const contentLogin = document.getElementById("portalTabLogin");
  const contentReg = document.getElementById("portalTabRegister");

  if (!btnLogin || !btnReg || !contentLogin || !contentReg) return;

  if (tabName === "login") {
    btnLogin.classList.add("active");
    btnReg.classList.remove("active");
    contentLogin.classList.add("active");
    contentReg.classList.remove("active");
  } else {
    btnReg.classList.add("active");
    btnLogin.classList.remove("active");
    contentReg.classList.add("active");
    contentLogin.classList.remove("active");
  }
}

// --------------------------------------------------------------------------
// Admin Registered Clients Management (Passwords, Vidimazioni, Private STL Files, CRUD & Backup)
// --------------------------------------------------------------------------
function getClientAccounts() {
  const saved = localStorage.getItem("titan_registered_user_accounts");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
  }
  const initial = [
    {
      name: "Cliente Prova 1",
      contact: "cliente1",
      pass: "1234",
      orderCode: "TITAN-8492",
      approved: true,
      files: [
        { name: "Supporto_Speciale_Gomma_TPU.stl", date: "02/08/2026", note: "File 3D personalizzato creato da Giovanni Di Lello", url: "#" },
        { name: "Flangia_Rinforzata_PETG.stl", date: "02/08/2026", note: "Modello revisionato con tolleranze di stampa 0.2mm", url: "#" }
      ]
    },
    {
      name: "Mario Rossi",
      contact: "mario.rossi@email.it",
      pass: "rossi123",
      orderCode: "TITAN-3104",
      approved: true,
      files: [
        { name: "Prototipo_Ingranaggio_Meccanico.stl", date: "01/08/2026", note: "Disegno CAD reverse engineering", url: "#" }
      ]
    },
    {
      name: "Giuseppe Verdi",
      contact: "3331234567",
      pass: "verdi2026",
      orderCode: "TITAN-5521",
      approved: false,
      files: []
    }
  ];
  localStorage.setItem("titan_registered_user_accounts", JSON.stringify(initial));
  return initial;
}

function saveClientAccounts(accounts) {
  if (Array.isArray(accounts)) {
    localStorage.setItem("titan_registered_user_accounts", JSON.stringify(accounts));
  }
}

function renderAdminClientsList() {
  const container = document.getElementById("adminClientsList");
  if (!container) return;

  const accounts = getClientAccounts();
  if (accounts.length === 0) {
    container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">Nessun cliente registrato al momento.</div>`;
    return;
  }

  container.innerHTML = accounts.map((acc, idx) => {
    const isApproved = !!acc.approved;
    const badgeText = isApproved ? "🟢 VIDIMATO" : "🟡 IN ATTESA";
    const badgeColor = isApproved ? "var(--green-primary)" : "var(--amber-primary)";
    const filesList = acc.files || [];
    
    return `
      <div style="background: rgba(0,0,0,0.4); border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <strong style="font-size: 1rem; color: #fff;">${acc.name}</strong> 
            <span style="font-size: 0.8rem; color: var(--text-muted);">(${acc.contact})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 0.78rem; font-weight: 700; color: ${badgeColor}; border: 1px solid ${badgeColor}; padding: 2px 8px; border-radius: 12px;">${badgeText}</span>
            <button onclick="toggleClientApprovalFromAdmin(${idx})" style="background: var(--bg-card); color: var(--cyan-primary); border: 1px solid var(--cyan-primary); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
              ${isApproved ? "Revoca Vidimazione" : "Approva & Vidima"}
            </button>
            <button onclick="addClientFileFromAdmin(${idx})" style="background: rgba(0, 240, 255, 0.15); color: var(--cyan-primary); border: 1px solid var(--cyan-primary); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
              📁 Carica File STL Privato (${filesList.length})
            </button>
            <button onclick="deleteClientFromAdmin(${idx})" style="background: rgba(255, 42, 95, 0.2); color: var(--red-primary); border: 1px solid var(--red-primary); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">
              ✕ Elimina Account
            </button>
          </div>
        </div>
        <div style="display: flex; gap: 15px; font-size: 0.83rem; font-family: var(--font-sub); flex-wrap: wrap; margin-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
          <span style="color: var(--cyan-primary);">🔑 Password: <strong>${acc.pass || '1234'}</strong></span>
          <span style="color: var(--amber-primary);">📦 Cod. Ordine Assegnato: <strong>${acc.orderCode || 'N/A'}</strong></span>
          <button onclick="editClientFromAdmin(${idx})" style="background: none; border: none; color: var(--text-muted); cursor: pointer; text-decoration: underline; font-size: 0.78rem;">✏️ Modifica Dati</button>
        </div>

        ${filesList.length > 0 ? `
          <div style="margin-top: 6px; background: rgba(7,9,14,0.6); padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); font-size: 0.78rem;">
            <strong style="color: var(--amber-primary); display: block; margin-bottom: 4px;">📂 Cartella File STL Privati (${filesList.length} file):</strong>
            ${filesList.map((f, fIdx) => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 3px; margin-bottom: 3px;">
                <span>📦 <strong>${f.name}</strong> <span style="color: var(--text-muted);">(${f.date})</span> - <em>${f.note || ''}</em></span>
                <button onclick="deleteClientFileFromAdmin(${idx}, ${fIdx})" style="background: none; border: none; color: var(--red-primary); cursor: pointer; font-weight: bold;" title="Elimina file">✕</button>
              </div>
            `).join("")}
          </div>
        ` : ''}
      </div>
    `;
  }).join("");
}

function addClientFileFromAdmin(clientIndex) {
  let fileInput = document.getElementById("adminClientFileInput");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.id = "adminClientFileInput";
    fileInput.type = "file";
    fileInput.accept = ".stl,.step,.stp,.3mf,.obj,.pdf,.zip";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
  }

  fileInput.onchange = function(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const accounts = getClientAccounts();
    const acc = accounts[clientIndex];
    if (!acc) return;

    const fileNote = prompt(`Note o descrizione per il cliente ${acc.name} (opzionale):`, `Disegno 3D / Modello caricato da Giovanni Di Lello per il tuo progetto`);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";

    const reader = new FileReader();
    reader.onload = function(evt) {
      if (!acc.files) acc.files = [];
      acc.files.push({
        name: file.name,
        size: sizeMb,
        date: new Date().toLocaleDateString('it-IT'),
        note: fileNote ? fileNote.trim() : "",
        dataUrl: evt.target.result
      });
      saveClientAccounts(accounts);
      renderAdminClientsList();
      alert(`✓ File "${file.name}" (${sizeMb}) caricato con successo nella cartella privata di ${acc.name}!`);
    };
    reader.readAsDataURL(file);

    fileInput.value = "";
  };

  fileInput.click();
}

function deleteClientFileFromAdmin(clientIndex, fileIndex) {
  const accounts = getClientAccounts();
  const acc = accounts[clientIndex];
  if (!acc || !acc.files || !acc.files[fileIndex]) return;

  if (confirm(`Rimuovere il file "${acc.files[fileIndex].name}" dalla cartella privata di ${acc.name}?`)) {
    acc.files.splice(fileIndex, 1);
    saveClientAccounts(accounts);
    renderAdminClientsList();
  }
}

function addClientFromAdmin() {
  const name = document.getElementById("adminNewClientName").value.trim();
  const contact = document.getElementById("adminNewClientContact").value.trim();
  const pass = document.getElementById("adminNewClientPass").value.trim() || "1234";
  const code = document.getElementById("adminNewClientCode").value.trim() || ("TITAN-" + Math.floor(1000 + Math.random() * 9000));

  if (!name || !contact) {
    alert("Per favore inserisci il Nome del cliente ed un Contatto (Email/Telefono)!");
    return;
  }

  const accounts = getClientAccounts();
  accounts.push({ name, contact, pass, orderCode: code, approved: true });
  saveClientAccounts(accounts);

  document.getElementById("adminNewClientName").value = "";
  document.getElementById("adminNewClientContact").value = "";
  document.getElementById("adminNewClientPass").value = "";
  document.getElementById("adminNewClientCode").value = "";

  renderAdminClientsList();
  alert(`✓ Cliente "${name}" creato ed approvato con successo!\nCodice Ordine Assegnato: ${code}\nPassword: ${pass}`);
}

function editClientFromAdmin(index) {
  const accounts = getClientAccounts();
  const acc = accounts[index];
  if (!acc) return;

  const newPass = prompt(`Modifica Password per ${acc.name}:`, acc.pass || "1234");
  if (newPass === null) return;

  const newCode = prompt(`Modifica Codice Ordine per ${acc.name}:`, acc.orderCode || "TITAN-1000");
  if (newCode === null) return;

  acc.pass = newPass.trim() || acc.pass;
  acc.orderCode = newCode.trim().toUpperCase() || acc.orderCode;

  saveClientAccounts(accounts);
  renderAdminClientsList();
  alert(`✓ Dati cliente "${acc.name}" aggiornati!`);
}

function deleteClientFromAdmin(index) {
  const accounts = getClientAccounts();
  const acc = accounts[index];
  if (!acc) return;

  if (confirm(`Sei sicuro di voler eliminare l'account di "${acc.name}"?`)) {
    accounts.splice(index, 1);
    saveClientAccounts(accounts);
    renderAdminClientsList();
  }
}

function toggleClientApprovalFromAdmin(index) {
  const accounts = getClientAccounts();
  const acc = accounts[index];
  if (!acc) return;

  acc.approved = !acc.approved;
  saveClientAccounts(accounts);
  renderAdminClientsList();
}

function exportClientAccountsBackup() {
  const accounts = getClientAccounts();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `Titan3D_Clienti_Backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(dlAnchorElem);
  dlAnchorElem.click();
  dlAnchorElem.remove();
}

function importClientAccountsBackup() {
  const jsonStr = prompt("Incolla qui la stringa del Backup JSON dei clienti per ripristinare:");
  if (!jsonStr) return;
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      saveClientAccounts(parsed);
      renderAdminClientsList();
      alert("✓ Backup clienti ripristinato con successo!");
    } else {
      alert("❌ Formato JSON non valido!");
    }
  } catch(e) {
    alert("❌ Errore durante la lettura del file JSON!");
  }
}

// --------------------------------------------------------------------------
// Client Registration & Live Order Search Handlers
// --------------------------------------------------------------------------
function handleClientRegister() {
  const name = document.getElementById("regName").value.trim();
  const contact = document.getElementById("regContact").value.trim();
  const pass = document.getElementById("regPass").value.trim();
  const notes = document.getElementById("regNotes") ? document.getElementById("regNotes").value.trim() : "";

  if (!name || !contact || !pass) {
    alert("Per favore riempi tutti i campi obbligatori!");
    return;
  }

  const generatedCode = "TITAN-" + Math.floor(1000 + Math.random() * 9000);
  const accounts = getClientAccounts();
  accounts.push({
    name: name,
    contact: contact,
    pass: pass,
    orderCode: generatedCode,
    notes: notes,
    approved: false
  });

  saveClientAccounts(accounts);

  document.getElementById("clientRegisterForm").reset();
  const successBox = document.getElementById("clientRegisterSuccess");
  if (successBox) {
    successBox.classList.remove("hidden");
    successBox.innerHTML = `
      <div style="background: rgba(0, 255, 136, 0.15); border: 2px solid var(--green-primary); padding: 18px; border-radius: var(--radius-md); color: #fff;">
        <h4 style="color: var(--green-primary); font-size: 1.2rem; font-family: var(--font-heading); margin-bottom: 6px;">
          ✓ REGISTRAZIONE INVIATA CON SUCCESSO!
        </h4>
        <p style="font-size: 0.92rem; color: var(--text-muted); margin-bottom: 12px;">
          Account per <strong>${name}</strong> registrato ed in attesa di vidimazione da Giovanni Di Lello.
        </p>

        <div style="background: rgba(0, 0, 0, 0.65); border: 2px solid var(--amber-primary); padding: 14px; border-radius: 8px; font-size: 1rem; box-shadow: 0 0 20px rgba(255, 153, 0, 0.2);">
          <strong style="color: var(--amber-primary); font-size: 1.1rem; display: block; margin-bottom: 6px; font-family: var(--font-heading);">
            ⚠️ SEGNA ED ANNOTA SUBITO QUESTI DATI PER L'ACCESSO FUTURO:
          </strong>
          <div style="margin-top: 6px; font-family: var(--font-sub); display: flex; flex-direction: column; gap: 4px;">
            <span>👤 Username / Contatto: <strong style="color: #fff; font-size: 1.15rem;">${contact}</strong></span>
            <span>🔑 Password Creata: <strong style="color: var(--cyan-primary); font-size: 1.15rem;">${pass}</strong></span>
            <span>📦 Codice Ordine Assegnato: <strong style="color: var(--amber-primary); font-size: 1.15rem;">${generatedCode}</strong></span>
          </div>
        </div>
      </div>
    `;
  }
}

function searchClientOrder() {
  const inputIdentifier = document.getElementById("clientSearchCode").value.trim();
  const inputPass = document.getElementById("clientSearchPass").value.trim();
  const resultBox = document.getElementById("clientOrderResult");
  if (!resultBox) return;

  if (!inputIdentifier) {
    alert("Per favore inserisci la tua Email, Numero di Telefono o Codice Ordine per accedere!");
    return;
  }

  const accounts = getClientAccounts();
  const searchLower = inputIdentifier.toLowerCase();

  // STRICT & SECURE MATCHING: Match strictly against unique Order Code or unique Contact (Email / Phone)
  const account = accounts.find(a => 
    (a.orderCode && a.orderCode.toLowerCase() === searchLower) ||
    (a.contact && a.contact.toLowerCase() === searchLower)
  );

  resultBox.classList.remove("hidden");

  if (!account) {
    resultBox.className = "order-result-card warning";
    resultBox.innerHTML = `
      <div style="color: var(--amber-primary); font-weight: 800; font-size: 1.05rem;">⚠️ NESSUN ACCOUNT O ORDINE TROVATO</div>
      <p style="font-size: 0.88rem; margin-top: 6px; color: var(--text-muted);">
        Nessun account trovato per l'identificativo "<strong>${inputIdentifier}</strong>".<br>Controlla di aver scritto correttamente i tuoi dati o compila la scheda di registrazione.
      </p>
    `;
    return;
  }

  function renderStreamPlayer(streamUrl, label) {
  const url = streamUrl || "assets/timelapse.mp4";
  const isEmbed = url.includes("youtube.com") || url.includes("youtu.be") || url.includes("twitch.tv") || url.includes("http");
  
  if (isEmbed && (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("twitch.tv"))) {
    let embedSrc = url;
    if (url.includes("watch?v=")) embedSrc = url.replace("watch?v=", "embed/");
    return `
      <div style="position: relative; width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid var(--cyan-primary); background: #000; margin-bottom: 12px; height: 260px; box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);">
        <iframe src="${embedSrc}" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>
        <div style="position: absolute; top: 10px; left: 10px; background: rgba(7, 9, 14, 0.85); color: var(--cyan-primary); border: 1px solid var(--cyan-primary); padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-family: var(--font-heading); font-weight: 700;">
          🎥 ${label}
        </div>
      </div>
    `;
  }

  return `
    <div style="position: relative; width: 100%; border-radius: 8px; overflow: hidden; border: 1px solid var(--cyan-primary); background: #000; margin-bottom: 12px; box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);">
      <video controls autoplay loop muted playsinline style="width: 100%; height: auto; max-height: 300px; object-fit: cover; display: block;">
        <source src="${url}" type="video/mp4">
        Il tuo browser non supporta il video.
      </video>
      <div style="position: absolute; top: 10px; left: 10px; background: rgba(7, 9, 14, 0.85); color: var(--cyan-primary); border: 1px solid var(--cyan-primary); padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-family: var(--font-heading); font-weight: 700;">
        🎥 ${label}
      </div>
    </div>
  `;
}

if (inputPass && account.pass && account.pass !== inputPass) {
    resultBox.className = "order-result-card warning";
    resultBox.innerHTML = `
      <div style="color: var(--red-primary); font-weight: 800; font-size: 1.05rem;">❌ PASSWORD ACCOUNT ERRATA</div>
      <p style="font-size: 0.88rem; margin-top: 6px; color: var(--text-muted);">
        La password inserita non corrisponde all'account <strong>${account.name}</strong> (${account.contact}).
      </p>
    `;
    return;
  }

  const isApproved = !!account.approved;
  const statusBadge = isApproved 
    ? `<span class="badge-vidimato">🟢 ACCOUNT VIDIMATO</span>` 
    : `<span class="badge-attesa">🟡 IN ATTESA DI VIDIMAZIONE DA GIOVANNI</span>`;

  resultBox.className = isApproved ? "order-result-card success" : "order-result-card warning";
  resultBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 14px;">
      <div>
        <h4 style="font-size: 1.15rem; color: #fff; margin: 0; font-family: var(--font-heading);">👤 ${account.name}</h4>
        <span style="font-size: 0.82rem; color: var(--text-muted);">${account.contact}</span>
      </div>
      <div>${statusBadge}</div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.9rem; margin-bottom: 14px;">
      <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Codice Ordine Assegnato:</span>
        <strong style="color: var(--amber-primary); font-family: var(--font-heading); font-size: 1.05rem;">${account.orderCode || 'TITAN-1000'}</strong>
      </div>
      <div style="background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
        <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">Password Account:</span>
        <strong style="color: var(--cyan-primary); font-family: var(--font-heading); font-size: 1.05rem;">🔑 ${account.pass || '••••'}</strong>
      </div>
    </div>

    ${isApproved ? `
      <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.25); padding: 18px; border-radius: var(--radius-md); margin-top: 14px; box-shadow: 0 0 20px rgba(0, 240, 255, 0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
          <strong style="color: var(--cyan-primary); font-size: 0.98rem; font-family: var(--font-heading); display: flex; align-items: center; gap: 8px;">
            📹 STREAMING LIVE & TIMELAPSE RISERVATO PEZZO
          </strong>
          <span style="background: rgba(255, 42, 95, 0.2); color: var(--red-primary); border: 1px solid var(--red-primary); padding: 2px 10px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; font-family: var(--font-heading);">
            🔴 LIVE CAM PIPELINE
          </span>
        </div>

        ${renderStreamPlayer(state.streamBambu, "CAM 01 - BAMBU LAB X1 CARBON [LIVE 10X]")}
        ${state.streamAnycubic ? renderStreamPlayer(state.streamAnycubic, "CAM 02 - ANYCUBIC S1 MAX [LIVE 350mm]") : ""}

        <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 10px;">
          📸 <strong>Stato Lavorazione:</strong> La tua stampa 3D è in corso di realizzazione ad alta velocità. Vuoi richiedere uno streaming video privato o foto live aggiuntive?
        </p>
        <a href="https://wa.me/${getWaPhone()}?text=${encodeURIComponent('Ciao Giovanni! Sto guardando il mio ordine ' + (account.orderCode || '') + ' nell\'Area Cliente. Mi invii una foto live del piatto?')}" target="_blank" rel="noopener noreferrer" class="btn-primary-small" style="background: #25d366; color: #fff; border: none; padding: 10px 16px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          💬 Richiedi Foto Live Piatto su WhatsApp
        </a>
      </div>

      <!-- Private Client STL Files Folder Section -->
      <div style="background: rgba(255, 153, 0, 0.05); border: 1px solid rgba(255, 153, 0, 0.25); padding: 18px; border-radius: var(--radius-md); margin-top: 14px; box-shadow: 0 0 20px rgba(255, 153, 0, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
          <strong style="color: var(--amber-primary); font-size: 0.98rem; font-family: var(--font-heading); display: flex; align-items: center; gap: 8px;">
            📁 CARTELLA FILE STL & MODELLI CAD PRIVATI (SOLO PER TE)
          </strong>
          <span style="font-size: 0.78rem; color: var(--text-muted);">🔒 Spazio di archiviazione protetto</span>
        </div>

        ${(account.files && account.files.length > 0) ? `
          <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            ${account.files.map(f => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; gap: 8px;">
                <div>
                  <strong style="color: #fff; font-size: 0.92rem; display: block;">📦 ${f.name}</strong>
                  <span style="font-size: 0.78rem; color: var(--text-muted);">Data caricamento: ${f.date} ${f.note ? ' - <em>' + f.note + '</em>' : ''}</span>
                </div>
                ${(f.dataUrl && f.dataUrl !== '#') ? `
                  <a href="${f.dataUrl}" download="${f.name}" target="_blank" class="btn-secondary-small" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                    ⬇️ Scarica File (${f.size || '3D'})
                  </a>
                ` : `
                  <button onclick="alert('Questo è un file dimostrativo per l\'account demo. I file reali caricati dall\'Admin saranno direttamente scaricabili!')" class="btn-secondary-small" style="padding: 6px 14px; font-size: 0.8rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                    ⬇️ Scarica File (Demo)
                  </button>
                `}
              </div>
            `).join("")}
          </div>
        ` : `
          <p style="font-size: 0.86rem; color: var(--text-muted); margin: 0;">
            📂 <strong>Nessun file presente attualmente:</strong> I modelli STL ed i disegni CAD creati o revisionati per te da Giovanni Di Lello appariranno qui in esclusiva per il tuo account.
          </p>
        `}
      </div>
    ` : `
      <div style="background: rgba(255, 153, 0, 0.05); border: 1px solid rgba(255, 153, 0, 0.2); padding: 14px; border-radius: var(--radius-sm); margin-top: 10px; color: var(--amber-primary); font-size: 0.88rem;">
        ⏳ <strong>In attesa di Vidimazione:</strong> Giovanni sta verificando le specifiche del tuo ordine. Non appena attivato, potrai vedere qui lo streaming ed i tuoi file STL privati.
      </div>
    `}
  `;
}

// --------------------------------------------------------------------------
// Admin Modal & Semaforo Machine Status Controls
// --------------------------------------------------------------------------
function getAdminPassword() {
  const saved = localStorage.getItem("titan_admin_password");
  if (saved && saved.trim()) return saved.trim();
  return state.adminPassword || "1234";
}

function saveAdminPassword(pwd) {
  if (pwd && pwd.trim()) {
    localStorage.setItem("titan_admin_password", pwd.trim());
    state.adminPassword = pwd.trim();
  }
}

function openAdminModal() {
  const currentPass = getAdminPassword();
  const pwd = prompt("🔐 Inserisci la Password Proprietario per accedere:");
  if (pwd === null) return;
  if (pwd.trim() === currentPass) {
    document.getElementById("adminModal").classList.remove("hidden");
    
    const passInput = document.getElementById("adminPasswordInput");
    if (passInput) passInput.value = currentPass;

    const kwhInput = document.getElementById("adminKwh");
    if (kwhInput) kwhInput.value = state.kwhPrice;

    const setupInput = document.getElementById("adminBaseSetup");
    if (setupInput) setupInput.value = state.baseSetupFee;

    const waInput = document.getElementById("adminWaPhone");
    if (waInput) waInput.value = state.waPhone;

    const streamB = document.getElementById("adminStreamBambu");
    if (streamB) streamB.value = state.streamBambu || "";

    const streamA = document.getElementById("adminStreamAnycubic");
    if (streamA) streamA.value = state.streamAnycubic || "";

    const fbIn = document.getElementById("adminFbChannelLink");
    if (fbIn) fbIn.value = state.fbChannelLink || "";

    const ytIn = document.getElementById("adminYtChannelLink");
    if (ytIn) ytIn.value = state.ytChannelLink || "";

    const t1In = document.getElementById("adminPublicTimelapse1");
    if (t1In) {
      if (state.publicTimelapse1 && state.publicTimelapse1.startsWith("data:video")) {
        t1In.value = "[Video MP4 Caricato da PC]";
      } else {
        t1In.value = state.publicTimelapse1 || "";
      }
    }

    const t2In = document.getElementById("adminPublicTimelapse2");
    if (t2In) {
      if (state.publicTimelapse2 && state.publicTimelapse2.startsWith("data:video")) {
        t2In.value = "[Video MP4 Caricato da PC]";
      } else {
        t2In.value = state.publicTimelapse2 || "";
      }
    }

    renderAdminMaterialsPricing();
    renderAdminPalettesManager();
    renderAdminClientsList();
    initSemaforo();
  } else {
    alert("❌ Password errata! Accesso negato.");
  }
}

function closeAdminModal() {
  document.getElementById("adminModal").classList.add("hidden");
}

function setSemaforo(status, labelText, subText) {
  state.semaforoStatus = status;
  state.semaforoText = labelText;
  state.semaforoSub = subText;
  localStorage.setItem("titan_admin_semaforo", JSON.stringify({ status, labelText, subText }));

  const dot = document.getElementById("semaforoDot");
  if (dot) dot.className = `status-dot ${status}`;

  const lbl = document.getElementById("semaforoLabel");
  if (lbl) lbl.textContent = labelText;
  const sub = document.getElementById("semaforoSub");
  if (sub) sub.textContent = subText;
  const adminLbl = document.getElementById("adminCurrentStatusLabel");
  if (adminLbl) adminLbl.textContent = `${status === 'green' ? '🟢' : status === 'yellow' ? '🟡' : '🔴'} ${labelText}`;

  const btnG = document.getElementById("btnSemGreen");
  const btnY = document.getElementById("btnSemYellow");
  const btnR = document.getElementById("btnSemRed");

  if (btnG) btnG.classList.remove("active");
  if (btnY) btnY.classList.remove("active");
  if (btnR) btnR.classList.remove("active");

  if (status === 'green' && btnG) btnG.classList.add("active");
  if (status === 'yellow' && btnY) btnY.classList.add("active");
  if (status === 'red' && btnR) btnR.classList.add("active");
}

function updateAdminSettings() {
  const newKwh = parseFloat(document.getElementById("adminKwh").value);
  const newSetup = parseFloat(document.getElementById("adminBaseSetup").value);
  const newWa = document.getElementById("adminWaPhone").value.trim();
  const passInput = document.getElementById("adminPasswordInput");
  const newPwd = passInput ? passInput.value.trim() : "";
  const sBambu = document.getElementById("adminStreamBambu").value.trim();
  const sAnycubic = document.getElementById("adminStreamAnycubic").value.trim();
  const fbLink = document.getElementById("adminFbChannelLink") ? document.getElementById("adminFbChannelLink").value.trim() : "";
  const ytLink = document.getElementById("adminYtChannelLink") ? document.getElementById("adminYtChannelLink").value.trim() : "";
  const t1Link = document.getElementById("adminPublicTimelapse1") ? document.getElementById("adminPublicTimelapse1").value.trim() : "";
  const t2Link = document.getElementById("adminPublicTimelapse2") ? document.getElementById("adminPublicTimelapse2").value.trim() : "";

  if (!isNaN(newKwh)) {
    state.kwhPrice = newKwh;
    localStorage.setItem("titan_admin_kwh_price", newKwh);
  }
  if (!isNaN(newSetup)) {
    state.baseSetupFee = newSetup;
    localStorage.setItem("titan_admin_base_setup", newSetup);
  }
  if (newWa) {
    state.waPhone = newWa;
    localStorage.setItem("titan_admin_wa_phone", newWa);
  }
  if (newPwd) {
    saveAdminPassword(newPwd);
  }
  if (sBambu) {
    state.streamBambu = sBambu;
    localStorage.setItem("titan_admin_stream_bambu", sBambu);
  }
  if (sAnycubic) {
    state.streamAnycubic = sAnycubic;
    localStorage.setItem("titan_admin_stream_anycubic", sAnycubic);
  }
  if (fbLink) {
    state.fbChannelLink = fbLink;
    localStorage.setItem("titan_admin_fb_channel", fbLink);
  }
  if (ytLink) {
    state.ytChannelLink = ytLink;
    localStorage.setItem("titan_admin_yt_channel", ytLink);
  }
  if (t1Link && !t1Link.startsWith("Es.") && !t1Link.startsWith("Video Caricato") && !t1Link.startsWith("[Video MP4")) {
    state.publicTimelapse1 = t1Link;
    localStorage.setItem("titan_admin_timelapse_1", t1Link);
  }
  if (t2Link && !t2Link.startsWith("Es.") && !t2Link.startsWith("Video Caricato") && !t2Link.startsWith("[Video MP4")) {
    state.publicTimelapse2 = t2Link;
    localStorage.setItem("titan_admin_timelapse_2", t2Link);
  }

  applySocialAndTimelapseLinks();
  calculateQuote();
  alert("✓ TUTTE LE IMPOSTAZIONI (Social, Video Timelapse, WhatsApp, kWh, Setup e Password) sono state salvate PERMANENTEMENTE!");
}

async function resetDefaultTimelapseVideos() {
  await deleteVideoFromIDB("timelapse_1");
  await deleteVideoFromIDB("timelapse_2");
  localStorage.removeItem("titan_admin_timelapse_1");
  localStorage.removeItem("titan_admin_timelapse_2");
  state.publicTimelapse1 = "assets/bambulab/timelapse_bambu.mp4";
  state.publicTimelapse2 = "assets/anycubic/timelapse_anycubic.mp4";
  const input1 = document.getElementById("adminPublicTimelapse1");
  const input2 = document.getElementById("adminPublicTimelapse2");
  if (input1) input1.value = "";
  if (input2) input2.value = "";
  applySocialAndTimelapseLinks();
  alert("✓ Video di esempio ripristinati e perfettamente funzionanti nelle 2 finestre!");
}
