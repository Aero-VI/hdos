import * as THREE from 'three';

export class UIManager {
    constructor(player) {
        this.player = player;
        this.chatEl = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.contextMenu = document.getElementById('context-menu');
        this.xpDrops = document.getElementById('xp-drops');
        this.npcDialog = document.getElementById('npc-dialog');

        this._setupInventory();
        this._setupStats();
        this._setupTabs();
        this._setupChatTabs();
        this._setupChatInput();
        this.addChatMessage('Welcome to Lumbridge.', 'system');
        this.addChatMessage("It's a nice day in Gielinor.", 'game');
    }

    _setupInventory() {
        this.player.inventory = [
            { name: 'Bronze sword', icon: 'https://oldschool.runescape.wiki/images/Bronze_sword.png' },
            { name: 'Wooden shield', icon: 'https://oldschool.runescape.wiki/images/Wooden_shield.png' },
            { name: 'Bronze axe', icon: 'https://oldschool.runescape.wiki/images/Bronze_axe.png' },
            { name: 'Bronze pickaxe', icon: 'https://oldschool.runescape.wiki/images/Bronze_pickaxe.png' },
            { name: 'Small fishing net', icon: 'https://oldschool.runescape.wiki/images/Small_fishing_net.png' },
            { name: 'Tinderbox', icon: 'https://oldschool.runescape.wiki/images/Tinderbox.png' },
            { name: 'Bread', icon: 'https://oldschool.runescape.wiki/images/Bread.png', qty: 3 },
        ];
        this.refreshInventory();
    }

