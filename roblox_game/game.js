/* ==========================================================================
   ROBLOX ULTIMATE GAMER HUB 3D - ENGINE & GAME LOGIC
   ========================================================================== */

// --- GLOBAL GAME STATE ---
const state = {
  activeTab: 'games', // 'games', 'obby3d', 'pets', 'avatar', 'build'
  level: parseInt(localStorage.getItem('roblox_level') || '15'),
  xp: parseInt(localStorage.getItem('roblox_xp') || '650'),
  robux: parseInt(localStorage.getItem('roblox_robux') || '12500'),
  coins: parseInt(localStorage.getItem('roblox_coins') || '450'),
  playerName: localStorage.getItem('roblox_player_name') || 'PRO GAMER',
  
  activePet: localStorage.getItem('roblox_active_pet') || 'cat', // 'cat', 'fox', 'dragon'
  selectedBlock: 'grass',
  musicEnabled: true,
  
  avatar: {
    shirt: localStorage.getItem('roblox_shirt') || '#00f0ff',
    pants: localStorage.getItem('roblox_pants') || '#1a237e',
    skin: localStorage.getItem('roblox_skin') || '#ffe082',
    wings: localStorage.getItem('roblox_wings') || 'cyan',
    hat: localStorage.getItem('roblox_hat') || 'crown',
    face: localStorage.getItem('roblox_face') || 'happy'
  }
};

// THREE.JS GLOBALS
let scene, camera, renderer;
let playerGroup, headMesh, torsoMesh, lArmMesh, rArmMesh, lLegMesh, rLegMesh, hatGroup, wingsGroup, faceCanvas, faceTexture;
let petMesh = null;
let platforms = [];
let coinsList = [];
let lavaList = [];
let buildBlocks = [];
let finishTrophy = null;

// Physics & Controls
const keys = {};
let playerPos = { x: 0, y: 3, z: 0 };
let playerVel = { x: 0, y: 0, z: 0 };
let isGrounded = false;
let cameraRotationY = 0;
let cameraRotationX = 0.3;

// Web Audio API
let audioCtx = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  initPlayerAvatar();
  init3DPet();
  initAudioCtx();
  setupEventListeners();
  updateHUDStats();
  
  // Default Scene Load
  loadObbyLevel(1);

  // Animation Loop
  animate();
});

function initThreeJS() {
  const container = document.getElementById('game-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0f19');
  scene.fog = new THREE.FogExp2('#0b0f19', 0.012);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x00f0ff, 0.9);
  dirLight.position.set(30, 50, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xffea00, 1, 30);
  pointLight.position.set(0, 10, 0);
  scene.add(pointLight);

  createSkyIslands();
}

function createSkyIslands() {
  // Background Floating Islands
  const islandGeo = new THREE.DodecahedronGeometry(6, 1);
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

  for (let i = 0; i < 15; i++) {
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(
      (Math.random() - 0.5) * 160,
      10 + Math.random() * 30,
      (Math.random() - 0.5) * 160
    );
    island.scale.set(1 + Math.random() * 2, 0.5 + Math.random() * 0.5, 1 + Math.random() * 2);
    scene.add(island);
  }
}

// ==========================================================================
// 3D ROBLOX CHARACTER & NEON WINGS & PETS
// ==========================================================================

