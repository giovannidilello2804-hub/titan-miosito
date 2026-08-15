/* ==========================================================================
   ROBLOX BLOCK WORLD 3D - GAME ENGINE & THREE.JS LOGIC
   ========================================================================== */

// --- GAME STATE & GLOBAL VARIABLES ---
const state = {
  mode: 'obby', // 'obby', 'build', 'avatar'
  level: 1,
  coins: parseInt(localStorage.getItem('roblox_coins') || '0'),
  selectedBlock: 'grass',
  audioEnabled: true,
  timerSeconds: 0,
  timerInterval: null,
  
  // Avatar Customization
  avatar: {
    shirt: localStorage.getItem('roblox_shirt') || '#00f0ff',
    pants: localStorage.getItem('roblox_pants') || '#1a237e',
    skin: localStorage.getItem('roblox_skin') || '#ffe082',
    hat: localStorage.getItem('roblox_hat') || 'crown',
    face: localStorage.getItem('roblox_face') || 'happy'
  }
};

// --- THREE.JS GLOBALS ---
let scene, camera, renderer;
let playerGroup, headMesh, torsoMesh, lArmMesh, rArmMesh, lLegMesh, rLegMesh, hatGroup, faceCanvas, faceTexture;
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

// Web Audio API Synth
let audioCtx = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  initPlayerAvatar();
  initAudioCtx();
  setupEventListeners();
  loadCustomWorldData();
  
  // Start Obby Level 1
  loadObbyLevel(state.level);
  startTimer();

  // Animation Loop
  animate();
});

function initThreeJS() {
  const container = document.getElementById('game-container');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#78c8ff');
  scene.fog = new THREE.FogExp2('#78c8ff', 0.015);

  // Camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(40, 60, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 150;
  dirLight.shadow.camera.left = -40;
  dirLight.shadow.camera.right = 40;
  dirLight.shadow.camera.top = 40;
  dirLight.shadow.camera.bottom = -40;
  scene.add(dirLight);

  // Decorative Clouds Sky
  createDecorativeClouds();

  // Update Coin UI
  document.getElementById('coinCount').textContent = state.coins;
}

function createDecorativeClouds() {
  const cloudGeo = new THREE.DodecahedronGeometry(4, 1);
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });

  for (let i = 0; i < 20; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.position.set(
      (Math.random() - 0.5) * 200,
      25 + Math.random() * 20,
      (Math.random() - 0.5) * 200
    );
    cloud.scale.set(1 + Math.random() * 2, 0.6 + Math.random() * 0.4, 1 + Math.random() * 2);
    scene.add(cloud);
  }
}

// ==========================================================================
// ROBLOX BLOCKY PLAYER AVATAR CREATION
// ==========================================================================

function initPlayerAvatar() {
  playerGroup = new THREE.Group();

  // Skin / Clothes Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: state.avatar.skin, roughness: 0.3 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: state.avatar.shirt, roughness: 0.4 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: state.avatar.pants, roughness: 0.5 });

  // 1. Torso
  const torsoGeo = new THREE.BoxGeometry(1.2, 1.4, 0.6);
  torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
  torsoMesh.position.y = 1.4;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  playerGroup.add(torsoMesh);

  // 2. Head & Face
  const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  
  // Dynamic Face Canvas
  faceCanvas = document.createElement('canvas');
  faceCanvas.width = 128;
  faceCanvas.height = 128;
  drawFaceTexture(state.avatar.face);
  faceTexture = new THREE.CanvasTexture(faceCanvas);

  const headMaterials = [
    skinMat, skinMat, skinMat, skinMat,
    new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.3 }), // Front face
    skinMat
  ];

  headMesh = new THREE.Mesh(headGeo, headMaterials);
  headMesh.position.y = 2.45;
  headMesh.castShadow = true;
  playerGroup.add(headMesh);

  // 3. Hat / Accessory Container
  hatGroup = new THREE.Group();
  headMesh.add(hatGroup);
  renderAvatarHat(state.avatar.hat);

  // 4. Arms
  const armGeo = new THREE.BoxGeometry(0.45, 1.3, 0.45);
  
  lArmMesh = new THREE.Mesh(armGeo, shirtMat);
  lArmMesh.position.set(-0.9, 1.35, 0);
  lArmMesh.castShadow = true;
  playerGroup.add(lArmMesh);

  rArmMesh = new THREE.Mesh(armGeo, shirtMat);
  rArmMesh.position.set(0.9, 1.35, 0);
  rArmMesh.castShadow = true;
  playerGroup.add(rArmMesh);

  // 5. Legs
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
    // Sunglasses
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 35, 88, 28);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(25, 40, 35, 18);
    ctx.fillRect(68, 40, 35, 18);
    // Cool smile
    ctx.beginPath();
    ctx.arc(64, 85, 20, 0, Math.PI);
    ctx.stroke();
  } else if (faceType === 'ninja') {
    // Ninja Mask
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = state.avatar.skin;
    ctx.fillRect(15, 35, 98, 35);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(40, 52, 7, 0, Math.PI * 2);
    ctx.arc(88, 52, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Happy Default Smile
    // Eyes
    ctx.beginPath();
    ctx.arc(38, 45, 8, 0, Math.PI * 2);
    ctx.arc(90, 45, 8, 0, Math.PI * 2);
    ctx.fill();
    // Smile
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
    const hpMat = new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.4 });
    const band = new THREE.Mesh(bandGeo, hpMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.45;
    hatGroup.add(band);
  }
}

