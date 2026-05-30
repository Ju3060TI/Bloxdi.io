/**
 * Touch-Steuerung für Handy/Tablet
 */
export function initMobile(game) {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) {
    game.settings.touch = true;
    document.getElementById('touch-controls')?.classList.remove('hidden');
    document.getElementById('set-touch').checked = true;
  }

  const joystick = document.getElementById('joystick-zone');
  const lookZone = document.getElementById('look-zone');
  let joyActive = false;
  let joyStart = { x: 0, y: 0 };
  let lookStart = { x: 0, y: 0 };

  joystick?.addEventListener('touchstart', (e) => {
    joyActive = true;
    joyStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  joystick?.addEventListener('touchmove', (e) => {
    if (!joyActive || !game.player) return;
    const dx = e.touches[0].clientX - joyStart.x;
    const dy = e.touches[0].clientY - joyStart.y;
    const len = Math.hypot(dx, dy);
    if (len > 10) {
      game.player.keys['KeyW'] = dy < -20;
      game.player.keys['KeyS'] = dy > 20;
      game.player.keys['KeyA'] = dx < -20;
      game.player.keys['KeyD'] = dx > 20;
    }
  }, { passive: true });

  joystick?.addEventListener('touchend', () => {
    joyActive = false;
    ['KeyW', 'KeyS', 'KeyA', 'KeyD'].forEach((k) => { if (game.player) game.player.keys[k] = false; });
  });

  lookZone?.addEventListener('touchstart', (e) => {
    lookStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  lookZone?.addEventListener('touchmove', (e) => {
    if (!game.player) return;
    const dx = e.touches[0].clientX - lookStart.x;
    const dy = e.touches[0].clientY - lookStart.y;
    game.player.yaw -= dx * 0.005;
    game.player.pitch -= dy * 0.005;
    game.player.pitch = Math.max(-1.5, Math.min(1.5, game.player.pitch));
    lookStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });

  let lastTap = 0;
  lookZone?.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      if (game.player) game.player.keys['Space'] = true;
      setTimeout(() => { if (game.player) game.player.keys['Space'] = false; }, 100);
    }
    lastTap = now;
  });

  document.getElementById('touch-jump')?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (game.player) game.player.keys['Space'] = true;
  });
  document.getElementById('touch-jump')?.addEventListener('touchend', () => {
    if (game.player) game.player.keys['Space'] = false;
  });

  document.getElementById('touch-inv')?.addEventListener('click', () => {
    document.getElementById('inventory-panel')?.classList.toggle('hidden');
    game.inventory?.render?.();
  });

  let breakTimer = null;
  lookZone?.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      breakTimer = setTimeout(() => {
        if (game.player) game.player.mouseDown.left = true;
      }, 500);
    }
  });
  lookZone?.addEventListener('touchend', () => {
    clearTimeout(breakTimer);
    if (game.player) {
      if (!game.player.mouseDown.left) game.player.mouseDown.right = true;
      setTimeout(() => { if (game.player) game.player.mouseDown.right = false; }, 50);
    }
  });
}