function initPlayerAvatar() {
  playerGroup = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: state.avatar.skin, roughness: 0.3 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: state.avatar.shirt, roughness: 0.4 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: state.avatar.pants, roughness: 0.5 });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(1.2, 1.4, 0.6);
  torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.position.y = 1.4;
  torsoMesh.castShadow = true;
  playerGroup.add(torsoMesh);

  // Head & Face
  const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  faceCanvas = document.createElement('canvas');
  faceCanvas.width = 128;
  faceCanvas.height = 128;
  drawFaceTexture(state.avatar.face);
  faceTexture = new THREE.CanvasTexture(faceCanvas);

  const headMaterials = [
    skinMat, skinMat, skinMat, skinMat,
    new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.3 }),
    skinMat
  ];

  headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.position.y = 2.45;
  headMesh.castShadow = true;
  playerGroup.add(headMesh);

  // Hat & Wings Containers
  hatGroup = new THREE.Group();
  headMesh.add(hatGroup);
  renderAvatarHat(state.avatar.hat);

  wingsGroup = new THREE.Group();
  torsoMesh.add(wingsGroup);
  renderAvatarWings(state.avatar.wings);

  // Arms & Legs
  const armGeo = new THREE.BoxGeometry(0.45, 1.3, 0.45);
  lArmMesh = new THREE.Mesh(armGeo, shirtMat);
  lArmMesh.position.set(-0.9, 1.35, 0);
  lArmMesh.castShadow = true;
  playerGroup.add(lArmMesh);

  rArmMesh = new THREE.Mesh(armGeo, shirtMat);
  rArmMesh.position.set(0.9, 1.35, 0);
  rArmMesh.castShadow = true;
  playerGroup.add(rArmMesh);

  const legGeo = new THREE.BoxGeometry(0.5, 1.3, 0.5);
  lLegMesh = new THREE.Mesh(legGeo, pantsMat);
  lLegMesh.position.set(-0.32, 0.65, 0);
  lLegMesh.castShadow = true;
  playerGroup.add(lLegMesh);

  rLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rLegMesh.position.set(0.32, 0.65, 0);
  rLegMesh.castShadow = true;
  playerGroup.add(rLegMesh);

  playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
  scene.add(playerGroup);
}

function drawFaceTexture(faceType) {
  const ctx = faceCanvas.getContext('2d');
  ctx.fillStyle = state.avatar.skin;
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#000000';
  ctx.lineWidth = 6;

  if (faceType === 'cool') {
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 35, 88, 28);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(25, 40, 35, 18);
    ctx.fillRect(68, 40, 35, 18);
    ctx.beginPath();
    ctx.arc(64, 85, 20, 0, Math.PI);
    ctx.stroke();
  } else if (faceType === 'ninja') {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = state.avatar.skin;
    ctx.fillRect(15, 35, 98, 35);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(40, 52, 7, 0, Math.PI * 2);
    ctx.arc(88, 52, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(38, 45, 8, 0, Math.PI * 2);
    ctx.arc(90, 45, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(64, 75, 26, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
  }

  if (faceTexture) faceTexture.needsUpdate = true;
}

function renderAvatarHat(hatType) {
  while (hatGroup.children.length > 0) hatGroup.remove(hatGroup.children[0]);

  if (hatType === 'crown') {
    const crownGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.35, 6);
    const crownMat = new THREE.MeshStandardMaterial({ color: '#ffea00', metalness: 0.8, roughness: 0.2 });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.y = 0.55;
    hatGroup.add(crown);
  } else if (hatType === 'cap') {
    const capGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.25, 12);
    const capMat = new THREE.MeshStandardMaterial({ color: '#ff3366' });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 0.5;
    const visorGeo = new THREE.BoxGeometry(0.5, 0.05, 0.4);
    const visor = new THREE.Mesh(visorGeo, capMat);
    visor.position.set(0, 0.45, 0.45);
    hatGroup.add(cap);
    hatGroup.add(visor);
  } else if (hatType === 'viking') {
    const helmGeo = new THREE.SphereGeometry(0.52, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmMat = new THREE.MeshStandardMaterial({ color: '#78909c', metalness: 0.6 });
    const helm = new THREE.Mesh(helmGeo, helmMat);
    helm.position.y = 0.45;
    hatGroup.add(helm);
  } else if (hatType === 'headphones') {
    const bandGeo = new THREE.TorusGeometry(0.52, 0.06, 8, 16, Math.PI);
    const hpMat = new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.5 });
    const band = new THREE.Mesh(bandGeo, hpMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.45;
    hatGroup.add(band);
  }
}

function renderAvatarWings(wingsType) {
  while (wingsGroup.children.length > 0) wingsGroup.remove(wingsGroup.children[0]);
  if (wingsType === 'none') return;

  let wingColor = '#00f0ff';
  if (wingsType === 'purple') wingColor = '#a100ff';
  if (wingsType === 'gold') wingColor = '#ffea00';

  const wingGeo = new THREE.BoxGeometry(1.8, 1.0, 0.05);
  const wingMat = new THREE.MeshStandardMaterial({ color: wingColor, emissive: wingColor, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 });

  const lWing = new THREE.Mesh(wingGeo, wingMat);
  lWing.position.set(-1.2, 0.2, -0.35);
  lWing.rotation.y = -0.3;

  const rWing = new THREE.Mesh(wingGeo, wingMat);
  rWing.position.set(1.2, 0.2, -0.35);
  rWing.rotation.y = 0.3;

  wingsGroup.add(lWing);
  wingsGroup.add(rWing);
}

