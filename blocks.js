/**
 * BLOXDI.IO – 300+ Blöcke mit 16×16 Canvas-Texturen
 */
import * as THREE from 'three';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 128;
export const SEA_LEVEL = 64;

const blocks = [];
const blockByName = new Map();
const blockById = new Map();

let textureAtlas = null;
const textureCache = new Map();

export function getBlock(id) { return blockById.get(id) ?? blockById.get(0); }
export function getBlockByName(name) { return blockByName.get(name); }
export function getAllBlocks() { return blocks; }
export function getBlockCount() { return blocks.length; }

function noise2D(x, y, seed = 0) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function registerBlock(def) {
  const id = blocks.length;
  const block = {
    id,
    name: def.name,
    solid: def.solid ?? true,
    transparent: def.transparent ?? false,
    liquid: def.liquid ?? false,
    light: def.light ?? 0,
    hardness: def.hardness ?? 1,
    tool: def.tool ?? 'pickaxe',
    drops: def.drops ?? id,
    category: def.category ?? 'misc',
    draw: def.draw ?? 'cube',
    colors: def.colors,
    drawFn: def.drawFn,
  };
  blocks.push(block);
  blockByName.set(def.name, block);
  blockById.set(id, block);
  return id;
}

function drawPixel(ctx, x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, 1, 1);
}

function drawNoiseRect(ctx, x, y, w, h, base, variance, seed) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const v = (noise2D(px, py, seed) - 0.5) * variance;
      const r = Math.max(0, Math.min(255, base[0] + v));
      const g = Math.max(0, Math.min(255, base[1] + v));
      const b = Math.max(0, Math.min(255, base[2] + v));
      drawPixel(ctx, px, py, `rgb(${r|0},${g|0},${b|0})`);
    }
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeTexture(drawFn, name) {
  if (textureCache.has(name)) return textureCache.get(name);
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawFn(ctx);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  textureCache.set(name, tex);
  return tex;
}

function texGrass(ctx) {
  drawNoiseRect(ctx, 0, 8, 16, 8, [90, 60, 30], 25, 1);
  drawNoiseRect(ctx, 0, 0, 16, 8, [60, 140, 50], 30, 2);
  for (let i = 0; i < 20; i++) {
    const x = (noise2D(i, 0, 3) * 16) | 0;
    drawPixel(ctx, x, 7, '#3d8b37');
    drawPixel(ctx, x, 6, '#2d6b27');
  }
}

function texStone(ctx) {
  drawNoiseRect(ctx, 0, 0, 16, 16, [120, 120, 125], 35, 4);
  for (let i = 0; i < 8; i++) {
    const x = (noise2D(i, 1, 5) * 14) | 0;
    const y = (noise2D(i, 2, 6) * 14) | 0;
    drawPixel(ctx, x, y, '#9a9a9f');
    drawPixel(ctx, x + 1, y, '#6a6a6f');
  }
}

function texWood(bark, inner, ctx) {
  const b = hexToRgb(bark);
  const inn = hexToRgb(inner);
  drawNoiseRect(ctx, 0, 0, 16, 16, b, 20, 7);
  for (let y = 0; y < 16; y++) {
    const ring = noise2D(0, y, 8) > 0.6;
    if (ring) drawPixel(ctx, 4, y, `rgb(${inn[0]},${inn[1]},${inn[2]})`);
    if (ring) drawPixel(ctx, 11, y, `rgb(${inn[0]},${inn[1]},${inn[2]})`);
  }
}

function texOre(ctx, stone, ore) {
  drawNoiseRect(ctx, 0, 0, 16, 16, hexToRgb(stone), 30, 9);
  for (let i = 0; i < 12; i++) {
    const x = (noise2D(i, 3, 10) * 14) | 0;
    const y = (noise2D(i, 4, 11) * 14) | 0;
    drawNoiseRect(ctx, x, y, 2, 2, hexToRgb(ore), 15, i);
  }
}

