// npcs.js — NPCs, enemies, and their behaviors
import * as THREE from 'three';
import { colorMat, makeMat, TEX } from './textures.js';

// ============================================================
//  NPC FACTORY — low-poly RS-style humanoids
// ============================================================
function createHumanoid(opts = {}) {
  const group = new THREE.Group();
  const skinColor = opts.skin || 0xDEB887;
  const shirtColor = opts.shirt || 0x3366AA;
  const pantsColor = opts.pants || 0x554433;
  const hairColor = opts.hair || 0x332211;

  const skinMat = colorMat(skinColor, 0.85);
  const shirtMat = colorMat(shirtColor, 0.8);
  const pantsMat = colorMat(pantsColor, 0.85);
  const hairMat = colorMat(hairColor, 0.9);

  // Head (box for RS style)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), skinMat);
  head.position.y = 3.1;
  head.castShadow = true;
  group.add(head);

  // Hair
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), hairMat);
  hair.position.y = 3.55;
  group.add(hair);

  // Eyes (tiny dark boxes)
  for (const side of [-0.15, 0.15]) {
    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.05),
      colorMat(0x111111)
    );
    eye.position.set(side, 3.15, 0.37);
    group.add(eye);
  }

  // Body/torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.55), shirtMat);
  torso.position.y = 2.15;
  torso.castShadow = true;
  group.add(torso);

  // Arms
  for (const side of [-0.6, 0.6]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3), shirtMat);
    arm.position.set(side, 2.1, 0);
    arm.castShadow = true;
    group.add(arm);
    // Hand
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), skinMat);
    hand.position.set(side, 1.5, 0);
    group.add(hand);
  }

  // Legs
  for (const side of [-0.2, 0.2]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 0.4), pantsMat);
    leg.position.set(side, 1.05, 0);
    leg.castShadow = true;
    group.add(leg);
    // Feet
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.5), colorMat(0x333333, 0.9));
    foot.position.set(side, 0.45, 0.08);
    group.add(foot);
  }

  return group;
}

// ============================================================
//  SPECIFIC NPCs
// ============================================================
export function createNPCs(scene) {
  const npcs = [];
  const hFn = window._terrainHeight || (() => 0);

  // === Duke Horacio (in castle) ===
  const duke = createHumanoid({ shirt: 0x8B0000, pants: 0x2F1500, hair: 0x444444 });
  duke.position.set(0, 0.4, 0); // inside castle
  duke.name = 'duke_horacio';
  duke.userData = {
    type: 'npc', name: 'Duke Horacio', interactable: true, overhead: 'Duke Horacio',
    dialog: [
      "Welcome to my castle. Lumbridge has been my family's home for generations.",
      "The goblins to the east have been causing trouble lately...",
      "If you're new here, I'd suggest talking to the tutors around town.",
    ],
  };
  scene.add(duke);
  npcs.push(duke);

  // === Hans (wandering) ===
  const hans = createHumanoid({ shirt: 0xBBAA77, pants: 0x776644 });
  hans.position.set(5, hFn(5, 8), 8);
  hans.name = 'hans';
  hans.userData = {
    type: 'npc', name: 'Hans', interactable: true, overhead: 'Hans',
    dialog: [
      "Hello there. I've been wandering around this castle for years.",
      "I'm Hans. If you need to know how long you've been here, just ask.",
    ],
    wander: { radius: 10, speed: 1.2, center: new THREE.Vector3(5, 0, 8) },
  };
  scene.add(hans);
  npcs.push(hans);

  // === L0nely_N00b (iconic) ===
  const noob = createHumanoid({ shirt: 0x00AA00, pants: 0x996633, skin: 0xFFCC99, hair: 0xFF8800 });
  noob.position.set(-8, hFn(-8, 15), 15);
  noob.name = 'l0nely_n00b';
  noob.userData = {
    type: 'npc', name: 'L0nely_N00b', interactable: true, overhead: 'L0nely_N00b',
    chatMessages: ["buying gf 10k", "anyone selling gf?", "buying gf 10k plz", "will someone be my gf", "buying gf", "10k for gf"],
    chatInterval: 8000,
    dialog: [
      "hey bro u kno where i can buy a gf??",
      "ive been trying for like 3 hours",
      "someone told me to go to GE but idk where that is",
    ],
  };
  scene.add(noob);
  npcs.push(noob);

  // === Maid NPC (at Maid Café) ===
  const maid = createHumanoid({ shirt: 0x111111, pants: 0xFFFFFF, skin: 0xFFE0BD, hair: 0x222222 });
  // Add a white apron
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.8, 0.1),
    colorMat(0xFFFFFF, 0.7)
  );
  apron.position.set(0, 1.9, 0.35);
  maid.add(apron);
  // Headband
  const headband = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.15, 0.3),
    colorMat(0xFFFFFF, 0.7)
  );
  headband.position.set(0, 3.65, 0);
  maid.add(headband);

  maid.position.set(-25, hFn(-25, -16), -16);
  maid.name = 'maid_npc';
  maid.userData = {
    type: 'npc', name: 'Maid Sakura', interactable: true, overhead: 'Maid Sakura ♡',
    dialog: [
      "Welcome home, Master! ♡",
      "Would you like some tea? Or perhaps... cake? ♡",
      "Nya~ Please come in and make yourself comfortable!",
      "Today's special: Omurice with a ketchup heart ♡",
    ],
  };
  scene.add(maid);
  npcs.push(maid);

  // === Shop keeper (general store) ===
  const shopkeep = createHumanoid({ shirt: 0xAA8833, pants: 0x553311, hair: 0x666666 });
  shopkeep.position.set(-20, hFn(-20, 14), 14);
  shopkeep.name = 'shopkeeper';
  shopkeep.userData = {
    type: 'npc', name: 'Shopkeeper', interactable: true, overhead: 'Shopkeeper',
    dialog: [
      "Welcome to the Lumbridge General Store!",
      "Can I help you find anything?",
      "We buy and sell all sorts of things.",
    ],
  };
  scene.add(shopkeep);
  npcs.push(shopkeep);

  return npcs;
}