// ==========================================================================
// GAME MODES & LEVEL GENERATION
// ==========================================================================

function switchGameMode(modeName) {
  state.mode = modeName;

  // Update UI Buttons
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  if (modeName === 'obby') document.getElementById('btnModeObby').classList.add('active');
  if (modeName === 'build') document.getElementById('btnModeBuild').classList.add('active');
  if (modeName === 'avatar') document.getElementById('btnModeAvatar').classList.add('active');

  // Toggle Panels
  document.getElementById('buildPaletteBar').classList.toggle('hidden', modeName !== 'build');
  document.getElementById('avatarStudioPanel').classList.toggle('hidden', modeName !== 'avatar');

  // Reset Scene Objects for Mode
  clearSceneObjects();

  if (modeName === 'obby') {
    loadObbyLevel(state.level);
    resetPlayerPosition();
  } else if (modeName === 'build') {
    buildBaseBuildGrid();
    loadCustomWorldBlocks();
    playerPos = { x: 0, y: 3, z: 0 };
  } else if (modeName === 'avatar') {
    // Center Avatar for Studio
    playerPos = { x: 0, y: 0, z: 0 };
    playerGroup.position.set(0, 0, 0);
  }

  showToast(`Modalità: ${modeName.toUpperCase()}`);
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

// OBBY PARKOUR LEVEL BUILDER
function loadObbyLevel(levelNum) {
  clearSceneObjects();
  document.getElementById('currentLevelNum').textContent = levelNum;

  // 1. Start Platform
  createPlatform(0, 0, 0, 6, 1, 6, '#00ff88');

  // 2. Progressive Obby Course
  let currentZ = -6;
  const platformColors = ['#00f0ff', '#ffea00', '#a100ff', '#ff3366'];

  for (let i = 0; i < 8 + levelNum * 3; i++) {
    const gap = 3 + Math.random() * 2;
    const heightOffset = (Math.random() - 0.3) * 1.5;
    const xOffset = (Math.random() - 0.5) * 4;
    currentZ -= gap;

    const isLava = (i % 4 === 2);

    if (isLava) {
      // Lava Block (Instant Respawn)
      createLavaBlock(xOffset, heightOffset, currentZ, 3, 0.4, 3);
    } else {
      const color = platformColors[i % platformColors.length];
      createPlatform(xOffset, heightOffset, currentZ, 3, 0.6, 3, color);

      // Add Coin
      if (Math.random() > 0.4) {
        createCoin(xOffset, heightOffset + 1.5, currentZ);
      }
    }
  }

  // 3. Victory Trophy Platform
  currentZ -= 6;
  createPlatform(0, 0, currentZ, 6, 1, 6, '#ffea00');
  createTrophy(0, 1.5, currentZ);

  resetPlayerPosition();
}

function createPlatform(x, y, z, w, h, d, colorHex) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);

  platforms.push({ mesh, bounds: new THREE.Box3().setFromObject(mesh) });
}

