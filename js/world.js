import * as THREE from 'three';
import * as TEX from './textures.js';

const roughMap = TEX.roughnessMap();

function mat(tex, opts = {}) {
    if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
    return new THREE.MeshStandardMaterial({
        map: tex, roughness: opts.roughness ?? 0.85, metalness: opts.metalness ?? 0.05,
        roughnessMap: roughMap, side: opts.side ?? THREE.FrontSide, ...opts.extra
    });
}

export function buildWorld(scene) {
    const group = new THREE.Group();

    // Grass ground with height variation
    const grassMat = mat(TEX.grassTexture(), { repeat: [40, 40] });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 64, 64), grassMat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = 'ground';
    const pos = ground.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        pos.setZ(i, (Math.sin(x * 0.15) * Math.cos(y * 0.12) * 0.3) + (Math.sin(x * 0.4 + y * 0.3) * 0.1));
    }
    pos.needsUpdate = true; ground.geometry.computeVertexNormals();
    group.add(ground);

    // Dirt paths
    const dirtMat = mat(TEX.dirtTexture(), { repeat: [4, 20] });
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(5, 60), dirtMat);
    p1.rotation.x = -Math.PI / 2; p1.position.set(0, 0.02, 0); p1.receiveShadow = true; group.add(p1);
    const dirtMat2 = mat(TEX.dirtTexture(), { repeat: [20, 4] });
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(60, 5), dirtMat2);
    p2.rotation.x = -Math.PI / 2; p2.position.set(0, 0.02, 5); p2.receiveShadow = true; group.add(p2);

    // Stone courtyard
    const tileMat = mat(TEX.stoneTileTexture(), { repeat: [6, 6] });
    const court = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), tileMat);
    court.rotation.x = -Math.PI / 2; court.position.set(0, 0.03, -15); court.receiveShadow = true; group.add(court);

    group.add(buildCastle());
    group.add(buildGeneralStore());
    group.add(buildChurch());
    group.add(buildHouse(-18, 8, 0.3));
    group.add(buildHouse(-18, 18, -0.2));
    group.add(buildMaidCafe());

    const trees = [[20,10],[25,15],[22,22],[18,25],[30,8],[-25,20],[-28,25],[-22,28],[-30,15],[15,-25],[-15,-28],[25,-20],[-25,-25],[35,0],[-35,5],[0,30],[10,35],[-10,32],[40,20],[-40,20],[45,-10],[-45,-15]];
    trees.forEach(([x, z]) => group.add(buildTree(x, z, 2 + Math.random() * 2)));

    [[30,-15],[32,-17],[28,-18],[34,-14]].forEach(([x, z]) => {
        const r = buildRock(x, z);
        r.userData = { type: 'rock', name: 'Rock', hp: 5, maxHp: 5, skill: 'Mining', xp: 17 };
        group.add(r);
    });

    group.add(buildRiver());
    group.add(buildBridge());

    for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 160, z = (Math.random() - 0.5) * 160;
        if (Math.abs(x) < 3 && Math.abs(z) < 30) continue;
        group.add(buildGrassPatch(x, z));
    }

    scene.add(group);
    return group;
}

