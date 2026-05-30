/**
 * Partikel – Abbau, Regen, Schnee, Explosionen
 */
import * as THREE from 'three';
import { getBlock } from './blocks.js';

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 1000;
  }

  spawn(x, y, z, color, count = 8, life = 1) {
    for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
      const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3,
          z: (Math.random() - 0.5) * 4,
        },
        life,
        maxLife: life,
      });
    }
  }

  blockBreak(x, y, z, blockId) {
    const b = getBlock(blockId);
    const color = 0x888888;
    this.spawn(x, y, z, color, 12, 0.8);
  }

  explosion(pos) {
    this.spawn(pos.x, pos.y, pos.z, 0xff6600, 50, 1.5);
  }

  hit(pos) {
    this.spawn(pos.x, pos.y, pos.z, 0xff0000, 5, 0.3);
  }

  rain(count = 200) {
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 80;
      this.spawn(x, 60 + Math.random() * 20, z, 0x4488ff, 1, 2);
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.vel.y -= 15 * dt;
      p.mesh.material.opacity = p.life / p.maxLife;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }
}