// 3D PET COMPANION
function init3DPet() {
  if (petMesh) scene.remove(petMesh);

  const petGroup = new THREE.Group();
  let petColor = '#00f0ff';

  if (state.activePet === 'fox') petColor = '#ff6d00';
  if (state.activePet === 'dragon') petColor = '#a100ff';

  const bodyGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const bodyMat = new THREE.MeshStandardMaterial({ color: petColor, emissive: petColor, emissiveIntensity: 0.3 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  petGroup.add(body);

  // Ears
  const earGeo = new THREE.ConeGeometry(0.18, 0.3, 4);
  const lEar = new THREE.Mesh(earGeo, bodyMat);
  lEar.position.set(-0.2, 0.45, 0);
  const rEar = new THREE.Mesh(earGeo, bodyMat);
  rEar.position.set(0.2, 0.45, 0);
  petGroup.add(lEar);
  petGroup.add(rEar);

  petMesh = petGroup;
  petMesh.position.set(playerPos.x + 1.2, playerPos.y + 1, playerPos.z + 1);
  scene.add(petMesh);
}

function updatePetMovement() {
  if (!petMesh) return;
  const targetX = playerPos.x + 1.4;
  const targetY = playerPos.y + 0.8 + Math.sin(animFrame * 0.1) * 0.2; // Hover bobbing
  const targetZ = playerPos.z + 1.2;

  petMesh.position.x += (targetX - petMesh.position.x) * 0.08;
  petMesh.position.y += (targetY - petMesh.position.y) * 0.08;
  petMesh.position.z += (targetZ - petMesh.position.z) * 0.08;
}

// ==========================================================================
// NAVIGATION TABS & GAME MODES
// ==========================================================================

function switchTab(tabName) {
  state.activeTab = tabName;

  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('buildPaletteBar').classList.add('hidden');

  if (tabName === 'games') {
    document.getElementById('tabGames').classList.add('active');
    document.getElementById('viewGames').classList.remove('hidden');
  } else if (tabName === 'obby3d') {
    document.getElementById('tabObby3D').classList.add('active');
    loadObbyLevel(1);
    showToast('🏃‍♂️ Modalità Obby 3D Attiva! Raggiungi il Trofeo!');
  } else if (tabName === 'pets') {
    document.getElementById('tabPets').classList.add('active');
    document.getElementById('viewPets').classList.remove('hidden');
  } else if (tabName === 'avatar') {
    document.getElementById('tabAvatar').classList.add('active');
    document.getElementById('viewAvatar').classList.remove('hidden');
  } else if (tabName === 'build') {
    document.getElementById('tabBuild').classList.add('active');
    document.getElementById('buildPaletteBar').classList.remove('hidden');
    buildBaseBuildGrid();
    showToast('🧱 Modalità Costruttore 3D! Premi E per piazzare blocchi!');
  }
}

function startSpecialGame(gameType) {
  if (gameType === 'blox_fruits') {
    showToast('⚔️ Entrando in Blox Fruits 3D Arena!');
    switchTab('obby3d');
  } else if (gameType === 'brookhaven') {
    showToast('🚗 Entrando in Brookhaven 3D City!');
    switchTab('build');
  }
}

// OBBY LEVEL BUILDER
function loadObbyLevel(levelNum) {
  clearSceneObjects();
  createPlatform(0, 0, 0, 6, 1, 6, '#00ff88');

  let currentZ = -6;
  const platformColors = ['#00f0ff', '#ffea00', '#a100ff', '#ff007f'];

  for (let i = 0; i < 10 + levelNum * 3; i++) {
    const gap = 3.5 + Math.random() * 2;
    const heightOffset = (Math.random() - 0.3) * 1.8;
    const xOffset = (Math.random() - 0.5) * 5;
    currentZ -= gap;

    if (i % 4 === 2) {
      createLavaBlock(xOffset, heightOffset, currentZ, 3.5, 0.4, 3.5);
    } else {
      const color = platformColors[i % platformColors.length];
      createPlatform(xOffset, heightOffset, currentZ, 3.5, 0.6, 3.5, color);

      if (Math.random() > 0.3) {
        createCoin(xOffset, heightOffset + 1.5, currentZ);
      }
    }
  }

  currentZ -= 6;
  createPlatform(0, 0, currentZ, 6, 1, 6, '#ffea00');
  createTrophy(0, 1.5, currentZ);

  resetPlayerPosition();
}

function clearSceneObjects() {
  platforms.forEach(p => scene.remove(p.mesh));
  coinsList.forEach(c => scene.remove(c.mesh));
  lavaList.forEach(l => scene.remove(l.mesh));
  buildBlocks.forEach(b => scene.remove(b.mesh));
  if (finishTrophy) scene.remove(finishTrophy);

  platforms = [];
  coinsList = [];
  lavaList = [];
  buildBlocks = [];
  finishTrophy = null;
}

function createPlatform(x, y, z, w, h, d, colorHex) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  platforms.push({ mesh, bounds: new THREE.Box3().setFromObject(mesh) });
}

function createLavaBlock(x, y, z, w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: '#ff007f', emissive: '#ff007f', emissiveIntensity: 0.7 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  lavaList.push({ mesh, bounds: new THREE.Box3().setFromObject(mesh) });
}

function createCoin(x, y, z) {
  const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12);
  const mat = new THREE.MeshStandardMaterial({ color: '#ffea00', metalness: 0.9, roughness: 0.1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  scene.add(mesh);

  coinsList.push({ mesh, collected: false });
}

function createTrophy(x, y, z) {
  const group = new THREE.Group();
  const baseGeo = new THREE.CylinderGeometry(0.8, 1, 0.4, 8);
  const cupGeo = new THREE.ConeGeometry(0.9, 1.2, 8);
  const goldMat = new THREE.MeshStandardMaterial({ color: '#ffea00', metalness: 0.9, roughness: 0.1 });

  const base = new THREE.Mesh(baseGeo, goldMat);
  const cup = new THREE.Mesh(cupGeo, goldMat);
  cup.position.y = 0.8;
  cup.rotation.x = Math.PI;

  group.add(base);
  group.add(cup);
  group.position.set(x, y, z);
  scene.add(group);

  finishTrophy = group;
}

// BUILD MODE SANDBOX
function buildBaseBuildGrid() {
  clearSceneObjects();
  const gridGeo = new THREE.BoxGeometry(36, 1, 36);
  const gridMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
  const gridMesh = new THREE.Mesh(gridGeo, gridMat);
  gridMesh.position.set(0, -0.5, 0);
  gridMesh.receiveShadow = true;
  scene.add(gridMesh);

  platforms.push({ mesh: gridMesh, bounds: new THREE.Box3().setFromObject(gridMesh) });
}

function selectBlockType(blockType) {
  state.selectedBlock = blockType;
  document.querySelectorAll('.palette-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`.palette-item[data-block="${blockType}"]`)?.classList.add('active');
}

function placeBlockInBuildMode() {
  if (state.activeTab !== 'build') return;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const intersects = raycaster.intersectObjects(platforms.map(p => p.mesh).concat(buildBlocks.map(b => b.mesh)));

  if (intersects.length > 0) {
    const hit = intersects[0];
    const normal = hit.face.normal;

    const blockX = Math.round(hit.point.x + normal.x * 0.5);
    const blockY = Math.round(hit.point.y + normal.y * 0.5);
    const blockZ = Math.round(hit.point.z + normal.z * 0.5);

    addBlockToScene(blockX, blockY, blockZ, state.selectedBlock);
    playSynthSound(440, 'triangle', 0.1);
  }
}

function breakBlockInBuildMode() {
  if (state.activeTab !== 'build') return;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  const intersects = raycaster.intersectObjects(buildBlocks.map(b => b.mesh));

  if (intersects.length > 0) {
    const hitBlockMesh = intersects[0].object;
    scene.remove(hitBlockMesh);
    buildBlocks = buildBlocks.filter(b => b.mesh !== hitBlockMesh);
    playSynthSound(220, 'sawtooth', 0.1);
  }
}

function addBlockToScene(x, y, z, type) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  let mat;

  switch (type) {
    case 'grass': mat = new THREE.MeshStandardMaterial({ color: '#2e7d32' }); break;
    case 'brick': mat = new THREE.MeshStandardMaterial({ color: '#b71c1c' }); break;
    case 'wood': mat = new THREE.MeshStandardMaterial({ color: '#5d4037' }); break;
    case 'gold': mat = new THREE.MeshStandardMaterial({ color: '#ffea00', metalness: 0.8 }); break;
    case 'neon': mat = new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.5 }); break;
    case 'lava': mat = new THREE.MeshStandardMaterial({ color: '#ff007f', emissive: '#ff007f', emissiveIntensity: 0.8 }); break;
    case 'rainbow': mat = new THREE.MeshStandardMaterial({ color: '#a100ff' }); break;
    default: mat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  buildBlocks.push({ mesh, type, x, y, z, bounds: new THREE.Box3().setFromObject(mesh) });
}

function saveCustomWorld() {
  const data = buildBlocks.map(b => ({ x: b.x, y: b.y, z: b.z, type: b.type }));
  localStorage.setItem('roblox_custom_world', JSON.stringify(data));
  showToast('💾 Mondo 3D salvato!');
}

function clearCustomWorld() {
  buildBlocks.forEach(b => scene.remove(b.mesh));
  buildBlocks = [];
  localStorage.removeItem('roblox_custom_world');
  showToast('🗑️ Mondo svuotato!');
}

// ==========================================================================
// PET HATCHING & AVATAR CUSTOMIZATION
// ==========================================================================

function hatchEgg(eggType, cost) {
  if (state.coins < cost) {
    showToast('❌ Monete insufficienti! Raccogli più monete nell\'Obby!');
    return;
  }

  state.coins -= cost;
  updateHUDStats();

  if (window.confetti) {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }

  const newPet = eggType === 'legendary' ? 'fox' : 'cat';
  equipPet(newPet);
  showToast(`🎉 CONGRATULAZIONI! Hai schiuso un Pet 3D: ${newPet.toUpperCase()}!`);
}

function equipPet(petType) {
  state.activePet = petType;
  localStorage.setItem('roblox_active_pet', petType);

  document.querySelectorAll('.pet-select-btn').forEach(b => b.classList.remove('active'));

  init3DPet();
}

function updateAvatarStyle() {
  state.avatar.shirt = document.getElementById('shirtColorPicker').value;
  state.avatar.pants = document.getElementById('pantsColorPicker').value;
  state.avatar.skin = document.getElementById('skinColorPicker').value;
  state.avatar.wings = document.getElementById('wingsSelect').value;
  state.avatar.hat = document.getElementById('hatSelect').value;
  state.avatar.face = document.getElementById('faceSelect').value;

  localStorage.setItem('roblox_shirt', state.avatar.shirt);
  localStorage.setItem('roblox_pants', state.avatar.pants);
  localStorage.setItem('roblox_skin', state.avatar.skin);
  localStorage.setItem('roblox_wings', state.avatar.wings);
  localStorage.setItem('roblox_hat', state.avatar.hat);
  localStorage.setItem('roblox_face', state.avatar.face);

  torsoMesh.material.color.set(state.avatar.shirt);
  lArmMesh.material.color.set(state.avatar.shirt);
  rArmMesh.material.color.set(state.avatar.shirt);

  lLegMesh.material.color.set(state.avatar.pants);
  rLegMesh.material.color.set(state.avatar.pants);

  renderAvatarHat(state.avatar.hat);
  renderAvatarWings(state.avatar.wings);
  drawFaceTexture(state.avatar.face);
}

// ==========================================================================
// CONTROLS & EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyE') placeBlockInBuildMode();
    if (e.code === 'KeyQ') breakBlockInBuildMode();
    if (e.code === 'Space') doJump();
  });

  window.addEventListener('keyup', e => keys[e.code] = false);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let isMouseDown = false;
  let prevMouseX = 0, prevMouseY = 0;

  window.addEventListener('mousedown', e => {
    if (e.target.tagName === 'CANVAS') isMouseDown = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => isMouseDown = false);

  window.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;

    cameraRotationY -= deltaX * 0.005;
    cameraRotationX = Math.max(0.05, Math.min(Math.PI / 2.2, cameraRotationX + deltaY * 0.005));
  });

  setupTouchJoystick();
}

