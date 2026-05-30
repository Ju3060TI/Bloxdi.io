/**
 * Survival – HP, Hunger, XP, Level
 */
let survivalState = null;

export function initSurvival(game) {
  survivalState = {
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    xp: 0,
    level: 0,
    regenTimer: 0,
    hungerTimer: 0,
  };
  game.survival = survivalState;
  renderHUD();
}

export function updateSurvival(game, dt) {
  if (!survivalState || !game.player) return;
  const s = survivalState;
  const body = game.player.body;

  if (game.player.keys['KeyW'] || game.player.keys['KeyA']) {
    s.hungerTimer += dt;
    if (s.hungerTimer > 40) { s.hunger = Math.max(0, s.hunger - 1); s.hungerTimer = 0; }
  }

  if (body.inLava) takeDamage(game, 4 * dt);
  if (body.inWater && !body.onGround) {
    s.breath = (s.breath ?? 10) - dt;
    if (s.breath <= 0) takeDamage(game, 2 * dt);
  } else s.breath = 10;

  if (s.hunger >= 18 && s.health < s.maxHealth) {
    s.regenTimer += dt;
    if (s.regenTimer >= 4) { s.health = Math.min(s.maxHealth, s.health + 1); s.hunger -= 1; s.regenTimer = 0; }
  }

  if (s.hunger <= 0) {
    s.starveTimer = (s.starveTimer ?? 0) + dt;
    if (s.starveTimer >= 4) { takeDamage(game, 1); s.starveTimer = 0; }
  }

  if (!body.onGround && body.velocity.y < -5) {
    s.fallStart = s.fallStart ?? body.position.y;
  } else if (body.onGround && s.fallStart) {
    const fall = s.fallStart - body.position.y;
    if (fall > 3) takeDamage(game, Math.floor(fall - 3));
    s.fallStart = null;
  }

  renderHUD();
}

export function takeDamage(game, amount) {
  if (!survivalState) return;
  survivalState.health = Math.max(0, survivalState.health - amount);
  if (survivalState.health <= 0) respawn(game);
  renderHUD();
}

export function addXP(game, amount) {
  survivalState.xp += amount;
  const need = xpForLevel(survivalState.level + 1);
  while (survivalState.xp >= need) {
    survivalState.xp -= need;
    survivalState.level++;
  }
  renderHUD();
}

function xpForLevel(l) {
  return l <= 16 ? 2 * l + 5 : l <= 31 ? 5 * l - 38 : 9 * l - 158;
}

function respawn(game) {
  survivalState.health = survivalState.maxHealth;
  survivalState.xp = Math.floor(survivalState.xp * 0.5);
  const y = game.findSpawnY?.(0, 0) ?? 70;
  const p = game.player.body.position;
  const v = game.player.body.velocity;
  p.x = 0.5;
  p.y = y;
  p.z = 0.5;
  v.x = 0;
  v.y = 0;
  v.z = 0;
}

function renderHUD() {
  const hearts = document.getElementById('hud-hearts');
  const hunger = document.getElementById('hud-hunger');
  if (!hearts || !survivalState) return;
  hearts.innerHTML = '';
  hunger.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    hearts.innerHTML += `<span class="heart">${i < survivalState.health / 2 ? '❤️' : '🖤'}</span>`;
    hunger.innerHTML += `<span class="hunger-icon">${i < survivalState.hunger / 2 ? '🍖' : '☠️'}</span>`;
  }
  const xpBar = document.getElementById('xp-bar');
  const xpLevel = document.getElementById('xp-level');
  if (xpBar) xpBar.style.setProperty('--xp', `${(survivalState.xp / xpForLevel(survivalState.level + 1)) * 100}%`);
  if (xpLevel) xpLevel.textContent = survivalState.level;
}

export function eatFood(game, hungerRestore) {
  survivalState.hunger = Math.min(survivalState.maxHunger, survivalState.hunger + hungerRestore);
  renderHUD();
}
