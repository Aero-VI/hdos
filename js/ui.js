// UI management — chat, inventory, stats, context menu, XP drops, hit splats, loot labels
import * as THREE from 'three';

export class UIManager {
    constructor(player) {
        this.player = player;
        this.chatEl = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.contextMenu = document.getElementById('context-menu');
        this.xpDrops = document.getElementById('xp-drops');
        this.npcDialog = document.getElementById('npc-dialog');
        this.dialogCallback = null;

        this._setupInventory();
        this._setupStats();
        this._setupTabs();
        this._setupChatTabs();
        this._setupChatInput();

        this.addChatMessage('Welcome to Lumbridge.', 'system');
        this.addChatMessage("It's a nice day in Gielinor.", 'game');
    }

    _setupInventory() {
        const grid = document.getElementById('inventory-grid');
        // Starting items
        const startItems = [
            { name: 'Bronze sword', icon: 'https://oldschool.runescape.wiki/images/Bronze_sword.png' },
            { name: 'Wooden shield', icon: 'https://oldschool.runescape.wiki/images/Wooden_shield.png' },
            { name: 'Bronze axe', icon: 'https://oldschool.runescape.wiki/images/Bronze_axe.png' },
            { name: 'Bronze pickaxe', icon: 'https://oldschool.runescape.wiki/images/Bronze_pickaxe.png' },
            { name: 'Small fishing net', icon: 'https://oldschool.runescape.wiki/images/Small_fishing_net.png' },
            { name: 'Tinderbox', icon: 'https://oldschool.runescape.wiki/images/Tinderbox.png' },
            { name: 'Bread', icon: 'https://oldschool.runescape.wiki/images/Bread.png', qty: 3 },
        ];
        this.player.inventory = [...startItems];
        this.refreshInventory();
    }

