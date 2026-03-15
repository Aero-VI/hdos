// main.js — HDOS Engine: Three.js setup, camera, lighting, post-processing, game loop
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { Sky } from 'three/addons/objects/Sky.js';

import { TEX, makeMat, colorMat, setLoadProgress } from './textures.js';
import {
  createTerrain, createCastle, createRiver, createBridge,
  createGeneralStore, createChurch, createHouse, createMaidCafe,
  populateWorld, createFishingSpots
} from './world.js';
import { createNPCs, createEnemies, updateNPCs } from './npcs.js';
import { Player } from './player.js';
import { GameUI } from './ui.js';

// ============================================================
//  INIT
// ============================================================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

// ============================================================
//  FOG — warm atmospheric haze
// ============================================================
scene.fog = new THREE.FogExp2(0xC8B898, 0.004);

// ============================================================
//  CAMERA — RS-style isometric angle
// ============================================================
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.5, 500);
// Camera orbit state
const cameraState = {
  distance: 35,
  angle: 0,         // horizontal orbit angle
  pitch: 55,        // degrees from horizontal (RS-style high angle)
  targetPos: new THREE.Vector3(0, 0, 15), // follows player
  minPitch: 20,
  maxPitch: 80,
  minDist: 15,
  maxDist: 60,
};

function updateCamera() {
  const pitchRad = THREE.MathUtils.degToRad(cameraState.pitch);
  const angleRad = cameraState.angle;
  const d = cameraState.distance;

  camera.position.set(
    cameraState.targetPos.x + Math.sin(angleRad) * Math.cos(pitchRad) * d,
    cameraState.targetPos.y + Math.sin(pitchRad) * d,
    cameraState.targetPos.z + Math.cos(angleRad) * Math.cos(pitchRad) * d
  );
  camera.lookAt(cameraState.targetPos);
}

// ============================================================
//  LIGHTING — warm golden afternoon sun
// ============================================================

// Hemisphere light (sky/ground)
const hemiLight = new THREE.HemisphereLight(0xC8AA78, 0x445522, 0.6);
scene.add(hemiLight);

// Directional (sun) — warm golden
const sunLight = new THREE.DirectionalLight(0xFFDDBB, 1.8);
sunLight.position.set(40, 60, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -60;
sunLight.shadow.camera.right = 60;
sunLight.shadow.camera.top = 60;
sunLight.shadow.camera.bottom = -60;
sunLight.shadow.bias = -0.001;
sunLight.shadow.normalBias = 0.02;
scene.add(sunLight);
scene.add(sunLight.target);

// Subtle fill light from opposite side
const fillLight = new THREE.DirectionalLight(0x8899BB, 0.3);
fillLight.position.set(-30, 20, -40);
scene.add(fillLight);

// ============================================================
//  SKY — procedural with sun
// ============================================================
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 4;
skyUniforms['rayleigh'].value = 1.5;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const sunPosition = new THREE.Vector3();
const phi = THREE.MathUtils.degToRad(90 - 35); // 35° elevation
const theta = THREE.MathUtils.degToRad(220);    // afternoon angle
sunPosition.setFromSphericalCoords(1, phi, theta);
skyUniforms['sunPosition'].value.copy(sunPosition);
sunLight.position.copy(sunPosition).multiplyScalar(60);

// ============================================================
//  POST-PROCESSING
// ============================================================
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.15,  // strength — subtle
  0.4,   // radius
  0.85   // threshold
);
composer.addPass(bloomPass);

const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
composer.addPass(smaaPass);

// ============================================================
//  LOADING
// ============================================================
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingStatus = document.getElementById('loading-status');

let loadStage = 0;
const loadStages = [
  'Creating terrain...',
  'Building Lumbridge Castle...',
  'Flowing the river...',
  'Constructing buildings...',
  'Planting trees...',
  'Spawning NPCs...',
  'Spawning enemies...',
  'Setting up fishing spots...',
  'Initializing player...',
  'Ready!',
];