let touchVector = { x: 0, y: 0 };

function setupTouchJoystick() {
  const container = document.getElementById('joystickZone');
  const knob = document.getElementById('joystickKnob');
  if (!container || !knob) return;

  let activeTouchId = null;
  let startX = 0, startY = 0;

  container.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    const rect = container.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  });

  window.addEventListener('touchmove', e => {
    if (activeTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === activeTouchId) {
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        const dist = Math.min(45, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);

        knob.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
        touchVector.x = (Math.cos(angle) * dist) / 45;
        touchVector.y = (Math.sin(angle) * dist) / 45;
      }
    }
  });

  const endTouch = () => {
    activeTouchId = null;
    knob.style.transform = 'translate(0px, 0px)';
    touchVector = { x: 0, y: 0 };
  };

  window.addEventListener('touchend', endTouch);
  window.addEventListener('touchcancel', endTouch);

  document.getElementById('touchBtnJump')?.addEventListener('touchstart', e => {
    e.preventDefault();
    doJump();
  });
}

function doJump() {
  if (isGrounded) {
    playerVel.y = 0.3;
    isGrounded = false;
    playSynthSound(600, 'sine', 0.15);
  }
}

// ==========================================================================
// PHYSICS & ANIMATION LOOP
// ==========================================================================

