import * as THREE from 'three';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        this.entities = [];
        this.loot = [];
        this._spawnNPCs();
        this._spawnMonsters();
    }

    _body(colors, scale = 1) {
        const g = new THREE.Group();
        const skin = new THREE.MeshStandardMaterial({ color: colors.skin || 0xdeb887, roughness: 0.8 });
        const shirt = new THREE.MeshStandardMaterial({ color: colors.shirt || 0x888888, roughness: 0.7 });
        const pants = new THREE.MeshStandardMaterial({ color: colors.pants || 0x555555, roughness: 0.7 });
        const s = scale;

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7*s, 0.9*s, 0.45*s), shirt); torso.position.y = 1.5*s; torso.castShadow = true; g.add(torso);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.45*s, 0.5*s, 0.45*s), skin); head.position.y = 2.2*s; head.castShadow = true; g.add(head);
        if (colors.hair) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.5*s, 0.25*s, 0.5*s), new THREE.MeshStandardMaterial({ color: colors.hair })); h.position.y = 2.4*s; g.add(h); }
        if (colors.catEars) {
            const em = new THREE.MeshStandardMaterial({ color: 0x222222 });
            [[-0.18,2.55],[0.18,2.55]].forEach(([x,y]) => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.08*s, 0.2*s, 4), em); e.position.set(x*s, y*s, 0); g.add(e); });
        }
        if (colors.apron) {
            const a = new THREE.Mesh(new THREE.BoxGeometry(0.5*s, 0.5*s, 0.02*s), new THREE.MeshStandardMaterial({ color: 0xffffff }));
            a.position.set(0, 1.3*s, 0.25*s); g.add(a);
        }

        g.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25*s, 0.7*s, 0.25*s), pants); g.leftLeg.position.set(-0.15*s, 0.75*s, 0); g.add(g.leftLeg);
        g.rightLeg = g.leftLeg.clone(); g.rightLeg.position.x = 0.15*s; g.add(g.rightLeg);
        g.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2*s, 0.8*s, 0.2*s), shirt); g.leftArm.position.set(-0.45*s, 1.5*s, 0); g.add(g.leftArm);
        g.rightArm = g.leftArm.clone(); g.rightArm.position.x = 0.45*s; g.add(g.rightArm);
        return g;
    }

    _nameSprite(name, color = 0xffff00) {
        const c = document.createElement('canvas'); c.width = 256; c.height = 64;
        const ctx = c.getContext('2d'); ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText(name, 128, 40);
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0'); ctx.fillText(name, 128, 40);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
        sp.scale.set(2.5, 0.6, 1); return sp;
    }

    _lvlSprite(level) {
        const c = document.createElement('canvas'); c.width = 128; c.height = 32;
        const ctx = c.getContext('2d'); ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
        ctx.fillStyle = '#0f0'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText(`(level-${level})`, 64, 22); ctx.fillText(`(level-${level})`, 64, 22);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
        sp.scale.set(1.8, 0.4, 1); return sp;
    }

    _spawnNPCs() {
        const npcs = [
            { name: 'Hans', pos: [2,0,-10], colors: { shirt: 0xcc8833, pants: 0x664422, hair: 0x888888 }, dialog: ['Welcome to Lumbridge!', "The Duke is upstairs in the castle."] },
            { name: 'Cook', pos: [5,0,-18], colors: { shirt: 0xffffff, pants: 0x444444, hair: 0x553300 }, dialog: ["It's terrible! I need an egg, flour, and milk for the Duke's dinner!"] },
            { name: 'Duke Horacio', pos: [0,0,-22], colors: { shirt: 0x8800aa, pants: 0x440066, hair: 0x444444 }, dialog: ['Greetings. Speak to my cook if you wish to help.'] },
            { name: 'Shopkeeper', pos: [15,0,12], colors: { shirt: 0x886644, pants: 0x553322, hair: 0x222222 }, dialog: ['Can I help you? We buy and sell!'] },
            { name: 'Father Aereck', pos: [-15,0,-6], colors: { shirt: 0x111111, pants: 0x111111, hair: 0x999999 }, dialog: ['Welcome to the church of Saradomin.'] },
            { name: 'Bob', pos: [-8,0,5], colors: { shirt: 0x2244aa, pants: 0x224488, hair: 0x332200 }, dialog: ["I'm Bob, the axe shop owner."] },
            { name: 'Maid Neko ♡', pos: [20,0,18], colors: { shirt: 0xff69b4, pants: 0x222222, hair: 0x111111, catEars: true, apron: true },
              dialog: ['Welcome home, Master! ♡ Would you like some tea?', 'Nyaa~ Our special today is the Moe Moe Omurice! ♡', 'Master, you look tired from adventuring~', 'This is @cafe@ maidreamin! #1 maid café in Gielinor! ♡'] },
            { name: 'L0nely_N00b', pos: [22,0,19], colors: { shirt: 0x00aa00, pants: 0x006600, hair: 0xff0000 },
              dialog: ['buying gf 10k', 'anyone selling gf?', 'will pay 10k for gf pls'], shout: true, shoutInterval: 8, shoutMsg: 'buying gf 10k' },
        ];

        npcs.forEach(data => {
            const body = this._body(data.colors);
            body.position.set(...data.pos);
            const tag = this._nameSprite(data.name); tag.position.y = 2.8; body.add(tag);
            this.scene.add(body);
            this.entities.push({
                mesh: body, type: 'npc', name: data.name, dialog: data.dialog, dialogIndex: 0,
                basePos: new THREE.Vector3(...data.pos), wanderTimer: Math.random() * 5, wanderTarget: null,
                shout: data.shout || false, shoutInterval: data.shoutInterval || 10,
                shoutTimer: Math.random() * 5, shoutMsg: data.shoutMsg || '', animTime: Math.random() * 10,
            });
        });
    }

    _spawnMonsters() {
        const monsters = [
            ...Array.from({length: 5}, (_, i) => ({ name: 'Chicken', level: 1, hp: 3, maxHp: 3, pos: [8+i*2, 0, 20+Math.random()*5], color: 0xffffff, scale: 0.4, loot: [{name:'Bones',icon:'🦴'},{name:'Raw chicken',icon:'🍗'},{name:'Feather',icon:'🪶'}] })),
            ...Array.from({length: 3}, (_, i) => ({ name: 'Giant rat', level: 1, hp: 2, maxHp: 2, pos: [-5+i*2, 0, 15], color: 0x8B7355, scale: 0.35, loot: [{name:'Bones',icon:'🦴'},{name:'Raw rat meat',icon:'🥩'}] })),
            ...Array.from({length: 4}, (_, i) => ({ name: 'Goblin', level: 2, hp: 5, maxHp: 5, pos: [35+i*3, 0, 25+Math.random()*5], color: 0x55aa44, scale: 0.55, loot: [{name:'Bones',icon:'🦴'},{name:'Coins',icon:'🪙',qty:Math.floor(Math.random()*20)+1}] })),
        ];

        monsters.forEach(data => {
            const g = new THREE.Group(); g.position.set(...data.pos);

            if (data.name === 'Chicken') {
                const bm = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.9 });
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bm); body.position.y = 0.4; body.scale.set(1, 0.8, 1.2); g.add(body);
                const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), bm); head.position.set(0, 0.6, 0.25); g.add(head);
                const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), new THREE.MeshStandardMaterial({ color: 0xffaa00 }));
                beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.58, 0.4); g.add(beak);
                const comb = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.1, 0.08), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
                comb.position.set(0, 0.72, 0.2); g.add(comb);
                const lm = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
                [[-0.08,0],[0.08,0]].forEach(([x]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), lm); l.position.set(x, 0.12, 0); g.add(l); });
            } else if (data.name === 'Giant rat') {
                const bm = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.9 });
                const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), bm); body.position.y = 0.25; body.scale.set(1, 0.7, 1.4); g.add(body);
                const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), bm); head.position.set(0, 0.3, 0.3); g.add(head);
                const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0xbb9977 }));
                tail.rotation.x = -0.8; tail.position.set(0, 0.2, -0.35); g.add(tail);
            } else if (data.name === 'Goblin') {
                const body = this._body({ skin: 0x55aa44, shirt: 0x886633, pants: 0x664422 }, data.scale); g.add(body);
                const em = new THREE.MeshStandardMaterial({ color: 0x55aa44 });
                [[-0.2,1.3],[0.2,1.3]].forEach(([x, y]) => {
                    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 4), em);
                    ear.rotation.z = x > 0 ? -0.5 : 0.5; ear.position.set(x*data.scale, y*data.scale, 0); g.add(ear);
                });
            }

            const tag = this._nameSprite(data.name); tag.position.y = data.name === 'Goblin' ? 1.8 : 1.2; g.add(tag);
            const lvl = this._lvlSprite(data.level); lvl.position.y = (data.name === 'Goblin' ? 1.8 : 1.2) - 0.35; g.add(lvl);

            this.scene.add(g);
            this.entities.push({
                mesh: g, type: 'monster', name: data.name, level: data.level,
                hp: data.hp, maxHp: data.maxHp, basePos: new THREE.Vector3(...data.pos),
                wanderTimer: Math.random() * 5, wanderTarget: null, loot: data.loot,
                dead: false, respawnTimer: 0, animTime: Math.random() * 10,
            });
        });
    }

    update(dt, chatFn) {
        this.entities.forEach(e => {
            if (e.dead) { e.respawnTimer -= dt; if (e.respawnTimer <= 0) { e.dead = false; e.hp = e.maxHp; e.mesh.visible = true; e.mesh.position.copy(e.basePos); } return; }
            e.wanderTimer -= dt;
            if (e.wanderTimer <= 0) {
                e.wanderTimer = 3 + Math.random() * 5;
                e.wanderTarget = new THREE.Vector3(e.basePos.x + (Math.random()-0.5)*6, 0, e.basePos.z + (Math.random()-0.5)*6);
            }
            if (e.wanderTarget) {
                const dir = new THREE.Vector3().subVectors(e.wanderTarget, e.mesh.position); dir.y = 0;
                if (dir.length() > 0.3) {
                    dir.normalize(); e.mesh.position.addScaledVector(dir, 1.5 * dt);
                    e.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                    e.animTime += dt * 5;
                    if (e.mesh.leftArm) {
                        const s = Math.sin(e.animTime) * 0.4;
                        e.mesh.leftArm.rotation.x = s; e.mesh.rightArm.rotation.x = -s;
                        e.mesh.leftLeg.rotation.x = -s; e.mesh.rightLeg.rotation.x = s;
                    }
                } else e.wanderTarget = null;
            }
            if (e.shout && chatFn) { e.shoutTimer -= dt; if (e.shoutTimer <= 0) { e.shoutTimer = e.shoutInterval + Math.random() * 4; chatFn(e.name, e.shoutMsg); } }
        });
    }

    getEntityAt(position, radius = 2) {
        let closest = null, dist = radius;
        this.entities.forEach(e => { if (e.dead) return; const d = e.mesh.position.distanceTo(position); if (d < dist) { dist = d; closest = e; } });
        return closest;
    }

    killEntity(entity) { entity.dead = true; entity.mesh.visible = false; entity.respawnTimer = 15 + Math.random() * 10; return entity.loot || []; }

    addLoot(items, position) {
        items.forEach(item => { this.loot.push({ ...item, position: position.clone().add(new THREE.Vector3((Math.random()-0.5), 0, (Math.random()-0.5))), timer: 60 }); });
    }
}
