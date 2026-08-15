/* ==========================================================================
   ROBLOX BUILDER 3D - DEDICATED VOXEL BUILDER GAME ENGINE
   ========================================================================== */

// --- GAME STATE ---
const state = {
  selectedBlock: 'grass',
  isFlyMode: true,
  audioEnabled: true,
  blocksCount: 0
};

// --- THREE.JS GLOBALS ---
let scene, camera, renderer;
let ghostMesh;
let buildBlocks = [];
let terrainMesh;
let raycaster, mousePointer;

// Camera & Movement Controls
const keys = {};
let cameraPos = { x: 0, y: 8, z: 16 };
let cameraRotY = 0;
let cameraRotX = -0.3;
let flySpeed = 0.35;

// Audio Context
let audioCtx = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  initGhostCursor();
  initAudioCtx();
  setupEventListeners();
  buildInitialGround();
  loadSavedWorld();

  // Animation Loop
  animate();
});

function initThreeJS() {
  const container = document.getElementById('game-container');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1329');
  scene.fog = new THREE.FogExp2('#0b1329', 0.008);

  // Camera
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Raycaster & Mouse
  raycaster = new THREE.Raycaster();
  mousePointer = new THREE.Vector2(0, 0); // Center of screen for crosshair

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfffae6, 0.9);
  sunLight.position.set(40, 60, 40);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);

  const neonLight = new THREE.PointLight(0x00f0ff, 0.6, 50);
  neonLight.position.set(0, 20, 0);
  scene.add(neonLight);

  // Background Sky Clouds
  createDecorativeClouds();
}

function createDecorativeClouds() {
  const cloudGeo = new THREE.DodecahedronGeometry(5, 1);
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.85 });

  for (let i = 0; i < 25; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    cloud.position.set(
      (Math.random() - 0.5) * 250,
      30 + Math.random() * 25,
      (Math.random() - 0.5) * 250
    );
    cloud.scale.set(1.5 + Math.random() * 2, 0.5 + Math.random() * 0.5, 1.5 + Math.random() * 2);
    scene.add(cloud);
  }
}

// 3D GHOST PLACEMENT CURSOR
function initGhostCursor() {
  const geo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.8
  });
  ghostMesh = new THREE.Mesh(geo, mat);
  scene.add(ghostMesh);
}

// INITIAL BASE TERRAIN
function buildInitialGround() {
  const size = 30;
  const gridGeo = new THREE.BoxGeometry(size, 1, size);
  const gridMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
  terrainMesh = new THREE.Mesh(gridGeo, gridMat);
  terrainMesh.position.set(0, -0.5, 0);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);
}

// ==========================================================================
// BLOCK MATERIALS & PLACEMENT ENGINE
// ==========================================================================

function getBlockMaterial(type) {
  switch (type) {
    case 'grass': return new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.6 });
    case 'brick': return new THREE.MeshStandardMaterial({ color: '#c62828', roughness: 0.5 });
    case 'wood': return new THREE.MeshStandardMaterial({ color: '#4e342e', roughness: 0.7 });
    case 'stone': return new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.6 });
    case 'gold': return new THREE.MeshStandardMaterial({ color: '#ffea00', metalness: 0.8, roughness: 0.2 });
    case 'neon_cyan': return new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.6 });
    case 'neon_pink': return new THREE.MeshStandardMaterial({ color: '#ff007f', emissive: '#ff007f', emissiveIntensity: 0.6 });
    case 'water': return new THREE.MeshStandardMaterial({ color: '#0284c7', transparent: true, opacity: 0.7 });
    case 'glass': return new THREE.MeshStandardMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.4 });
    case 'lava': return new THREE.MeshStandardMaterial({ color: '#ff3366', emissive: '#ff3366', emissiveIntensity: 0.9 });
    default: return new THREE.MeshStandardMaterial({ color: '#ffffff' });
  }
}

function setSelectBlock(type) {
  state.selectedBlock = type;
  document.querySelectorAll('.block-slot').forEach(el => el.classList.remove('active'));
  document.querySelector(`.block-slot[data-type="${type}"]`)?.classList.add('active');
  playSynthSound(500, 'sine', 0.1);
}