function texSolid(color, ctx, variance = 25) {
  drawNoiseRect(ctx, 0, 0, 16, 16, hexToRgb(color), variance, color.charCodeAt(1));
}

function texWater(ctx) {
  drawNoiseRect(ctx, 0, 0, 16, 16, [30, 80, 180], 40, 20);
  for (let i = 0; i < 6; i++) {
    const x = (noise2D(i, 5, 21) * 14) | 0;
    drawPixel(ctx, x, (noise2D(i, 6, 22) * 14) | 0, 'rgba(255,255,255,0.5)');
  }
}

function texLava(ctx) {
  drawNoiseRect(ctx, 0, 0, 16, 16, [200, 60, 10], 50, 23);
  for (let i = 0; i < 8; i++) {
    drawPixel(ctx, (noise2D(i, 7, 24) * 14) | 0, (noise2D(i, 8, 25) * 14) | 0, '#ffcc00');
  }
}

// === NATUR (60) ===
registerBlock({ name: 'air', solid: false, transparent: true, hardness: 0 });
registerBlock({ name: 'grass', colors: ['#3d8b37', '#5a9e3e', '#5a4030'], drawFn: texGrass, category: 'nature' });
registerBlock({ name: 'dirt', colors: ['#5a4030'], drawFn: (c) => texSolid('#5a4030', c), category: 'nature' });
registerBlock({ name: 'coarse_dirt', colors: ['#6b4a2a'], drawFn: (c) => texSolid('#6b4a2a', c, 35), category: 'nature' });
registerBlock({ name: 'podzol', colors: ['#4a3520'], drawFn: (c) => { texSolid('#4a3520', c); drawNoiseRect(c, 0, 0, 16, 6, [60, 140, 50], 25, 1); }, category: 'nature' });
registerBlock({ name: 'mycelium', colors: ['#6a5080'], drawFn: (c) => { texSolid('#6a5080', c, 20); drawNoiseRect(c, 0, 0, 16, 6, [140, 100, 160], 25, 2); }, category: 'nature' });
registerBlock({ name: 'stone', drawFn: texStone, hardness: 1.5, category: 'nature' });
registerBlock({ name: 'cobblestone', drawFn: (c) => texSolid('#6a6a6f', c, 40), hardness: 2, category: 'nature' });
registerBlock({ name: 'stone_bricks', drawFn: (c) => texSolid('#7a7a80', c, 15), category: 'nature' });
registerBlock({ name: 'mossy_stone', drawFn: (c) => { texStone(c); drawNoiseRect(c, 0, 0, 16, 16, [40, 100, 40], 30, 30); }, category: 'nature' });
registerBlock({ name: 'sand', drawFn: (c) => texSolid('#dbd3a0', c), category: 'nature' });
registerBlock({ name: 'red_sand', drawFn: (c) => texSolid('#b85c38', c), category: 'nature' });
registerBlock({ name: 'sandstone', drawFn: (c) => texSolid('#d4c48a', c, 20), category: 'nature' });
registerBlock({ name: 'gravel', drawFn: (c) => texSolid('#8a8580', c, 45), category: 'nature' });
registerBlock({ name: 'clay', drawFn: (c) => texSolid('#9aa4b0', c), category: 'nature' });
registerBlock({ name: 'snow', drawFn: (c) => texSolid('#f0f8ff', c, 10), category: 'nature' });
registerBlock({ name: 'ice', transparent: true, drawFn: (c) => texSolid('#a8d8f0', c, 15), category: 'nature' });
registerBlock({ name: 'packed_ice', drawFn: (c) => texSolid('#88c8e8', c), category: 'nature' });
registerBlock({ name: 'blue_ice', drawFn: (c) => texSolid('#4080c0', c), category: 'nature' });
registerBlock({ name: 'moss', drawFn: (c) => texSolid('#3a6b30', c), category: 'nature' });
registerBlock({ name: 'moss_carpet', solid: false, drawFn: (c) => texSolid('#4a7b40', c), category: 'nature' });
registerBlock({ name: 'fern', solid: false, transparent: true, drawFn: (c) => texSolid('#2d6b27', c), category: 'nature' });
registerBlock({ name: 'tall_fern', solid: false, transparent: true, drawFn: (c) => texSolid('#2d7b30', c), category: 'nature' });
registerBlock({ name: 'dead_bush', solid: false, drawFn: (c) => texSolid('#8b6914', c), category: 'nature' });
registerBlock({ name: 'short_grass', solid: false, transparent: true, drawFn: (c) => texSolid('#4a9e40', c), category: 'nature' });
registerBlock({ name: 'seagrass', solid: false, transparent: true, drawFn: (c) => texSolid('#2a7a40', c), category: 'nature' });
registerBlock({ name: 'kelp', solid: false, transparent: true, drawFn: (c) => texSolid('#1a5a30', c), category: 'nature' });
registerBlock({ name: 'cactus', drawFn: (c) => texSolid('#2d8a2d', c), category: 'nature' });
registerBlock({ name: 'vine', solid: false, transparent: true, drawFn: (c) => texSolid('#2a6a20', c), category: 'nature' });
registerBlock({ name: 'lily_pad', solid: false, drawFn: (c) => texSolid('#2a8a30', c), category: 'nature' });
registerBlock({ name: 'lily', solid: false, transparent: true, drawFn: (c) => { texSolid('#ffffff', c); drawPixel(c, 8, 8, '#ff6080'); }, category: 'nature' });
registerBlock({ name: 'brown_mushroom', solid: false, drawFn: (c) => { texSolid('#8b6914', c, 5); drawNoiseRect(c, 4, 0, 8, 6, [160, 120, 80], 20, 40); }, category: 'nature' });
registerBlock({ name: 'red_mushroom', solid: false, drawFn: (c) => { texSolid('#8b6914', c, 5); drawNoiseRect(c, 4, 0, 8, 6, [200, 40, 40], 20, 41); }, category: 'nature' });
registerBlock({ name: 'mushroom_block', drawFn: (c) => texSolid('#c8a080', c), category: 'nature' });
registerBlock({ name: 'pumpkin', drawFn: (c) => { texSolid('#c87820', c); for (let i = 0; i < 4; i++) drawPixel(c, 6 + i, 6, '#1a1a1a'); }, category: 'nature' });
registerBlock({ name: 'melon', drawFn: (c) => { texSolid('#5a9a30', c); for (let y = 0; y < 16; y += 4) drawPixel(c, 0, y, '#3a6a20'); }, category: 'nature' });
registerBlock({ name: 'bamboo', drawFn: (c) => texSolid('#6a9a30', c), category: 'nature' });
registerBlock({ name: 'sugar_cane', solid: false, transparent: true, drawFn: (c) => texSolid('#8aba50', c), category: 'nature' });
registerBlock({ name: 'bedrock', hardness: -1, drawFn: (c) => texSolid('#2a2a2a', c, 50), category: 'nature' });
registerBlock({ name: 'mud', drawFn: (c) => texSolid('#4a3a30', c), category: 'nature' });
registerBlock({ name: 'rooted_dirt', drawFn: (c) => { texSolid('#5a4030', c); for (let i = 0; i < 8; i++) drawPixel(c, (i * 2) % 16, 15, '#3a2a18'); }, category: 'nature' });

