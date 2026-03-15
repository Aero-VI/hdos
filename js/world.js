// world.js — Lumbridge world geometry: terrain, buildings, trees, river, bridge
import * as THREE from 'three';
import { TEX, makeMat, colorMat } from './textures.js';

const TILE = 2; // world units per RS tile

// ============================================================
//  TERRAIN — tile-based heightmap with gentle rolling hills
// ============================================================
export function createTerrain(scene) {
  const SIZE = 128; // tiles each side
  const geo = new THREE.PlaneGeometry(SIZE * TILE, SIZE * TILE, SIZE, SIZE);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;

  // Height function: gentle Lumbridge-style terrain
  function h(wx, wz) {
    // River valley running roughly north-south at x ≈ 10
    const riverDist = Math.abs(wx - 10 * TILE);
    let riverDip = 0;
    if (riverDist < 8 * TILE) {
      riverDip = -1.5 * (1 - riverDist / (8 * TILE));
    }
    // Gentle rolling hills
    const hill = Math.sin(wx * 0.015) * Math.cos(wz * 0.012) * 2.0
               + Math.sin(wx * 0.035 + 1) * Math.sin(wz * 0.028) * 1.0
               + Math.cos(wx * 0.008 + wz * 0.006) * 3.0;
    // Castle area flattened (around origin)
    const castleDist = Math.sqrt(wx * wx + wz * wz);
    const castleFlat = Math.max(0, 1 - castleDist / (20 * TILE));
    // South area gently rises
    const southRise = Math.max(0, wz * 0.005);
    return (hill + riverDip + southRise) * (1 - castleFlat * 0.8);
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, h(x, z));
  }
  geo.computeVertexNormals();

  // Store height function for gameplay use
  window._terrainHeight = h;

  const grassTex = TEX.grass(40, 40);
  const mat = makeMat(grassTex, { });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  scene.add(mesh);

  // Dirt paths — flat strips with cobblestone
  createPaths(scene, h);

  return mesh;
}

function createPaths(scene, h) {
  // Main path from castle south
  const pathGeo = new THREE.PlaneGeometry(3 * TILE, 40 * TILE, 3, 40);
  pathGeo.rotateX(-Math.PI / 2);
  const pp = pathGeo.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const x = pp.getX(i), z = pp.getZ(i);
    pp.setY(i, h(x, z - 25 * TILE) + 0.08);
  }
  pathGeo.computeVertexNormals();
  const cobble = TEX.cobblestone(3, 30);
  const pathMesh = new THREE.Mesh(pathGeo, makeMat(cobble));
  pathMesh.position.set(0, 0, -25 * TILE);
  pathMesh.receiveShadow = true;
  scene.add(pathMesh);

  // East-west path near castle
  const ewGeo = new THREE.PlaneGeometry(35 * TILE, 3 * TILE, 35, 3);
  ewGeo.rotateX(-Math.PI / 2);
  const ep = ewGeo.attributes.position;
  for (let i = 0; i < ep.count; i++) {
    const x = ep.getX(i), z = ep.getZ(i);
    ep.setY(i, h(x, z) + 0.08);
  }
  ewGeo.computeVertexNormals();
  const ewMesh = new THREE.Mesh(ewGeo, makeMat(TEX.cobblestone(25, 3)));
  ewMesh.receiveShadow = true;
  scene.add(ewMesh);

  // Dirt path toward bridge
  const dirtGeo = new THREE.PlaneGeometry(12 * TILE, 3 * TILE, 12, 3);
  dirtGeo.rotateX(-Math.PI / 2);
  const dp = dirtGeo.attributes.position;
  for (let i = 0; i < dp.count; i++) {
    dp.setY(i, h(dp.getX(i) + 10 * TILE, dp.getZ(i) - 5 * TILE) + 0.06);
  }
  dirtGeo.computeVertexNormals();
  const dirtMesh = new THREE.Mesh(dirtGeo, makeMat(TEX.dirt(8, 3)));
  dirtMesh.position.set(10 * TILE, 0, -5 * TILE);
  dirtMesh.receiveShadow = true;
  scene.add(dirtMesh);
}

