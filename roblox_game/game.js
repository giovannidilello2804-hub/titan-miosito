/* ==========================================================================
   ROBLOX BEDWARS SURVIVAL 3D - GAME ENGINE
   ========================================================================== */

// --- GAME STATE ---
const state = {
  health: 100,
  maxHealth: 100,
  score: 250,
  wave: 1,
  selectedSlot: 'sword', // 'sword', 'stone', 'wood', 'lava'
  audioEnabled: true,
  isGameOver: false
};

// THREE.JS GLOBALS
let scene, camera, renderer;
let playerGroup, swordMesh, playerTorso;
let groundMesh;
let enemies = [];
let botPlayers = [];
let placedBlocks = [];

// Controls & Physics
const keys = {};
let playerPos = { x: 0, y: 0.8, z: 0 };
let playerVel = { x: 0, y: 0, z: 0 };
let isGrounded = true;
let cameraRotY = 0;
let cameraRotX = 0.35;
let isAttacking = false;
let attackAnimTimer = 0;

// Web Audio API
let audioCtx = null;

// ==========================================================================
// INITIALIZATION
// ==========================================================================

window.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  initPlayerCharacter();
  initBotTeammates();
  initAudioCtx();
  setupEventListeners();
  startWave(state.wave);

  // Animation Loop
  animate();
});

function initThreeJS() {
  const container = document.getElementById('game-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a1026');
  scene.fog = new THREE.FogExp2('#0a1026', 0.01);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0x00f0ff, 0.9);
  sun.position.set(30, 50, 30);
  sun.castShadow = true;
  scene.add(sun);

  // Ground Arena
  const groundGeo = new THREE.BoxGeometry(60, 1, 60);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -0.5;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Base Bed / Core Structure
  createBaseBed();
}

function createBaseBed() {
  const bedGroup = new THREE.Group();
  const bedGeo = new THREE.BoxGeometry(3, 0.6, 2);
  const bedMat = new THREE.MeshStandardMaterial({ color: 0xff007f, emissive: 0xff007f, emissiveIntensity: 0.4 });
  const bed = new THREE.Mesh(bedGeo, bedMat);
  bed.position.set(0, 0.3, 0);
  bedGroup.add(bed);
  scene.add(bedGroup);
}

// ==========================================================================
// 3D PLAYER CHARACTER & GLOWING SWORD
// ==========================================================================

function initPlayerCharacter() {
  playerGroup = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: '#ffe082', roughness: 0.3 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: '#00f0ff', roughness: 0.4 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: '#1a237e', roughness: 0.5 });

  // Torso
  const torsoGeo = new THREE.BoxGeometry(1.2, 1.4, 0.6);
  playerTorso = new THREE.Mesh(torsoGeo, shirtMat);
  playerTorso.position.y = 1.4;
  playerTorso.castShadow = true;
  playerGroup.add(playerTorso);

  // Head
  const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 2.45;
  head.castShadow = true;
  playerGroup.add(head);

  // Crown Hat
  const crownGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.35, 6);
  const crownMat = new THREE.MeshStandardMaterial({ color: '#ffea00', metalness: 0.8 });
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.position.y = 0.55;
  head.add(crown);

  // Arms & Legs
  const armGeo = new THREE.BoxGeometry(0.45, 1.3, 0.45);
  const lArm = new THREE.Mesh(armGeo, shirtMat);
  lArm.position.set(-0.9, 1.35, 0);
  playerGroup.add(lArm);

  const rArm = new THREE.Mesh(armGeo, shirtMat);
  rArm.position.set(0.9, 1.35, 0);
  playerGroup.add(rArm);

  // 3D Glowing Sword attached to Right Arm
  const swordBladeGeo = new THREE.BoxGeometry(0.12, 1.6, 0.25);
  const swordMat = new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 0.8 });
  swordMesh = new THREE.Mesh(swordBladeGeo, swordMat);
  swordMesh.position.set(0.2, -0.4, 0.6);
  swordMesh.rotation.x = Math.PI / 3;
  rArm.add(swordMesh);

  // Legs
  const legGeo = new THREE.BoxGeometry(0.5, 1.3, 0.5);
  const lLeg = new THREE.Mesh(legGeo, pantsMat);
  lLeg.position.set(-0.32, 0.65, 0);
  playerGroup.add(lLeg);

  const rLeg = new THREE.Mesh(legGeo, pantsMat);
  rLeg.position.set(0.32, 0.65, 0);
  playerGroup.add(rLeg);

  playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
  scene.add(playerGroup);
}

