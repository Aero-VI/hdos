// player.js — Player character, movement, combat, skilling
import * as THREE from 'three';
import { colorMat } from './textures.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'player';

    // Stats
    this.stats = {
      hp: 10, maxHp: 10,
      prayer: 1, maxPrayer: 1,
      runEnergy: 100,
      attack: 1, strength: 1, defence: 1,
      hitpoints: 10,
      mining: 1, woodcutting: 1, fishing: 1,
      cooking: 1, firemaking: 1,
    };
    this.xp = {
      attack: 0, strength: 0, defence: 0, hitpoints: 1154,
      mining: 0, woodcutting: 0, fishing: 0, cooking: 0, firemaking: 0,
    };

    // Inventory (28 slots)
    this.inventory = new Array(28).fill(null);
    // Give starter items
    this.inventory[0] = { name: 'Bronze Sword', icon: '⚔️', count: 1, type: 'weapon', attack: 2 };
    this.inventory[1] = { name: 'Bronze Axe', icon: '🪓', count: 1, type: 'tool' };
    this.inventory[2] = { name: 'Bronze Pickaxe', icon: '⛏️', count: 1, type: 'tool' };
    this.inventory[3] = { name: 'Net', icon: '🥅', count: 1, type: 'tool' };
    this.inventory[4] = { name: 'Tinderbox', icon: '🔥', count: 1, type: 'tool' };
    this.inventory[5] = { name: 'Coins', icon: '🪙', count: 25, type: 'currency' };

    // Movement
    this.moveTarget = null;
    this.moveSpeed = 6;
    this.isMoving = false;

    // Combat
    this.combatTarget = null;
    this.combatCooldown = 0;
    this.attackSpeed = 2.4; // seconds between attacks

    // Skilling
    this.skillingTarget = null;
    this.skillingType = null;
    this.skillingCooldown = 0;

    // Build the player model
    this._buildModel();

    // Click marker
    this.marker = this._createMarker();
    scene.add(this.marker);
    this.marker.visible = false;

    scene.add(this.group);
  }

  _buildModel() {
    const skinMat = colorMat(0xDEB887, 0.85);
    const shirtMat = colorMat(0x336699, 0.8);
    const pantsMat = colorMat(0x554433, 0.85);
    const hairMat = colorMat(0x332211, 0.9);
    const bootMat = colorMat(0x3A2211, 0.9);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), skinMat);
    head.position.y = 3.1;
    head.castShadow = true;
    this.group.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.4, 0.75), hairMat);
    hair.position.y = 3.6;
    this.group.add(hair);

    // Eyes
    for (const s of [-0.15, 0.15]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), colorMat(0x111111));
      eye.position.set(s, 3.15, 0.37);
      this.group.add(eye);
    }

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.55), shirtMat);
    torso.position.y = 2.15;
    torso.castShadow = true;
    this.group.add(torso);

    // Arms
    this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3), shirtMat);
    this.leftArm.position.set(-0.6, 2.1, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.0, 0.3), shirtMat);
    this.rightArm.position.set(0.6, 2.1, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // Hands
    for (const s of [-0.6, 0.6]) {
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), skinMat);
      hand.position.set(s, 1.5, 0);
      this.group.add(hand);
    }

    // Legs
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.4), pantsMat);
    this.leftLeg.position.set(-0.2, 1.05, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.4), pantsMat);
    this.rightLeg.position.set(0.2, 1.05, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // Boots
    for (const s of [-0.2, 0.2]) {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.5), bootMat);
      boot.position.set(s, 0.5, 0.05);
      this.group.add(boot);
    }

    // Overhead name
    // (handled in UI layer)

    this.group.position.set(0, 0, 15);
  }

  _createMarker() {
    const markerGroup = new THREE.Group();
    // Yellow X marker on ground
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFFF00, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 2; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 1.2), mat);
      bar.rotation.y = (i === 0) ? Math.PI / 4 : -Math.PI / 4;
      markerGroup.add(bar);
    }
    return markerGroup;
  }

  setMoveTarget(point) {
    this.moveTarget = point.clone();
    this.isMoving = true;
    this.combatTarget = null;
    this.skillingTarget = null;
    this.skillingType = null;

    // Show marker
    this.marker.position.copy(point);
    this.marker.position.y += 0.15;
    this.marker.visible = true;
  }

  setCombatTarget(enemy) {
    this.combatTarget = enemy;
    this.skillingTarget = null;
    this.skillingType = null;
  }

  setSkillingTarget(target, type) {
    this.skillingTarget = target;
    this.skillingType = type;
    this.combatTarget = null;
    this.skillingCooldown = 0;
  }

  update(delta, time, callbacks = {}) {
    const hFn = window._terrainHeight || (() => 0);

    // Walk animation
    if (this.isMoving) {
      const walkCycle = Math.sin(time * 8) * 0.4;
      this.leftLeg.rotation.x = walkCycle;
      this.rightLeg.rotation.x = -walkCycle;
      this.leftArm.rotation.x = -walkCycle * 0.6;
      this.rightArm.rotation.x = walkCycle * 0.6;
    } else {
      // Idle — subtle breathing
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
    }

    // Movement
    if (this.moveTarget) {
      const dx = this.moveTarget.x - this.group.position.x;
      const dz = this.moveTarget.z - this.group.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.3) {
        const step = Math.min(this.moveSpeed * delta, dist);
        this.group.position.x += (dx / dist) * step;
        this.group.position.z += (dz / dist) * step;
        this.group.position.y = hFn(this.group.position.x, this.group.position.z);
        this.group.rotation.y = Math.atan2(dx, dz);
        this.isMoving = true;
      } else {
        this.moveTarget = null;
        this.isMoving = false;
        this.marker.visible = false;
      }
    }

    // Combat — move to target then attack
    if (this.combatTarget && !this.combatTarget.userData.isDead) {
      const enemy = this.combatTarget;
      const dx = enemy.position.x - this.group.position.x;
      const dz = enemy.position.z - this.group.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 2.5) {
        // Walk to enemy
        const step = this.moveSpeed * delta;
        this.group.position.x += (dx / dist) * step;
        this.group.position.z += (dz / dist) * step;
        this.group.position.y = hFn(this.group.position.x, this.group.position.z);
        this.group.rotation.y = Math.atan2(dx, dz);
        this.isMoving = true;
        this.moveTarget = null;
      } else {
        this.isMoving = false;
        this.group.rotation.y = Math.atan2(dx, dz);

        // Attack
        this.combatCooldown -= delta;
        if (this.combatCooldown <= 0) {
          this.combatCooldown = this.attackSpeed;
          const maxHit = Math.max(1, this.stats.strength);
          const hit = Math.floor(Math.random() * (maxHit + 1));
          enemy.userData.hp -= hit;

          // Attack animation (arm swing)
          this.rightArm.rotation.x = -1.2;
          setTimeout(() => { if (this.rightArm) this.rightArm.rotation.x = 0; }, 200);

          if (callbacks.onHit) callbacks.onHit(enemy, hit);

          if (enemy.userData.hp <= 0) {
            enemy.userData.isDead = true;
            enemy.visible = false;
            this.combatTarget = null;
            if (callbacks.onKill) callbacks.onKill(enemy);

            // Respawn after 10s
            setTimeout(() => {
              enemy.userData.hp = enemy.userData.maxHp;
              enemy.userData.isDead = false;
              enemy.visible = true;
              if (enemy.userData.respawnPos) {
                enemy.position.copy(enemy.userData.respawnPos);
              }
            }, 10000);
          }
        }
      }
    } else if (this.combatTarget && this.combatTarget.userData.isDead) {
      this.combatTarget = null;
    }

    // Skilling
    if (this.skillingTarget) {
      const target = this.skillingTarget;
      const dx = target.position.x - this.group.position.x;
      const dz = target.position.z - this.group.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 3) {
        const step = this.moveSpeed * delta;
        this.group.position.x += (dx / dist) * step;
        this.group.position.z += (dz / dist) * step;
        this.group.position.y = hFn(this.group.position.x, this.group.position.z);
        this.group.rotation.y = Math.atan2(dx, dz);
        this.isMoving = true;
      } else {
        this.isMoving = false;
        this.group.rotation.y = Math.atan2(dx, dz);
        this.skillingCooldown -= delta;

        if (this.skillingCooldown <= 0) {
          this.skillingCooldown = 3 + Math.random() * 2; // 3-5s between actions

          // Arm animation
          this.rightArm.rotation.x = -0.8;
          setTimeout(() => { if (this.rightArm) this.rightArm.rotation.x = 0; }, 300);

          if (callbacks.onSkill) callbacks.onSkill(this.skillingType, target);
        }
      }
    }
  }

  addItem(item) {
    // Try to stack
    if (item.count) {
      for (let i = 0; i < 28; i++) {
        if (this.inventory[i] && this.inventory[i].name === item.name) {
          this.inventory[i].count += item.count;
          return true;
        }
      }
    }
    // Find empty slot
    for (let i = 0; i < 28; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { ...item, count: item.count || 1 };
        return true;
      }
    }
    return false; // inventory full
  }

  hasItem(name) {
    return this.inventory.some(i => i && i.name === name);
  }

  // XP and leveling
  addXP(skill, amount) {
    this.xp[skill] = (this.xp[skill] || 0) + amount;
    const newLevel = this.xpToLevel(this.xp[skill]);
    if (newLevel > this.stats[skill]) {
      this.stats[skill] = newLevel;
      if (skill === 'hitpoints') {
        this.stats.maxHp = newLevel;
        this.stats.hp = newLevel;
      }
      return { levelUp: true, skill, level: newLevel };
    }
    return { levelUp: false, amount };
  }

  xpToLevel(xp) {
    // RS XP table approximation
    let level = 1;
    let total = 0;
    for (let l = 1; l < 99; l++) {
      total += Math.floor(l + 300 * Math.pow(2, l / 7)) / 4;
      if (xp >= total) level = l + 1;
      else break;
    }
    return Math.min(level, 99);
  }
}