// ============================================================
//  CASTLE — Lumbridge style with thick walls, towers, courtyard
// ============================================================
export function createCastle(scene) {
  const castle = new THREE.Group();
  castle.name = 'castle';

  const wallTex = TEX.stoneWall(4, 3);
  const wallMat = makeMat(wallTex);
  const floorMat = makeMat(TEX.cobblestone(4, 4));
  const woodMat = makeMat(TEX.wood(2, 2));
  const roofMat = makeMat(TEX.roof(4, 3));

  // Main keep — thick-walled rectangular building
  // Ground floor walls
  const wallH = 10, wallThick = 1.2, keepW = 14, keepD = 12;
  const makeWall = (w, h, d) => {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, wallMat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  };

  // Front wall (south) with door opening
  const frontLeft = makeWall(5, wallH, wallThick);
  frontLeft.position.set(-keepW/2 + 2.5, wallH/2, keepD/2);
  castle.add(frontLeft);
  const frontRight = makeWall(5, wallH, wallThick);
  frontRight.position.set(keepW/2 - 2.5, wallH/2, keepD/2);
  castle.add(frontRight);
  const frontTop = makeWall(4, wallH - 5, wallThick);
  frontTop.position.set(0, wallH - (wallH-5)/2, keepD/2);
  castle.add(frontTop);

  // Back wall
  const back = makeWall(keepW, wallH, wallThick);
  back.position.set(0, wallH/2, -keepD/2);
  castle.add(back);

  // Side walls
  const sideL = makeWall(wallThick, wallH, keepD);
  sideL.position.set(-keepW/2, wallH/2, 0);
  castle.add(sideL);
  const sideR = makeWall(wallThick, wallH, keepD);
  sideR.position.set(keepW/2, wallH/2, 0);
  castle.add(sideR);

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(keepW, 0.3, keepD), floorMat);
  floor.position.set(0, 0.15, 0);
  floor.receiveShadow = true;
  castle.add(floor);

  // Second floor
  const floor2 = new THREE.Mesh(new THREE.BoxGeometry(keepW - 0.5, 0.3, keepD - 0.5), woodMat);
  floor2.position.set(0, wallH * 0.55, 0);
  floor2.receiveShadow = true;
  castle.add(floor2);

  // Roof — peaked
  const roofGeo = new THREE.ConeGeometry(keepW * 0.55, 5, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, wallH + 2.5, 0);
  roof.castShadow = true;
  castle.add(roof);

  // Crenellations along walls
  for (let i = -keepW/2 + 1; i <= keepW/2 - 1; i += 2) {
    for (const zz of [keepD/2, -keepD/2]) {
      const cren = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.8), wallMat);
      cren.position.set(i, wallH + 0.75, zz);
      cren.castShadow = true;
      castle.add(cren);
    }
  }
  for (let j = -keepD/2 + 1; j <= keepD/2 - 1; j += 2) {
    for (const xx of [-keepW/2, keepW/2]) {
      const cren = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 1), wallMat);
      cren.position.set(xx, wallH + 0.75, j);
      cren.castShadow = true;
      castle.add(cren);
    }
  }

  // Corner towers (cylindrical, taller than walls)
  const towerR = 3, towerH = 14;
  const towerGeo = new THREE.CylinderGeometry(towerR, towerR * 1.1, towerH, 8);
  const towerCapGeo = new THREE.ConeGeometry(towerR * 1.3, 4, 8);

  for (const [tx, tz] of [[-keepW/2, -keepD/2], [keepW/2, -keepD/2], [-keepW/2, keepD/2], [keepW/2, keepD/2]]) {
    const tower = new THREE.Mesh(towerGeo, wallMat);
    tower.position.set(tx, towerH/2, tz);
    tower.castShadow = true;
    castle.add(tower);

    const cap = new THREE.Mesh(towerCapGeo, roofMat);
    cap.position.set(tx, towerH + 2, tz);
    cap.castShadow = true;
    castle.add(cap);

    // Tower crenellations
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const cren = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.6), wallMat);
      cren.position.set(
        tx + Math.cos(a) * (towerR + 0.3),
        towerH + 0.75,
        tz + Math.sin(a) * (towerR + 0.3)
      );
      cren.lookAt(tx, towerH + 0.75, tz);
      cren.castShadow = true;
      castle.add(cren);
    }
  }

  // Window openings (dark recesses)
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
  for (const side of [-1, 1]) {
    for (let j = -3; j <= 3; j += 3) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.3), windowMat);
      // On side walls
      win.position.set(side * keepW/2, 6, j);
      castle.add(win);
      // Upper floor
      const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.3), windowMat);
      win2.position.set(side * keepW/2, wallH * 0.55 + 2.5, j);
      castle.add(win2);
    }
  }

  // Staircase inside (spiral-ish)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 1), wallMat);
    step.position.set(
      -4 + Math.cos(angle) * 1.5,
      (i / 12) * wallH * 0.55,
      Math.sin(angle) * 1.5
    );
    step.rotation.y = -angle;
    step.receiveShadow = true;
    castle.add(step);
  }

  // Castle courtyard walls (outer perimeter)
  const courtW = 30, courtD = 25;
  const courtWallH = 4;
  // Front courtyard wall with gate
  for (const side of [-1, 1]) {
    const cw = makeWall((courtW/2 - 3), courtWallH, 0.8);
    cw.position.set(side * (courtW/4 + 1.5), courtWallH/2, courtD/2);
    castle.add(cw);
  }
  // Side courtyard walls
  for (const side of [-1, 1]) {
    const cw = makeWall(0.8, courtWallH, courtD);
    cw.position.set(side * courtW/2, courtWallH/2, 0);
    castle.add(cw);
  }
  // Courtyard ground
  const courtFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(courtW, courtD),
    makeMat(TEX.cobblestone(8, 6))
  );
  courtFloor.rotation.x = -Math.PI / 2;
  courtFloor.position.y = 0.05;
  courtFloor.receiveShadow = true;
  castle.add(courtFloor);

  castle.position.set(0, 0, 0);
  scene.add(castle);
  return castle;
}

