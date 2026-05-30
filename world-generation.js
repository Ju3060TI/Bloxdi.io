/**
 * Welt-Generator – Biome, Höhen, Erze, Strukturen
 */
import { CHUNK_SIZE, WORLD_HEIGHT, SEA_LEVEL, getBlockByName, getBlock } from './blocks.js';
import { sampleBiomeMap } from './biomes.js';
import { createNoise3D, isCave, isCanyon, getCanyonDepth } from './caves.js';
import { placeTree, tryPlaceStructure } from './structures.js';

export function createNoise2D(seed = 12345) {
  return function noise2D(x, y, s = 0) {
    const n = Math.sin((x + s) * 12.9898 + (y + s) * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  };
}

function octave(noise, x, z, octaves, persistence, scale) {
  let total = 0, amp = 1, freq = scale, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise(x * freq, z * freq) * amp;
    max += amp;
    amp *= persistence;
    freq *= 2;
  }
  return total / max;
}

function getSurfaceBlock(biome) {
  const map = {
    grass: 'grass', sand: 'sand', snow: 'snow', stone: 'stone',
    mycelium: 'mycelium', red_sand: 'red_sand',
  };
  return getBlockByName(map[biome.surface] ?? 'grass')?.id ?? 1;
}

function getSubsurface(biome) {
  if (biome.id === 'desert' || biome.id === 'badlands') return getBlockByName('sand')?.id ?? 1;
  if (biome.id === 'tundra') return getBlockByName('dirt')?.id ?? 2;
  return getBlockByName('dirt')?.id ?? 2;
}

function placeOre(id, y, wx, wy, wz, noise2D, seed) {
  const ores = [
    { name: 'coal_ore', min: -20, max: 50, chance: 0.012 },
    { name: 'copper_ore', min: -10, max: 40, chance: 0.01 },
    { name: 'iron_ore', min: -30, max: 30, chance: 0.008 },
    { name: 'gold_ore', min: -50, max: 10, chance: 0.004 },
    { name: 'lapis_ore', min: -40, max: 20, chance: 0.004 },
    { name: 'redstone_ore', min: -60, max: 10, chance: 0.006 },
    { name: 'diamond_ore', min: -60, max: -30, chance: 0.002 },
    { name: 'emerald_ore', min: -10, max: 30, chance: 0.001 },
  ];
  for (const o of ores) {
    if (wy >= o.min && wy <= o.max) {
      const n = noise2D(wx * 0.1 + wy, wz * 0.1, seed + o.name.length);
      if (n < o.chance) return getBlockByName(o.name)?.id ?? id;
    }
  }
  return id;
}

export class ChunkData {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint16Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    this.dirty = true;
    this.meshes = new Map();
  }

  index(x, y, z) {
    return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
  }

  get(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return 0;
    return this.blocks[this.index(x, y, z)];
  }

  set(x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return;
    this.blocks[this.index(x, y, z)] = id;
    this.dirty = true;
  }
}