    refreshInventory() {
        const grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
        for (let i = 0; i < 28; i++) {
            const slot = document.createElement('div'); slot.className = 'inv-slot';
            const item = this.player.inventory[i];
            if (item) {
                if (item.icon?.startsWith('http')) {
                    const img = document.createElement('img'); img.src = item.icon; img.alt = item.name; img.title = item.name;
                    img.onerror = () => { img.style.display = 'none'; slot.textContent = item.emoji || '📦'; };
                    slot.appendChild(img);
                } else { slot.textContent = item.emoji || item.icon || '📦'; slot.style.fontSize = '20px'; slot.title = item.name; }
                if (item.qty > 1) { const c = document.createElement('span'); c.className = 'inv-count'; c.textContent = item.qty; slot.appendChild(c); }
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
        Object.keys(this.player.skills).forEach(name => {
            const box = document.createElement('div'); box.className = 'stat-box'; box.id = `stat-${name}`;
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
            tab.addEventListener('click', () => { document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); });
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
        const div = document.createElement('div'); div.className = `chat-msg-${type}`;
        div.innerHTML = sender ? `<span class="chat-name">${sender}:</span> ${text}` : text;
        this.chatEl.appendChild(div); this.chatEl.scrollTop = this.chatEl.scrollHeight;
        while (this.chatEl.children.length > 100) this.chatEl.removeChild(this.chatEl.firstChild);
    }

    showContextMenu(x, y, title, options, callbacks = {}) {
        this.contextMenu.classList.remove('hidden');
        this.contextMenu.style.left = x + 'px'; this.contextMenu.style.top = y + 'px';
        this.contextMenu.innerHTML = `<div class="ctx-title">${title}</div>`;
        options.forEach(opt => {
            const div = document.createElement('div'); div.className = 'ctx-option';
            div.innerHTML = `<span class="ctx-action">${opt.action}</span> ${opt.label.replace(opt.action, '').trim()}`;
            div.addEventListener('click', () => {
                this.hideContextMenu();
                if (callbacks[opt.action]) callbacks[opt.action]();
                else if (opt.action === 'Examine') this.addChatMessage(`It's a ${title.toLowerCase()}.`, 'game');
            });
            this.contextMenu.appendChild(div);
        });
        setTimeout(() => { const hide = () => { this.hideContextMenu(); document.removeEventListener('click', hide); }; document.addEventListener('click', hide); }, 10);
    }

    hideContextMenu() { this.contextMenu.classList.add('hidden'); }

    showXpDrop(skill, amount) {
        const div = document.createElement('div'); div.className = 'xp-drop';
        div.textContent = `+${amount} ${skill} XP`;
        this.xpDrops.appendChild(div); setTimeout(() => div.remove(), 2000);
    }

    showHitSplat(screenPos, damage, miss = false) {
        const splat = document.createElement('div'); splat.className = `hit-splat ${miss ? 'miss' : 'damage'}`;
        splat.textContent = miss ? '0' : damage;
        splat.style.left = screenPos.x + 'px'; splat.style.top = screenPos.y + 'px';
        document.getElementById('ui-overlay').appendChild(splat); setTimeout(() => splat.remove(), 1000);
    }

    showHealthBar(screenPos, hp, maxHp) {
        const old = document.getElementById('active-healthbar'); if (old) old.remove();
        const c = document.createElement('div'); c.className = 'health-bar-container'; c.id = 'active-healthbar';
        c.style.left = screenPos.x + 'px'; c.style.top = (screenPos.y - 30) + 'px';
        const fill = document.createElement('div'); fill.className = 'health-bar-fill';
        fill.style.width = `${(hp / maxHp) * 100}%`;
        fill.style.background = hp / maxHp > 0.5 ? '#0f0' : hp / maxHp > 0.25 ? '#ff0' : '#f00';
        c.appendChild(fill); document.getElementById('ui-overlay').appendChild(c);
        setTimeout(() => c.remove(), 3000);
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
        const optEl = document.getElementById('npc-dialog-options'); optEl.innerHTML = '';
        if (options) {
            options.forEach((opt, i) => {
                const btn = document.createElement('div'); btn.className = 'dialog-option'; btn.textContent = opt;
                btn.addEventListener('click', () => { if (callback) callback(i); this.hideDialog(); }); optEl.appendChild(btn);
            });
        } else {
            const btn = document.createElement('div'); btn.className = 'dialog-option'; btn.textContent = 'Click to continue';
            btn.addEventListener('click', () => { if (callback) callback(0); this.hideDialog(); }); optEl.appendChild(btn);
        }
    }

    hideDialog() { this.npcDialog.classList.add('hidden'); }

    updateMinimap(playerPos, entities, camera) {
        const canvas = document.getElementById('minimap');
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height, sc = 1.5;
        ctx.fillStyle = '#2d5a1e'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1a6b8a';
        ctx.fillRect(((-35 - playerPos.x) * sc) + w/2 - 8, 0, 16, h);
        [{x:0,z:-20,w:14,h:12,c:'#666'},{x:15,z:8,w:8,h:7,c:'#886'},{x:-15,z:-10,w:8,h:12,c:'#555'},{x:-18,z:8,w:6,h:5,c:'#876'},{x:-18,z:18,w:6,h:5,c:'#876'},{x:20,z:14,w:6,h:6,c:'#f69'}].forEach(b => {
            ctx.fillStyle = b.c;
            ctx.fillRect(((b.x-playerPos.x)*sc)+w/2-b.w*sc/2, ((b.z-playerPos.z)*sc)+h/2-b.h*sc/2, b.w*sc, b.h*sc);
        });
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(((0-playerPos.x)*sc)+w/2-3, 0, 6, h);
        ctx.fillRect(0, ((5-playerPos.z)*sc)+h/2-3, w, 6);
        entities.forEach(e => {
            if (e.dead) return;
            const ex = ((e.mesh.position.x-playerPos.x)*sc)+w/2, ez = ((e.mesh.position.z-playerPos.z)*sc)+h/2;
            if (ex < 0 || ex > w || ez < 0 || ez > h) return;
            ctx.fillStyle = e.type === 'npc' ? '#ff0' : '#f00';
            ctx.beginPath(); ctx.arc(ex, ez, 2, 0, Math.PI*2); ctx.fill();
        });
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(w/2, h/2, 3, 0, Math.PI*2); ctx.fill();
    }

    updateLootLabels(lootItems, camera, renderer) {
        document.querySelectorAll('.loot-label').forEach(l => l.remove());
        lootItems.forEach(item => {
            const pos = item.position.clone(); pos.y = 0.5; pos.project(camera);
            if (pos.z > 1) return;
            const x = (pos.x * 0.5 + 0.5) * renderer.domElement.width;
            const y = (-pos.y * 0.5 + 0.5) * renderer.domElement.height;
            const label = document.createElement('div'); label.className = 'loot-label';
            label.textContent = `${item.icon || '📦'} ${item.name}${item.qty ? ` (${item.qty})` : ''}`;
            label.style.left = x + 'px'; label.style.top = y + 'px';
            label.addEventListener('click', () => { item._pickup = true; });
            document.getElementById('ui-overlay').appendChild(label);
        });
    }
}