// ============================================================
//  RS-STYLE TREES — chunky, low-poly, stylized foliage
// ============================================================
export function createTree(scene, x, z, scale = 1, type = 'normal') {
  const group = new THREE.Group();
  const hFn = window._terrainHeight || (() => 0);
  const y = hFn(x, z);

  // Bark — use wood texture
  const barkMat = makeMat(TEX.wood(1, 2), { color: 0x6B4226 });

  if (type === 'normal') {
    // Trunk — slightly tapered cylinder, low-poly (6 sides for RS feel)
    const trunkGeo = new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 4 * scale, 6);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = 2 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // RS-style foliage: stack of 2-3 squashed dodecahedrons (chunky, faceted)
    const leafColor = [0x3A5F0B, 0x4A6F1B, 0x2D4A08][Math.floor(Math.random() * 3)];
    const leafMat = colorMat(leafColor, 0.9);

    // Bottom canopy — wider
    const canopy1 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.5 * scale, 0),
      leafMat
    );
    canopy1.position.y = 5 * scale;
    canopy1.scale.y = 0.6;
    canopy1.castShadow = true;
    group.add(canopy1);

    // Top canopy — smaller, offset
    const canopy2 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.8 * scale, 0),
      leafMat
    );
    canopy2.position.y = 7 * scale;
    canopy2.position.x = (Math.random() - 0.5) * 0.5;
    canopy2.scale.y = 0.7;
    canopy2.castShadow = true;
    group.add(canopy2);

  } else if (type === 'oak') {
    // Thicker trunk
    const trunkGeo = new THREE.CylinderGeometry(0.5 * scale, 0.8 * scale, 5 * scale, 6);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = 2.5 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // Big chunky canopy
    const leafMat = colorMat(0x355E00, 0.9);
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.5 * scale, 1),
      leafMat
    );
    canopy.position.y = 6.5 * scale;
    canopy.scale.y = 0.65;
    canopy.castShadow = true;
    group.add(canopy);

    // Branch bumps
    for (let i = 0; i < 3; i++) {
      const bump = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.5 * scale, 0),
        leafMat
      );
      const angle = (i / 3) * Math.PI * 2 + Math.random() * 0.5;
      bump.position.set(
        Math.cos(angle) * 2 * scale,
        5.5 * scale + Math.random() * 2,
        Math.sin(angle) * 2 * scale
      );
      bump.castShadow = true;
      group.add(bump);
    }

  } else if (type === 'willow') {
    // Curved trunk
    const trunkGeo = new THREE.CylinderGeometry(0.4 * scale, 0.7 * scale, 6 * scale, 6);
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = 3 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // Droopy canopy — tall sphere
    const leafMat = colorMat(0x4A7A20, 0.9);
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(3 * scale, 6, 4),
      leafMat
    );
    canopy.position.y = 7 * scale;
    canopy.scale.set(1, 1.4, 1);
    canopy.castShadow = true;
    group.add(canopy);

    // Hanging vines (thin stretched boxes)
    const vineMat = colorMat(0x3A6A10, 0.95);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const vine = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3 * scale, 0.15),
        vineMat
      );
      vine.position.set(
        Math.cos(angle) * 2.5 * scale,
        4 * scale,
        Math.sin(angle) * 2.5 * scale
      );
      group.add(vine);
    }
  } else if (type === 'dead') {
    // Dead tree — just trunk and bare branches
    const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.5 * scale, 5 * scale, 5);
    const deadMat = colorMat(0x4A3520, 0.95);
    const trunk = new THREE.Mesh(trunkGeo, deadMat);
    trunk.position.y = 2.5 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    for (let i = 0; i < 4; i++) {
      const branchGeo = new THREE.CylinderGeometry(0.05, 0.15, 2.5 * scale, 4);
      const branch = new THREE.Mesh(branchGeo, deadMat);
      const angle = (i / 4) * Math.PI * 2;
      branch.position.set(
        Math.cos(angle) * 0.8,
        3.5 * scale + i * 0.5,
        Math.sin(angle) * 0.8
      );
      branch.rotation.z = Math.cos(angle) * 0.6;
      branch.rotation.x = Math.sin(angle) * 0.6;
      branch.castShadow = true;
      group.add(branch);
    }
  }

  group.position.set(x, y, z);
  group.userData = { type: 'tree', treeType: type, interactable: true, name: `${type === 'oak' ? 'Oak' : type === 'willow' ? 'Willow' : 'Tree'}` };
  scene.add(group);
  return group;
}

