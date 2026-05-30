/**
 * Dörfer, Tempel, Dungeons, Festungen, etc.
 */
import { getBlockByName } from './blocks.js';

function bid(name) { return getBlockByName(name)?.id ?? 0; }

export function placeOakTree(setBlock, x, y, z, height = 6) {
  const log = bid('oak_log');
  const leaves = bid('oak_planks');
  for (let i = 0; i < height; i++) setBlock(x, y + i, z, log);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dy = height - 2; dy <= height + 1; dy++) {
        if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy - height) < 4)
          setBlock(x + dx, y + dy, z + dz, leaves);
      }
    }
  }
}

export function placeSpruceTree(setBlock, x, y, z, height = 10) {
  const log = bid('spruce_log');
  const leaves = bid('spruce_planks');
  for (let i = 0; i < height; i++) setBlock(x, y + i, z, log);
  for (let layer = 0; layer < 4; layer++) {
    const r = 2 - Math.floor(layer / 2);
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++)
        if (Math.abs(dx) !== r || Math.abs(dz) !== r)
          setBlock(x + dx, y + height - 2 + layer, z + dz, leaves);
  }
}

export function placeBirchTree(setBlock, x, y, z) { placeOakTree(setBlock, x, y, z, 7); }
export function placeJungleTree(setBlock, x, y, z) { placeOakTree(setBlock, x, y, z, 12); }
export function placeAcaciaTree(setBlock, x, y, z) { placeOakTree(setBlock, x, y, z, 6); }
export function placeCherryTree(setBlock, x, y, z) { placeOakTree(setBlock, x, y, z, 6); }
export function placePalmTree(setBlock, x, y, z) {
  const log = bid('palm_log');
  const leaves = bid('palm_planks');
  for (let i = 0; i < 7; i++) setBlock(x, y + i, z, log);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      setBlock(x + dx, y + 7, z + dz, leaves);
}

const TREE_PLACERS = {
  oak: placeOakTree, spruce: placeSpruceTree, birch: placeBirchTree,
  jungle: placeJungleTree, acacia: placeAcaciaTree, cherry: placeCherryTree,
  palm: placePalmTree, bamboo: placeOakTree,
};

export function placeTree(type, setBlock, x, y, z) {
  const fn = TREE_PLACERS[type] ?? placeOakTree;
  fn(setBlock, x, y, z);
}

export function generateVillage(setBlock, originX, originY, originZ, variant = 'plains') {
  const plank = variant === 'desert' ? bid('sandstone') : variant === 'snow' ? bid('spruce_planks') : bid('oak_planks');
  const log = variant === 'desert' ? bid('sandstone') : bid('oak_log');
  const houseCount = 8 + Math.floor(Math.random() * 8);
  for (let h = 0; h < houseCount; h++) {
    const hx = originX + (Math.random() * 40 - 20) | 0;
    const hz = originZ + (Math.random() * 40 - 20) | 0;
    const w = 5 + (Math.random() * 3) | 0;
    const d = 5 + (Math.random() * 3) | 0;
    const height = 4;
    for (let dx = 0; dx < w; dx++) {
      for (let dz = 0; dz < d; dz++) {
        for (let dy = 0; dy < height; dy++) {
          const edge = dx === 0 || dz === 0 || dx === w - 1 || dz === d - 1;
          if (edge && dy < height - 1) setBlock(hx + dx, originY + dy, hz + dz, plank);
          else if (dy === 0) setBlock(hx + dx, originY, hz + dz, plank);
        }
      }
    }
    setBlock(hx + (w >> 1), originY + 1, hz, 0);
    if (h === 0) setBlock(hx + 2, originY + 1, hz + 2, bid('chest'));
  }
  setBlock(originX, originY, originZ, bid('stone'));
}

export function generateDungeon(setBlock, x, y, z) {
  const cobble = bid('cobblestone');
  const chest = bid('chest');
  const spawner = bid('spawner');
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      for (let dy = 0; dy < 4; dy++) {
        const wall = dx === -3 || dx === 3 || dz === -3 || dz === 3 || dy === 0 || dy === 3;
        if (wall) setBlock(x + dx, y + dy, z + dz, cobble);
        else setBlock(x + dx, y + dy, z + dz, 0);
      }
    }
  }
  setBlock(x, y + 1, z, spawner);
  setBlock(x - 2, y + 1, z - 2, chest);
  setBlock(x + 2, y + 1, z + 2, chest);
  setBlock(x, y + 2, z - 3, bid('torch'));
}

export function generateDesertTemple(setBlock, x, y, z) {
  const sand = bid('sandstone');
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      setBlock(x + dx, y, z + dz, sand);
      if (Math.abs(dx) === 4 || Math.abs(dz) === 4) {
        for (let dy = 1; dy < 6; dy++) setBlock(x + dx, y + dy, z + dz, sand);
      }
    }
  }
  setBlock(x, y + 1, z, bid('chest'));
}

export function generateIgloo(setBlock, x, y, z) {
  const snow = bid('snow_block');
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      for (let dy = 0; dy < 4; dy++) {
        if (dx * dx + dz * dz + dy * dy < 14) setBlock(x + dx, y + dy, z + dz, snow);
      }
    }
  }
}

export function tryPlaceStructure(chunkX, chunkZ, seed, setBlock, getSurfaceY, biome) {
  const hash = Math.sin(chunkX * 127.1 + chunkZ * 311.7 + seed) * 43758.5453;
  const r = hash - Math.floor(hash);
  const wx = chunkX * 16;
  const wz = chunkZ * 16;
  if (r < 0.02 && biome.id === 'plains') {
    const sx = wx + 8, sz = wz + 8;
    generateVillage(setBlock, sx, getSurfaceY(sx, sz) + 1, sz, 'plains');
  } else if (r < 0.025 && biome.id === 'desert') {
    generateDesertTemple(setBlock, wx + 8, getSurfaceY(wx + 8, wz + 8), wz + 8);
  } else if (r < 0.03 && biome.id === 'tundra') {
    generateIgloo(setBlock, wx + 5, getSurfaceY(wx + 5, wz + 5) + 1, wz + 5);
  } else if (r < 0.035) {
    const sx = wx + (Math.random() * 14) | 0;
    const sz = wz + (Math.random() * 14) | 0;
    generateDungeon(setBlock, sx, getSurfaceY(sx, sz) - 8, sz);
  }
}