function createLavaBlock(x, y, z, w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color: '#ff3366', emissive: '#ff0033', emissiveIntensity: 0.6 });
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
  const gridGeo = new THREE.BoxGeometry(30, 1, 30);
  const gridMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 });
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
  if (state.mode !== 'build') return;

  // Raycast forward from camera
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
  if (state.mode !== 'build') return;

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
    case 'lava': mat = new THREE.MeshStandardMaterial({ color: '#ff3366', emissive: '#ff3366', emissiveIntensity: 0.8 }); break;
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
  showToast('💾 Mondo 3D salvato con successo!');
}

function loadCustomWorldData() {
  // Utility for building mode
}

function loadCustomWorldBlocks() {
  const raw = localStorage.getItem('roblox_custom_world');
  if (!raw) return;
  try {
    const list = JSON.parse(raw);
    list.forEach(b => addBlockToScene(b.x, b.y, b.z, b.type));
  } catch(e) {}
}

function clearCustomWorld() {
  buildBlocks.forEach(b => scene.remove(b.mesh));
  buildBlocks = [];
  localStorage.removeItem('roblox_custom_world');
  showToast('🗑️ Mondo svuotato!');
}

// ==========================================================================
// CONTROLS & EVENT LISTENERS
// ==========================================================================

function setupEventListeners() {
  // Keyboard
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyE') placeBlockInBuildMode();
    if (e.code === 'KeyQ') breakBlockInBuildMode();
    if (e.code === 'Space') doJump();
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  // Window Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Mouse Camera Rotation
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

  // Touch / Mobile Controls
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

  // Jump Button Touch
  document.getElementById('touchBtnJump')?.addEventListener('touchstart', e => {
    e.preventDefault();
    doJump();
  });
}

function doJump() {
  if (isGrounded) {
    playerVel.y = 0.28;
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

  if (state.mode !== 'avatar') {
    updatePlayerMovement();
    checkCollisions();
    animateCoins();
  } else {
    // Rotate Player in Avatar Studio Mode
    playerGroup.rotation.y += 0.01;
  }

  updateCameraPosition();
  renderer.render(scene, camera);
}

function updatePlayerMovement() {
  // Input direction
  let moveX = 0, moveZ = 0;

  if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

  // Touch joystick override
  if (Math.abs(touchVector.x) > 0.1 || Math.abs(touchVector.y) > 0.1) {
    moveX = touchVector.x;
    moveZ = touchVector.y;
  }

  const speed = keys['ShiftLeft'] ? 0.18 : 0.11;

  if (moveX !== 0 || moveZ !== 0) {
    // Move relative to camera angle
    const angle = cameraRotationY;
    const forwardX = Math.sin(angle);
    const forwardZ = Math.cos(angle);
    const rightX = Math.cos(angle);
    const rightZ = -Math.sin(angle);

    const dirX = forwardX * moveZ + rightX * moveX;
    const dirZ = forwardZ * moveZ + rightZ * moveX;

    playerVel.x = dirX * speed;
    playerVel.z = dirZ * speed;

    // Rotate Avatar facing direction
    playerGroup.rotation.y = Math.atan2(dirX, dirZ);

    // Walking Limb Animation
    lArmMesh.rotation.x = Math.sin(animFrame * 0.2) * 0.6;
    rArmMesh.rotation.x = -Math.sin(animFrame * 0.2) * 0.6;
    lLegMesh.rotation.x = -Math.sin(animFrame * 0.2) * 0.6;
    rLegMesh.rotation.x = Math.sin(animFrame * 0.2) * 0.6;
  } else {
    playerVel.x = 0;
    playerVel.z = 0;

    lArmMesh.rotation.x = 0;
    rArmMesh.rotation.x = 0;
    lLegMesh.rotation.x = 0;
    rLegMesh.rotation.x = 0;
  }

  // Gravity
  playerVel.y -= 0.014;

  // Update Position
  playerPos.x += playerVel.x;
  playerPos.y += playerVel.y;
  playerPos.z += playerVel.z;

  // Death / Respawn Threshold
  if (playerPos.y < -15) {
    resetPlayerPosition();
    showToast('💥 Ah! Sei caduto! Riprova!');
    playSynthSound(150, 'sawtooth', 0.25);
  }

  playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
}

function checkCollisions() {
  const playerRadius = 0.5;
  const playerHeight = 2.8;

  // Check Platforms & Build Blocks
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

  // Check Lava Collision
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

  // Check Victory Trophy
  if (finishTrophy && state.mode === 'obby') {
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
        state.coins += 10;
        localStorage.setItem('roblox_coins', state.coins.toString());
        document.getElementById('coinCount').textContent = state.coins;
        playSynthSound(880, 'sine', 0.1);
      }
    }
  });
}

