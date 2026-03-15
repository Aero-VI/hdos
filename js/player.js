import * as THREE from 'three';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.position.set(0, 0, 10);
        this.targetPos = this.group.position.clone();
        this.speed = 6; this.moving = false; this.animTime = 0;
        this.hp = 10; this.maxHp = 10; this.prayer = 1; this.maxPrayer = 1; this.run = 100;
        this.combatTarget = null; this.attackCooldown = 0;
        this.skills = {};
        ['Attack','Strength','Defence','Hitpoints','Ranged','Prayer','Magic','Cooking','Woodcutting','Fletching','Fishing','Firemaking','Crafting','Smithing','Mining','Herblore','Agility','Thieving','Slayer','Farming','Runecraft','Hunter','Construction'].forEach(s => {
            this.skills[s] = { level: s === 'Hitpoints' ? 10 : 1, xp: s === 'Hitpoints' ? 1154 : 0 };
        });
        this.inventory = [];
        this.skilling = null;
        this._build();
        scene.add(this.group);
    }

    _build() {
        const skin = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.8 });
        const shirt = new THREE.MeshStandardMaterial({ color: 0x2266bb, roughness: 0.7 });
        const pants = new THREE.MeshStandardMaterial({ color: 0x333355, roughness: 0.7 });
        const boots = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.9 });
        const hair = new THREE.MeshStandardMaterial({ color: 0x3a1f00, roughness: 0.95 });
        const eye = new THREE.MeshStandardMaterial({ color: 0x111111 });

        this.body = new THREE.Group();
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.5), shirt); torso.position.y = 1.6; torso.castShadow = true; this.body.add(torso);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), skin); head.position.y = 2.4; head.castShadow = true; this.body.add(head);
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.55), hair); h.position.y = 2.6; this.body.add(h);
        [[-0.12, 2.4, 0.26], [0.12, 2.4, 0.26]].forEach(([x, y, z]) => {
            const e = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.02), eye); e.position.set(x, y, z); this.body.add(e);
        });

        this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), shirt);
        this.leftArm.position.set(-0.55, 1.6, 0); this.leftArm.geometry.translate(0, -0.45, 0); this.leftArm.castShadow = true;
        const handL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), skin); handL.position.set(0, -0.55, 0); this.leftArm.add(handL);
        this.body.add(this.leftArm);

        this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), shirt);
        this.rightArm.position.set(0.55, 1.6, 0); this.rightArm.geometry.translate(0, -0.45, 0); this.rightArm.castShadow = true;
        this.rightArm.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), skin).translateY(-0.55));
        this.body.add(this.rightArm);

        this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), pants);
        this.leftLeg.position.set(-0.2, 0.9, 0); this.leftLeg.geometry.translate(0, -0.4, 0); this.leftLeg.castShadow = true;
        this.leftLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.4), boots).translateY(-0.5).translateZ(0.05));
        this.body.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), pants);
        this.rightLeg.position.set(0.2, 0.9, 0); this.rightLeg.geometry.translate(0, -0.4, 0); this.rightLeg.castShadow = true;
        this.rightLeg.add(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.25, 0.4), boots).translateY(-0.5).translateZ(0.05));
        this.body.add(this.rightLeg);

        // Name tag
        const c = document.createElement('canvas'); c.width = 256; c.height = 64;
        const ctx = c.getContext('2d'); ctx.font = 'bold 28px Arial'; ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.strokeText('You', 128, 40);
        ctx.fillStyle = '#00ff00'; ctx.fillText('You', 128, 40);
        const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
        tag.scale.set(2, 0.5, 1); tag.position.y = 3; this.body.add(tag);

        this.group.add(this.body);
    }

    moveTo(target) { this.targetPos.copy(target); this.targetPos.y = 0; this.moving = true; this.skilling = null; }

    update(dt) {
        if (this.moving) {
            const dir = new THREE.Vector3().subVectors(this.targetPos, this.group.position); dir.y = 0;
            if (dir.length() > 0.3) {
                dir.normalize(); this.group.position.addScaledVector(dir, this.speed * dt);
                this.group.rotation.y = Math.atan2(dir.x, dir.z);
                this.animTime += dt * 8;
                const s = Math.sin(this.animTime) * 0.6;
                this.leftArm.rotation.x = s; this.rightArm.rotation.x = -s;
                this.leftLeg.rotation.x = -s; this.rightLeg.rotation.x = s;
            } else {
                this.moving = false;
                this.leftArm.rotation.x = this.rightArm.rotation.x = this.leftLeg.rotation.x = this.rightLeg.rotation.x = 0;
            }
        }
        if (this.combatTarget && !this.moving) {
            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) { this.attackCooldown = 2.4; return { type: 'attack' }; }
        }
        if (this.skilling && !this.moving) {
            this.skilling.timer -= dt;
            this.animTime += dt * 6; this.rightArm.rotation.x = Math.sin(this.animTime) * 1.0;
            if (this.skilling.timer <= 0) return { type: 'skill_complete', skill: this.skilling };
        }
        return null;
    }

    addXp(skillName, amount) {
        const skill = this.skills[skillName]; if (!skill) return;
        skill.xp += amount;
        let level = 1, needed = 0;
        for (let l = 1; l < 99; l++) {
            needed += Math.floor(l + 300 * Math.pow(2, l / 7)) / 4;
            if (skill.xp >= needed) level = l + 1; else break;
        }
        const old = skill.level; skill.level = level;
        return level > old ? level : null;
    }

    get position() { return this.group.position; }
}