// ============================================================
//  ENEMIES — Chickens, Goblins
// ============================================================
function createChicken() {
  const group = new THREE.Group();
  // Body
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 5, 4),
    colorMat(0xFFFFEE, 0.9)
  );
  body.scale.set(1, 0.8, 1.2);
  body.position.y = 0.6;
  body.castShadow = true;
  group.add(body);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 4, 3),
    colorMat(0xFFFFEE, 0.9)
  );
  head.position.set(0, 1.1, 0.3);
  group.add(head);

  // Beak
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.2, 4),
    colorMat(0xFFAA00, 0.8)
  );
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, 1.05, 0.55);
  group.add(beak);

  // Comb (red thing on head)
  const comb = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.2, 0.15),
    colorMat(0xFF0000, 0.8)
  );
  comb.position.set(0, 1.3, 0.3);
  group.add(comb);

  // Legs
  for (const sx of [-0.15, 0.15]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.35, 4),
      colorMat(0xFFAA00, 0.8)
    );
    leg.position.set(sx, 0.2, 0);
    group.add(leg);
  }

  return group;
}

function createGoblin() {
  const group = new THREE.Group();
  const skinMat = colorMat(0x5A8A3A, 0.85);

  // Head — bigger, more grotesque
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.7), skinMat);
  head.position.y = 2.4;
  head.castShadow = true;
  group.add(head);

  // Pointy ears
  for (const side of [-0.5, 0.5]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.3, 4),
      skinMat
    );
    ear.rotation.z = side > 0 ? -0.5 : 0.5;
    ear.position.set(side, 2.5, 0);
    group.add(ear);
  }

  // Eyes (yellow, beady)
  for (const side of [-0.15, 0.15]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 4, 3),
      colorMat(0xFFFF00, 0.5)
    );
    eye.position.set(side, 2.45, 0.37);
    group.add(eye);
  }

  // Body
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.45), colorMat(0x8B4513, 0.85));
  torso.position.y = 1.7;
  torso.castShadow = true;
  group.add(torso);

  // Arms
  for (const side of [-0.5, 0.5]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.25), skinMat);
    arm.position.set(side, 1.7, 0);
    arm.castShadow = true;
    group.add(arm);
  }

  // Legs
  for (const side of [-0.15, 0.15]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), colorMat(0x8B4513, 0.85));
    leg.position.set(side, 0.85, 0);
    leg.castShadow = true;
    group.add(leg);
  }

  // Spear
  const spearShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 2.5, 4),
    colorMat(0x6B4226, 0.9)
  );
  spearShaft.position.set(0.6, 1.8, 0.2);
  spearShaft.rotation.z = 0.15;
  group.add(spearShaft);
  const spearTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.3, 4),
    colorMat(0xAAAAAA, 0.4, 0.6)
  );
  spearTip.position.set(0.65, 3.15, 0.2);
  group.add(spearTip);

  return group;
}

