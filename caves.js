/**
 * Höhlen, Kavernen, Schluchten – 3D Noise
 */
import { SEA_LEVEL } from './blocks.js';

export function createNoise3D(seed = 12345) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  return function noise3D(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
           lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
           lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  };
}

export function isCave(x, y, z, noise3D, seed) {
  const scale = 0.05;
  const n1 = noise3D(x * scale, y * scale * 0.8, z * scale);
  const n2 = noise3D(x * scale * 2 + 50, y * scale * 2, z * scale * 2 + 50);
  const n3 = noise3D(x * scale * 0.5, y * scale * 0.5, z * scale * 0.5 + 100);
  const combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  const threshold = y < 20 ? 0.52 : y < SEA_LEVEL - 10 ? 0.48 : 0.55;
  return combined > threshold;
}

export function isLargeCavern(x, y, z, noise3D) {
  const n = noise3D(x * 0.02, y * 0.02, z * 0.02);
  return n > 0.65 && y < SEA_LEVEL;
}

export function isCanyon(x, z, noise2D, seed) {
  const ridge = Math.abs(noise2D(x * 0.008, z * 0.008, seed + 500) - 0.5) * 2;
  return ridge < 0.04;
}

export function getCanyonDepth(x, z, noise2D, seed) {
  const ridge = Math.abs(noise2D(x * 0.008, z * 0.008, seed + 500) - 0.5) * 2;
  if (ridge >= 0.04) return 0;
  return Math.floor((0.04 - ridge) / 0.04 * 35) + 10;
}

export function isIceCave(biome, y) {
  return (biome.id === 'tundra' || biome.id === 'mountains') && y < SEA_LEVEL - 5;
}

export function isLavaCave(y) {
  return y < -30;
}

export function carveCaves(blocks, wx, wz, getBlock, setBlock, noise3D, noise2D, seed, biome) {
  const size = blocks.length;
  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const wxb = wx + x, wzb = wz + z;
      const canyonD = isCanyon(wxb, wzb, noise2D, seed) ? getCanyonDepth(wxb, wzb, noise2D, seed) : 0;
      for (let y = 0; y < blocks[0][0].length; y++) {
        const id = getBlock(x, y, z);
        if (id === 0) continue;
        if (isCave(wxb, y, wzb, noise3D, seed) || isLargeCavern(wxb, y, wzb, noise3D)) {
          setBlock(x, y, z, 0);
        }
        if (canyonD > 0) {
          const surface = findSurfaceY(blocks, x, z, getBlock);
          if (y > surface - canyonD && y <= surface) setBlock(x, y, z, 0);
        }
        if (isLavaCave(y) && isCave(wxb, y, wzb, noise3D, seed)) {
          const b = getBlockByName('lava');
          if (Math.random() < 0.02) setBlock(x, y, z, b);
        }
      }
    }
  }
}

function findSurfaceY(blocks, x, z, getBlock) {
  for (let y = blocks[0][0].length - 1; y >= 0; y--) {
    const id = getBlock(x, y, z);
    if (id !== 0) return y;
  }
  return 0;
}

function getBlockByName(name) {
  return 0;
}
