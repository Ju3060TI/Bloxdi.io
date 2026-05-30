/**
 * Mobs & Tiere – KI, Spawning, Drops
 */
import * as THREE from 'three';

const MOB_TYPES = {
  pig: { hp: 10, passive: true, drop: 'pork', speed: 2, color: 0xffb6c1 },
  cow: { hp: 10, passive: true, drop: 'beef', speed: 2, color: 0x8b4513 },
  sheep: { hp: 8, passive: true, drop: 'wool', speed: 2, color: 0xffffff },
  chicken: { hp: 4, passive: true, drop: 'feather', speed: 2.5, color: 0xffff00 },
  zombie: { hp: 20, hostile: true, drop: 'rotten_flesh', speed: 2.2, color: 0x2d5a27, xp: 5 },
  skeleton: { hp: 20, hostile: true, drop: 'bone', speed: 2.5, color: 0xc8c8c8, xp: 5 },
  creeper: { hp: 20, hostile: true, explode: true, speed: 2, color: 0x50c878, xp: 5 },
  spider: { hp: 16, hostile: true, drop: 'string', speed: 3, color: 0x4a3020, xp: 5 },
  slime: { hp: 8, hostile: true, drop: 'slime', speed: 1.5, color: 0x60c060, xp: 4 },
  enderman: { hp: 40, neutral: true, speed: 3, color: 0x302040, xp: 5 },
};

export class EntityManager {
  constructor(game) {
    this.game = game;
    this.entities = [];
    this.maxMobs = 50;
    this.spawnRadius = 128;
  }

  spawnInitial() {
    for (let i = 0; i < 8; i++) this.spawnRandom('passive');
  }

  spawnRandom(type) {
    if (this.entities.length >= this.maxMobs) return;
    const player = this.game.player;
    if (!player) return;
    const types = type === 'passive'
      ? ['pig', 'cow', 'sheep', 'chicken']
      : ['zombie', 'skeleton', 'spider'];
    const t = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 30;
    const x = player.body.position.x + Math.cos(angle) * dist;
    const z = player.body.position.z + Math.sin(angle) * dist;
    const y = player.body.position.y;
    this.spawn(t, x, y, z);
  }

  spawn(type, x, y, z) {
    const def = MOB_TYPES[type];
    if (!def) return;
    const geo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const mat = new THREE.MeshLambertMaterial({ color: def.color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.game.scene.add(mesh);
    this.entities.push({
      type, mesh, health: def.hp, maxHealth: def.hp,
      velocity: { x: 0, y: 0, z: 0 },
      def, wanderTimer: 0, target: null, xpDrop: def.xp ?? 3,
    });
  }

  update(dt) {
    const player = this.game.player;
    if (!player) return;
    const px = player.body.position.x;
    const py = player.body.position.y;
    const pz = player.body.position.z;
    const isNight = this.game.scene?.userData?.isNight;

    if (this.entities.length < this.maxMobs && Math.random() < 0.01) {
      this.spawnRandom(isNight ? 'hostile' : 'passive');
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      const m = e.mesh;
      const dist = Math.hypot(m.position.x - px, m.position.z - pz);

      if (dist > this.spawnRadius) {
        this.game.scene.remove(m);
        this.entities.splice(i, 1);
        continue;
      }

      e.wanderTimer -= dt;
      if (e.def.hostile && isNight && dist < 24) {
        const dx = px - m.position.x;
        const dz = pz - m.position.z;
        const len = Math.hypot(dx, dz) || 1;
        m.position.x += (dx / len) * e.def.speed * dt;
        m.position.z += (dz / len) * e.def.speed * dt;
        if (e.type === 'creeper' && dist < 3) this.explode(e);
        if (dist < 2 && e.def.hostile) {
          import('./survival.js').then(({ takeDamage }) => takeDamage(this.game, 3 * dt));
        }
      } else if (e.def.passive && dist < 6) {
        const dx = m.position.x - px;
        const dz = m.position.z - pz;
        const len = Math.hypot(dx, dz) || 1;
        m.position.x += (dx / len) * e.def.speed * dt;
        m.position.z += (dz / len) * e.def.speed * dt;
      } else if (e.wanderTimer <= 0) {
        m.position.x += (Math.random() - 0.5) * dt * 2;
        m.position.z += (Math.random() - 0.5) * dt * 2;
        e.wanderTimer = 2 + Math.random() * 3;
      }

      m.position.y = py;
      if (e.health <= 0) {
        this.game.scene.remove(m);
        this.entities.splice(i, 1);
      }
    }
  }

  explode(entity) {
    this.game.particles?.explosion?.(entity.mesh.position);
    this.game.sounds?.playExplosion?.();
    import('./survival.js').then(({ takeDamage }) => takeDamage(this.game, 8));
    this.game.scene.remove(entity.mesh);
    const idx = this.entities.indexOf(entity);
    if (idx >= 0) this.entities.splice(idx, 1);
  }
}