// ============================================================
//  BUILDINGS — General store, Church, Houses, Maid Café
// ============================================================

function makeBuilding(scene, x, z, w, d, h, opts = {}) {
  const group = new THREE.Group();
  const hFn = window._terrainHeight || (() => 0);
  const baseY = hFn(x, z);

  const wallMat = opts.wallMat || makeMat(TEX.stoneWall(2, 2));
  const roofMat = opts.roofMat || makeMat(TEX.roof(3, 2));
  const floorMat = opts.floorMat || makeMat(TEX.cobblestone(2, 2));
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 1 });

  // Walls with door opening on south face
  const thick = 0.6;
  // Back wall
  const bw = new THREE.Mesh(new THREE.BoxGeometry(w, h, thick), wallMat);
  bw.position.set(0, h/2, -d/2); bw.castShadow = true; bw.receiveShadow = true;
  group.add(bw);
  // Left wall
  const lw = new THREE.Mesh(new THREE.BoxGeometry(thick, h, d), wallMat);
  lw.position.set(-w/2, h/2, 0); lw.castShadow = true; lw.receiveShadow = true;
  group.add(lw);
  // Right wall
  const rw = new THREE.Mesh(new THREE.BoxGeometry(thick, h, d), wallMat);
  rw.position.set(w/2, h/2, 0); rw.castShadow = true; rw.receiveShadow = true;
  group.add(rw);
  // Front wall — split for door
  const doorW = 1.8, doorH = 3;
  const sideW = (w - doorW) / 2;
  const fl = new THREE.Mesh(new THREE.BoxGeometry(sideW, h, thick), wallMat);
  fl.position.set(-w/2 + sideW/2, h/2, d/2); fl.castShadow = true; fl.receiveShadow = true;
  group.add(fl);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(sideW, h, thick), wallMat);
  fr.position.set(w/2 - sideW/2, h/2, d/2); fr.castShadow = true; fr.receiveShadow = true;
  group.add(fr);
  const ft = new THREE.Mesh(new THREE.BoxGeometry(doorW, h - doorH, thick), wallMat);
  ft.position.set(0, h - (h - doorH)/2, d/2); ft.castShadow = true; ft.receiveShadow = true;
  group.add(ft);

  // Floor
  const flr = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), floorMat);
  flr.position.y = 0.1; flr.receiveShadow = true;
  group.add(flr);

  // Windows on side walls
  for (const sx of [-1, 1]) {
    for (let j = 0; j < Math.max(1, Math.floor(d / 4)); j++) {
      const wn = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.8), windowMat);
      wn.position.set(sx * w/2, h * 0.55, -d/2 + 2 + j * 3);
      group.add(wn);
    }
  }

  // Roof
  if (opts.roofType === 'flat') {
    const rf = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.3, d + 1), roofMat);
    rf.position.y = h; rf.castShadow = true;
    group.add(rf);
  } else {
    // Peaked roof using a prism (extruded triangle)
    const roofShape = new THREE.Shape();
    const overhang = 1;
    roofShape.moveTo(-w/2 - overhang, 0);
    roofShape.lineTo(0, h * 0.4);
    roofShape.lineTo(w/2 + overhang, 0);
    roofShape.lineTo(-w/2 - overhang, 0);
    const roofExtGeo = new THREE.ExtrudeGeometry(roofShape, {
      depth: d + overhang * 2,
      bevelEnabled: false
    });
    const roofMesh = new THREE.Mesh(roofExtGeo, roofMat);
    roofMesh.rotation.x = -Math.PI / 2;
    roofMesh.position.set(0, h, d/2 + overhang);
    roofMesh.castShadow = true;
    group.add(roofMesh);
  }

  group.position.set(x, baseY, z);
  scene.add(group);
  return group;
}