function buildCastle() {
    const c = new THREE.Group(); c.position.set(0, 0, -20);
    const sm = mat(TEX.stoneTexture(), { repeat: [3, 3] });
    const rm = mat(TEX.roofTexture(), { repeat: [2, 2] });
    const wm = mat(TEX.woodTexture(), { repeat: [1, 2] });

    const keep = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 12), sm);
    keep.position.y = 5; keep.castShadow = true; keep.receiveShadow = true; c.add(keep);

    // Crenellations
    for (let x = -6; x <= 6; x += 2) for (let z = -5; z <= 5; z += 10) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), sm); m.position.set(x, 10.75, z); m.castShadow = true; c.add(m);
    }
    for (let z = -4; z <= 4; z += 2) for (let x = -7; x <= 7; x += 14) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.2), sm); m.position.set(x, 10.75, z); m.castShadow = true; c.add(m);
    }

    // Towers
    const tg = new THREE.CylinderGeometry(3, 3.3, 14, 8);
    [[-8,-7],[8,-7],[-8,7],[8,7]].forEach(([x, z]) => {
        const t = new THREE.Mesh(tg, sm); t.position.set(x, 7, z); t.castShadow = true; c.add(t);
        const rc = new THREE.Mesh(new THREE.ConeGeometry(3.5, 4, 8), rm); rc.position.set(x, 16, z); rc.castShadow = true; c.add(rc);
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), sm);
            m.position.set(x + Math.cos(a) * 3, 14.6, z + Math.sin(a) * 3); c.add(m);
        }
    });

    // Doorway
    const dl = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), sm); dl.position.set(-1.5, 2.5, 6.1); c.add(dl);
    const dr = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), sm); dr.position.set(1.5, 2.5, 6.1); c.add(dr);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.5, 8, 12, Math.PI), sm);
    arch.position.set(0, 5, 6.1); arch.rotation.x = Math.PI / 2; c.add(arch);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.5, 0.3), wm); door.position.set(0, 2.25, 6.2); c.add(door);

    // Windows
    const winM = new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.6 });
    [[-4,5],[4,5],[-4,7],[4,7]].forEach(([x, y]) => {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), winM); w.position.set(x, y, 6.05); c.add(w);
    });

    // Flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }));
    pole.position.set(0, 12.5, 0); c.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), new THREE.MeshStandardMaterial({ color: 0xcc2200, side: THREE.DoubleSide }));
    flag.position.set(1, 13.5, 0); flag.name = 'flag'; c.add(flag);

    return c;
}

function buildGeneralStore() {
    const s = new THREE.Group(); s.position.set(15, 0, 8);
    const sm = mat(TEX.stoneTexture(), { repeat: [2, 2] }), wm = mat(TEX.woodTexture()), rm = mat(TEX.roofTexture(), { repeat: [2, 2] });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 7), sm);
    walls.position.y = 2.5; walls.castShadow = true; walls.receiveShadow = true; s.add(walls);
    const rs = new THREE.Shape(); rs.moveTo(-5, 0); rs.lineTo(0, 3); rs.lineTo(5, 0); rs.lineTo(-5, 0);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 8, bevelEnabled: false }), rm);
    roof.rotation.y = Math.PI / 2; roof.position.set(4, 5, -4); roof.castShadow = true; s.add(roof);
    s.add(new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.2), wm).translateY(1.5).translateZ(3.55));
    s.userData = { type: 'building', name: 'General Store' };
    return s;
}

function buildChurch() {
    const ch = new THREE.Group(); ch.position.set(-15, 0, -10);
    const sm = mat(TEX.stoneTexture(), { repeat: [2, 2] }), rm = mat(TEX.roofTexture(), { repeat: [2, 2] });
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 12), sm);
    body.position.y = 3; body.castShadow = true; body.receiveShadow = true; ch.add(body);
    const rs = new THREE.Shape(); rs.moveTo(-5, 0); rs.lineTo(0, 4); rs.lineTo(5, 0);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 13, bevelEnabled: false }), rm);
    roof.position.set(-5, 6, -6.5); roof.castShadow = true; ch.add(roof);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3, 10, 3), sm); tower.position.set(0, 5, -5); tower.castShadow = true; ch.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(2, 4, 4), sm); spire.position.set(0, 12, -5); ch.add(spire);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(1.2, 6), new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.1, transparent: true, opacity: 0.5, emissive: 0x441100 }));
    glass.position.set(0, 4, 6.05); ch.add(glass);
    ch.userData = { type: 'building', name: 'Church' };
    return ch;
}

function buildHouse(x, z, rotY) {
    const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = rotY;
    const sm = mat(TEX.stoneTexture(), { repeat: [2, 1] }), wm = mat(TEX.woodTexture()), rm = mat(TEX.roofTexture(), { repeat: [2, 2] });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), sm);
    walls.position.y = 2; walls.castShadow = true; walls.receiveShadow = true; h.add(walls);
    const rs = new THREE.Shape(); rs.moveTo(-4, 0); rs.lineTo(0, 2.5); rs.lineTo(4, 0);
    const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: 6, bevelEnabled: false }), rm);
    roof.rotation.y = Math.PI / 2; roof.position.set(3, 4, -3); roof.castShadow = true; h.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 0.2), wm); door.position.set(0, 1.25, 2.55); h.add(door);
    return h;
}

