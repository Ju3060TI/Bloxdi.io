/**
 * Spieler – Bewegung, Kamera, Block-Interaktion (ohne Pointer Lock)
 */
import * as THREE from 'three';
import { PhysicsBody, updatePhysics, raycast, PLAYER_HEIGHT } from './physics.js';
import { getBlock } from './blocks.js';

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.body = new PhysicsBody();
    this.yaw = 0;
    this.pitch = 0;
    this.keys = {};
    this.sprint = false;
    this.sneak = false;
    this.flyMode = false;
    this.thirdPerson = false;
    this.selectedSlot = 0;
    this.breakProgress = 0;
    this.breakTarget = null;
    this.pointerLocked = false;
    this.mouseDown = { left: false, right: false };
    this.moveSpeed = 5;
    this.sprintSpeed = 8;
    this.sneakSpeed = 2;
    this.jumpForce = 9;
    this.canDoubleJump = false;
    this.jumps = 0;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyF') this.thirdPerson = !this.thirdPerson;
      if (e.code === 'F3') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    this._placeQueued = false;
    this.dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown.left = true;
      if (e.button === 2) { this.mouseDown.right = true; this._placeQueued = true; }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) { this.mouseDown.left = false; this.breakProgress = 0; this.breakTarget = null; }
      if (e.button === 2) this.mouseDown.right = false;
    });
    this.dom.addEventListener('contextmenu', (e) => e.preventDefault());

    let dragging = false;
    let lastX = 0, lastY = 0;
    this.dom.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 2) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });
    window.addEventListener('mouseup', () => { dragging = false; });
    this.dom.addEventListener('mousemove', (e) => {
      if (!dragging && !this.keys['ArrowLeft']) return;
      const dx = e.movementX !== undefined ? e.movementX : e.clientX - lastX;
      const dy = e.movementY !== undefined ? e.movementY : e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const sens = 0.002;
      this.yaw -= dx * sens;
      this.pitch -= dy * sens;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
    });

    if (this.keys['ArrowLeft']) {
      setInterval(() => {
        if (this.keys['ArrowLeft']) this.yaw += 0.03;
        if (this.keys['ArrowRight']) this.yaw -= 0.03;
        if (this.keys['ArrowUp']) this.pitch += 0.02;
        if (this.keys['ArrowDown']) this.pitch -= 0.02;
      }, 16);
    }

    this.dom.addEventListener('wheel', (e) => {
      if (this.thirdPerson) {
        this.zoom = Math.max(2, Math.min(12, (this.zoom ?? 5) + e.deltaY * 0.01));
      } else {
        this.selectedSlot = ((this.selectedSlot + (e.deltaY > 0 ? 1 : -1)) % 9 + 9) % 9;
      }
    });

    for (let i = 1; i <= 9; i++) {
      window.addEventListener('keydown', (e) => {
        if (e.code === `Digit${i}`) this.selectedSlot = i - 1;
      });
    }
  }

  getForward() {
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    ).normalize();
  }

  getDirection() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  getRight() {
    const d = this.getDirection();
    return new THREE.Vector3(d.z, 0, -d.x);
  }

  update(dt, world, game) {
    const { body, keys } = this;
    this.sneak = keys['ShiftLeft'] || keys['ShiftRight'];
    this.sprint = keys['KeyW'] && keys['KeyW'] && (keys['KeyW'] && this._lastW) ? true : keys['KeyW'];
    this._lastW = keys['KeyW'];

    let speed = this.moveSpeed;
    if (this.sneak) speed = this.sneakSpeed;
    else if (keys['ShiftLeft'] && keys['KeyW']) speed = this.sprintSpeed;
    if (this.flyMode) speed = 10;

    const move = new THREE.Vector3();
    if (keys['KeyW']) move.add(this.getDirection());
    if (keys['KeyS']) move.sub(this.getDirection());
    if (keys['KeyA']) move.sub(this.getRight());
    if (keys['KeyD']) move.add(this.getRight());
    if (move.length() > 0) move.normalize().multiplyScalar(speed);

    body.velocity.x = move.x;
    body.velocity.z = move.z;

    if (this.flyMode) {
      body.velocity.y = 0;
      if (keys['Space']) body.velocity.y = speed;
      if (this.sneak) body.velocity.y = -speed;
      body.onGround = true;
    } else {
      if (keys['Space'] && body.onGround) {
        body.velocity.y = this.jumpForce;
        body.onGround = false;
        this.jumps = 1;
        game?.sounds?.playJump?.();
      } else if (keys['Space'] && this.jumps < 2 && this.canDoubleJump) {
        body.velocity.y = this.jumpForce * 0.85;
        this.jumps = 2;
      }
      if (!body.onGround && body.velocity.y < 0) this.jumps = Math.max(this.jumps, 1);
    }

    updatePhysics(body, world, dt, this.flyMode);

    const eyeY = body.position.y + PLAYER_HEIGHT - 0.2;
    const camPos = new THREE.Vector3(body.position.x, eyeY, body.position.z);

    if (this.thirdPerson) {
      const dist = this.zoom ?? 5;
      const offset = this.getForward().multiplyScalar(-dist);
      offset.y += 1;
      this.camera.position.copy(camPos).add(offset);
      this.camera.lookAt(camPos);
    } else {
      this.camera.position.copy(camPos);
      const look = camPos.clone().add(this.getForward());
      this.camera.lookAt(look);
    }

    this._handleInteraction(dt, world, game);
  }

  _handleInteraction(dt, world, game) {
    const origin = this.camera.position.clone();
    const dir = this.getForward();
    const hit = raycast(world, origin, dir, 6);

    if (this.mouseDown.left && hit.hit) {
      const key = `${hit.x},${hit.y},${hit.z}`;
      if (this.breakTarget !== key) {
        this.breakTarget = key;
        this.breakProgress = 0;
      }
      const block = getBlock(hit.blockId);
      const hardness = block?.hardness ?? 1;
      if (hardness < 0) return;
      this.breakProgress += dt / hardness;
      game?.setBreakProgress?.(this.breakProgress);
      if (this.breakProgress >= 1) {
        world.setBlock(hit.x, hit.y, hit.z, 0);
        game?.onBlockBreak?.(hit);
        game?.particles?.blockBreak?.(hit.x, hit.y, hit.z, hit.blockId);
        game?.sounds?.playBreak?.(block);
        game?.statistics?.addBlockMined?.(block?.name);
        this.breakProgress = 0;
        this.breakTarget = null;
        game?.setBreakProgress?.(0);
      }
    }

    if (this._placeQueued && hit.hit) {
      this._placeQueued = false;
      const place = {
        x: hit.x,
        y: hit.y + 1,
        z: hit.z,
      };
      if (game?.inventory) game.inventory.selectedSlot = this.selectedSlot;
      const slot = game?.inventory?.getHotbarItem?.(this.selectedSlot);
      const blockId = slot?.blockId ?? 0;
      const existing = world.getBlockAt(place.x, place.y, place.z);
      if (blockId && !existing) {
        world.setBlock(place.x, place.y, place.z, blockId);
        if (slot && slot.count > 0) {
          slot.count--;
          if (slot.count <= 0) game.inventory.slots[game.inventory.selectedSlot] = null;
          game.inventory.render();
        }
        game?.sounds?.playPlace?.();
        game?.statistics?.addBlockPlaced?.(getBlock(blockId)?.name);
      }
    }
  }

  serialize() {
    const { position, velocity } = this.body;
    return { position: [position.x, position.y, position.z], yaw: this.yaw, pitch: this.pitch };
  }

  load(data) {
    if (!data) return;
    this.body.position.x = data.position[0];
    this.body.position.y = data.position[1];
    this.body.position.z = data.position[2];
    this.yaw = data.yaw ?? 0;
    this.pitch = data.pitch ?? 0;
  }
}