function advanceLoading() {
  loadStage++;
  const pct = Math.min(100, (loadStage / loadStages.length) * 100);
  loadingBar.style.width = `${pct}%`;
  if (loadStage < loadStages.length) {
    loadingStatus.textContent = loadStages[loadStage];
  }
}

// ============================================================
//  WORLD CREATION
// ============================================================
loadingStatus.textContent = loadStages[0];

// We stagger creation with requestAnimationFrame for visual loading bar
let terrain, castle, river, bridge, genStore, church, houses, maidCafe, worldItems, fishSpots;
let npcs, enemies, player, ui;

function buildWorld() {
  return new Promise(resolve => {
    // Stage 1: Terrain
    terrain = createTerrain(scene);
    advanceLoading();

    setTimeout(() => {
      // Stage 2: Castle
      castle = createCastle(scene);
      advanceLoading();

      setTimeout(() => {
        // Stage 3: River
        river = createRiver(scene);
        advanceLoading();

        setTimeout(() => {
          // Stage 4: Buildings
          bridge = createBridge(scene);
          genStore = createGeneralStore(scene);
          church = createChurch(scene);
          houses = [
            createHouse(scene, -15, -10, { label: 'Bob\'s Axes', w: 6, d: 5, h: 4 }),
            createHouse(scene, 12, 20, { label: 'Farmer\'s House', w: 7, d: 5, h: 4 }),
            createHouse(scene, -8, -30, { label: 'Small House', w: 5, d: 4, h: 3.5 }),
          ];
          maidCafe = createMaidCafe(scene);
          advanceLoading();

          setTimeout(() => {
            // Stage 5: Trees & vegetation
            worldItems = populateWorld(scene);
            advanceLoading();

            setTimeout(() => {
              // Stage 6-8: NPCs, enemies, fishing
              npcs = createNPCs(scene);
              advanceLoading();
              enemies = createEnemies(scene);
              advanceLoading();
              fishSpots = createFishingSpots(scene);
              advanceLoading();

              setTimeout(() => {
                // Stage 9: Player
                player = new Player(scene);
                ui = new GameUI(player);
                advanceLoading();

                // Welcome messages
                ui.addMessage('', 'Welcome to Lumbridge.', 'game');
                ui.addMessage('', 'HDOS HD Client loaded successfully.', 'game');
                ui.addMessage('', 'Left-click to move. Right-click for options.', 'game');
                ui.addMessage('', 'Use WASD to rotate camera, scroll to zoom.', 'game');

                setTimeout(() => {
                  loadingScreen.classList.add('hidden');
                  resolve();
                }, 500);
              }, 50);
            }, 50);
          }, 50);
        }, 50);
      }, 50);
    }, 50);
  });
}

// ============================================================
//  INPUT HANDLING
// ============================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const keys = {};

document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  // Prevent WASD from typing in chat when not focused
  if (['w','a','s','d'].includes(e.key.toLowerCase()) && document.activeElement.id !== 'chat-input') {
    e.preventDefault();
  }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Mouse click — left click to move/interact
