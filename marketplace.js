/**
 * Community-Welten – 100% kostenlos, nur Downloads
 */
export const COMMUNITY_WORLDS = [
  { id: 'sky1', name: 'Skyblock Challenge', author: 'Community', rating: 4.8, downloads: 1203, category: 'Survival', seed: 12345, type: 'skyblock' },
  { id: 'park1', name: 'Parkour Paradise', author: 'BuilderMax', rating: 4.9, downloads: 3421, category: 'Parkour', seed: 99999, type: 'flat' },
  { id: 'castle1', name: 'Medieval Castle', author: 'Architekt99', rating: 4.7, downloads: 892, category: 'Bauen', seed: 54321, type: 'flat' },
  { id: 'cave1', name: 'Cave Explorer', author: 'MinerPro', rating: 4.6, downloads: 567, category: 'Adventure', seed: 77777, type: 'normal' },
  { id: 'mount1', name: 'Alpine Peaks', author: 'TerrainKing', rating: 4.5, downloads: 445, category: 'Survival', seed: 11111, type: 'mountains' },
];

export function downloadWorld(id) {
  const world = COMMUNITY_WORLDS.find((w) => w.id === id);
  if (!world) return null;
  const meta = {
    id: `dl_${world.id}_${Date.now()}`,
    name: world.name,
    type: world.type,
    seed: world.seed,
    created: Date.now(),
    fromCommunity: true,
  };
  const worlds = JSON.parse(localStorage.getItem('bloxdi_worlds') || '[]');
  worlds.push(meta);
  localStorage.setItem('bloxdi_worlds', JSON.stringify(worlds));
  return meta;
}

export function rateWorld(id, stars) {
  console.log(`[Marketplace] Bewertung ${stars} Sterne für ${id}`);
}