function buildTree(x, z, scale) {
    const t = new THREE.Group(); t.position.set(x, 0, z);
    const bm = mat(TEX.barkTexture(), { repeat: [1, 2] });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8), bm);
    trunk.position.y = 1.5 * scale; trunk.castShadow = true; t.add(trunk);
    const cols = [0x2d6b1e, 0x3a8a2a, 0x256118, 0x4a9e35];
    [{y:3.5,r:2.2},{y:4.2,r:1.8},{y:4.8,r:1.2}].forEach(({y, r}) => {
        const lm = new THREE.MeshStandardMaterial({ color: cols[Math.floor(Math.random() * cols.length)], roughness: 0.9 });
        const f = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 8, 6), lm);
        f.position.set((Math.random() - 0.5) * scale * 0.5, y * scale, (Math.random() - 0.5) * scale * 0.5);
        f.castShadow = true; t.add(f);
    });
    t.userData = { type: 'tree', name: 'Tree', hp: 5, maxHp: 5, skill: 'Woodcutting', xp: 25 };
    return t;
}

function buildRock(x, z) {
    const r = new THREE.Group(); r.position.set(x, 0, z);
    const rm = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.9, metalness: 0.1, roughnessMap: roughMap });
    const main = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), rm);
    main.position.y = 0.8; main.scale.y = 0.6; main.castShadow = true; r.add(main);
    const om = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.6, metalness: 0.4 });
    for (let i = 0; i < 3; i++) {
        const v = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 4), om);
        v.position.set((Math.random()-0.5)*1.2, 0.5+Math.random()*0.6, (Math.random()-0.5)*1.2); r.add(v);
    }
    return r;
}

function buildRiver() {
    const rv = new THREE.Group();
    const wt = TEX.waterTexture(); wt.repeat.set(2, 10);
    const wm = new THREE.MeshStandardMaterial({ map: wt, color: 0x2288aa, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.75 });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(12, 200), wm);
    water.rotation.x = -Math.PI / 2; water.position.set(-35, 0.05, 0); water.name = 'water'; rv.add(water);
    const bm = mat(TEX.dirtTexture(), { repeat: [2, 20] });
    [-29, -41].forEach(xOff => {
        const bank = new THREE.Mesh(new THREE.PlaneGeometry(3, 200), bm);
        bank.rotation.x = -Math.PI / 2; bank.position.set(xOff, 0.01, 0); rv.add(bank);
    });
    const bobber = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0x661100 }));
    bobber.position.set(-35, 0.4, 10); bobber.name = 'fishingSpot';
    bobber.userData = { type: 'fishing', name: 'Fishing Spot', skill: 'Fishing', xp: 10 }; rv.add(bobber);
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 }));
    ripple.rotation.x = -Math.PI / 2; ripple.position.set(-35, 0.15, 10); ripple.name = 'ripple'; rv.add(ripple);
    return rv;
}

function buildBridge() {
    const b = new THREE.Group(); b.position.set(-35, 0, 5);
    const sm = mat(TEX.stoneTexture(), { repeat: [2, 1] });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 0.6, 5), sm);
    deck.position.y = 2; deck.castShadow = true; deck.receiveShadow = true; b.add(deck);
    [[-4,0],[4,0]].forEach(([x, z]) => {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 3, 6), sm);
        s.position.set(x, 1, z); s.castShadow = true; b.add(s);
    });
    for (let x = -6; x <= 6; x += 2) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), sm); p.position.set(x, 3, -2.3); b.add(p);
        const p2 = p.clone(); p2.position.z = 2.3; b.add(p2);
    }
    const rg = new THREE.BoxGeometry(13, 0.2, 0.3);
    const r1 = new THREE.Mesh(rg, sm); r1.position.set(0, 3.7, -2.3); b.add(r1);
    const r2 = new THREE.Mesh(rg, sm); r2.position.set(0, 3.7, 2.3); b.add(r2);
    return b;
}