export function createGeneralStore(scene) {
  const bld = makeBuilding(scene, -20, 12, 8, 6, 5, {});
  bld.name = 'general_store';
  bld.userData = { type: 'building', name: 'General Store', interactable: true };

  // Sign
  const signMat = makeMat(TEX.wood(1, 1));
  const sign = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.15), signMat);
  sign.position.set(-20, 5.8, 15.1);
  const hFn = window._terrainHeight || (() => 0);
  sign.position.y += hFn(-20, 12);
  scene.add(sign);

  return bld;
}

export function createChurch(scene) {
  const wallMat = makeMat(TEX.stoneWall(3, 3), { color: 0xCCBBAA });
  const bld = makeBuilding(scene, 20, -15, 8, 14, 8, { wallMat, roofType: 'peaked' });
  bld.name = 'church';
  bld.userData = { type: 'building', name: 'Lumbridge Church', interactable: true };

  // Steeple / bell tower
  const steeple = new THREE.Mesh(
    new THREE.BoxGeometry(3, 8, 3),
    wallMat
  );
  steeple.position.set(0, 12, -4);
  steeple.castShadow = true;
  bld.add(steeple);

  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 5, 4),
    makeMat(TEX.roof(2, 2))
  );
  spire.position.set(0, 19.5, -4);
  spire.castShadow = true;
  bld.add(spire);

  // Cross on top
  const crossMat = colorMat(0xFFD700, 0.3, 0.6);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2, 0.2), crossMat);
  crossV.position.set(0, 23, -4);
  bld.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.2), crossMat);
  crossH.position.set(0, 23.5, -4);
  bld.add(crossH);

  return bld;
}

export function createHouse(scene, x, z, opts = {}) {
  const bld = makeBuilding(scene, x, z, opts.w || 6, opts.d || 5, opts.h || 4, opts);
  bld.name = opts.name || 'house';
  bld.userData = { type: 'building', name: opts.label || 'House', interactable: true };
  return bld;
}