canvas.addEventListener('click', (e) => {
  if (!player || !ui) return;
  ui.hideContextMenu();

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Check interactable objects first
  const allInteractable = [];
  scene.traverse(obj => {
    if (obj.userData && obj.userData.interactable && obj.visible) {
      allInteractable.push(obj);
    }
  });

  // Get meshes for raycasting (need to go deeper into groups)
  const allMeshes = [];
  scene.traverse(obj => {
    if (obj.isMesh && obj.visible) allMeshes.push(obj);
  });

  const intersects = raycaster.intersectObjects(allMeshes, false);
  if (intersects.length === 0) return;

  const hit = intersects[0];
  const hitObj = findInteractableParent(hit.object);

  if (hitObj && hitObj.userData.type === 'enemy' && !hitObj.userData.isDead) {
    // Attack enemy
    player.setCombatTarget(hitObj);
    ui.addMessage('', `You attack the ${hitObj.userData.name}.`, 'game');
  } else if (hitObj && hitObj.userData.type === 'npc') {
    // Talk to NPC
    player.setMoveTarget(hitObj.position.clone());
    setTimeout(() => {
      if (hitObj.userData.dialog) {
        ui.showNPCDialog(hitObj.userData.name, hitObj.userData.dialog);
      }
    }, 500);
  } else if (hitObj && hitObj.userData.type === 'tree') {
    // Woodcutting
    if (player.hasItem('Bronze Axe')) {
      player.setSkillingTarget(hitObj, 'woodcutting');
      ui.addMessage('', `You swing your axe at the ${hitObj.userData.name}.`, 'game');
    } else {
      ui.addMessage('', 'You need an axe to chop trees.', 'game');
    }
  } else if (hitObj && hitObj.userData.type === 'rock') {
    // Mining
    if (player.hasItem('Bronze Pickaxe')) {
      player.setSkillingTarget(hitObj, 'mining');
      ui.addMessage('', 'You swing your pickaxe at the rock.', 'game');
    } else {
      ui.addMessage('', 'You need a pickaxe to mine rocks.', 'game');
    }
  } else if (hitObj && hitObj.userData.type === 'fishing_spot') {
    // Fishing
    if (player.hasItem('Net')) {
      player.setSkillingTarget(hitObj, 'fishing');
      ui.addMessage('', 'You cast your net into the water.', 'game');
    } else {
      ui.addMessage('', 'You need a net to fish here.', 'game');
    }
  } else {
    // Move to clicked point on terrain
    player.setMoveTarget(hit.point);
  }
});

// Right-click context menu
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (!player || !ui) return;

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const allMeshes = [];
  scene.traverse(obj => { if (obj.isMesh && obj.visible) allMeshes.push(obj); });
  const intersects = raycaster.intersectObjects(allMeshes, false);
  if (intersects.length === 0) return;

  const hitObj = findInteractableParent(intersects[0].object);
  if (!hitObj) {
    // Ground
    ui.showContextMenu(e.clientX, e.clientY, [
      { label: 'Walk here', action: () => player.setMoveTarget(intersects[0].point) },
      { label: 'Cancel', action: () => {} },
    ]);
    return;
  }

  const options = [
    { label: hitObj.userData.overhead || hitObj.userData.name, action: null, highlight: true },
  ];

  if (hitObj.userData.type === 'npc') {
    options.push({ label: 'Talk-to', action: () => {
      player.setMoveTarget(hitObj.position.clone());
      setTimeout(() => {
        if (hitObj.userData.dialog) ui.showNPCDialog(hitObj.userData.name, hitObj.userData.dialog);
      }, 500);
    }});
    options.push({ label: 'Examine', action: () => ui.addMessage('', `${hitObj.userData.name}: A local of Lumbridge.`, 'game') });
  } else if (hitObj.userData.type === 'enemy') {
    options.push({ label: 'Attack', action: () => {
      player.setCombatTarget(hitObj);
      ui.addMessage('', `You attack the ${hitObj.userData.name}.`, 'game');
    }});
    options.push({ label: 'Examine', action: () => ui.addMessage('', `${hitObj.userData.overhead || hitObj.userData.name}`, 'game') });
  } else if (hitObj.userData.type === 'tree') {
    options.push({ label: 'Chop down', action: () => {
      if (player.hasItem('Bronze Axe')) {
        player.setSkillingTarget(hitObj, 'woodcutting');
        ui.addMessage('', `You swing your axe at the ${hitObj.userData.name}.`, 'game');
      } else {
        ui.addMessage('', 'You need an axe to chop trees.', 'game');
      }
    }});
  } else if (hitObj.userData.type === 'rock') {
    options.push({ label: 'Mine', action: () => {
      if (player.hasItem('Bronze Pickaxe')) {
        player.setSkillingTarget(hitObj, 'mining');
        ui.addMessage('', 'You swing your pickaxe at the rock.', 'game');
      } else {
        ui.addMessage('', 'You need a pickaxe to mine rocks.', 'game');
      }
    }});
  } else if (hitObj.userData.type === 'fishing_spot') {
    options.push({ label: 'Net', action: () => {
      if (player.hasItem('Net')) {
        player.setSkillingTarget(hitObj, 'fishing');
        ui.addMessage('', 'You cast your net into the water.', 'game');
      } else {
        ui.addMessage('', 'You need a net to fish here.', 'game');
      }
    }});
  } else if (hitObj.userData.type === 'building') {
    options.push({ label: 'Enter', action: () => player.setMoveTarget(hitObj.position.clone()) });
    options.push({ label: 'Examine', action: () => ui.addMessage('', hitObj.userData.name, 'game') });
  }

  options.push({ label: 'Walk here', action: () => player.setMoveTarget(intersects[0].point) });
  options.push({ label: 'Cancel', action: () => {} });

  ui.showContextMenu(e.clientX, e.clientY, options);
});