function buildGrassPatch(x, z) {
    const p = new THREE.Group(); p.position.set(x, 0.05, z);
    const cols = [0x3a7d2a, 0x4a8e35, 0x2d6b1e];
    for (let i = 0; i < 5; i++) {
        const bm = new THREE.MeshStandardMaterial({ color: cols[Math.floor(Math.random() * cols.length)], side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 });
        const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.5 + Math.random() * 0.4), bm);
        blade.position.set((Math.random()-0.5)*0.8, 0.3, (Math.random()-0.5)*0.8);
        blade.rotation.y = Math.random() * Math.PI; blade.rotation.x = -0.1; p.add(blade);
    }
    return p;
}

export function buildMaidCafe() {
    const cafe = new THREE.Group(); cafe.position.set(20, 0, 14);
    const pink = mat(TEX.pinkWallTexture(), { repeat: [2, 3] });
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const neonPink = new THREE.MeshStandardMaterial({ color: 0xff69b4, emissive: 0xff1493, emissiveIntensity: 0.6, roughness: 0.2 });
    const neonBlue = new THREE.MeshStandardMaterial({ color: 0x00bfff, emissive: 0x0088ff, emissiveIntensity: 0.5, roughness: 0.2 });

    // 3-story building
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 6), pink); f1.position.y = 2.5; f1.castShadow = true; cafe.add(f1);
    const f2 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4, 6.2), white); f2.position.y = 7; f2.castShadow = true; cafe.add(f2);
    const f3 = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.5, 5.5), pink); f3.position.y = 10.75; f3.castShadow = true; cafe.add(f3);
    const flatRoof = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.3, 6.5), white); flatRoof.position.y = 12.65; cafe.add(flatRoof);

    // Signs
    const topSign = new THREE.Mesh(new THREE.BoxGeometry(5, 1.5, 0.2), neonPink); topSign.position.set(0, 13.7, 3.1); cafe.add(topSign);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.15), neonBlue); s2.position.set(0, 5.5, 3.1); cafe.add(s2);
    const s3 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 0.15), neonPink); s3.position.set(0, 8.5, 3.2); cafe.add(s3);
    const ss = new THREE.Mesh(new THREE.BoxGeometry(0.15, 6, 2), neonPink); ss.position.set(3.1, 6, 0); cafe.add(ss);
    const ss2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4, 1.5), neonBlue); ss2.position.set(-3.1, 7, 0); cafe.add(ss2);

    // Awning & door
    const awning = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 2.5), new THREE.MeshStandardMaterial({ color: 0xff69b4, side: THREE.DoubleSide }));
    awning.position.set(0, 4.6, 4.3); cafe.add(awning);
    const df = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 0.3), neonPink); df.position.set(0, 1.75, 3.05); cafe.add(df);
    const di = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.35), new THREE.MeshStandardMaterial({ color: 0x330022, roughness: 0.9 }));
    di.position.set(0, 1.5, 3.05); cafe.add(di);

    // Glowing windows
    const glowM = new THREE.MeshStandardMaterial({ color: 0xffc0cb, emissive: 0xff69b4, emissiveIntensity: 0.3, transparent: true, opacity: 0.7 });
    [[-1.5,6.5],[1.5,6.5],[-1.5,10],[1.5,10]].forEach(([x, y]) => {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), glowM); w.position.set(x, y, 3.15); cafe.add(w);
    });

    // Neon strips
    [5, 9, 12.5].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 0.1), neonPink); s.position.set(0, y, 3.15); cafe.add(s); });
    [5, 9].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 6), neonBlue); s.position.set(3.1, y, 0); cafe.add(s); });

    // Lights
    const nl = new THREE.PointLight(0xff69b4, 2, 12); nl.position.set(0, 6, 5); cafe.add(nl);
    const nl2 = new THREE.PointLight(0x00bfff, 1, 8); nl2.position.set(3, 7, 0); cafe.add(nl2);

    cafe.userData = { type: 'building', name: '@cafe@ maidreamin ♡' };
    return cafe;
}
