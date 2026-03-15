// ui.js — OSRS-style UI management
import * as THREE from 'three';

export class GameUI {
  constructor(player) {
    this.player = player;
    this.activeTab = 'all';
    this.activePanel = 'inventory';
    this.messages = [];

    this._setupChatTabs();
    this._setupPanelTabs();
    this._setupInventory();
    this._setupSkills();
    this._setupChatInput();
  }

  _setupChatTabs() {
    document.querySelectorAll('.chat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this._renderMessages();
      });
    });
  }

  _setupPanelTabs() {
    document.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        this.activePanel = tab.dataset.panel;
        document.getElementById(`${this.activePanel}-panel`).classList.add('active');
        if (this.activePanel === 'inventory') this.updateInventory();
        if (this.activePanel === 'skills') this.updateSkills();
      });
    });
  }

  _setupChatInput() {
    const input = document.getElementById('chat-input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        this.addMessage('You', input.value.trim(), 'public');
        input.value = '';
        input.blur();
      }
    });

    // Focus on Enter key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement !== input) {
        input.focus();
      }
    });
  }

  _setupInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    for (let i = 0; i < 28; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot';
      slot.dataset.index = i;
      slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const item = this.player.inventory[i];
        if (item) {
          this.showContextMenu(e.clientX, e.clientY, [
            { label: `${item.icon} ${item.name}`, action: null, highlight: true },
            { label: 'Use', action: () => this.useItem(i) },
            { label: 'Drop', action: () => this.dropItem(i) },
            { label: 'Examine', action: () => this.addMessage('', `${item.name}: A useful item.`, 'game') },
          ]);
        }
      });
      grid.appendChild(slot);
    }
    this.updateInventory();
  }

  _setupSkills() {
    this.updateSkills();
  }

  addMessage(sender, text, type = 'game') {
    this.messages.push({ sender, text, type, time: Date.now() });
    if (this.messages.length > 200) this.messages.shift();
    this._renderMessages();
  }

  _renderMessages() {
    const container = document.getElementById('chat-messages');
    const filtered = this.activeTab === 'all'
      ? this.messages
      : this.messages.filter(m => m.type === this.activeTab);

    const last50 = filtered.slice(-50);
    container.innerHTML = last50.map(m => {
      const cls = `msg msg-${m.type}`;
      const prefix = m.sender ? `<b>${m.sender}:</b> ` : '';
      return `<div class="${cls}">${prefix}${m.text}</div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }

  updateInventory() {
    const slots = document.querySelectorAll('.inv-slot');
    slots.forEach((slot, i) => {
      const item = this.player.inventory[i];
      if (item) {
        slot.innerHTML = `<span style="font-size:20px">${item.icon}</span>`;
        if (item.count > 1) {
          slot.innerHTML += `<span class="item-count">${item.count >= 1000 ? Math.floor(item.count/1000) + 'k' : item.count}</span>`;
        }
        slot.title = item.name;
      } else {
        slot.innerHTML = '';
        slot.title = '';
      }
    });
  }

  updateSkills() {
    const list = document.getElementById('skills-list');
    const skills = [
      { name: 'Attack', key: 'attack', icon: '⚔️' },
      { name: 'Strength', key: 'strength', icon: '💪' },
      { name: 'Defence', key: 'defence', icon: '🛡️' },
      { name: 'Hitpoints', key: 'hitpoints', icon: '❤️' },
      { name: 'Mining', key: 'mining', icon: '⛏️' },
      { name: 'Woodcutting', key: 'woodcutting', icon: '🪓' },
      { name: 'Fishing', key: 'fishing', icon: '🐟' },
      { name: 'Cooking', key: 'cooking', icon: '🍳' },
    ];

    list.innerHTML = skills.map(s => {
      const level = this.player.stats[s.key] || 1;
      const xp = this.player.xp[s.key] || 0;
      return `<div class="skill-entry" title="${s.name}: ${xp} XP">
        <span class="skill-icon">${s.icon}</span>
        <span style="flex:1;font-size:9px">${s.name}</span>
        <span class="skill-level">${level}</span>
      </div>`;
    }).join('');
  }

  updateOrbs() {
    const p = this.player.stats;
    document.getElementById('hp-text').textContent = p.hp;
    document.querySelector('.hp-fill').style.height = `${(p.hp / p.maxHp) * 100}%`;
    document.getElementById('prayer-text').textContent = p.prayer;
    document.querySelector('.prayer-fill').style.height = `${(p.prayer / p.maxPrayer) * 100}%`;
    document.getElementById('run-text').textContent = Math.floor(p.runEnergy);
    document.querySelector('.run-fill').style.height = `${p.runEnergy}%`;
  }

  showXPDrop(skill, amount) {
    const container = document.getElementById('xp-drops');
    const icons = { attack: '⚔️', strength: '💪', defence: '🛡️', hitpoints: '❤️', mining: '⛏️', woodcutting: '🪓', fishing: '🐟', cooking: '🍳' };
    const drop = document.createElement('div');
    drop.className = 'xp-drop';
    drop.textContent = `${icons[skill] || '✨'} +${amount} XP`;
    container.appendChild(drop);
    setTimeout(() => drop.remove(), 2000);
  }

  showContextMenu(x, y, options) {
    const menu = document.getElementById('context-menu');
    const list = document.getElementById('context-options');
    list.innerHTML = '';

    options.forEach(opt => {
      const li = document.createElement('li');
      li.textContent = opt.label;
      if (opt.highlight) li.style.color = '#ff0';
      if (opt.action) {
        li.addEventListener('click', () => {
          opt.action();
          menu.classList.add('hidden');
        });
      }
      list.appendChild(li);
    });

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove('hidden');
  }

  hideContextMenu() {
    document.getElementById('context-menu').classList.add('hidden');
  }

  showNPCDialog(name, lines) {
    const dialog = document.getElementById('npc-dialog');
    const nameEl = document.getElementById('npc-dialog-name');
    const textEl = document.getElementById('npc-dialog-text');
    const optsEl = document.getElementById('npc-dialog-options');

    let lineIndex = 0;
    nameEl.textContent = name;
    textEl.textContent = lines[lineIndex];
    optsEl.innerHTML = '';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Continue';
    nextBtn.addEventListener('click', () => {
      lineIndex++;
      if (lineIndex < lines.length) {
        textEl.textContent = lines[lineIndex];
      } else {
        dialog.classList.add('hidden');
      }
    });
    optsEl.appendChild(nextBtn);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => dialog.classList.add('hidden'));
    optsEl.appendChild(closeBtn);

    dialog.classList.remove('hidden');
  }

  useItem(index) {
    const item = this.player.inventory[index];
    if (!item) return;

    if (item.name === 'Raw Chicken' || item.name === 'Raw Shrimp') {
      // "Cook" it
      item.name = item.name.replace('Raw ', 'Cooked ');
      item.icon = '🍖';
      this.addMessage('', `You cook the ${item.name}.`, 'game');
      const result = this.player.addXP('cooking', 30);
      this.showXPDrop('cooking', 30);
      if (result.levelUp) {
        this.addMessage('', `🎉 Congratulations! Your Cooking level is now ${result.level}!`, 'game');
      }
    } else if (item.name.startsWith('Cooked')) {
      // Eat it
      const heal = 3;
      this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + heal);
      this.addMessage('', `You eat the ${item.name}. It heals ${heal} hitpoints.`, 'game');
      item.count--;
      if (item.count <= 0) this.player.inventory[index] = null;
    }
    this.updateInventory();
    this.updateOrbs();
  }

  dropItem(index) {
    const item = this.player.inventory[index];
    if (item) {
      this.addMessage('', `You drop the ${item.name}.`, 'game');
      this.player.inventory[index] = null;
      this.updateInventory();
    }
  }

  // Minimap rendering
  updateMinimap(player, npcs, enemies) {
    const canvas = document.getElementById('minimap');
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Dark green background
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, 0, w, h);

    const scale = 1.2;
    const cx = player.group.position.x;
    const cz = player.group.position.z;

    // Draw terrain color grid (simplified)
    ctx.fillStyle = '#2a4a1a';
    ctx.fillRect(0, 0, w, h);

    // River
    ctx.fillStyle = '#224488';
    const riverX = (20 * 2 - cx) * scale + w/2;
    ctx.fillRect(riverX - 4, 0, 8, h);

    // Castle
    ctx.fillStyle = '#666655';
    const castleX = (0 - cx) * scale + w/2;
    const castleZ = (0 - cz) * scale + h/2;
    ctx.fillRect(castleX - 8, castleZ - 7, 16, 14);

    // Buildings
    ctx.fillStyle = '#554433';
    // General store
    const gsX = (-20 - cx) * scale + w/2;
    const gsZ = (12 - cz) * scale + h/2;
    ctx.fillRect(gsX - 4, gsZ - 3, 8, 6);

    // Church
    ctx.fillStyle = '#887766';
    const chX = (20 - cx) * scale + w/2;
    const chZ = (-15 - cz) * scale + h/2;
    ctx.fillRect(chX - 4, chZ - 7, 8, 14);

    // Maid café (pink dot)
    ctx.fillStyle = '#FF69B4';
    const mcX = (-25 - cx) * scale + w/2;
    const mcZ = (-20 - cz) * scale + h/2;
    ctx.fillRect(mcX - 4, mcZ - 3, 8, 7);

    // NPCs (yellow dots)
    ctx.fillStyle = '#FFFF00';
    npcs.forEach(npc => {
      if (npc.userData.isDead) return;
      const nx = (npc.position.x - cx) * scale + w/2;
      const nz = (npc.position.z - cz) * scale + h/2;
      if (nx > 0 && nx < w && nz > 0 && nz < h) {
        ctx.fillRect(nx - 1, nz - 1, 3, 3);
      }
    });

    // Enemies (red dots)
    ctx.fillStyle = '#FF0000';
    enemies.forEach(e => {
      if (e.userData.isDead) return;
      const ex = (e.position.x - cx) * scale + w/2;
      const ez = (e.position.z - cz) * scale + h/2;
      if (ex > 0 && ex < w && ez > 0 && ez < h) {
        ctx.fillRect(ex - 1, ez - 1, 3, 3);
      }
    });

    // Player (white arrow/dot)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(w/2, h/2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Circular mask
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(w/2, h/2, w/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
}
