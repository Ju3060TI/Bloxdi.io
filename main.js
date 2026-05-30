/**
 * BLOXDI.IO – Three.js Setup, Game-Loop, Chunk-Manager
 */
import * as THREE from 'three';
import { CHUNK_SIZE, WORLD_HEIGHT, getBlock, getBlockTexture, buildAllTextures, getBlockCount, BLOCK, getBlockByName } from './blocks.js';
import { generateChunk, ChunkData, precomputeNoise } from './world-generation.js';
import { Player } from './player.js';
import { initMenu, showScreen } from './menu.js';
import { initAuth } from './auth.js';
import { Inventory } from './inventory.js';
import { initSurvival, updateSurvival } from './survival.js';
import { Sounds } from './sounds.js';
import { initLighting, updateLighting } from './lighting.js';
import { initWeather, updateWeather } from './weather.js';
import { Particles } from './particles.js';
import { initShaders } from './shaders.js';
import { EntityManager } from './entities.js';
import { initAchievements, checkAchievements } from './achievements.js';
import { Statistics } from './statistics.js';
import { initMobile } from './mobile.js';
import { initSettings } from './settings-advanced.js';
import { GameRenderer } from './render.js';

const LOADING_STAGES = [
  { pct: 8, msg: 'Initialisiere Three.js & WebGL...' },
  { pct: 18, msg: 'Rendere 300+ Block-Texturen...' },
  { pct: 28, msg: 'Berechne Welt-Noise...' },
  { pct: 38, msg: 'Generiere Höhlen-Systeme...' },
  { pct: 48, msg: 'Grabe Schluchten & Canyons...' },
  { pct: 58, msg: 'Platziere Seen & Flüsse...' },
  { pct: 68, msg: 'Baue 3 Dorf-Varianten...' },
  { pct: 78, msg: 'Errichte Tempel & Dungeons...' },
  { pct: 85, msg: 'Pflanze 8 Baum-Varianten...' },
  { pct: 92, msg: 'Baue Spawn-Chunks...' },
  { pct: 97, msg: 'Spawne 15+ Tierarten & Monster...' },
  { pct: 100, msg: 'Starte Spiel! 🎮' },
];

const TIPS = [
  '💡 Tipp: Mit Shift schleichen!',
  '💡 Tipp: Fackeln verhindern Monster-Spawns!',
  '💡 Tipp: Diamanten findest du auf Y=-50!',
  '💡 Tipp: Doppel-W zum Sprinten!',
  '💡 Tipp: F5 wechselt die Perspektive!',
];

class World {
  constructor(seed, type) {
    this.seed = seed;
    this.type = type;
    this.chunks = new Map();
    const { noise2D, noise3D } = precomputeNoise(seed);
    this.noise2D = noise2D;
    this.noise3D = noise3D;
  }

  key(cx, cz) { return `${cx},${cz}`; }

  getChunk(cx, cz) {
    const k = this.key(cx, cz);
    if (!this.chunks.has(k)) {
      const chunk = new ChunkData(cx, cz);
      generateChunk(chunk, this.type, this.seed, this.noise2D, this.noise3D);
      this.chunks.set(k, chunk);
    }
    return this.chunks.get(k);
  }

