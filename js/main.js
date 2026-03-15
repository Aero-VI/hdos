// Main entry — scene setup, game loop, input handling
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { EntityManager } from './npcs.js';
import { UIManager } from './ui.js';

// === SCENE SETUP ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.getElementById('game-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();

// === FOG ===
scene.fog = new THREE.FogExp2(0x9bc4e0, 0.008);

// === SKY ===
const skyGeo = new THREE.SphereGeometry(500, 32, 15);
const skyMat = new THREE.ShaderMaterial({
    uniforms: {
        topColor: { value: new THREE.Color(0x4488cc) },
        bottomColor: { value: new THREE.Color(0xb8d8f0) },
        offset: { value: 20 },
        exponent: { value: 0.5 },
    },
    vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
    `,
    side: THREE.BackSide,
});
scene.add(new THREE.Mesh(skyGeo, skyMat));

// === LIGHTING ===
// Warm directional sunlight
const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.0);
sunLight.position.set(30, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 150;
sunLight.shadow.camera.left = -60;
sunLight.shadow.camera.right = 60;
sunLight.shadow.camera.top = 60;
sunLight.shadow.camera.bottom = -60;
sunLight.shadow.bias = -0.001;
scene.add(sunLight);

// Ambient for soft fill
const ambientLight = new THREE.AmbientLight(0x667799, 0.6);
scene.add(ambientLight);

// Hemisphere for sky/ground bounce
const hemiLight = new THREE.HemisphereLight(0x88aacc, 0x445522, 0.5);
scene.add(hemiLight);

// === CAMERA ===
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
let cameraAngle = 0;
let cameraPitch = 0.6; // Radians from horizontal
let cameraDistance = 18;

function updateCamera() {
    const target = player.position;
    const x = target.x + Math.sin(cameraAngle) * Math.cos(cameraPitch) * cameraDistance;
    const z = target.z + Math.cos(cameraAngle) * Math.cos(cameraPitch) * cameraDistance;
    const y = target.y + Math.sin(cameraPitch) * cameraDistance;
    camera.position.set(x, y, z);
    camera.lookAt(target.x, target.y + 1.5, target.z);
}

// === BUILD WORLD ===
const worldGroup = buildWorld(scene);
const player = new Player(scene);
const entities = new EntityManager(scene);
const ui = new UIManager(player);

// === INPUT ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isMiddleDown = false;
let lastMouseX = 0, lastMouseY = 0;

// Click to move / interact
renderer.domElement.addEventListener('click', (e) => {
    if (e.button !== 0) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Check entities
    const entityMeshes = entities.entities.filter(e => !e.dead).map(e => e.mesh);
    // Raycast all entity children
    const allMeshes = [];
    entityMeshes.forEach(m => {
        m.traverse(child => { if (child.isMesh) { child.userData._parentEntity = m; allMeshes.push(child); }});
    });
    const entityHits = raycaster.intersectObjects(allMeshes, false);
    if (entityHits.length > 0) {
        const hitMesh = entityHits[0].object;
        const parentMesh = hitMesh.userData._parentEntity || hitMesh.parent;
        const entity = entities.entities.find(e => e.mesh === parentMesh);
        if (entity) {
            handleEntityClick(entity, e);
            return;
        }
    }

    // Check world objects (trees, rocks)
    const worldHits = raycaster.intersectObjects(worldGroup.children, true);
    for (const hit of worldHits) {
        let obj = hit.object;
        while (obj.parent && obj.parent !== scene && obj.parent !== worldGroup) obj = obj.parent;
        if (obj.userData && obj.userData.type === 'tree') {
            startSkilling(obj, 'Woodcutting', hit.point);
            return;
        }
        if (obj.userData && obj.userData.type === 'rock') {
            startSkilling(obj, 'Mining', hit.point);
            return;
        }
        if (obj.userData && obj.userData.type === 'fishing') {
            startSkilling(obj, 'Fishing', hit.point);
            return;
        }
    }

    // Ground click
    const groundHits = raycaster.intersectObjects(worldGroup.children.filter(c => c.name === 'ground'), true);
    if (groundHits.length > 0) {
        const point = groundHits[0].point;
        player.moveTo(point);
        player.combatTarget = null;
        showClickMarker(e.clientX, e.clientY);
    }
});

// Right-click context menu
renderer.domElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const entityMeshes = entities.entities.filter(e => !e.dead).map(e => e.mesh);
    const allMeshes = [];
    entityMeshes.forEach(m => {
        m.traverse(child => { if (child.isMesh) { child.userData._parentEntity = m; allMeshes.push(child); }});
    });
    const hits = raycaster.intersectObjects(allMeshes, false);
    if (hits.length > 0) {
        const parentMesh = hits[0].object.userData._parentEntity || hits[0].object.parent;
        const entity = entities.entities.find(e => e.mesh === parentMesh);
        if (entity) {
            const opts = entity.type === 'npc'
                ? [{ action: 'Talk-to', label: entity.name }, { action: 'Examine', label: entity.name }]
                : [{ action: 'Attack', label: entity.name }, { action: 'Examine', label: entity.name }];
            ui.showContextMenu(e.clientX, e.clientY, entity.name, opts, {
                'Talk-to': () => talkToNpc(entity),
                'Attack': () => attackEntity(entity),
                'Examine': () => ui.addChatMessage(`It's a ${entity.name}${entity.level ? ` (level ${entity.level})` : ''}.`, 'game'),
            });
            return;
        }
    }

    // World objects
    const worldHits = raycaster.intersectObjects(worldGroup.children, true);
    for (const hit of worldHits) {
        let obj = hit.object;
        while (obj.parent && obj.parent !== scene && obj.parent !== worldGroup) obj = obj.parent;
        if (obj.userData && obj.userData.type) {
            const name = obj.userData.name || obj.userData.type;
            const opts = [];
            if (obj.userData.skill) opts.push({ action: obj.userData.skill === 'Woodcutting' ? 'Chop down' : obj.userData.skill === 'Mining' ? 'Mine' : 'Fish', label: name });
            opts.push({ action: 'Examine', label: name });
            ui.showContextMenu(e.clientX, e.clientY, name, opts, {
                'Chop down': () => startSkilling(obj, 'Woodcutting', hit.point),
                'Mine': () => startSkilling(obj, 'Mining', hit.point),
                'Fish': () => startSkilling(obj, 'Fishing', hit.point),
                'Examine': () => ui.addChatMessage(`It's a ${name.toLowerCase()}.`, 'game'),
            });
            return;
        }
    }

    // Ground
    ui.showContextMenu(e.clientX, e.clientY, 'Ground', [
        { action: 'Walk here', label: '' },
        { action: 'Examine', label: '' },
    ]);
});