// Erze (25)
const ores = [
  ['coal_ore', '#2a2a2a', '#1a1a1a'], ['iron_ore', '#8a7a6a', '#c8a880'],
  ['gold_ore', '#8a7a6a', '#ffd700'], ['diamond_ore', '#8a7a6a', '#40e0ff'],
  ['lapis_ore', '#8a7a6a', '#2040c0'], ['redstone_ore', '#8a7a6a', '#c01010'],
  ['emerald_ore', '#8a7a6a', '#20c060'], ['nether_quartz_ore', '#4a2020', '#e8e0d0'],
  ['copper_ore', '#8a7a6a', '#c87840'], ['tin_ore', '#8a7a6a', '#a0a0a8'],
  ['silver_ore', '#8a7a6a', '#c0c0c8'], ['ruby_ore', '#8a7a6a', '#c02040'],
  ['sapphire_ore', '#8a7a6a', '#2040c0'], ['amethyst_ore', '#8a7a6a', '#9060c0'],
  ['topaz_ore', '#8a7a6a', '#e0a040'], ['jade_ore', '#8a7a6a', '#40a060'],
  ['meteorite_ore', '#3a3a4a', '#6060a0'], ['titanium_ore', '#6a6a7a', '#a0b0c0'],
  ['platinum_ore', '#7a7a8a', '#d0d8e8'], ['uranium_ore', '#4a5a30', '#80c040'],
  ['salt_ore', '#c8c8b0', '#f0f0e8'], ['sulfur_ore', '#c8c040', '#e8e060'],
  ['obsidian', '#101020', '#101020'], ['crying_obsidian', '#201030', '#8040a0'],
  ['netherite_ore', '#3a3040', '#504050'],
];
for (const [name, stone, ore] of ores) {
  registerBlock({
    name, hardness: 3, tool: 'pickaxe', category: 'ore',
    drawFn: (ctx) => texOre(ctx, stone, ore),
  });
}