  getBlockAt(x, y, z) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    const lx = ((Math.floor(x) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((Math.floor(z) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.get(lx, y, lz);
  }

  setBlock(x, y, z, id) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cz);
    const lx = ((Math.floor(x) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((Math.floor(z) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    chunk.set(lx, y, lz, id);
    chunk.dirty = true;
    if (window.bloxdiGame?.gameRender) {
      window.bloxdiGame.gameRender.invalidateChunk(window.bloxdiGame.world, cx, cz);
    }
  }
}

class Game {
  constructor() {
    this.world = null;
    this.player = null;
    this.running = false;
    this.paused = false;
    this.gameRender = null;
    this.clock = new THREE.Clock();
    this.settings = { renderDistance: 4, shadows: false, bloom: false };
    this.inventory = new Inventory();
    this.statistics = new Statistics();
    this.entities = null;
    this.particles = null;
    this.sounds = null;
    this.saveInterval = null;
    this.currentWorldMeta = null;
  }

  async init() {
    const progressBar = document.getElementById('progress-bar');
    const progressPct = document.getElementById('progress-percent');
    const progressStatus = document.getElementById('progress-status');
    const loadingTip = document.getElementById('loading-tip');
    const loadingErr = document.getElementById('loading-error');

    const setProgress = (pct, msg) => {
      progressBar.style.width = `${pct}%`;
      progressPct.textContent = `${Math.floor(pct)}%`;
      if (msg) progressStatus.textContent = msg;
      if (loadingTip) loadingTip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    };

    const fail = (err) => {
      console.error('[Bloxdi] Laden fehlgeschlagen:', err);
      if (loadingErr) {
        loadingErr.hidden = false;
        loadingErr.textContent = `Fehler: ${err?.message || err}. Bitte F5 oder lokalen Server nutzen (npm start).`;
      }
      progressStatus.textContent = 'Laden fehlgeschlagen';
    };

    try {
      setProgress(2, 'Starte Engine...');
      await this._wait(0);

      const canvas = document.getElementById('game-canvas');
      if (!canvas) throw new Error('Canvas nicht gefunden');

      setProgress(8, LOADING_STAGES[0].msg);
      this.gameRender = new GameRenderer(canvas, this.settings);
      setProgress(15, LOADING_STAGES[1].msg);

      await buildAllTextures((t) => {
        setProgress(15 + t * 20, LOADING_STAGES[1].msg);
      });
      setProgress(38, LOADING_STAGES[2].msg);

      this.gameRender.detectGPU();
      setProgress(45, LOADING_STAGES[3].msg);

      initShaders(this.gameRender.renderer, this.settings);
      initAuth();
      initMenu(this);
      initSettings(this);
      initAchievements();
      initMobile(this);
      setProgress(55, LOADING_STAGES[5].msg);

      this.sounds = new Sounds();
      await this.sounds.init();
      setProgress(62, LOADING_STAGES[6].msg);

      this.particles = new Particles(this.gameRender.scene);
      initLighting(this.gameRender.scene);
      initWeather(this.gameRender.scene);
      setProgress(72, LOADING_STAGES[8].msg);

      await this._preloadSpawnChunks(setProgress);
      setProgress(88, LOADING_STAGES[9].msg);

      this.entities = new EntityManager(this);
      setProgress(96, LOADING_STAGES[10].msg);
      await this._wait(80);

      setProgress(100, LOADING_STAGES[11].msg);
      await this._wait(150);

      document.getElementById('loading-screen').classList.remove('active');
      showScreen('main-menu');
      window.addEventListener('resize', () => this._onResize());
    } catch (err) {
      fail(err);
    }
  }

  get scene() { return this.gameRender?.scene; }
  get camera() { return this.gameRender?.camera; }
  get renderer() { return this.gameRender?.renderer; }

  async _preloadSpawnChunks(setProgress) {
    const tempWorld = new World(42, 'normal');
    const dist = 1;
    let done = 0;
    const total = (dist * 2 + 1) ** 2;
    for (let cx = -dist; cx <= dist; cx++) {
      for (let cz = -dist; cz <= dist; cz++) {
        tempWorld.getChunk(cx, cz);
        done++;
        if (setProgress) setProgress(72 + (done / total) * 14, LOADING_STAGES[8].msg);
        await this._wait(0);
      }
    }
    this._preloadedWorld = tempWorld;
  }

  _wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  findSpawnY(x, z) {
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      const id = this.world.getBlockAt(x, y, z);
      const b = getBlock(id);
      if (b?.solid && !b?.liquid) return y + 1;
    }
    return 70;
  }

  async startWorld(meta) {
    this.currentWorldMeta = meta;
    const seed = meta.seed ?? Math.floor(Math.random() * 999999);
    this.world = new World(seed, meta.type ?? 'normal');
    this.gameRender.clearChunks();

    showScreen('game-screen');
    document.getElementById('game-screen').classList.add('active');
    await this._wait(0);
    this.gameRender.resize();

    this.player = new Player(this.gameRender.camera, this.gameRender.domElement);
    const spawnY = this.findSpawnY(0, 0);
    const p = this.player.body.position;
    const v = this.player.body.velocity;
    p.x = 0.5;
    p.y = spawnY;
    p.z = 0.5;
    v.x = 0;
    v.y = 0;
    v.z = 0;

    const dist = Math.min(this.settings.renderDistance ?? 4, 5);
    for (let cx = -dist; cx <= dist; cx++) {
      for (let cz = -dist; cz <= dist; cz++) {
        this.world.getChunk(cx, cz);
        this.gameRender.rebuildChunkMesh(this.world, cx, cz);
      }
    }

    this.inventory.fillStarterItems();
    this.inventory.render();
    initSurvival(this);
    this.entities?.spawnInitial?.();
    this.running = true;
    this.paused = false;
    this.clock.start();
    this._gameLoop();

    this.saveInterval = setInterval(() => this.saveWorld(), 30000);
    this.sounds?.playMusic?.('day');
  }

  updateChunks() {
    if (!this.player || !this.world || !this.gameRender) return;
    this.gameRender.updateChunks(this.world, this.player.body.position);
    if (this._lastDt) this.statistics?.updatePosition?.(this.player.body.position, this._lastDt);
  }

  _gameLoop() {
    if (!this.running) return;
    requestAnimationFrame(() => this._gameLoop());
    if (this.paused) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);
    this._lastDt = dt;
    this.player?.update(dt, this.world, this);
    updateSurvival(this, dt);
    updateLighting(this.scene, dt);
    updateWeather(this.scene, dt);
    this.entities?.update(dt);
    this.particles?.update(dt);
    this.updateChunks();
    this.gameRender.render();
    this._updateDebug();
  }

  setBreakProgress(p) {
    const el = document.getElementById('break-progress');
    const bar = document.getElementById('break-bar');
    if (p > 0) {
      el.classList.remove('hidden');
      bar.style.width = `${Math.min(100, p * 100)}%`;
    } else el.classList.add('hidden');
  }

  onBlockBreak(hit) {
    checkAchievements(this, 'block_break', hit);
    const drops = getBlock(hit.blockId)?.drops ?? hit.blockId;
    if (drops) this.inventory.addItem(drops, 1);
    this.inventory.render();
  }

  pause() {
    this.paused = true;
    document.getElementById('pause-menu').classList.remove('hidden');
  }

  resume() {
    this.paused = false;
    document.getElementById('pause-menu').classList.add('hidden');
  }

  saveWorld() {
    if (!this.currentWorldMeta || !this.world) return;
    const data = {
      version: '0.4.0',
      world: { seed: this.world.seed, type: this.world.type, chunks: {} },
      player: {
        ...this.player.serialize(),
        health: this.survival?.health ?? 20,
        hunger: this.survival?.hunger ?? 20,
        inventory: this.inventory.serialize(),
      },
      statistics: this.statistics.serialize(),
    };
    const key = `bloxdi_world_${this.currentWorldMeta.id}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) { console.warn('Save failed', e); }
  }

  _onResize() {
    this.gameRender?.resize();
  }

  _updateDebug() {
    const el = document.getElementById('debug-info');
    if (!this.player?.keys['F3']) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const p = this.player.body.position;
    const fps = this._lastDt > 0 ? (1 / this._lastDt).toFixed(0) : '–';
    el.textContent = `FPS: ${fps}\nXYZ: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\nChunks: ${this.gameRender.chunkMeshes.size}\nRender-Distanz: ${this.settings.renderDistance}\nBlocks: ${getBlockCount()}`;
  }
}

const game = new Game();
game.init().catch(console.error);
window.bloxdiGame = game;