// Click anywhere to close context menu
document.addEventListener('click', (e) => {
  if (e.target.closest('#context-menu')) return;
  if (ui) ui.hideContextMenu();
});

// Camera controls — WASD orbit, scroll zoom
canvas.addEventListener('wheel', (e) => {
  cameraState.distance += e.deltaY * 0.03;
  cameraState.distance = THREE.MathUtils.clamp(cameraState.distance, cameraState.minDist, cameraState.maxDist);
});

// Helper: find parent group with userData.interactable
function findInteractableParent(obj) {
  let current = obj;
  while (current) {
    if (current.userData && current.userData.interactable) return current;
    current = current.parent;
  }
  return null;
}

// ============================================================
//  OVERHEAD LABELS (HTML overlay for NPC names)
// ============================================================
const labelContainer = document.createElement('div');
labelContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
document.body.appendChild(labelContainer);

const labels = new Map();

function updateLabels() {
  if (!npcs || !enemies) return;

  [...npcs, ...enemies].forEach(npc => {
    if (npc.userData.isDead || !npc.visible) {
      if (labels.has(npc)) {
        labels.get(npc).style.display = 'none';
      }
      return;
    }

    if (!labels.has(npc)) {
      const label = document.createElement('div');
      label.style.cssText = 'position:absolute;color:#ff0;font-size:11px;font-weight:bold;text-shadow:1px 1px 2px #000;white-space:nowrap;text-align:center;transform:translate(-50%,-100%);pointer-events:none;';
      labelContainer.appendChild(label);
      labels.set(npc, label);
    }

    const label = labels.get(npc);
    const pos = new THREE.Vector3();
    pos.copy(npc.position);
    pos.y += (npc.userData.type === 'enemy' && npc.userData.enemyType === 'chicken') ? 2 : 4.2;
    pos.project(camera);

    if (pos.z > 1 || pos.z < -1) {
      label.style.display = 'none';
      return;
    }

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
    label.style.display = 'block';
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;

    // Show HP bar for enemies in combat
    let text = npc.userData.overhead || npc.userData.name;
    if (npc.userData.type === 'enemy' && npc.userData.hp < npc.userData.maxHp) {
      const pct = Math.max(0, npc.userData.hp / npc.userData.maxHp * 100);
      const barColor = pct > 50 ? '#0f0' : pct > 25 ? '#ff0' : '#f00';
      text += `<br><div style="width:40px;height:4px;background:#300;margin:2px auto;"><div style="width:${pct}%;height:100%;background:${barColor};"></div></div>`;
    }
    label.innerHTML = text;

    // Color based on type
    if (npc.userData.type === 'enemy') {
      label.style.color = '#ff0';
    } else {
      label.style.color = '#00ffff';
    }
  });
}