function placeBlockAtTarget() {
  raycaster.setFromCamera(mousePointer, camera);
  const targets = [terrainMesh].concat(buildBlocks.map(b => b.mesh));
  const intersects = raycaster.intersectObjects(targets);

  if (intersects.length > 0) {
    const hit = intersects[0];
    const normal = hit.face.normal;

    const x = Math.round(hit.point.x + normal.x * 0.5);
    const y = Math.round(hit.point.y + normal.y * 0.5);
    const z = Math.round(hit.point.z + normal.z * 0.5);

    addBlockToScene(x, y, z, state.selectedBlock);
    playSynthSound(440, 'triangle', 0.12);
  }
}

function breakBlockAtTarget() {
  raycaster.setFromCamera(mousePointer, camera);
  const intersects = raycaster.intersectObjects(buildBlocks.map(b => b.mesh));

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    scene.remove(hitMesh);
    buildBlocks = buildBlocks.filter(b => b.mesh !== hitMesh);
    playSynthSound(220, 'sawtooth', 0.15);
  }
}

function addBlockToScene(x, y, z, type) {
  // Check if block already exists at position
  if (buildBlocks.some(b => b.x === x && b.y === y && b.z === z)) return;

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = getBlockMaterial(type);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  buildBlocks.push({ mesh, type, x, y, z });
}

// ==========================================================================
// PRE-BUILT BLUEPRINTS & TEMPLATES
// ==========================================================================

function buildTemplate(name) {
  if (name === 'house') {
    // 5x5 House with Roof
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        for (let y = 0; y <= 3; y++) {
          const isWall = (x === -2 || x === 2 || z === -2 || z === 2);
          const isDoor = (x === 0 && z === 2 && y <= 1);
          if (isWall && !isDoor) {
            addBlockToScene(x + 4, y, z, 'brick');
          }
        }
      }
    }
    // Roof
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        addBlockToScene(x + 4, 4, z, 'wood');
      }
    }
    showToast('🏠 Casetta creata!');
  } else if (name === 'castle') {
    // Castle Towers
    const corners = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
    corners.forEach(([cx, cz]) => {
      for (let y = 0; y <= 6; y++) {
        addBlockToScene(cx, y, cz, 'stone');
      }
    });
    // Walls
    for (let i = -4; i <= 4; i++) {
      for (let y = 0; y <= 4; y++) {
        if (i !== 0 || y > 2) {
          addBlockToScene(i, y, -5, 'stone');
          addBlockToScene(i, y, 5, 'stone');
          addBlockToScene(-5, y, i, 'stone');
          addBlockToScene(5, y, i, 'stone');
        }
      }
    }
    showToast('🏰 Castello creata!');
  } else if (name === 'tower') {
    // Glowing Neon Tower
    for (let y = 0; y <= 12; y++) {
      const type = y % 2 === 0 ? 'neon_cyan' : 'neon_pink';
      addBlockToScene(-6, y, 0, type);
    }
    showToast('🗼 Torre Neon creata!');
  } else if (name === 'tree') {
    // 3D Tree
    for (let y = 0; y <= 4; y++) addBlockToScene(-8, y, -4, 'wood');
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        for (let y = 5; y <= 7; y++) {
          addBlockToScene(-8 + x, y, -4 + z, 'grass');
        }
      }
    }
    showToast('🌳 Albero 3D creato!');
  }

  if (window.confetti) {
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
  }

  playSynthSound(659, 'triangle', 0.2);
}

function saveWorld() {
  const data = buildBlocks.map(b => ({ x: b.x, y: b.y, z: b.z, type: b.type }));
  localStorage.setItem('roblox_builder_world', JSON.stringify(data));
  showToast('💾 Mondo 3D salvato!');
  playSynthSound(880, 'sine', 0.15);
}

function loadSavedWorld() {
  const raw = localStorage.getItem('roblox_builder_world');
  if (!raw) return;
  try {
    const list = JSON.parse(raw);
    list.forEach(b => addBlockToScene(b.x, b.y, b.z, b.type));
  } catch(e) {}
}

function clearWorld() {
  buildBlocks.forEach(b => scene.remove(b.mesh));
  buildBlocks = [];
  localStorage.removeItem('roblox_builder_world');
  showToast('🗑️ Mondo svuotato!');
}

// ==========================================================================
// CONTROLS & PHYSICS
// ==========================================================================

