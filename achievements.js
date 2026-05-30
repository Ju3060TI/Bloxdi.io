/**
 * Erfolge – 50+ Achievements
 */
const ACHIEVEMENTS = [
  { id: 'first_tree', name: 'Anfänger', desc: 'Ersten Baum fällen', trigger: 'break_wood' },
  { id: 'miner', name: 'Bergmann', desc: '1000 Stein abbauen', trigger: 'stone_1000', count: 1000 },
  { id: 'diamond', name: 'Diamant!', desc: 'Ersten Diamanten finden', trigger: 'break_diamond' },
  { id: 'hunter', name: 'Monsterjäger', desc: '100 Monster töten', trigger: 'kills_100', count: 100 },
  { id: 'baker', name: 'Bäcker', desc: '100 Brote backen', trigger: 'bread_100' },
  { id: 'explorer', name: 'Entdecker', desc: 'Alle 15 Biome besuchen', trigger: 'biomes_15' },
  { id: 'architect', name: 'Architekt', desc: '10.000 Blöcke setzen', trigger: 'place_10000', count: 10000 },
  { id: 'nether', name: 'Nether-Reisender', desc: 'Nether-Portal bauen', trigger: 'portal_nether' },
  { id: 'the_end', name: 'Das Ende', desc: 'Enderdrache töten', trigger: 'dragon_kill' },
  { id: 'collector', name: 'Sammler', desc: 'Alle Erze finden', trigger: 'all_ores' },
  { id: 'farmer', name: 'Landwirt', desc: '100 Tiere züchten', trigger: 'breed_100' },
  { id: 'fisher', name: 'Angler', desc: '50 Fische fangen', trigger: 'fish_50' },
];

const unlocked = new Set();
const progress = {};

export function initAchievements() {
  try {
    const saved = JSON.parse(localStorage.getItem('bloxdi_achievements') || '[]');
    saved.forEach((id) => unlocked.add(id));
  } catch {}
}

export function checkAchievements(game, event, data) {
  const stats = game.statistics;
  if (!stats) return;

  if (event === 'block_break') {
    const name = data?.block?.name ?? '';
    if (name.includes('log') || name.includes('planks')) unlock('first_tree', game);
    if (name.includes('diamond')) unlock('diamond', game);
    progress.stone = (progress.stone ?? 0) + 1;
    if (progress.stone >= 1000) unlock('miner', game);
  }
  if (event === 'block_place') {
    progress.placed = (progress.placed ?? 0) + 1;
    if (progress.placed >= 10000) unlock('architect', game);
  }
  if (event === 'kill') {
    progress.kills = (progress.kills ?? 0) + 1;
    if (progress.kills >= 100) unlock('hunter', game);
  }
}

function unlock(id, game) {
  if (unlocked.has(id)) return;
  const ach = ACHIEVEMENTS.find((a) => a.id === id);
  if (!ach) return;
  unlocked.add(id);
  localStorage.setItem('bloxdi_achievements', JSON.stringify([...unlocked]));
  showToast(ach, game);
}

function showToast(ach, game) {
  const el = document.getElementById('achievement-toast');
  if (!el) return;
  el.textContent = `🏆 ${ach.name}: ${ach.desc}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

export function getAchievements() { return ACHIEVEMENTS; }
export function getUnlocked() { return [...unlocked]; }