let animFrame = 0;

function animate() {
  requestAnimationFrame(animate);
  animFrame++;

  updatePlayerMovement();
  checkCollisions();
  animateCoins();
  updatePetMovement();

  updateCameraPosition();
  renderer.render(scene, camera);
}

function updatePlayerMovement() {
  let moveX = 0, moveZ = 0;

  if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

  if (Math.abs(touchVector.x) > 0.1 || Math.abs(touchVector.y) > 0.1) {
    moveX = touchVector.x;
    moveZ = touchVector.y;
  }

  const speed = keys['ShiftLeft'] ? 0.2 : 0.12;

  if (moveX !== 0 || moveZ !== 0) {
    const angle = cameraRotationY;
    const forwardX = Math.sin(angle);
    const forwardZ = Math.cos(angle);
    const rightX = Math.cos(angle);
    const rightZ = -Math.sin(angle);

    const dirX = forwardX * moveZ + rightX * moveX;
    const dirZ = forwardZ * moveZ + rightZ * moveX;

    playerVel.x = dirX * speed;
    playerVel.z = dirZ * speed;

    playerGroup.rotation.y = Math.atan2(dirX, dirZ);

    lArmMesh.rotation.x = Math.sin(animFrame * 0.2) * 0.6;
    rArmMesh.rotation.x = -Math.sin(animFrame * 0.2) * 0.6;
    lLegMesh.rotation.x = -Math.sin(animFrame * 0.2) * 0.6;
    rLegMesh.rotation.x = Math.sin(animFrame * 0.2) * 0.6;
  } else {
    playerVel.x = 0;
    playerVel.z = 0;
    lArmMesh.rotation.x = 0; rArmMesh.rotation.x = 0;
    lLegMesh.rotation.x = 0; rLegMesh.rotation.x = 0;
  }

  playerVel.y -= 0.014;

  playerPos.x += playerVel.x;
  playerPos.y += playerVel.y;
  playerPos.z += playerVel.z;

  if (playerPos.y < -15) {
    resetPlayerPosition();
    showToast('💥 Caduto! Riprova!');
    playSynthSound(150, 'sawtooth', 0.25);
  }

  playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
}

