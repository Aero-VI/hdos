import * as THREE from 'three';

function makeTexture(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function noise(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

export function grassTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#3a7d2a'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * w, y = Math.random() * h;
            ctx.fillStyle = `rgb(${30 + Math.random() * 40},${90 + Math.random() * 60},${20 + Math.random() * 30})`;
            ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 3);
        }
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * w, y = Math.random() * h;
            ctx.strokeStyle = `rgba(${40 + Math.random() * 30},${100 + Math.random() * 80},${20 + Math.random() * 20},0.6)`;
            ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 3 - Math.random() * 5); ctx.stroke();
        }
    });
}

export function dirtTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#8B7355'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * w, y = Math.random() * h, v = 80 + Math.random() * 60;
            ctx.fillStyle = `rgb(${v + 20},${v},${v - 30})`; ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * w, y = Math.random() * h;
            ctx.fillStyle = `rgba(${100 + Math.random() * 50},${90 + Math.random() * 40},${70 + Math.random() * 30},0.5)`;
            ctx.beginPath(); ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
        }
    });
}

export function stoneTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#8a8a7a'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 15000; i++) {
            const x = Math.random() * w, y = Math.random() * h, v = 100 + Math.random() * 70;
            ctx.fillStyle = `rgb(${v},${v},${v - 10})`; ctx.fillRect(x, y, 1, 1);
        }
        ctx.strokeStyle = 'rgba(60,55,45,0.6)'; ctx.lineWidth = 2;
        for (let row = 0; row < 8; row++) {
            const y = row * 32 + 16;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            const off = row % 2 === 0 ? 0 : 32;
            for (let col = 0; col < 8; col++) {
                const x = col * 64 + off;
                ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke();
            }
        }
    });
}

export function stoneTileTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#999990'; ctx.fillRect(0, 0, w, h);
        const ts = 32;
        for (let ty = 0; ty < h; ty += ts) for (let tx = 0; tx < w; tx += ts) {
            const v = 130 + Math.random() * 40;
            ctx.fillStyle = `rgb(${v},${v},${v - 5})`; ctx.fillRect(tx + 1, ty + 1, ts - 2, ts - 2);
            for (let i = 0; i < 50; i++) {
                const gv = v + (Math.random() - 0.5) * 30;
                ctx.fillStyle = `rgb(${gv},${gv},${gv})`; ctx.fillRect(tx + Math.random() * ts, ty + Math.random() * ts, 1, 1);
            }
        }
        ctx.strokeStyle = 'rgba(50,45,35,0.5)'; ctx.lineWidth = 2;
        for (let i = 0; i <= h; i += ts) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
        for (let i = 0; i <= w; i += ts) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
    });
}

export function woodTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#8B6914'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 100; i++) {
            const y = Math.random() * h;
            ctx.strokeStyle = `rgba(${100 + Math.random() * 40},${70 + Math.random() * 30},${10 + Math.random() * 20},0.3)`;
            ctx.lineWidth = 1 + Math.random() * 2; ctx.beginPath(); ctx.moveTo(0, y);
            for (let x = 0; x < w; x += 10) ctx.lineTo(x, y + (Math.random() - 0.5) * 4);
            ctx.stroke();
        }
    });
}

export function barkTexture() {
    return makeTexture(128, 256, (ctx, w, h) => {
        ctx.fillStyle = '#5c3d1e'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 60; i++) {
            const y = Math.random() * h;
            ctx.strokeStyle = `rgba(${40 + Math.random() * 30},${25 + Math.random() * 20},${10 + Math.random() * 15},0.5)`;
            ctx.lineWidth = 2 + Math.random() * 3; ctx.beginPath(); ctx.moveTo(0, y);
            for (let x = 0; x < w; x += 8) ctx.lineTo(x, y + (Math.random() - 0.5) * 6);
            ctx.stroke();
        }
    });
}

export function roofTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#8B4513'; ctx.fillRect(0, 0, w, h);
        for (let row = 0; row < h / 16; row++) {
            const off = row % 2 === 0 ? 0 : 16;
            for (let tx = -16 + off; tx < w; tx += 32) {
                const v = 100 + Math.random() * 40;
                ctx.fillStyle = `rgb(${v},${v * 0.5},${v * 0.2})`;
                ctx.beginPath(); ctx.arc(tx + 16, row * 16 + 16, 18, Math.PI, 0); ctx.fill();
            }
        }
    });
}

export function waterTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#1a6b8a'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * w, y = Math.random() * h;
            ctx.strokeStyle = `rgba(100,200,255,${0.1 + Math.random() * 0.15})`;
            ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + 20, y + (Math.random() - 0.5) * 6, x + 40 + Math.random() * 20, y + (Math.random() - 0.5) * 4);
            ctx.stroke();
        }
    });
}

export function pinkWallTexture() {
    return makeTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = '#ffb6c1'; ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * w, y = Math.random() * h, v = 200 + Math.random() * 55;
            ctx.fillStyle = `rgb(${v},${v * 0.7},${v * 0.75})`; ctx.fillRect(x, y, 1, 1);
        }
    });
}

export function roughnessMap() {
    return makeTexture(128, 128, (ctx, w, h) => {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const v = 150 + noise(x * 0.1, y * 0.1) * 80;
            ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 1, 1);
        }
    });
}