// MULTIPLAYER AI BOT TEAMMATES
function initBotTeammates() {
  const botNames = ['Noob_Gamer99', 'CyberNinja_9', 'VoxelMaster'];
  const botColors = ['#ffea00', '#ff007f', '#00ff88'];

  for (let i = 0; i < 3; i++) {
    const botGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: botColors[i] });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), mat);
    torso.position.y = 1.4;
    botGroup.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: '#ffe082' }));
    head.position.y = 2.45;
    botGroup.add(head);

    const botX = (i - 1) * 4;
    const botZ = -3;
    botGroup.position.set(botX, 0, botZ);
    scene.add(botGroup);

    botPlayers.push({ mesh: botGroup, name: botNames[i], target: null });
  }
}

// ==========================================================================
// WAVE SPAWNER & 3D ENEMY ZOMBIES
// ==========================================================================

function startWave(waveNum) {
  state.wave = waveNum;
  document.getElementById('waveNum').textContent = waveNum;

  // Clear remaining enemies
  enemies.forEach(e => scene.remove(e.mesh));
  enemies = [];

  const count = 4 + waveNum * 3;
  document.getElementById('enemyCount').textContent = count;

  for (let i = 0; i < count; i++) {
    setTimeout(() => spawnEnemyZombie(), i * 1200);
  }

  showToast(`⚔️ ONDA ${waveNum}: I Nemici stanno arrivando!`);
  addChatMessage('SYSTEM', `Onda ${waveNum} iniziata! Difendete la base!`);
}

function spawnEnemyZombie() {
  if (state.isGameOver) return;

  const enemyGroup = new THREE.Group();
  const zombieMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.6 });
  const redEyeMat = new THREE.MeshBasicMaterial({ color: '#ff0000' });

  // Body
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.6), zombieMat);
  torso.position.y = 1.4;
  enemyGroup.add(torso);

  // Head & Eyes
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), zombieMat);
  head.position.y = 2.45;
  enemyGroup.add(head);

  const lEye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), redEyeMat);
  lEye.position.set(-0.25, 2.5, 0.45);
  const rEye = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), redEyeMat);
  rEye.position.set(0.25, 2.5, 0.45);
  enemyGroup.add(lEye);
  enemyGroup.add(rEye);

  // Arms extended forward
  const armGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
  const lArm = new THREE.Mesh(armGeo, zombieMat);
  lArm.position.set(-0.8, 1.6, 0.4);
  lArm.rotation.x = -Math.PI / 2;
  enemyGroup.add(lArm);

  const rArm = new THREE.Mesh(armGeo, zombieMat);
  rArm.position.set(0.8, 1.6, 0.4);
  rArm.rotation.x = -Math.PI / 2;
  enemyGroup.add(rArm);

  // Spawn position around perimeter
  const angle = Math.random() * Math.PI * 2;
  const radius = 22 + Math.random() * 6;
  const spawnX = Math.cos(angle) * radius;
  const spawnZ = Math.sin(angle) * radius;

  enemyGroup.position.set(spawnX, 0, spawnZ);
  scene.add(enemyGroup);

  enemies.push({
    mesh: enemyGroup,
    hp: 40 + state.wave * 10,
    maxHp: 40 + state.wave * 10,
    speed: 0.04 + Math.random() * 0.02
  });
}

// ==========================================================================
// ACTIONS: SWORD SLASH & BLOCK BUILDING
// ==========================================================================

function performMainAction() {
  if (state.isGameOver) return;

  if (state.selectedSlot === 'sword') {
    // Sword Attack Slash
    isAttacking = true;
    attackAnimTimer = 0;
    playSynthSound(700, 'sawtooth', 0.12);

    // Hit detection against enemies in front of player
    let hitCount = 0;
    enemies.forEach((enemy, idx) => {
      const dist = Math.hypot(playerPos.x - enemy.mesh.position.x, playerPos.z - enemy.mesh.position.z);
      if (dist < 3.2) {
        enemy.hp -= 35;
        hitCount++;
        playSynthSound(300, 'square', 0.15);

        // Knockback
        enemy.mesh.position.x += Math.sin(cameraRotY) * 0.8;
        enemy.mesh.position.z += Math.cos(cameraRotY) * 0.8;

        if (enemy.hp <= 0) {
          scene.remove(enemy.mesh);
          enemies.splice(idx, 1);
          state.score += 50;
          updateHUD();
          playSynthSound(880, 'sine', 0.2);

          document.getElementById('enemyCount').textContent = enemies.length;

          if (enemies.length === 0) {
            triggerWaveVictory();
          }
        }
      }
    });

    if (hitCount > 0) {
      showToast(`💥 Colpiti ${hitCount} Nemici!`);
    }
  } else {
    // Place Defensive Block
    const blockType = state.selectedSlot;
    const placeX = Math.round(playerPos.x + Math.sin(cameraRotY) * 2.2);
    const placeZ = Math.round(playerPos.z + Math.cos(cameraRotY) * 2.2);

    addDefenseBlock(placeX, 0.5, placeZ, blockType);
    playSynthSound(450, 'triangle', 0.1);
  }
}

