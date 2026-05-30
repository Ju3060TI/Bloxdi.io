/**
 * Physik – Gravitation, Kollision, Wasser
 */
import { CHUNK_SIZE, WORLD_HEIGHT, getBlock } from './blocks.js';

const PLAYER_WIDTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const GRAVITY = -28;
const TERMINAL = -50;

export class PhysicsBody {
  constructor() {
    this.position = { x: 0, y: 70, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.onGround = false;
    this.inWater = false;
    this.inLava = false;
  }

  setPosition(x, y, z) {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
  }

  setVelocity(x, y, z) {
    this.velocity.x = x;
    this.velocity.y = y;
    this.velocity.z = z;
  }
}

export function getBlockAt(world, x, y, z) {
  const cx = Math.floor(x / CHUNK_SIZE);
  const cz = Math.floor(z / CHUNK_SIZE);
  const chunk = world.getChunk(cx, cz);
  if (!chunk) return 0;
  const lx = ((Math.floor(x) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((Math.floor(z) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const ly = Math.floor(y);
  if (ly < 0 || ly >= WORLD_HEIGHT) return 0;
  return chunk.get(lx, ly, lz);
}

export function isSolid(world, x, y, z) {
  const id = getBlockAt(world, x, y, z);
  const b = getBlock(id);
  return b?.solid && !b?.liquid;
}

export function isLiquid(world, x, y, z) {
  const id = getBlockAt(world, x, y, z);
  return getBlock(id)?.liquid ?? false;
}

function aabbCollides(world, px, py, pz, w, h) {
  const minX = Math.floor(px - w / 2);
  const maxX = Math.floor(px + w / 2);
  const minY = Math.floor(py);
  const maxY = Math.floor(py + h);
  const minZ = Math.floor(pz - w / 2);
  const maxZ = Math.floor(pz + w / 2);
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (isSolid(world, x, y, z)) return true;
      }
    }
  }
  return false;
}

export function updatePhysics(body, world, dt, flyMode = false) {
  const { position, velocity } = body;
  body.inWater = false;
  body.inLava = false;

  const w = PLAYER_WIDTH;
  const h = PLAYER_HEIGHT;

  if (!flyMode) {
    const feetY = position.y;
    if (isLiquid(world, position.x, feetY + 0.5, position.z)) body.inWater = true;
    if (isLiquid(world, position.x, feetY + 0.5, position.z)) {
      const id = getBlockAt(world, position.x, feetY + 0.5, position.z);
      if (getBlock(id)?.name === 'lava') body.inLava = true;
    }
    const grav = body.inWater ? -8 : GRAVITY;
    velocity.y += grav * dt;
    if (velocity.y < TERMINAL) velocity.y = TERMINAL;
    if (body.inWater) {
      velocity.x *= 0.85;
      velocity.z *= 0.85;
      velocity.y *= 0.9;
    }
  } else {
    velocity.y *= 0.9;
  }

  const steps = 3;
  const sdt = dt / steps;
  for (let s = 0; s < steps; s++) {
    position.x += velocity.x * sdt;
    if (aabbCollides(world, position.x, position.y, position.z, w, h)) {
      position.x -= velocity.x * sdt;
      velocity.x = 0;
    }
    position.z += velocity.z * sdt;
    if (aabbCollides(world, position.x, position.y, position.z, w, h)) {
      position.z -= velocity.z * sdt;
      velocity.z = 0;
    }
    position.y += velocity.y * sdt;
    body.onGround = false;
    if (aabbCollides(world, position.x, position.y, position.z, w, h)) {
      position.y -= velocity.y * sdt;
      if (velocity.y < 0) body.onGround = true;
      velocity.y = 0;
    }
  }

  if (position.y < -10) {
    position.y = 80;
    velocity.y = 0;
  }
}

export function raycast(world, origin, direction, maxDist = 6) {
  const pos = { ...origin };
  const step = 0.1;
  const dir = normalize(direction);
  for (let d = 0; d < maxDist; d += step) {
    pos.x += dir.x * step;
    pos.y += dir.y * step;
    pos.z += dir.z * step;
    const id = getBlockAt(world, pos.x, pos.y, pos.z);
    const b = getBlock(id);
    if (b?.solid) {
      return {
        hit: true,
        block: b,
        blockId: id,
        x: Math.floor(pos.x),
        y: Math.floor(pos.y),
        z: Math.floor(pos.z),
        face: { x: 0, y: 1, z: 0 },
        distance: d,
      };
    }
  }
  return { hit: false };
}

function normalize(v) {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export { PLAYER_WIDTH, PLAYER_HEIGHT };