export function generateChunk(chunk, worldType, seed, noise2D, noise3D) {
  const { cx, cz, blocks } = chunk;
  const bedrock = getBlockByName('bedrock')?.id ?? 40;
  const stone = getBlockByName('stone')?.id ?? 6;
  const water = getBlockByName('water')?.id ?? 0;
  const air = 0;

  const wx0 = cx * CHUNK_SIZE;
  const wz0 = cz * CHUNK_SIZE;

  const getSurfaceY = (wx, wz) => {
    const biome = sampleBiomeMap(wx, wz, noise2D, seed);
    let h;
    if (worldType === 'flat') h = SEA_LEVEL;
    else if (worldType === 'skyblock') h = SEA_LEVEL + 5;
    else if (worldType === 'oneblock') h = SEA_LEVEL;
    else if (worldType === 'mountains') {
      h = SEA_LEVEL + octave(noise2D, wx, wz, 5, 0.5, 0.003) * 80 + biome.heightMod * 3;
    } else if (worldType === 'realistic') {
      h = SEA_LEVEL + octave(noise2D, wx, wz, 4, 0.45, 0.004) * 25 + biome.heightMod;
    } else {
      h = SEA_LEVEL + octave(noise2D, wx, wz, 4, 0.5, 0.005) * 35 + biome.heightMod * 2;
    }
    if (biome.id === 'ocean') h = Math.min(h, SEA_LEVEL - 8);
    return Math.max(4, Math.min(WORLD_HEIGHT - 5, Math.floor(h)));
  };

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const wx = wx0 + x;
      const wz = wz0 + z;
      const biome = sampleBiomeMap(wx, wz, noise2D, seed);
      const surfaceY = getSurfaceY(wx, wz);
      const surfaceBlock = getSurfaceBlock(biome);
      const sub = getSubsurface(biome);

      if (worldType === 'oneblock' && cx === 0 && cz === 0 && x === 8 && z === 8) {
        chunk.set(x, SEA_LEVEL, z, getBlockByName('grass')?.id ?? 1);
        continue;
      }
      if (worldType === 'skyblock' && cx === 0 && cz === 0) {
        const dist = Math.sqrt((x - 8) ** 2 + (z - 8) ** 2);
        if (dist < 10) {
          for (let y = SEA_LEVEL - 3; y <= SEA_LEVEL; y++) {
            chunk.set(x, y, z, y === SEA_LEVEL ? surfaceBlock : stone);
          }
        }
        continue;
      }

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        let id = air;
        if (y === 0) id = bedrock;
        else if (y < surfaceY - 4) id = stone;
        else if (y < surfaceY) id = sub;
        else if (y === surfaceY) id = surfaceBlock;
        else if (y <= SEA_LEVEL && biome.id === 'ocean') id = water;
        else if (y <= SEA_LEVEL && biome.id === 'swamp' && y > surfaceY) id = water;

        if (id === stone && y < surfaceY) {
          id = placeOre(id, y - SEA_LEVEL, wx, y, wz, noise2D, seed);
        }
        chunk.set(x, y, z, id);
      }

      const canyonD = isCanyon(wx, wz, noise2D, seed) ? getCanyonDepth(wx, wz, noise2D, seed) : 0;
      if (canyonD > 0) {
        for (let y = surfaceY - canyonD; y <= surfaceY; y++) {
          if (y > 0) chunk.set(x, y, z, air);
        }
        const riverY = surfaceY - canyonD;
        if (riverY > 0) chunk.set(x, riverY, z, water);
      }
    }
  }

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const wx = wx0 + x;
      const wz = wz0 + z;
      for (let y = 1; y < WORLD_HEIGHT - 1; y++) {
        if (isCave(wx, y, wz, noise3D, seed)) {
          const cur = chunk.get(x, y, z);
          const b = getBlock(cur);
          if (b?.solid && !b?.liquid) chunk.set(x, y, z, air);
        }
      }
    }
  }

  const biomeCenter = sampleBiomeMap(wx0 + 8, wz0 + 8, noise2D, seed);
  if (biomeCenter.tree && worldType !== 'flat') {
    for (let i = 0; i < 3; i++) {
      const tx = (Math.random() * 14 + 1) | 0;
      const tz = (Math.random() * 14 + 1) | 0;
      let ty = 0;
      for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
        if (chunk.get(tx, y, tz) !== 0) { ty = y + 1; break; }
      }
      if (ty > 0 && chunk.get(tx, ty, tz) === 0) {
        placeTree(biomeCenter.tree, (dx, dy, dz, id) => chunk.set(dx, dy, dz, id), tx, ty, tz);
      }
    }
  }

  const setBlockWorld = (dx, dy, dz, id) => {
    if (dx >= 0 && dx < CHUNK_SIZE && dz >= 0 && dz < CHUNK_SIZE && dy >= 0 && dy < WORLD_HEIGHT)
      chunk.set(dx, dy, dz, id);
  };
  const getSurf = (sx, sz) => {
    const lx = ((sx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((sz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      if (chunk.get(lx, y, lz) !== 0) return y;
    }
    return SEA_LEVEL;
  };
  tryPlaceStructure(cx, cz, seed, setBlockWorld, (sx, sz) => getSurf(sx - wx0, sz - wz0), biomeCenter);

  chunk.dirty = true;
  return chunk;
}

export function precomputeNoise(seed) {
  return {
    noise2D: createNoise2D(seed),
    noise3D: createNoise3D(seed),
  };
}
