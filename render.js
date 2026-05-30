/**
 * BLOXDI.IO – Renderer (WebGL, Chunks, Performance)
 */
import * as THREE from 'three';
import { CHUNK_SIZE, WORLD_HEIGHT, getBlock, getBlockTexture } from './blocks.js';

const FACE_VERTS = [
  [[1,0,0],[1,1,0],[1,1,1],[1,0,1]],
  [[0,0,1],[0,1,1],[0,1,0],[0,0,0]],
  [[0,1,1],[1,1,1],[1,1,0],[0,1,0]],
  [[0,0,0],[1,0,0],[1,0,1],[0,0,1]],
  [[0,0,1],[1,0,1],[1,1,1],[0,1,1]],
  [[1,0,0],[0,0,0],[0,1,0],[1,1,0]],
];
const FACE_NORMALS = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];

function addFace(g, x, y, z, faceIdx) {
  const verts = FACE_VERTS[faceIdx];
  const norm = FACE_NORMALS[faceIdx];
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const base = g.positions.length / 3;
  for (let i = 0; i < 4; i++) {
    g.positions.push(x + verts[i][0], y + verts[i][1], z + verts[i][2]);
    g.normals.push(norm[0], norm[1], norm[2]);
    g.uvs.push(uv[i][0], uv[i][1]);
  }
  g.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function getVisibleFaces(chunk, x, y, z, block) {
  const dirs = [
    { dx: 1, dy: 0, dz: 0, face: 0 },
    { dx: -1, dy: 0, dz: 0, face: 1 },
    { dx: 0, dy: 1, dz: 0, face: 2 },
    { dx: 0, dy: -1, dz: 0, face: 3 },
    { dx: 0, dy: 0, dz: 1, face: 4 },
    { dx: 0, dy: 0, dz: -1, face: 5 },
  ];
  const faces = [];
  for (const d of dirs) {
    const n = chunk.get(x + d.dx, y + d.dy, z + d.dz);
    const nb = getBlock(n);
    if (!nb || nb.liquid || !nb.solid || nb.transparent) faces.push(d.face);
  }
  return faces;
}

export class GameRenderer {
  constructor(canvas, settings = {}) {
    this.settings = settings;
    this.chunkMeshes = new Map();
    this._frustum = new THREE.Frustum();
    this._projScreen = new THREE.Matrix4();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.antialias !== false,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.pixelRatio ?? 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x78a7ff);
    if ('outputColorSpace' in this.renderer && THREE.SRGBColorSpace) {
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x78a7ff, 40, 120);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      320
    );

    this._lastChunkCenter = { cx: null, cz: null };
  }

  detectGPU() {
    const gl = this.renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';

    if (/RTX 30|RTX 40|RX 6/i.test(gpu)) {
      Object.assign(this.settings, {
        renderDistance: 8, shadows: true, bloom: true, waterShader: true,
        particles: 3000, pixelRatio: 2, antialias: true,
      });
    } else if (/GTX 10|GTX 16|RX 5/i.test(gpu)) {
      Object.assign(this.settings, {
        renderDistance: 6, bloom: true, waterShader: true,
        particles: 1000, pixelRatio: 1.5, antialias: true,
      });
    } else if (/Iris/i.test(gpu)) {
      Object.assign(this.settings, { renderDistance: 4, particles: 500, pixelRatio: 1 });
    } else {
      Object.assign(this.settings, {
        renderDistance: 2, particles: 100, pixelRatio: 1, antialias: false,
      });
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.settings.pixelRatio ?? 1));
    console.log(`[Render] GPU: ${gpu} | Distanz: ${this.settings.renderDistance}`);
    return gpu;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  isChunkVisible(cx, cz) {
    this._projScreen.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    const group = this.chunkMeshes.get(`${cx},${cz}`)?.group;
    if (!group) return true;
    this._frustum.setFromProjectionMatrix(this._projScreen);
    const box = new THREE.Box3(
      new THREE.Vector3(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE),
      new THREE.Vector3((cx + 1) * CHUNK_SIZE, WORLD_HEIGHT, (cz + 1) * CHUNK_SIZE)
    );
    return this._frustum.intersectsBox(box);
  }

  rebuildChunkMesh(world, cx, cz) {
    const chunk = world.getChunk(cx, cz);
    const k = world.key(cx, cz);
    if (!chunk.dirty && this.chunkMeshes.has(k)) return;

    if (this.chunkMeshes.has(k)) {
      this.scene.remove(this.chunkMeshes.get(k).group);
      this.chunkMeshes.get(k).group.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose?.();
      });
    }

    const group = new THREE.Group();
    group.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
    const geosByBlock = new Map();

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const id = chunk.get(x, y, z);
          if (!id) continue;
          const block = getBlock(id);
          if (!block?.solid || block?.liquid) continue;

          const faces = getVisibleFaces(chunk, x, y, z, block);
          if (!faces.length) continue;

          if (!geosByBlock.has(id)) {
            geosByBlock.set(id, { positions: [], normals: [], uvs: [], indices: [] });
          }
          const g = geosByBlock.get(id);
          for (const face of faces) addFace(g, x, y, z, face);
        }
      }
    }

    for (const [id, g] of geosByBlock) {
      if (!g.positions.length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
      geo.setIndex(g.indices);
      geo.computeBoundingSphere();
      const block = getBlock(id);
      const tex = getBlockTexture(id, 0);
      const mat = new THREE.MeshLambertMaterial({
        map: tex,
        transparent: !!block?.transparent,
        side: block?.transparent ? THREE.DoubleSide : THREE.FrontSide,
      });
      group.add(new THREE.Mesh(geo, mat));
    }

    this.scene.add(group);
    chunk.dirty = false;
    this.chunkMeshes.set(k, { group });
  }

  updateChunks(world, playerPos) {
    const px = playerPos.x;
    const pz = playerPos.z;
    const pcx = Math.floor(px / CHUNK_SIZE);
    const pcz = Math.floor(pz / CHUNK_SIZE);
    const dist = Math.min(this.settings.renderDistance ?? 4, 6);
    let rebuilt = 0;
    const maxRebuilds = 2;

    for (let cx = pcx - dist; cx <= pcx + dist; cx++) {
      for (let cz = pcz - dist; cz <= pcz + dist; cz++) {
        const k = world.key(cx, cz);
        const chunk = world.getChunk(cx, cz);
        const needs = chunk.dirty || !this.chunkMeshes.has(k);
        if (needs && rebuilt < maxRebuilds) {
          this.rebuildChunkMesh(world, cx, cz);
          rebuilt++;
        }
      }
    }

    this._lastChunkCenter = { cx: pcx, cz: pcz };

    for (const [k] of this.chunkMeshes) {
      const [cx, cz] = k.split(',').map(Number);
      if (Math.abs(cx - pcx) > dist + 1 || Math.abs(cz - pcz) > dist + 1) {
        this.scene.remove(this.chunkMeshes.get(k).group);
        this.chunkMeshes.get(k).group.traverse((c) => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose?.();
        });
        this.chunkMeshes.delete(k);
      }
    }
  }

  invalidateChunk(world, cx, cz) {
    world.getChunk(cx, cz).dirty = true;
    this.rebuildChunkMesh(world, cx, cz);
    for (const dx of [-1, 0, 1]) {
      for (const dz of [-1, 0, 1]) {
        if (dx === 0 && dz === 0) continue;
        const k = world.key(cx + dx, cz + dz);
        if (world.chunks.has(k)) world.chunks.get(k).dirty = true;
      }
    }
  }

  clearChunks() {
    for (const [, m] of this.chunkMeshes) {
      this.scene.remove(m.group);
      m.group.traverse((c) => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose?.();
      });
    }
    this.chunkMeshes.clear();
    this._lastChunkCenter = { cx: null, cz: null };
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  get domElement() {
    return this.renderer.domElement;
  }
}