function checkCollisions() {
  const playerRadius = 0.5;
  const allObstacles = platforms.concat(buildBlocks);
  isGrounded = false;

  for (let obs of allObstacles) {
    const b = obs.bounds;
    if (
      playerPos.x + playerRadius > b.min.x &&
      playerPos.x - playerRadius < b.max.x &&
      playerPos.z + playerRadius > b.min.z &&
      playerPos.z - playerRadius < b.max.z
    ) {
      if (playerPos.y <= b.max.y + 0.1 && playerPos.y >= b.max.y - 0.6 && playerVel.y <= 0) {
        playerPos.y = b.max.y;
        playerVel.y = 0;
        isGrounded = true;
      }
    }
  }

  for (let lava of lavaList) {
    const b = lava.bounds;
    if (
      playerPos.x + playerRadius > b.min.x &&
      playerPos.x - playerRadius < b.max.x &&
      playerPos.y < b.max.y + 0.2 &&
      playerPos.z + playerRadius > b.min.z &&
      playerPos.z - playerRadius < b.max.z
    ) {
      resetPlayerPosition();
      showToast('🔥 Ouch! Attento alla Lava!');
      playSynthSound(120, 'square', 0.3);
    }
  }

  if (finishTrophy && state.activeTab === 'obby3d') {
    const dist = Math.hypot(playerPos.x - finishTrophy.position.x, playerPos.z - finishTrophy.position.z);
    if (dist < 1.8 && Math.abs(playerPos.y - finishTrophy.position.y) < 2) {
      triggerVictory();
    }
  }
}