function updateCameraPosition() {
  if (state.mode === 'avatar') {
    // Studio Fixed Camera
    camera.position.set(0, 1.4, 4.2);
    camera.lookAt(0, 1.4, 0);
    return;
  }

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
// VICTORY & TIMER LOGIC
// ==========================================================================

function triggerVictory() {
  playSynthSound(523, 'triangle', 0.2);
  setTimeout(() => playSynthSound(659, 'triangle', 0.2), 150);
  setTimeout(() => playSynthSound(783, 'triangle', 0.4), 300);

  document.getElementById('vicCoins').textContent = state.coins;
  document.getElementById('vicTime').textContent = document.getElementById('gameTimer').textContent;
  document.getElementById('victoryModal').classList.remove('hidden');
}

function nextLevelOrRestart() {
  document.getElementById('victoryModal').classList.add('hidden');
  state.level++;
  loadObbyLevel(state.level);
}

function resetCurrentMode() {
  if (state.mode === 'obby') loadObbyLevel(state.level);
  if (state.mode === 'build') clearCustomWorld();
}

function startTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerSeconds = 0;

  state.timerInterval = setInterval(() => {
    state.timerSeconds++;
    const m = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0');
    const s = String(state.timerSeconds % 60).padStart(2, '0');
    document.getElementById('gameTimer').textContent = `${m}:${s}`;
  }, 1000);
}

// ==========================================================================
// AVATAR CUSTOMIZATION UPDATES
// ==========================================================================

function updateAvatarColors() {
  state.avatar.shirt = document.getElementById('shirtColorPicker').value;
  state.avatar.pants = document.getElementById('pantsColorPicker').value;
  state.avatar.skin = document.getElementById('skinColorPicker').value;

  localStorage.setItem('roblox_shirt', state.avatar.shirt);
  localStorage.setItem('roblox_pants', state.avatar.pants);
  localStorage.setItem('roblox_skin', state.avatar.skin);

  torsoMesh.material.color.set(state.avatar.shirt);
  lArmMesh.material.color.set(state.avatar.shirt);
  rArmMesh.material.color.set(state.avatar.shirt);

  lLegMesh.material.color.set(state.avatar.pants);
  rLegMesh.material.color.set(state.avatar.pants);

  drawFaceTexture(state.avatar.face);
}

function updateAvatarHat() {
  state.avatar.hat = document.getElementById('hatSelect').value;
  localStorage.setItem('roblox_hat', state.avatar.hat);
  renderAvatarHat(state.avatar.hat);
}

function updateAvatarFace() {
  state.avatar.face = document.getElementById('faceSelect').value;
  localStorage.setItem('roblox_face', state.avatar.face);
  drawFaceTexture(state.avatar.face);
}

// ==========================================================================
// AUDIO SYNTHESIZER & TOAST UTILS
// ==========================================================================

function initAudioCtx() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  } catch (e) {}
}

function toggleAudio() {
  state.audioEnabled = !state.audioEnabled;
  document.getElementById('btnAudioToggle').textContent = state.audioEnabled ? '🔊' : '🔇';
}

function playSynthSound(freq, type = 'sine', duration = 0.15) {
  if (!state.audioEnabled || !audioCtx) return;
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
  setTimeout(() => el.classList.add('hidden'), 2500);
}