function addDefenseBlock(x, y, z, type) {
  const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
  let mat = new THREE.MeshStandardMaterial({ color: '#64748b' });

  if (type === 'wood') mat = new THREE.MeshStandardMaterial({ color: '#5d4037' });
  if (type === 'lava') mat = new THREE.MeshStandardMaterial({ color: '#ff3366', emissive: '#ff3366', emissiveIntensity: 0.8 });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  placedBlocks.push({ mesh, type, bounds: new THREE.Box3().setFromObject(mesh) });
}

function selectSlot(slotName) {
  state.selectedSlot = slotName;
  document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('active'));
  document.querySelector(`.hotbar-slot[data-slot="${slotName}"]`)?.classList.add('active');

  const btn = document.getElementById('btnMainAction');
  if (slotName === 'sword') {
    btn.textContent = '⚔️ ATTACCA CON LA SPADA';
  } else {
    btn.textContent = `🧱 PIAZZA ${slotName.toUpperCase()}`;
  }
}

// ==========================================================================
// GAMEPLAY LOOP & AI LOGIC
// ==========================================================================

let animFrame = 0;

function animate() {
  requestAnimationFrame(animate);
  animFrame++;

  if (!state.isGameOver) {
    updatePlayerPhysics();
    updateEnemyAI();
    updateBotAI();
    updateSwordAnimation();
  }

  updateCamera();
  renderer.render(scene, camera);
}

function updatePlayerPhysics() {
  let moveX = 0, moveZ = 0;

  if (keys['KeyW'] || keys['ArrowUp']) moveZ += 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveZ -= 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

  if (Math.abs(touchVector.x) > 0.1 || Math.abs(touchVector.y) > 0.1) {
    moveX = touchVector.x;
    moveZ = touchVector.y;
  }

  const speed = 0.15;

  if (moveX !== 0 || moveZ !== 0) {
    const angle = cameraRotY;
    const forwardX = Math.sin(angle);
    const forwardZ = Math.cos(angle);
    const rightX = Math.cos(angle);
    const rightZ = -Math.sin(angle);

    const dirX = forwardX * moveZ + rightX * moveX;
    const dirZ = forwardZ * moveZ + rightZ * moveX;

    playerVel.x = dirX * speed;
    playerVel.z = dirZ * speed;

    playerGroup.rotation.y = Math.atan2(dirX, dirZ);
  } else {
    playerVel.x = 0;
    playerVel.z = 0;
  }

  playerPos.x += playerVel.x;
  playerPos.z += playerVel.z;

  playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
}

function updateEnemyAI() {
  enemies.forEach(enemy => {
    // Pathfinding towards Player
    const dx = playerPos.x - enemy.mesh.position.x;
    const dz = playerPos.z - enemy.mesh.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.8) {
      enemy.mesh.position.x += (dx / dist) * enemy.speed;
      enemy.mesh.position.z += (dz / dist) * enemy.speed;
      enemy.mesh.rotation.y = Math.atan2(dx, dz);
    } else {
      // Attack Player
      if (animFrame % 60 === 0) {
        takeDamage(12);
      }
    }
  });
}

function updateBotAI() {
  botPlayers.forEach((bot, idx) => {
    if (enemies.length > 0) {
      const targetEnemy = enemies[idx % enemies.length];
      if (targetEnemy) {
        const dx = targetEnemy.mesh.position.x - bot.mesh.position.x;
        const dz = targetEnemy.mesh.position.z - bot.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 1.2) {
          bot.mesh.position.x += (dx / dist) * 0.05;
          bot.mesh.position.z += (dz / dist) * 0.05;
          bot.mesh.rotation.y = Math.atan2(dx, dz);
        }
      }
    }
  });

  // Random Chat Simulation
  if (animFrame % 350 === 0) {
    const msgs = [
      'Attacchiamo i nemici insieme! ⚔️',
      'Sto piazzando i muri di protezione!',
      'Grande colpo! L\'onda sta finendo!',
      'Vieni verso la base centrale!'
    ];
    const randomBot = botPlayers[Math.floor(Math.random() * botPlayers.length)];
    const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
    addChatMessage(randomBot.name, randomMsg);
  }
}

function updateSwordAnimation() {
  if (isAttacking) {
    attackAnimTimer += 0.2;
    swordMesh.rotation.z = Math.sin(attackAnimTimer) * 1.4;
    if (attackAnimTimer >= Math.PI) {
      isAttacking = false;
      swordMesh.rotation.z = 0;
    }
  }
}