export function createEnemies(scene) {
  const enemies = [];
  const hFn = window._terrainHeight || (() => 0);

  // Chickens near the castle
  const chickenPositions = [
    { x: -10, z: 8 }, { x: -12, z: 6 }, { x: -8, z: 10 },
    { x: -14, z: 9 }, { x: -11, z: 12 },
  ];
  chickenPositions.forEach((p, i) => {
    const chicken = createChicken();
    chicken.position.set(p.x, hFn(p.x, p.z), p.z);
    chicken.name = `chicken_${i}`;
    chicken.userData = {
      type: 'enemy', enemyType: 'chicken', name: 'Chicken',
      interactable: true, overhead: 'Chicken (Level 1)',
      hp: 3, maxHp: 3, level: 1,
      respawnPos: new THREE.Vector3(p.x, hFn(p.x, p.z), p.z),
      wander: { radius: 5, speed: 0.6, center: new THREE.Vector3(p.x, 0, p.z) },
      drops: [
        { name: 'Raw Chicken', icon: '🍗', chance: 1.0 },
        { name: 'Feather', icon: '🪶', chance: 1.0 },
        { name: 'Bones', icon: '🦴', chance: 1.0 },
      ],
    };
    scene.add(chicken);
    enemies.push(chicken);
  });

  // Goblins east of the river
  const goblinPositions = [
    { x: 35, z: -5 }, { x: 38, z: -8 }, { x: 33, z: -3 },
    { x: 40, z: -10 }, { x: 36, z: -12 },
  ];
  goblinPositions.forEach((p, i) => {
    const goblin = createGoblin();
    goblin.position.set(p.x, hFn(p.x, p.z), p.z);
    goblin.name = `goblin_${i}`;
    goblin.userData = {
      type: 'enemy', enemyType: 'goblin', name: 'Goblin',
      interactable: true, overhead: 'Goblin (Level 2)',
      hp: 5, maxHp: 5, level: 2,
      respawnPos: new THREE.Vector3(p.x, hFn(p.x, p.z), p.z),
      wander: { radius: 6, speed: 0.8, center: new THREE.Vector3(p.x, 0, p.z) },
      drops: [
        { name: 'Goblin Mail', icon: '📧', chance: 0.3 },
        { name: 'Coins', icon: '🪙', chance: 1.0 },
        { name: 'Bones', icon: '🦴', chance: 1.0 },
      ],
    };
    scene.add(goblin);
    enemies.push(goblin);
  });

  return enemies;
}

// ============================================================
//  NPC UPDATE LOOP — wandering, chat messages
// ============================================================
export function updateNPCs(npcs, enemies, time, delta, chatFn) {
  const hFn = window._terrainHeight || (() => 0);

  // Wander behavior
  [...npcs, ...enemies].forEach(npc => {
    const w = npc.userData.wander;
    if (!w || npc.userData.isDead) return;

    if (!npc.userData._wanderTarget) {
      npc.userData._wanderTarget = new THREE.Vector3();
      npc.userData._wanderTimer = 0;
    }

    npc.userData._wanderTimer -= delta;
    if (npc.userData._wanderTimer <= 0) {
      // Pick new wander target
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * w.radius;
      npc.userData._wanderTarget.set(
        w.center.x + Math.cos(angle) * dist,
        0,
        w.center.z + Math.sin(angle) * dist
      );
      npc.userData._wanderTimer = 3 + Math.random() * 5;
    }

    const target = npc.userData._wanderTarget;
    const dx = target.x - npc.position.x;
    const dz = target.z - npc.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.5) {
      const speed = w.speed * delta;
      npc.position.x += (dx / dist) * speed;
      npc.position.z += (dz / dist) * speed;
      npc.position.y = hFn(npc.position.x, npc.position.z);
      // Face movement direction
      npc.rotation.y = Math.atan2(dx, dz);
    }
  });

  // L0nely_N00b chat messages
  npcs.forEach(npc => {
    if (npc.userData.chatMessages && chatFn) {
      if (!npc.userData._lastChat) npc.userData._lastChat = 0;
      const interval = npc.userData.chatInterval || 10000;
      if (time * 1000 - npc.userData._lastChat > interval) {
        const msgs = npc.userData.chatMessages;
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        chatFn(npc.userData.name, msg, 'public');
        npc.userData._lastChat = time * 1000;
      }
    }
  });
}
