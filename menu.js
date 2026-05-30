/**
 * Navigation, Welten-Manager, Settings
 */
let gameRef = null;

export function initMenu(game) {
  gameRef = game;
  document.getElementById('btn-play').onclick = () => showScreen('worlds-screen');
  document.getElementById('btn-worlds').onclick = () => showScreen('worlds-screen');
  document.getElementById('btn-marketplace').onclick = () => { showScreen('marketplace-screen'); loadMarketplace(); };
  document.getElementById('btn-settings').onclick = () => showScreen('settings-screen');
  document.getElementById('btn-auth').onclick = () => document.getElementById('auth-modal').classList.remove('hidden');
  document.getElementById('btn-back-worlds').onclick = () => showScreen('main-menu');
  document.getElementById('btn-back-marketplace').onclick = () => showScreen('main-menu');
  document.getElementById('btn-back-settings').onclick = () => showScreen('main-menu');
  document.getElementById('btn-create-world').onclick = createWorld;
  document.getElementById('btn-resume').onclick = () => game.resume();
  document.getElementById('btn-save').onclick = () => { game.saveWorld(); alert('Gespeichert!'); };
  document.getElementById('btn-quit').onclick = quitToMenu;
  document.getElementById('btn-close-auth').onclick = () => document.getElementById('auth-modal').classList.add('hidden');

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && game.running) {
      if (game.paused) game.resume();
      else game.pause();
    }
    if (e.code === 'KeyE' && game.running) {
      document.getElementById('inventory-panel').classList.toggle('hidden');
      game.inventory?.render?.();
    }
  });

  refreshWorldList();
}

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  if (id === 'game-screen') {
    document.getElementById('game-screen').style.display = 'block';
  } else {
    document.getElementById('game-screen')?.classList.remove('active');
    document.getElementById('game-screen').style.display = 'none';
  }
}

function createWorld() {
  const name = document.getElementById('world-name').value.trim() || `Welt ${Date.now()}`;
  const type = document.getElementById('world-type').value;
  const seedInput = document.getElementById('world-seed').value;
  const seed = seedInput ? hashSeed(seedInput) : Math.floor(Math.random() * 999999);
  const id = `w_${Date.now()}`;
  const meta = { id, name, type, seed, created: Date.now() };
  const worlds = getWorldList();
  worlds.push(meta);
  localStorage.setItem('bloxdi_worlds', JSON.stringify(worlds));
  startWorld(meta);
}

function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

export function getWorldList() {
  try { return JSON.parse(localStorage.getItem('bloxdi_worlds') || '[]'); }
  catch { return []; }
}

function refreshWorldList() {
  const list = document.getElementById('world-list');
  list.innerHTML = '';
  const worlds = getWorldList();
  if (!worlds.length) {
    list.innerHTML = '<p style="color:#94a3b8;padding:1rem">Noch keine Welten. Erstelle eine!</p>';
    return;
  }
  worlds.forEach((w) => {
    const div = document.createElement('div');
    div.className = 'world-item';
    div.innerHTML = `<span><strong>${w.name}</strong><br><small>${w.type} · Seed ${w.seed}</small></span><span>▶</span>`;
    div.onclick = () => startWorld(w);
    list.appendChild(div);
  });
}

function startWorld(meta) {
  gameRef.startWorld(meta);
}

function quitToMenu() {
  gameRef.running = false;
  gameRef.saveWorld();
  clearInterval(gameRef.saveInterval);
  showScreen('main-menu');
  refreshWorldList();
}

function loadMarketplace() {
  const list = document.getElementById('marketplace-list');
  const demos = [
    { name: 'Skyblock Challenge', author: 'Community', rating: 4.8, downloads: 1203, cat: 'Survival' },
    { name: 'Parkour Paradise', author: 'BuilderMax', rating: 4.9, downloads: 3421, cat: 'Parkour' },
    { name: 'Medieval Castle', author: 'Architekt99', rating: 4.7, downloads: 892, cat: 'Bauen' },
    { name: 'Cave Explorer', author: 'MinerPro', rating: 4.6, downloads: 567, cat: 'Adventure' },
  ];
  list.innerHTML = demos.map((d) => `
    <div class="world-item">
      <span><strong>${d.name}</strong><br><small>${d.cat} · ⭐ ${d.rating} · ${d.downloads} Downloads · 100% GRATIS</small></span>
      <button class="menu-btn" style="width:auto;padding:0.4rem 0.8rem">Download</button>
    </div>
  `).join('');
}