// Holz-Arten (18 × 8 Varianten)
const WOODS = [
  ['oak', '#5a4030', '#8b6914'], ['birch', '#d4c4a8', '#c8b888'],
  ['spruce', '#3a2a18', '#5a4030'], ['jungle', '#4a3020', '#6a5030'],
  ['acacia', '#6a4030', '#a06030'], ['mangrove', '#4a3028', '#6a4840'],
  ['cherry', '#5a3530', '#c08090'], ['bamboo_wood', '#8a9a40', '#a0b050'],
  ['mahogany', '#4a2818', '#6a3828'], ['palm', '#8a7a50', '#a09060'],
  ['cedar', '#5a3820', '#7a5030'], ['maple', '#6a4830', '#9a6840'],
  ['walnut', '#3a2818', '#5a3828'], ['ebony', '#1a1410', '#2a2018'],
  ['teak', '#5a4830', '#7a6040'], ['pine', '#4a3828', '#6a5038'],
  ['larch', '#6a5840', '#8a7050'], ['redwood', '#6a3020', '#8a4030'],
];
const WOOD_SUFFIX = [
  ['log', (b, i, ctx) => texWood(b, i, ctx)],
  ['planks', (b, i, ctx) => texSolid(i, ctx, 15)],
  ['stairs', (b, i, ctx) => { texSolid(i, ctx, 15); drawPixel(ctx, 0, 0, '#00000044'); }],
  ['slab', (b, i, ctx) => texSolid(i, ctx, 15)],
  ['fence', (b, i, ctx) => texWood(b, i, ctx)],
  ['door', (b, i, ctx) => { texWood(b, i, ctx); drawPixel(ctx, 7, 7, '#ffd700'); }],
  ['trapdoor', (b, i, ctx) => texSolid(i, ctx, 10)],
  ['sign', (b, i, ctx) => { texWood(b, i, ctx); drawNoiseRect(ctx, 2, 2, 12, 10, [200, 180, 140], 20, 50); }],
];
for (const [wood, bark, inner] of WOODS) {
  for (const [suffix, draw] of WOOD_SUFFIX) {
    registerBlock({
      name: `${wood}_${suffix}`,
      hardness: suffix === 'log' ? 2 : 1.5,
      tool: 'axe',
      category: 'wood',
      drawFn: (ctx) => draw(bark, inner, ctx),
    });
  }
}