function animateCoins() {
  coinsList.forEach(c => {
    if (!c.collected) {
      c.mesh.rotation.z += 0.04;
      const dist = Math.hypot(playerPos.x - c.mesh.position.x, playerPos.z - c.mesh.position.z);
      if (dist < 1.2 && Math.abs(playerPos.y - c.mesh.position.y) < 1.8) {
        c.collected = true;
        scene.remove(c.mesh);
        state.coins += 20;
        state.xp += 30;
        updateHUDStats();
        playSynthSound(880, 'sine', 0.1);
      }
    }
  });
}

function updateCameraPosition() {
  const camDist = 7;
  const targetX = playerPos.x - Math.sin(cameraRotationY) * camDist * Math.cos(cameraRotationX);
  const targetY = playerPos.y + 2.5 + Math.sin(cameraRotationX) * camDist;
  const targetZ = playerPos.z - Math.cos(cameraRotationY) * camDist * Math.cos(cameraRotationX);

  camera.position.set(targetX, targetY, targetZ);
  camera.lookAt(playerPos.x, playerPos.y + 1.4, playerPos.z);
}

function resetPlayerPosition() {
  playerPos = { x: 0, y: 3, z: 0 };
  playerVel = { x: 0, y: 0, z: 0 };
}

// ==========================================================================
// HUD STATS & VICTORY
// ==========================================================================

function updateHUDStats() {
  localStorage.setItem('roblox_coins', state.coins.toString());
  localStorage.setItem('roblox_xp', state.xp.toString());
  localStorage.setItem('roblox_robux', state.robux.toString());
  localStorage.setItem('roblox_level', state.level.toString());

  document.getElementById('coinCount').textContent = state.coins;
  document.getElementById('robuxCount').textContent = state.robux.toLocaleString();
  document.getElementById('playerLevel').textContent = state.level;
  document.getElementById('playerXp').textContent = state.xp;
  document.getElementById('playerNameDisplay').textContent = state.playerName;

  const xpPct = Math.min(100, (state.xp % 1000) / 10);
  document.getElementById('xpBarFill').style.width = `${xpPct}%`;
}

function triggerVictory() {
  if (window.confetti) {
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
  }

  playSynthSound(523, 'triangle', 0.2);
  setTimeout(() => playSynthSound(659, 'triangle', 0.2), 150);
  setTimeout(() => playSynthSound(783, 'triangle', 0.4), 300);

  state.coins += 150;
  state.xp += 200;
  updateHUDStats();

  document.getElementById('victoryModal').classList.remove('hidden');
}

function nextLevelOrRestart() {
  document.getElementById('victoryModal').classList.add('hidden');
  state.level++;
  loadObbyLevel(state.level);
}

// ==========================================================================
// AUDIO & UTILS
// ==========================================================================

function initAudioCtx() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  } catch (e) {}
}

function toggleMusic() {
  state.musicEnabled = !state.musicEnabled;
  document.getElementById('btnAudioToggle').textContent = state.musicEnabled ? '🎵' : '🔇';
}

function playSynthSound(freq, type = 'sine', duration = 0.15) {
  if (!state.musicEnabled || !audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function showToast(text) {
  const el = document.getElementById('toastNotification');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2800);
}

function openSettingsModal() {
  document.getElementById('settingsModal').classList.remove('hidden');
}

function saveSettings() {
  const val = document.getElementById('settingPlayerName').value.trim();
  if (val) {
    state.playerName = val;
    localStorage.setItem('roblox_player_name', val);
    updateHUDStats();
  }
  document.getElementById('settingsModal').classList.add('hidden');
}
