/**
 * Erweiterte Einstellungen – Keybinds, Grafik
 */
const DEFAULT_KEYBINDS = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD',
  jump: 'Space', sneak: 'ShiftLeft', inventory: 'KeyE',
  drop: 'KeyQ', interact: 'KeyF', pause: 'Escape', debug: 'F3',
  perspective: 'KeyF',
};

export function initSettings(game) {
  const saved = JSON.parse(localStorage.getItem('bloxdi_settings') || '{}');
  Object.assign(game.settings, saved);

  document.getElementById('set-render-dist')?.addEventListener('input', (e) => {
    game.settings.renderDistance = parseInt(e.target.value, 10);
    saveSettings(game.settings);
  });
  document.getElementById('set-master-vol')?.addEventListener('input', (e) => {
    if (game.sounds) game.sounds.master = e.target.value / 100;
    saveSettings(game.settings);
  });
  document.getElementById('set-music-vol')?.addEventListener('input', (e) => {
    if (game.sounds) game.sounds.music = e.target.value / 100;
  });
  document.getElementById('set-sfx-vol')?.addEventListener('input', (e) => {
    if (game.sounds) game.sounds.sfx = e.target.value / 100;
  });
  document.getElementById('set-touch')?.addEventListener('change', (e) => {
    game.settings.touch = e.target.checked;
    document.getElementById('touch-controls')?.classList.toggle('hidden', !e.target.checked);
  });

  renderKeybinds();
}

function saveSettings(settings) {
  localStorage.setItem('bloxdi_settings', JSON.stringify(settings));
}

function renderKeybinds() {
  const panel = document.getElementById('keybinds-panel');
  if (!panel) return;
  panel.innerHTML = '<h3 style="margin:1rem 0 0.5rem">Tastenbelegung</h3>';
  Object.entries(DEFAULT_KEYBINDS).forEach(([action, key]) => {
    panel.innerHTML += `<div style="display:flex;justify-content:space-between;padding:0.25rem 0"><span>${action}</span><code>${key}</code></div>`;
  });
}

export function getKeybinds() { return { ...DEFAULT_KEYBINDS }; }