function updateCamera() {
  const camDist = 6.5;
  const targetX = playerPos.x - Math.sin(cameraRotY) * camDist * Math.cos(cameraRotX);
  const targetY = playerPos.y + 2.2 + Math.sin(cameraRotX) * camDist;
  const targetZ = playerPos.z - Math.cos(cameraRotY) * camDist * Math.cos(cameraRotX);

  camera.position.set(targetX, targetY, targetZ);
  camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);
}

// ==========================================================================
// DAMAGE, HUD & CHAT
// ==========================================================================

function takeDamage(amount) {
  state.health = Math.max(0, state.health - amount);
  updateHUD();
  playSynthSound(150, 'sawtooth', 0.2);

  if (state.health <= 0) {
    triggerGameOver();
  }
}

function updateHUD() {
  document.getElementById('healthFill').style.width = `${state.health}%`;
  document.getElementById('healthLabel').textContent = `${state.health} / ${state.maxHealth}`;
  document.getElementById('scoreText').textContent = `${state.score} Monete`;
}

function addChatMessage(user, text) {
  const box = document.getElementById('chatMessages');
  if (!box) return;

  const line = document.createElement('div');
  line.className = 'chat-line';
  line.innerHTML = `<span class="user-tag ${user === 'SYSTEM' ? 'pro' : 'noob'}">${user}:</span> ${text}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function triggerWaveVictory() {
  if (window.confetti) {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
  }

  document.getElementById('modalTitle').textContent = `ONDA ${state.wave} VINTA! 🎉`;
  document.getElementById('modalSub').textContent = 'Hai eliminato tutti i nemici con la tua squadra!';
  document.getElementById('endModal').classList.remove('hidden');
}

function triggerGameOver() {
  state.isGameOver = true;
  document.getElementById('modalIcon').textContent = '💀';
  document.getElementById('modalTitle').textContent = 'SEI CADUTO IN BATTAGLIA!';
  document.getElementById('modalSub').textContent = 'I nemici hanno superato le tue difese.';
  document.getElementById('endModal').classList.remove('hidden');
}

function restartOrNextWave() {
  document.getElementById('endModal').classList.add('hidden');

  if (state.health <= 0) {
    state.health = 100;
    state.wave = 1;
    state.isGameOver = false;
    playerPos = { x: 0, y: 0.8, z: 0 };
    updateHUD();
  } else {
    state.wave++;
  }

  startWave(state.wave);
}

// ==========================================================================
// EVENT LISTENERS & TOUCH CONTROLS
// ==========================================================================

function setupEventListeners() {
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') doJump();
    if (e.code === 'Digit1') selectSlot('sword');
    if (e.code === 'Digit2') selectSlot('stone');
    if (e.code === 'Digit3') selectSlot('wood');
    if (e.code === 'Digit4') selectSlot('lava');
  });

  window.addEventListener('keyup', e => keys[e.code] = false);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let isMouseDown = false;
  let prevX = 0, prevY = 0;

  window.addEventListener('mousedown', e => {
    if (e.target.tagName === 'CANVAS') {
      performMainAction();
      isMouseDown = true;
    }
    prevX = e.clientX; prevY = e.clientY;
  });

  window.addEventListener('mouseup', () => isMouseDown = false);

  window.addEventListener('mousemove', e => {
    if (!isMouseDown) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX; prevY = e.clientY;

    cameraRotY -= dx * 0.005;
    cameraRotX = Math.max(0.1, Math.min(1.2, cameraRotX + dy * 0.005));
  });

  setupTouchControls();
}

function doJump() {
  if (isGrounded) {
    playerVel.y = 0.28;
    isGrounded = false;
  }
}

let touchVector = { x: 0, y: 0 };

function setupTouchControls() {
  const container = document.getElementById('joystickZone');
  const knob = document.getElementById('joystickKnob');
  if (!container || !knob) return;

  let touchId = null, startX = 0, startY = 0;

  container.addEventListener('touchstart', e => {
    const t = e.changedTouches[0];
    touchId = t.identifier;
    const rect = container.getBoundingClientRect();
    startX = rect.left + rect.width / 2;
    startY = rect.top + rect.height / 2;
  });

  window.addEventListener('touchmove', e => {
    if (touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchId) {
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
    touchId = null;
    knob.style.transform = 'translate(0px, 0px)';
    touchVector = { x: 0, y: 0 };
  };

  window.addEventListener('touchend', endTouch);
  window.addEventListener('touchcancel', endTouch);
}

// ==========================================================================
// AUDIO SYNTH
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