function setupEventListeners() {
  // Keyboard
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyF') toggleFly();
    if (e.code === 'KeyQ') breakBlockAtTarget();
    if (e.code === 'Digit1') setSelectBlock('grass');
    if (e.code === 'Digit2') setSelectBlock('brick');
    if (e.code === 'Digit3') setSelectBlock('wood');
    if (e.code === 'Digit4') setSelectBlock('stone');
    if (e.code === 'Digit5') setSelectBlock('gold');
  });

  window.addEventListener('keyup', e => keys[e.code] = false);

  // Window Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Mouse Interaction
  let isMouseDown = false;
  let prevMouseX = 0, prevMouseY = 0;

  window.addEventListener('mousedown', e => {
    if (e.target.tagName === 'CANVAS') {
      if (e.button === 0) { // Left Click
        placeBlockAtTarget();
        isMouseDown = true;
      } else if (e.button === 2) { // Right Click
        breakBlockAtTarget();
      }
    }
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('contextmenu', e => e.preventDefault()); // Prevent right click context menu

  window.addEventListener('mouseup', () => isMouseDown = false);

  window.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;

    cameraRotY -= deltaX * 0.005;
    cameraRotX = Math.max(-1.4, Math.min(1.4, cameraRotX - deltaY * 0.005));
  });

  // Touch Joystick
  setupTouchJoystick();
}

function toggleFly() {
  state.isFlyMode = !state.isFlyMode;
  document.getElementById('flyStatusBadge').textContent = state.isFlyMode ? '🕊️ VOLO ATTIVO (Premi F)' : '🚶 CAMMINATA (Premi F)';
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
        const dist = Math.min(40, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);

        knob.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
        touchVector.x = (Math.cos(angle) * dist) / 40;
        touchVector.y = (Math.sin(angle) * dist) / 40;
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

  document.getElementById('btnTouchPlace')?.addEventListener('touchstart', e => {
    e.preventDefault();
    placeBlockAtTarget();
  });

  document.getElementById('btnTouchBreak')?.addEventListener('touchstart', e => {
    e.preventDefault();
    breakBlockAtTarget();
  });
}

// ==========================================================================
// ANIMATION LOOP & GHOST UPDATE
// ==========================================================================

function animate() {
  requestAnimationFrame(animate);

  updateCameraMovement();
  updateGhostCursor();

  renderer.render(scene, camera);
}

function updateCameraMovement() {
  let moveX = 0, moveZ = 0, moveY = 0;

  if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

  if (keys['Space']) moveY += 1;
  if (keys['ShiftLeft'] || keys['KeyC']) moveY -= 1;

  if (Math.abs(touchVector.x) > 0.1 || Math.abs(touchVector.y) > 0.1) {
    moveX = touchVector.x;
    moveZ = touchVector.y;
  }

  if (moveX !== 0 || moveZ !== 0 || moveY !== 0) {
    const forwardX = Math.sin(cameraRotY);
    const forwardZ = Math.cos(cameraRotY);
    const rightX = Math.cos(cameraRotY);
    const rightZ = -Math.sin(cameraRotY);

    cameraPos.x += (forwardX * moveZ + rightX * moveX) * flySpeed;
    cameraPos.z += (forwardZ * moveZ + rightZ * moveX) * flySpeed;
    cameraPos.y += moveY * flySpeed;
  }

  camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = cameraRotY;
  camera.rotation.x = cameraRotX;
}

function updateGhostCursor() {
  if (!ghostMesh) return;

  raycaster.setFromCamera(mousePointer, camera);
  const targets = [terrainMesh].concat(buildBlocks.map(b => b.mesh));
  const intersects = raycaster.intersectObjects(targets);

  if (intersects.length > 0) {
    const hit = intersects[0];
    const normal = hit.face.normal;

    const gx = Math.round(hit.point.x + normal.x * 0.5);
    const gy = Math.round(hit.point.y + normal.y * 0.5);
    const gz = Math.round(hit.point.z + normal.z * 0.5);

    ghostMesh.position.set(gx, gy, gz);
    ghostMesh.visible = true;
  } else {
    ghostMesh.visible = false;
  }
}

// ==========================================================================
// AUDIO SYNTH & UTILS
// ==========================================================================

function initAudioCtx() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  } catch (e) {}
}

function toggleAudio() {
  state.audioEnabled = !state.audioEnabled;
  document.getElementById('btnAudio').textContent = state.audioEnabled ? '🔊' : '🔇';
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
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}