// Bau-Blöcke (50+)
const COLORS16 = ['#f44336','#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#03a9f4','#00bcd4','#009688','#4caf50','#8bc34a','#cddc39','#ffeb3b','#ffc107','#ff9800','#795548'];
for (let i = 0; i < 16; i++) {
  registerBlock({ name: `concrete_${i}`, drawFn: (c) => texSolid(COLORS16[i], c, 8), category: 'build' });
  registerBlock({ name: `terracotta_${i}`, drawFn: (c) => texSolid(COLORS16[i], c, 25), category: 'build' });
  registerBlock({ name: `wool_${i}`, drawFn: (c) => texSolid(COLORS16[i], c, 35), category: 'build' });
  registerBlock({ name: `stained_glass_${i}`, transparent: true, drawFn: (c) => { texSolid(COLORS16[i], c, 10); }, category: 'build' });
  registerBlock({ name: `carpet_${i}`, solid: false, drawFn: (c) => texSolid(COLORS16[i], c, 20), category: 'deco' });
}
registerBlock({ name: 'glass', transparent: true, drawFn: (c) => { c.fillStyle = 'rgba(180,220,255,0.4)'; c.fillRect(0, 0, 16, 16); }, category: 'build' });
registerBlock({ name: 'glass_pane', transparent: true, solid: false, drawFn: (c) => { c.fillStyle = 'rgba(180,220,255,0.5)'; c.fillRect(0, 0, 16, 16); }, category: 'build' });
['diorite','andesite','granite','marble','basalt','prismarine','dark_prismarine','bricks'].forEach((n, i) => {
  const cols = ['#c8c8c0','#8a8a85','#a08070','#e8e8e0','#3a3a40','#60a090','#306050','#8a4030'];
  registerBlock({ name: n, drawFn: (c) => texSolid(cols[i], c, 20), category: 'build' });
});

// Deko (35+)
const flowers = ['rose','tulip','daisy','sunflower','orchid','lavender','poppy','cornflower','allium','peony'];
const flowerColors = ['#c02040','#e04060','#f0f0e0','#ffd020','#8040c0','#9060c0','#c04040','#4080e0','#c060e0','#f080a0'];
flowers.forEach((f, i) => {
  registerBlock({ name: `flower_${f}`, solid: false, transparent: true, drawFn: (c) => { texSolid('#2d8a2d', c, 5); drawNoiseRect(c, 5, 2, 6, 6, hexToRgb(flowerColors[i]), 20, i); }, category: 'deco' });
});
for (let i = 0; i < 5; i++) {
  registerBlock({ name: `coral_${i}`, drawFn: (c) => texSolid(COLORS16[i], c, 30), category: 'deco' });
}
registerBlock({ name: 'lantern', light: 15, drawFn: (c) => { texSolid('#4a4a4a', c); drawNoiseRect(c, 4, 4, 8, 8, [255, 200, 80], 30, 60); }, category: 'deco' });
registerBlock({ name: 'chain', solid: false, drawFn: (c) => texSolid('#8a8a90', c), category: 'deco' });
registerBlock({ name: 'frame', solid: false, drawFn: (c) => { texSolid('#8b6914', c); c.strokeStyle = '#5a4030'; c.strokeRect(2, 2, 12, 12); }, category: 'deco' });
registerBlock({ name: 'flower_pot', drawFn: (c) => { texSolid('#8b4513', c); drawPixel(c, 8, 4, '#c02040'); }, category: 'deco' });
registerBlock({ name: 'banner', solid: false, drawFn: (c) => texSolid('#c02040', c), category: 'deco' });