// Camera controls
renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 1) { isMiddleDown = true; lastMouseX = e.clientX; lastMouseY = e.clientY; e.preventDefault(); }
});
window.addEventListener('mouseup', (e) => {
    if (e.button === 1) isMiddleDown = false;
});
window.addEventListener('mousemove', (e) => {
    if (isMiddleDown) {
        cameraAngle += (e.clientX - lastMouseX) * 0.005;
        cameraPitch = Math.max(0.15, Math.min(1.2, cameraPitch + (e.clientY - lastMouseY) * 0.005));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }
});
renderer.domElement.addEventListener('wheel', (e) => {
    cameraDistance = Math.max(5, Math.min(40, cameraDistance + e.deltaY * 0.02));
    e.preventDefault();
}, { passive: false });

// Arrow key camera rotation
window.addEventListener('keydown', (e) => {
    if (document.activeElement === document.getElementById('chat-input')) return;
    if (e.key === 'ArrowLeft') cameraAngle -= 0.05;
    if (e.key === 'ArrowRight') cameraAngle += 0.05;
    if (e.key === 'ArrowUp') cameraPitch = Math.min(1.2, cameraPitch + 0.05);
    if (e.key === 'ArrowDown') cameraPitch = Math.max(0.15, cameraPitch - 0.05);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// === INTERACTION FUNCTIONS ===
function handleEntityClick(entity, event) {
    if (entity.type === 'npc') {
        // Walk to then talk
        const target = entity.mesh.position.clone();
        target.z += 1.5;
        player.moveTo(target);
        player.combatTarget = null;
        // Talk when arrived
        const checkArrival = setInterval(() => {
            if (!player.moving) {
                clearInterval(checkArrival);
                talkToNpc(entity);
            }
        }, 200);
    } else if (entity.type === 'monster') {
        attackEntity(entity);
    }
    showClickMarker(event.clientX, event.clientY);
}

function talkToNpc(entity) {
    if (!entity.dialog || entity.dialog.length === 0) return;
    const text = entity.dialog[entity.dialogIndex % entity.dialog.length];
    entity.dialogIndex++;
    ui.showNpcDialog(entity.name, text);
    ui.addChatMessage(`${entity.name}: ${text}`, 'game');
}

function attackEntity(entity) {
    if (entity.dead) return;
    const target = entity.mesh.position.clone();
    target.z += 1.5;
    player.moveTo(target);
    player.combatTarget = entity;
    player.attackCooldown = 0.5;
    ui.addChatMessage(`You attack the ${entity.name}.`, 'game');
}

function startSkilling(obj, skillName, point) {
    player.moveTo(point);
    player.combatTarget = null;
    player.skilling = {
        type: skillName,
        target: obj,
        timer: 2.5 + Math.random(),
    };
    const action = skillName === 'Woodcutting' ? 'chop the tree' : skillName === 'Mining' ? 'mine the rock' : 'fish';
    ui.addChatMessage(`You attempt to ${action}.`, 'game');
}

function showClickMarker(x, y) {
    const marker = document.getElementById('click-marker');
    marker.classList.remove('hidden');
    marker.style.left = x + 'px';
    marker.style.top = y + 'px';
    setTimeout(() => marker.classList.add('hidden'), 600);
}

function toScreen(position) {
    const pos = position.clone();
    pos.y += 1.5;
    pos.project(camera);
    return {
        x: (pos.x * 0.5 + 0.5) * window.innerWidth,
        y: (-pos.y * 0.5 + 0.5) * window.innerHeight,
    };
}

// === WATER ANIMATION ===
let waterTime = 0;

// === GAME LOOP ===
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    waterTime += dt;

    // Update player
    const event = player.update(dt);
    if (event) {
        if (event.type === 'attack' && player.combatTarget) {
            const target = player.combatTarget;
            if (!target.dead) {
                const damage = Math.floor(Math.random() * 3) + 1;
                const miss = Math.random() < 0.2;
                if (!miss) {
                    target.hp -= damage;
                }
                const screenPos = toScreen(target.mesh.position);
                ui.showHitSplat(screenPos, damage, miss);
                ui.showHealthBar(screenPos, Math.max(0, target.hp), target.maxHp);

                if (target.hp <= 0) {
                    const loot = entities.killEntity(target);
                    entities.addLoot(loot, target.mesh.position.clone());
                    player.combatTarget = null;
                    player.addXp('Attack', 4 * target.maxHp);
                    player.addXp('Hitpoints', Math.floor(1.33 * target.maxHp));
                    ui.showXpDrop('Attack', 4 * target.maxHp);
                    ui.showXpDrop('Hitpoints', Math.floor(1.33 * target.maxHp));
                    ui.addChatMessage(`You killed the ${target.name}!`, 'game');
                    ui.refreshStats();
                }
            }
        }
        if (event.type === 'skill_complete') {
            const skill = event.skill;
            const xp = skill.target.userData?.xp || 25;
            const skillName = skill.type;
            const newLevel = player.addXp(skillName, xp);
            ui.showXpDrop(skillName, xp);
            ui.addChatMessage(`You get some ${skillName.toLowerCase()} experience.`, 'game');

            // Give resource
            const items = {
                Woodcutting: { name: 'Logs', icon: 'https://oldschool.runescape.wiki/images/Logs.png' },
                Mining: { name: 'Copper ore', icon: 'https://oldschool.runescape.wiki/images/Copper_ore.png' },
                Fishing: { name: 'Raw shrimps', icon: 'https://oldschool.runescape.wiki/images/Raw_shrimps.png' },
            };
            const item = items[skillName];
            if (item && player.inventory.length < 28) {
                player.inventory.push({ ...item });
                ui.refreshInventory();
                ui.addChatMessage(`You get some ${item.name.toLowerCase()}.`, 'game');
            }

            if (newLevel) {
                ui.addChatMessage(`Congratulations! You've reached level ${newLevel} ${skillName}!`, 'system');
            }

            ui.refreshStats();

            // Continue skilling
            player.skilling = {
                type: skillName,
                target: skill.target,
                timer: 2 + Math.random() * 1.5,
            };
        }
    }

    // Update entities
    entities.update(dt, (name, msg) => {
        ui.addChatMessage(msg, 'public', name);
    });

    // Loot pickup
    entities.loot = entities.loot.filter(item => {
        item.timer -= dt;
        if (item._pickup && player.inventory.length < 28) {
            player.inventory.push({ name: item.name, icon: item.icon || '📦', emoji: item.icon, qty: item.qty });
            ui.refreshInventory();
            ui.addChatMessage(`You pick up: ${item.name}${item.qty ? ` (${item.qty})` : ''}.`, 'game');
            return false;
        }
        return item.timer > 0;
    });

    // Animate water
    scene.traverse(obj => {
        if (obj.name === 'water' && obj.material.map) {
            obj.material.map.offset.y = waterTime * 0.02;
        }
        if (obj.name === 'ripple') {
            obj.scale.set(1 + Math.sin(waterTime * 3) * 0.3, 1 + Math.sin(waterTime * 3) * 0.3, 1);
            obj.material.opacity = 0.15 + Math.sin(waterTime * 2) * 0.1;
        }
        if (obj.name === 'flag') {
            obj.rotation.y = Math.sin(waterTime * 2) * 0.15;
            obj.position.x = 1 + Math.sin(waterTime * 2.5) * 0.1;
        }
    });

    // Update camera
    updateCamera();

    // Update UI
    ui.updateOrbs();
    ui.updateMinimap(player.position, entities.entities, camera);
    ui.updateLootLabels(entities.loot, camera, renderer);

    renderer.render(scene, camera);
}

animate();

// Initial greeting
setTimeout(() => {
    ui.addChatMessage("Welcome to Lumbridge! Click to move, right-click for options.", 'system');
    ui.addChatMessage("Try chopping trees, mining rocks, or fighting monsters!", 'system');
}, 1000);