export function createMaidCafe(scene) {
  // Pink/magenta walls
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xFF69B4, roughness: 0.7,
    normalMap: TEX.stoneWall(2, 2).normalMap,
  });
  const bld = makeBuilding(scene, -25, -20, 8, 7, 5, {
    wallMat: pinkMat,
    roofMat: new THREE.MeshStandardMaterial({ color: 0xFF1493, roughness: 0.6 }),
  });
  bld.name = 'maid_cafe';
  bld.userData = { type: 'building', name: 'Maid Café ♡', interactable: true };

  // Neon lights
  const neonColors = [0xFF00FF, 0xFF69B4, 0xFFB6C1];
  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(neonColors[i], 3, 15);
    light.position.set(-2 + i * 2, 4, 3.8);
    bld.add(light);
  }

  // Lanterns on front
  for (const sx of [-3, 3]) {
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0xFF69B4, emissive: 0xFF1493, emissiveIntensity: 0.5 })
    );
    lantern.position.set(sx, 4.5, 3.8);
    bld.add(lantern);
  }

  // Sign board
  const signGeo = new THREE.BoxGeometry(4, 1.2, 0.15);
  const signMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, emissive: 0xFF69B4, emissiveIntensity: 0.3, roughness: 0.5 });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 5.8, 3.6);
  bld.add(sign);

  return bld;
}

// ============================================================
//  RIVER with animated water ripples
// ============================================================
export function createRiver(scene) {
  // River geometry following a path
  const riverW = 8;
  const riverLen = 120;
  const geo = new THREE.PlaneGeometry(riverW, riverLen, 8, 60);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const hFn = window._terrainHeight || (() => 0);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, hFn(x + 10 * TILE, z) - 0.8);
    // Slight meander
    pos.setX(i, x + Math.sin(z * 0.05) * 2);
  }
  geo.computeVertexNormals();

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2266AA,
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.75,
  });

  const river = new THREE.Mesh(geo, waterMat);
  river.position.set(10 * TILE, -0.5, 0);
  river.receiveShadow = true;
  river.name = 'river';
  scene.add(river);

  // Animate — store ref for update loop
  river.userData.animate = (time) => {
    const p = river.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const baseY = hFn(x + 10 * TILE, z) - 0.8;
      p.setY(i, baseY + Math.sin(z * 0.3 + time * 2) * 0.15 + Math.sin(x * 0.5 + time * 1.5) * 0.1);
    }
    p.needsUpdate = true;
  };

  return river;
}

// ============================================================
//  BRIDGE — stone arch bridge
// ============================================================
export function createBridge(scene) {
  const bridge = new THREE.Group();
  const bridgeMat = makeMat(TEX.cobblestone(3, 2));
  const hFn = window._terrainHeight || (() => 0);

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 12), bridgeMat);
  deck.position.y = 1.5;
  deck.castShadow = true; deck.receiveShadow = true;
  bridge.add(deck);

  // Arch underneath
  const archGeo = new THREE.TorusGeometry(3, 0.6, 6, 8, Math.PI);
  const arch = new THREE.Mesh(archGeo, makeMat(TEX.stoneWall(2, 1)));
  arch.rotation.y = Math.PI / 2;
  arch.position.set(0, 0, 0);
  arch.castShadow = true;
  bridge.add(arch);

  // Railings
  const railMat = makeMat(TEX.stoneWall(1, 1));
  for (const sx of [-2.5, 2.5]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 12), railMat);
    rail.position.set(sx, 2.5, 0);
    rail.castShadow = true;
    bridge.add(rail);

    // Posts
    for (let z = -5; z <= 5; z += 2.5) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 0.5), railMat);
      post.position.set(sx, 2.75, z);
      post.castShadow = true;
      bridge.add(post);
    }
  }

  bridge.position.set(10 * TILE, hFn(10 * TILE, -5 * TILE) + 0.5, -5 * TILE);
  bridge.name = 'bridge';
  scene.add(bridge);
  return bridge;
}

