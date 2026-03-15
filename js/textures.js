// textures.js - PBR Texture loading from Poly Haven CDN
import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const PH = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k';
const cache = {};
let totalToLoad = 0, totalLoaded = 0;
let onProgressCb = null;

export function setLoadProgress(cb) { onProgressCb = cb; }

function trackLoad(tex) {
  totalToLoad++;
  const origOnLoad = tex.image ? null : undefined;
  // We rely on the texture manager's internal loading
  const check = setInterval(() => {
    if (tex.image) {
      clearInterval(check);
      totalLoaded++;
      if (onProgressCb) onProgressCb(totalLoaded, totalToLoad);
    }
  }, 100);
  return tex;
}

function loadPBR(name, repeatX = 1, repeatY = 1) {
  const key = `${name}_${repeatX}_${repeatY}`;
  if (cache[key]) return cache[key];

  const configure = (tex, srgb = false) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    trackLoad(tex);
    return tex;
  };

  const result = {
    map: configure(loader.load(`${PH}/${name}/${name}_diff_1k.jpg`), true),
    normalMap: configure(loader.load(`${PH}/${name}/${name}_nor_gl_1k.jpg`)),
    roughnessMap: configure(loader.load(`${PH}/${name}/${name}_rough_1k.jpg`)),
  };
  cache[key] = result;
  return result;
}

// Texture presets with RS-appropriate repeat values
export const TEX = {
  stoneWall:    (rx=2, ry=2)   => loadPBR('medieval_blocks_05', rx, ry),
  grass:        (rx=30, ry=30) => loadPBR('forrest_ground_01', rx, ry),
  dirt:         (rx=8, ry=8)   => loadPBR('brown_mud_02', rx, ry),
  wood:         (rx=2, ry=2)   => loadPBR('wood_planks_dirty', rx, ry),
  cobblestone:  (rx=6, ry=6)   => loadPBR('cobblestone_floor_08', rx, ry),
  roof:         (rx=3, ry=3)   => loadPBR('roof_tiles_02', rx, ry),
};

// PBR material from texture set
export function makeMat(texSet, extras = {}) {
  return new THREE.MeshStandardMaterial({
    map: texSet.map,
    normalMap: texSet.normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap: texSet.roughnessMap,
    ...extras,
  });
}

// Simple colored material
export function colorMat(color, roughness = 0.85, metalness = 0.0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export { loader };