// ============================================================
//  HITSPLATS (floating damage numbers)
// ============================================================
const hitsplats = [];

function showHitsplat(target, damage) {
  const div = document.createElement('div');
  div.style.cssText = `position:absolute;pointer-events:none;font-weight:bold;font-size:14px;z-index:6;
    background:${damage > 0 ? '#c00' : '#004'};color:#fff;border-radius:50%;width:20px;height:20px;
    display:flex;align-items:center;justify-content:center;text-shadow:1px 1px 0 #000;`;
  div.textContent = damage;
  labelContainer.appendChild(div);
  hitsplats.push({ div, target, startTime: performance.now(), duration: 1500, offsetY: 0 });
}

function updateHitsplats() {
  const now = performance.now();
  for (let i = hitsplats.length - 1; i >= 0; i--) {
    const hs = hitsplats[i];
    const elapsed = now - hs.startTime;
    if (elapsed > hs.duration) {
      hs.div.remove();
      hitsplats.splice(i, 1);
      continue;
    }

    const pos = new THREE.Vector3();
    pos.copy(hs.target.position);
    pos.y += 3 - (elapsed / hs.duration) * 0.5;
    pos.project(camera);

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
    hs.div.style.left = `${x - 10}px`;
    hs.div.style.top = `${y}px`;
    hs.div.style.opacity = 1 - (elapsed / hs.duration) * 0.5;
  }
}

// ============================================================
//  GAME LOOP
// ============================================================
const clock = new THREE.Clock();