// ============================================================
//  SCATTER VEGETATION
// ============================================================
export function populateWorld(scene) {
  // Trees around Lumbridge
  const treePositions = [
    // West of castle
    { x: -30, z: 5, type: 'normal' }, { x: -35, z: 10, type: 'oak' }, { x: -33, z: -5, type: 'normal' },
    { x: -28, z: -12, type: 'normal' }, { x: -40, z: -8, type: 'oak' },
    // East side
    { x: 35, z: 5, type: 'normal' }, { x: 40, z: -5, type: 'oak' }, { x: 38, z: 10, type: 'normal' },
    { x: 45, z: 15, type: 'normal' }, { x: 42, z: -15, type: 'oak' },
    // South
    { x: -10, z: -30, type: 'normal' }, { x: 5, z: -35, type: 'oak' }, { x: -5, z: -40, type: 'normal' },
    { x: 15, z: -35, type: 'normal' }, { x: -15, z: -38, type: 'dead' },
    // Near river (willows)
    { x: 15, z: 5, type: 'willow' }, { x: 17, z: -15, type: 'willow' }, { x: 14, z: 20, type: 'willow' },
    // North
    { x: -10, z: 30, type: 'normal' }, { x: 10, z: 35, type: 'oak' }, { x: -5, z: 28, type: 'normal' },
    { x: 5, z: 40, type: 'normal' }, { x: -20, z: 35, type: 'oak' },
    // More fill
    { x: -50, z: 20, type: 'normal' }, { x: 50, z: 20, type: 'normal' },
    { x: -45, z: -30, type: 'oak' }, { x: 48, z: -25, type: 'normal' },
    { x: -55, z: 0, type: 'normal' }, { x: 55, z: -10, type: 'oak' },
  ];
  const trees = [];
  treePositions.forEach(t => {
    const scale = 0.8 + Math.random() * 0.5;
    trees.push(createTree(scene, t.x, t.z, scale, t.type));
  });

  // Rocks scattered
  const rockMat = makeMat(TEX.stoneWall(1, 1), { color: 0x888888 });
  const rockPositions = [
    { x: -12, z: -8 }, { x: 8, z: 15 }, { x: -8, z: -25 },
    { x: 25, z: 8 }, { x: -18, z: 22 }, { x: 30, z: -20 },
    { x: -40, z: 15 }, { x: 42, z: 25 },
  ];
  const rocks = [];
  rockPositions.forEach(r => {
    const hFn = window._terrainHeight || (() => 0);
    const scale = 0.5 + Math.random() * 1.5;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(scale, 0),
      rockMat
    );
    rock.position.set(r.x, hFn(r.x, r.z) + scale * 0.4, r.z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    rock.userData = { type: 'rock', name: 'Rock', interactable: true };
    scene.add(rock);
    rocks.push(rock);
  });

  // Flowers / ground details
  const flowerColors = [0xFFFF00, 0xFF6600, 0xFF0066, 0x6666FF, 0xFFFFFF];
  for (let i = 0; i < 50; i++) {
    const fx = (Math.random() - 0.5) * 100;
    const fz = (Math.random() - 0.5) * 100;
    // Skip river area
    if (Math.abs(fx - 10 * TILE) < 6) continue;
    const hFn = window._terrainHeight || (() => 0);
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 4, 3),
      colorMat(flowerColors[Math.floor(Math.random() * flowerColors.length)], 0.9)
    );
    flower.position.set(fx, hFn(fx, fz) + 0.1, fz);
    scene.add(flower);
  }

  return { trees, rocks };
}

// ============================================================
//  FISHING SPOTS
// ============================================================
export function createFishingSpots(scene) {
  const spots = [];
  const positions = [
    { x: 10 * TILE + 3, z: 5 },
    { x: 10 * TILE - 2, z: -10 },
    { x: 10 * TILE + 1, z: 15 },
  ];
  positions.forEach(p => {
    const hFn = window._terrainHeight || (() => 0);
    // Bubbling marker
    const spot = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 4, 3),
        new THREE.MeshStandardMaterial({ color: 0xAADDFF, transparent: true, opacity: 0.6 })
      );
      bubble.position.set(
        (Math.random() - 0.5) * 0.8,
        Math.random() * 0.3,
        (Math.random() - 0.5) * 0.8
      );
      spot.add(bubble);
    }
    spot.position.set(p.x, hFn(p.x, p.z) - 0.2, p.z);
    spot.userData = { type: 'fishing_spot', name: 'Fishing Spot', interactable: true };
    spot.name = 'fishing_spot';
    scene.add(spot);
    spots.push(spot);
  });
  return spots;
}