// Spezial (30+)
registerBlock({ name: 'water', solid: false, transparent: true, liquid: true, drawFn: texWater, category: 'special' });
registerBlock({ name: 'lava', solid: false, transparent: true, liquid: true, light: 15, drawFn: texLava, category: 'special' });
registerBlock({ name: 'torch', solid: false, light: 14, drawFn: (c) => { texSolid('#8b6914', c, 5); drawPixel(c, 8, 4, '#ffaa00'); drawPixel(c, 8, 3, '#ff6600'); }, category: 'special' });
registerBlock({ name: 'chest', drawFn: (c) => { texSolid('#8b6914', c); drawPixel(c, 7, 8, '#ffd700'); }, category: 'special' });
registerBlock({ name: 'furnace', drawFn: (c) => texSolid('#6a6a6f', c), category: 'special' });
registerBlock({ name: 'crafting_table', drawFn: (c) => { texWood('#8b6914', '#c8a060', c); }, category: 'special' });
registerBlock({ name: 'tnt', drawFn: (c) => { texSolid('#c02020', c); drawPixel(c, 4, 4, '#fff'); drawPixel(c, 11, 4, '#fff'); }, category: 'special' });
registerBlock({ name: 'bookshelf', drawFn: (c) => { texWood('#8b6914', '#c8a060', c); for (let y = 2; y < 14; y += 3) drawPixel(c, 4, y, '#2040a0'); }, category: 'special' });
registerBlock({ name: 'enchanting_table', drawFn: (c) => { texSolid('#402060', c); drawNoiseRect(c, 2, 2, 12, 4, [80, 200, 255], 40, 70); }, category: 'special' });
registerBlock({ name: 'anvil', drawFn: (c) => texSolid('#3a3a40', c), category: 'special' });
registerBlock({ name: 'grindstone', drawFn: (c) => texSolid('#6a6a6f', c), category: 'special' });
registerBlock({ name: 'smoker', drawFn: (c) => texSolid('#4a4a50', c), category: 'special' });
registerBlock({ name: 'cartography', drawFn: (c) => texSolid('#8b6914', c), category: 'special' });
registerBlock({ name: 'loom', drawFn: (c) => texSolid('#c8a080', c), category: 'special' });
registerBlock({ name: 'fletching', drawFn: (c) => texSolid('#8b6914', c), category: 'special' });
registerBlock({ name: 'smithing', drawFn: (c) => texSolid('#4a4a55', c), category: 'special' });
registerBlock({ name: 'ender_chest', light: 7, drawFn: (c) => { texSolid('#102030', c); drawPixel(c, 8, 8, '#40ff80'); }, category: 'special' });
registerBlock({ name: 'shulker_box', drawFn: (c) => texSolid('#9060a0', c), category: 'special' });

// Leucht-Blöcke (20)
['glowstone','sea_lantern','redstone_lamp','beacon','end_rod','candle','jack_o_lantern','redstone_torch'].forEach((n, i) => {
  const lights = [15, 15, 15, 15, 14, 10, 15, 7];
  registerBlock({ name: n, light: lights[i], drawFn: (c) => texSolid(['#e8d080','#80c8c0','#c04020','#60c0ff','#e0e0e0','#f0e0a0','#e0a020','#c04020'][i], c, 30), category: 'light' });
});
registerBlock({ name: 'lava_cauldron', light: 12, drawFn: texLava, category: 'light' });
registerBlock({ name: 'campfire', light: 15, drawFn: (c) => { texSolid('#4a3020', c); drawNoiseRect(c, 2, 6, 12, 6, [255, 100, 20], 40, 80); }, category: 'light' });

// Nether (15)
['netherrack','nether_brick','soul_sand','soul_soil','blackstone','crimson_stem','warped_stem','nether_wart','glowstone_nether','nether_gold','magma','nether_sprouts'].forEach((n, i) => {
  const cols = ['#6a2020','#4a1818','#4a4030','#3a3530','#2a2a30','#6a1020','#206a60','#8a1020','#e8d080','#ffd700','#c04010','#40a060'];
  registerBlock({ name: n, drawFn: (c) => texSolid(cols[i], c, 25), category: 'nether' });
});

// End (12)
['end_stone','purpur_block','purpur_pillar','end_portal','end_portal_frame','end_crystal_block','chorus_plant','chorus_flower'].forEach((n, i) => {
  const cols = ['#d8d8a0','#9060a0','#8060a0','#102030','#404060','#80ffff','#604080','#a060c0'];
  registerBlock({ name: n, drawFn: (c) => texSolid(cols[i], c, 20), category: 'end', transparent: n.includes('portal') });
});

