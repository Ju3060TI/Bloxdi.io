/**
 * 15+ Biome mit Temperatur, Feuchtigkeit, Farben
 */
export const BIOMES = {
  plains:      { id: 'plains',      temp: 0.8,  humidity: 0.4,  grass: '#7cbd3a', water: '#3f76e4', sky: '#78a7ff', surface: 'grass', tree: 'oak', heightMod: 0 },
  forest:      { id: 'forest',      temp: 0.7,  humidity: 0.6,  grass: '#59ae30', water: '#3f76e4', sky: '#6a9aff', surface: 'grass', tree: 'oak', heightMod: 2 },
  desert:      { id: 'desert',      temp: 2.0,  humidity: 0.0,  grass: '#bfb755', water: '#32a598', sky: '#6eb1ff', surface: 'sand', tree: null, heightMod: -2 },
  tundra:      { id: 'tundra',      temp: -1.0, humidity: 0.2,  grass: '#b0c4de', water: '#3d6db5', sky: '#a0c0ff', surface: 'snow', tree: 'spruce', heightMod: 0 },
  jungle:      { id: 'jungle',      temp: 1.2,  humidity: 1.0,  grass: '#59c93c', water: '#3a7bd5', sky: '#5a8aff', surface: 'grass', tree: 'jungle', heightMod: 4 },
  savanna:     { id: 'savanna',     temp: 1.5,  humidity: 0.3,  grass: '#bfb755', water: '#2590a8', sky: '#78b4ff', surface: 'grass', tree: 'acacia', heightMod: 1 },
  taiga:       { id: 'taiga',       temp: 0.2,  humidity: 0.5,  grass: '#86b783', water: '#3d6db5', sky: '#7aa8ff', surface: 'grass', tree: 'spruce', heightMod: 3 },
  swamp:       { id: 'swamp',       temp: 0.8,  humidity: 0.9,  grass: '#6a7039', water: '#4a7a60', sky: '#6a8a9a', surface: 'grass', tree: 'oak', heightMod: -4 },
  ocean:       { id: 'ocean',       temp: 0.5,  humidity: 0.8,  grass: '#3a7a40', water: '#1787d4', sky: '#78a7ff', surface: 'sand', tree: null, heightMod: -20 },
  mountains:   { id: 'mountains',   temp: 0.3,  humidity: 0.3,  grass: '#8ab689', water: '#3f76e4', sky: '#90b8ff', surface: 'stone', tree: null, heightMod: 25 },
  mushroom:    { id: 'mushroom',    temp: 0.6,  humidity: 0.7,  grass: '#9a6ab0', water: '#6a40a0', sky: '#a080c0', surface: 'mycelium', tree: 'mushroom', heightMod: 2 },
  dark_forest: { id: 'dark_forest', temp: 0.6,  humidity: 0.7,  grass: '#507a32', water: '#3f76e4', sky: '#4a6080', surface: 'grass', tree: 'oak', heightMod: 3 },
  badlands:    { id: 'badlands',    temp: 2.0,  humidity: 0.1,  grass: '#d9451f', water: '#4a7a98', sky: '#ff9060', surface: 'red_sand', tree: null, heightMod: 8 },
  bamboo:      { id: 'bamboo',      temp: 1.0,  humidity: 0.8,  grass: '#6faa50', water: '#3a7bd5', sky: '#68a0ff', surface: 'grass', tree: 'bamboo', heightMod: 2 },
  cherry:      { id: 'cherry',      temp: 0.9,  humidity: 0.5,  grass: '#b5db8a', water: '#5eb5d4', sky: '#ffb7c5', surface: 'grass', tree: 'cherry', heightMod: 1 },
};

const BIOME_LIST = Object.values(BIOMES);

export function getBiomeAt(temp, humidity) {
  let best = BIOMES.plains;
  let bestDist = Infinity;
  for (const b of BIOME_LIST) {
    const dt = (b.temp - temp) ** 2;
    const dh = (b.humidity - humidity) ** 2;
    const d = dt + dh;
    if (d < bestDist) { bestDist = d; best = b; }
  }
  return best;
}

export function sampleBiomeMap(x, z, noise2D, seed) {
  const scale = 0.002;
  const t = noise2D(x * scale, z * scale, seed) * 3 - 0.5;
  const h = noise2D(x * scale + 100, z * scale + 100, seed + 1) * 1.2;
  return getBiomeAt(t, h);
}

export function blendBiomeColor(b1, b2, t, prop) {
  const parse = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const a = parse(b1[prop]);
  const b = parse(b2[prop]);
  const r = (a[0] + (b[0] - a[0]) * t) | 0;
  const g = (a[1] + (b[1] - a[1]) * t) | 0;
  const bl = (a[2] + (b[2] - a[2]) * t) | 0;
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

export function getBiomeList() { return BIOME_LIST; }