    refreshInventory() {
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 28; i++) {
            const slot = document.createElement('div');
            slot.className = 'inv-slot';
            const item = this.player.inventory[i];
            if (item) {
                if (item.icon && item.icon.startsWith('http')) {
                    const img = document.createElement('img');
                    img.src = item.icon;
                    img.alt = item.name;
                    img.title = item.name;
                    img.onerror = () => { img.style.display = 'none'; slot.textContent = item.emoji || '📦'; };
                    slot.appendChild(img);
                } else {
                    slot.textContent = item.emoji || item.icon || '📦';
                    slot.style.fontSize = '20px';
                    slot.title = item.name;
                }
                if (item.qty && item.qty > 1) {
                    const count = document.createElement('span');
                    count.className = 'inv-count';
                    count.textContent = item.qty;
                    slot.appendChild(count);
                }
                slot.addEventListener('contextmenu', (ev) => {
                    ev.preventDefault();
                    this.showContextMenu(ev.clientX, ev.clientY, item.name, [
                        { action: 'Use', label: `Use ${item.name}` },
                        { action: 'Drop', label: `Drop ${item.name}` },
                        { action: 'Examine', label: `Examine ${item.name}` },
                    ]);
                });
            }
            grid.appendChild(slot);
        }
    }

    _setupStats() {
        const grid = document.getElementById('stats-grid');
        const skillNames = Object.keys(this.player.skills);
        skillNames.forEach(name => {
            const box = document.createElement('div');
            box.className = 'stat-box';
            box.id = `stat-${name}`;
            box.innerHTML = `<div class="stat-name">${name}</div><div class="stat-level">${this.player.skills[name].level}</div>`;
            grid.appendChild(box);
        });
    }

    refreshStats() {
        Object.keys(this.player.skills).forEach(name => {
            const el = document.getElementById(`stat-${name}`);
            if (el) el.querySelector('.stat-level').textContent = this.player.skills[name].level;
        });
    }

    _setupTabs() {
        document.querySelectorAll('.side-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.side-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });
    }

    _setupChatTabs() {
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    _setupChatInput() {
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.chatInput.value.trim()) {
                this.addChatMessage(this.chatInput.value, 'public', 'You');
                this.chatInput.value = '';
            }
        });
    }

    addChatMessage(text, type = 'game', sender = null) {
        const div = document.createElement('div');
        div.className = `chat-msg-${type}`;
        if (sender) {
            div.innerHTML = `<span class="chat-name">${sender}:</span> ${text}`;
        } else {
            div.textContent = text;
        }
        this.chatEl.appendChild(div);
        this.chatEl.scrollTop = this.chatEl.scrollHeight;
        // Keep chat history manageable
        while (this.chatEl.children.length > 100) {
            this.chatEl.removeChild(this.chatEl.firstChild);
        }
    }

    showContextMenu(x, y, title, options, callbacks = {}) {
        this.contextMenu.classList.remove('hidden');
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.innerHTML = `<div class="ctx-title">${title}</div>`;
        options.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'ctx-option';
            div.innerHTML = `<span class="ctx-action">${opt.action}</span> ${opt.label.replace(opt.action, '').trim()}`;
            div.addEventListener('click', () => {
                this.hideContextMenu();
                if (callbacks[opt.action]) callbacks[opt.action]();
                else if (opt.action === 'Examine') {
                    this.addChatMessage(`It's a ${title.toLowerCase()}.`, 'game');
                }
            });
            this.contextMenu.appendChild(div);
        });
        // Cancel on click elsewhere
        setTimeout(() => {
            const hide = () => { this.hideContextMenu(); document.removeEventListener('click', hide); };
            document.addEventListener('click', hide);
        }, 10);
    }

    hideContextMenu() {
        this.contextMenu.classList.add('hidden');
    }

    showXpDrop(skill, amount) {
        const div = document.createElement('div');
        div.className = 'xp-drop';
        div.textContent = `+${amount} ${skill} XP`;
        this.xpDrops.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }

    showHitSplat(screenPos, damage, miss = false) {
        const splat = document.createElement('div');
        splat.className = `hit-splat ${miss ? 'miss' : 'damage'}`;
        splat.textContent = miss ? '0' : damage;
        splat.style.left = screenPos.x + 'px';
        splat.style.top = screenPos.y + 'px';
        document.getElementById('ui-overlay').appendChild(splat);
        setTimeout(() => splat.remove(), 1000);
    }

    showHealthBar(screenPos, hp, maxHp) {
        // Remove existing
        const existing = document.getElementById('active-healthbar');
        if (existing) existing.remove();

        const container = document.createElement('div');
        container.className = 'health-bar-container';
        container.id = 'active-healthbar';
        container.style.left = screenPos.x + 'px';
        container.style.top = (screenPos.y - 30) + 'px';
        const fill = document.createElement('div');
        fill.className = 'health-bar-fill';
        fill.style.width = `${(hp / maxHp) * 100}%`;
        fill.style.background = hp / maxHp > 0.5 ? '#0f0' : hp / maxHp > 0.25 ? '#ff0' : '#f00';
        container.appendChild(fill);
        document.getElementById('ui-overlay').appendChild(container);
        setTimeout(() => container.remove(), 3000);
    }

    updateOrbs() {
        document.querySelector('#orb-hp .orb-text').textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.querySelector('#orb-prayer .orb-text').textContent = `${this.player.prayer}/${this.player.maxPrayer}`;
        document.querySelector('#orb-run .orb-text').textContent = `${this.player.run}%`;
    }

    showNpcDialog(npcName, text, options = null, callback = null) {
        this.npcDialog.classList.remove('hidden');
        document.getElementById('npc-dialog-name').textContent = npcName;
        document.getElementById('npc-dialog-text').textContent = text;
        const optionsEl = document.getElementById('npc-dialog-options');
        optionsEl.innerHTML = '';
        if (options) {
            options.forEach((opt, i) => {
                const btn = document.createElement('div');
                btn.className = 'dialog-option';
                btn.textContent = opt;
                btn.addEventListener('click', () => {
                    if (callback) callback(i);
                    this.hideDialog();
                });
                optionsEl.appendChild(btn);
            });
        } else {
            const btn = document.createElement('div');
            btn.className = 'dialog-option';
            btn.textContent = 'Click to continue';
            btn.addEventListener('click', () => {
                if (callback) callback(0);
                this.hideDialog();
            });
            optionsEl.appendChild(btn);
        }
    }

    hideDialog() {
        this.npcDialog.classList.add('hidden');
    }

    updateMinimap(playerPos, entities, camera) {
        const canvas = document.getElementById('minimap');
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        const scale = 1.5;

        // Background
        ctx.fillStyle = '#2d5a1e';
        ctx.fillRect(0, 0, w, h);

        // River
        ctx.fillStyle = '#1a6b8a';
        const rx = ((-35 - playerPos.x) * scale) + w / 2;
        ctx.fillRect(rx - 8, 0, 16, h);

        // Buildings as rectangles
        const buildings = [
            { x: 0, z: -20, w: 14, h: 12, color: '#666' },  // Castle
            { x: 15, z: 8, w: 8, h: 7, color: '#886' },      // Store
            { x: -15, z: -10, w: 8, h: 12, color: '#555' },   // Church
            { x: -18, z: 8, w: 6, h: 5, color: '#876' },      // House
            { x: -18, z: 18, w: 6, h: 5, color: '#876' },     // House
            { x: 20, z: 14, w: 6, h: 6, color: '#f69' },      // Maid café!
        ];
        buildings.forEach(b => {
            const bx = ((b.x - playerPos.x) * scale) + w / 2;
            const bz = ((b.z - playerPos.z) * scale) + h / 2;
            ctx.fillStyle = b.color;
            ctx.fillRect(bx - b.w * scale / 2, bz - b.h * scale / 2, b.w * scale, b.h * scale);
        });

        // Paths
        ctx.fillStyle = '#8B7355';
        const px = ((0 - playerPos.x) * scale) + w / 2;
        ctx.fillRect(px - 3, 0, 6, h);
        const pz = ((5 - playerPos.z) * scale) + h / 2;
        ctx.fillRect(0, pz - 3, w, 6);

        // Entities
        entities.forEach(e => {
            if (e.dead) return;
            const ex = ((e.mesh.position.x - playerPos.x) * scale) + w / 2;
            const ez = ((e.mesh.position.z - playerPos.z) * scale) + h / 2;
            if (ex < 0 || ex > w || ez < 0 || ez > h) return;
            ctx.fillStyle = e.type === 'npc' ? '#ff0' : '#f00';
            ctx.beginPath();
            ctx.arc(ex, ez, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Player dot (center)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Direction arrow
        const angle = camera.rotation.y;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(w / 2 + Math.sin(angle) * 8, h / 2 - Math.cos(angle) * 8);
        ctx.stroke();
    }

    updateLootLabels(lootItems, camera, renderer) {
        // Remove old
        document.querySelectorAll('.loot-label').forEach(l => l.remove());

        lootItems.forEach(item => {
            const pos = item.position.clone();
            pos.y = 0.5;
            pos.project(camera);
            if (pos.z > 1) return;
            const hw = renderer.domElement.width / 2;
            const hh = renderer.domElement.height / 2;
            const x = (pos.x * hw) + hw;
            const y = -(pos.y * hh) + hh;

            const label = document.createElement('div');
            label.className = 'loot-label';
            label.textContent = `${item.icon || '📦'} ${item.name}${item.qty ? ` (${item.qty})` : ''}`;
            label.style.left = x + 'px';
            label.style.top = y + 'px';
            label.addEventListener('click', () => {
                item._pickup = true;
            });
            document.getElementById('ui-overlay').appendChild(label);
        });
    }
}