// Unterwasser
['prismarine_bricks','coral_block','sea_pickle','sponge'].forEach((n, i) => {
  registerBlock({ name: n, drawFn: (c) => texSolid(['#50a090','#ff6080','#f0e080','#c8c040'][i], c), category: 'underwater' });
});

// Redstone (20)
['redstone_block','repeater','comparator','piston','sticky_piston','dispenser','dropper','note_block','observer','target','slime_block','honey_block'].forEach((n, i) => {
  registerBlock({ name: n, drawFn: (c) => texSolid(['#c01010','#8a8a8a','#8a8a8a','#8b6914','#6a5030','#6a6a6f','#6a6a6f','#8b6914','#4a4a50','#c8c040','#60c060','#e0a040'][i], c), category: 'redstone' });
});

// Sonstige
['bone_block','slime','honeycomb','spawner','barrier','light_block'].forEach((n, i) => {
  registerBlock({ name: n, drawFn: (c) => texSolid(['#e8e8d0','#60c060','#e0c060','#202020','#ff00ff','#ffffff'][i], c), category: 'misc', transparent: n === 'barrier' });
});

// Fill to 300+ if needed with variants
const extraNames = ['moss_block','tuff','calcite','deepslate','raw_iron_block','raw_gold_block','raw_copper_block'];
extraNames.forEach((n, i) => {
  registerBlock({ name: n, drawFn: (c) => texSolid(['#4a7b40','#5a5a55','#e0e0e0','#3a3a45','#c8a880','#ffd700','#c87840'][i], c), category: 'misc' });
});

// Snow/Eis extras
['snow_block','powder_snow','icicle','snow_golem','ice_golem'].forEach((n, i) => {
  registerBlock({ name: n, drawFn: (c) => texSolid(['#f0f8ff','#e8f0f8','#a0d0f0','#f0f8ff','#a0d8ff'][i], c), category: 'ice' });
});

console.log(`[Bloxdi] ${blocks.length} Blöcke registriert`);

export function getBlockTexture(blockId, face = 0) {
  const block = getBlock(blockId);
  if (!block || block.name === 'air') return null;
  const key = `${block.name}_f${face}`;
  if (block.drawFn) return makeTexture(block.drawFn, key);
  if (block.colors) {
    return makeTexture((ctx) => {
      const c = block.colors[Math.min(face, block.colors.length - 1)] ?? block.colors[0];
      if (typeof c === 'string' && c.startsWith('#')) texSolid(c, ctx);
      else texGrass(ctx);
    }, key);
  }
  return makeTexture(texStone, key);
}

/** Nur Starter-Texturen vorab – Rest lazy beim ersten Render */
export async function buildAllTextures(onProgress) {
  const priority = ['grass', 'dirt', 'stone', 'sand', 'water', 'oak_log', 'oak_planks', 'leaves', 'coal_ore', 'bedrock', 'cobblestone'];
  const ids = new Set();
  for (const name of priority) {
    const b = blockByName.get(name);
    if (b) ids.add(b.id);
  }
  for (let i = 0; i < Math.min(40, blocks.length); i++) ids.add(i);

  const list = [...ids];
  const total = list.length;
  for (let i = 0; i < total; i++) {
    try {
      getBlockTexture(list[i], 0);
    } catch (e) {
      console.warn('[Blocks] Textur', list[i], e);
    }
    if (onProgress) onProgress((i + 1) / total);
    await new Promise((r) => setTimeout(r, 0));
  }
  return textureCache.size;
}

export const BLOCK = {
  AIR: 0,
  GRASS: blockByName.get('grass')?.id ?? 1,
  DIRT: blockByName.get('dirt')?.id ?? 2,
  STONE: blockByName.get('stone')?.id ?? 6,
  WATER: blockByName.get('water')?.id ?? 0,
  BEDROCK: blockByName.get('bedrock')?.id ?? 0,
  SAND: blockByName.get('sand')?.id ?? 0,
};
