/**
 * Kampf – Schwerter, Bogen, Rüstung
 */
const WEAPON_DAMAGE = {
  fist: 1, wood: 4, stone: 5, iron: 6, diamond: 7, netherite: 8,
};

const ARMOR_REDUCTION = {
  leather: 0.07, iron: 0.15, diamond: 0.20, netherite: 0.25,
};

const COOLDOWNS = { sword: 0.6, axe: 1.0, bow: 1.0 };

export function getWeaponDamage(toolName, jumping, fromBehind) {
  let dmg = WEAPON_DAMAGE[toolName] ?? WEAPON_DAMAGE.fist;
  if (jumping) dmg *= 1.5;
  if (fromBehind) dmg *= 1.25;
  return dmg;
}

export function applyArmor(damage, armorPieces = []) {
  let reduction = 0;
  armorPieces.forEach((a) => { reduction += ARMOR_REDUCTION[a] ?? 0; });
  return damage * (1 - Math.min(0.8, reduction));
}

export function canAttack(lastAttack, weapon = 'sword') {
  return performance.now() / 1000 - lastAttack >= (COOLDOWNS[weapon] ?? 0.6);
}

export function attackEntity(entity, player, game) {
  const jumping = !player.body.onGround;
  const dmg = getWeaponDamage('iron', jumping, false);
  entity.health -= dmg;
  game?.sounds?.playHit?.();
  game?.particles?.hit?.(entity.position);
  if (entity.health <= 0) {
    game?.onEntityKill?.(entity);
    game?.survival && game.survival.xp !== undefined && import('./survival.js').then(({ addXP }) => addXP(game, entity.xpDrop ?? 5));
  }
  return dmg;
}