function gameLoop() {
  requestAnimationFrame(gameLoop);
  const delta = Math.min(clock.getDelta(), 0.1);
  const time = clock.getElapsedTime();

  if (!player) return;

  // Camera orbit via WASD
  if (document.activeElement.id !== 'chat-input') {
    if (keys['a']) cameraState.angle -= 1.5 * delta;
    if (keys['d']) cameraState.angle += 1.5 * delta;
    if (keys['w']) cameraState.pitch = Math.min(cameraState.maxPitch, cameraState.pitch + 30 * delta);
    if (keys['s']) cameraState.pitch = Math.max(cameraState.minPitch, cameraState.pitch - 30 * delta);
  }

  // Smooth camera follow
  cameraState.targetPos.lerp(
    new THREE.Vector3(
      player.group.position.x,
      player.group.position.y + 3,
      player.group.position.z
    ),
    5 * delta
  );
  updateCamera();

  // Update sun light to follow camera (shadow quality)
  sunLight.target.position.copy(cameraState.targetPos);
  sunLight.position.copy(sunPosition).multiplyScalar(60).add(cameraState.targetPos);

  // Player update
  player.update(delta, time, {
    onHit: (enemy, damage) => {
      showHitsplat(enemy, damage);
      if (damage > 0) {
        ui.addMessage('', `You hit the ${enemy.userData.name} for ${damage} damage.`, 'game');
        // XP
        const atkXP = damage * 4;
        const strXP = damage * 4;
        const hpXP = Math.floor(damage * 1.33);
        player.addXP('attack', atkXP);
        player.addXP('strength', strXP);
        const hpResult = player.addXP('hitpoints', hpXP);
        ui.showXPDrop('attack', atkXP);
        setTimeout(() => ui.showXPDrop('strength', strXP), 300);
        setTimeout(() => ui.showXPDrop('hitpoints', hpXP), 600);

        if (hpResult.levelUp) {
          ui.addMessage('', `🎉 Congratulations! Your Hitpoints level is now ${hpResult.level}!`, 'game');
        }
      } else {
        ui.addMessage('', `You miss the ${enemy.userData.name}.`, 'game');
      }
    },
    onKill: (enemy) => {
      ui.addMessage('', `You have defeated the ${enemy.userData.name}!`, 'game');
      // Drops
      if (enemy.userData.drops) {
        enemy.userData.drops.forEach(drop => {
          if (Math.random() <= drop.chance) {
            const count = drop.name === 'Coins' ? Math.floor(Math.random() * 15) + 1 : 1;
            player.addItem({ name: drop.name, icon: drop.icon, count, type: 'loot' });
            ui.addMessage('', `${drop.icon} You received: ${drop.name}${count > 1 ? ` x${count}` : ''}.`, 'game');
          }
        });
        ui.updateInventory();
      }
    },
    onSkill: (type, target) => {
      if (type === 'woodcutting') {
        const xpAmount = target.userData.treeType === 'oak' ? 37.5 : 25;
        const result = player.addXP('woodcutting', xpAmount);
        ui.showXPDrop('woodcutting', xpAmount);
        const logName = target.userData.treeType === 'oak' ? 'Oak Logs' : 'Logs';
        player.addItem({ name: logName, icon: '🪵', count: 1, type: 'resource' });
        ui.addMessage('', `You get some ${logName.toLowerCase()}.`, 'game');
        if (result.levelUp) ui.addMessage('', `🎉 Congratulations! Your Woodcutting level is now ${result.level}!`, 'game');
        ui.updateInventory();
      } else if (type === 'mining') {
        const xpAmount = 17.5;
        const result = player.addXP('mining', xpAmount);
        ui.showXPDrop('mining', xpAmount);
        const ores = [
          { name: 'Copper Ore', icon: '🟤' },
          { name: 'Tin Ore', icon: '⬜' },
        ];
        const ore = ores[Math.floor(Math.random() * ores.length)];
        player.addItem({ ...ore, count: 1, type: 'resource' });
        ui.addMessage('', `You manage to mine some ${ore.name.toLowerCase()}.`, 'game');
        if (result.levelUp) ui.addMessage('', `🎉 Congratulations! Your Mining level is now ${result.level}!`, 'game');
        ui.updateInventory();
      } else if (type === 'fishing') {
        const xpAmount = 10;
        const result = player.addXP('fishing', xpAmount);
        ui.showXPDrop('fishing', xpAmount);
        player.addItem({ name: 'Raw Shrimp', icon: '🦐', count: 1, type: 'resource' });
        ui.addMessage('', 'You catch some shrimp.', 'game');
        if (result.levelUp) ui.addMessage('', `🎉 Congratulations! Your Fishing level is now ${result.level}!`, 'game');
        ui.updateInventory();
      }
      ui.updateSkills();
    },
  });

  // NPC updates
  if (npcs && enemies) {
    updateNPCs(npcs, enemies, time, delta, (sender, msg, type) => {
      ui.addMessage(sender, msg, type);
    });
  }

  // River animation
  if (river && river.userData.animate) {
    river.userData.animate(time);
  }

  // Fishing spot bubble animation
  if (fishSpots) {
    fishSpots.forEach(spot => {
      spot.children.forEach((bubble, i) => {
        bubble.position.y = Math.sin(time * 3 + i) * 0.3 + 0.2;
      });
    });
  }

  // Marker pulse
  if (player.marker.visible) {
    player.marker.rotation.y = time * 3;
    player.marker.scale.setScalar(0.8 + Math.sin(time * 5) * 0.2);
  }

  // UI updates
  ui.updateOrbs();
  updateLabels();
  updateHitsplats();

  // Minimap
  if (time - (window._lastMinimapUpdate || 0) > 0.2) {
    ui.updateMinimap(player, npcs, enemies);
    window._lastMinimapUpdate = time;
  }

  // Render
  composer.render();
}

// ============================================================
//  RESIZE
// ============================================================
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloomPass.setSize(w, h);
});

// ============================================================
//  START
// ============================================================
buildWorld().then(() => {
  gameLoop();
});
