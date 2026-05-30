/**
 * Inventar – 36 Slots, Hotbar, Drag & Drop
 */
import { getBlock, getBlockTexture, getBlockByName } from './blocks.js';

const STACK_MAX = 64;

export class Inventory {
  constructor() {
    this.slots = Array(36).fill(null);
    this.selectedSlot = 0;
    this.dragItem = null;
  }

  fillStarterItems() {
    const items = ['grass', 'dirt', 'stone', 'oak_log', 'oak_planks', 'coal_ore', 'torch', 'cobblestone', 'iron_ore'];
    items.forEach((name, i) => {
      const b = getBlockByName(name);
      if (b) this.slots[i] = { blockId: b.id, count: STACK_MAX };
    });
  }

  addItem(blockId, count = 1) {
    for (let i = 0; i < 36; i++) {
      const s = this.slots[i];
      if (s && s.blockId === blockId && s.count < STACK_MAX) {
        const add = Math.min(count, STACK_MAX - s.count);
        s.count += add;
        count -= add;
        if (count <= 0) return true;
      }
    }
    for (let i = 0; i < 36; i++) {
      if (!this.slots[i]) {
        this.slots[i] = { blockId, count: Math.min(count, STACK_MAX) };
        return true;
      }
    }
    return false;
  }

  getHotbarItem(slot) {
    return this.slots[slot] ?? null;
  }

  getSelectedBlockId() {
    const s = this.slots[this.selectedSlot];
    return s?.blockId ?? 0;
  }

  serialize() {
    return this.slots.map((s) => s ? { blockId: s.blockId, count: s.count } : null);
  }

  load(data) {
    if (!data) return;
    this.slots = data.map((s) => s ? { ...s } : null);
  }

  render() {
    const hotbar = document.getElementById('hotbar');
    if (!hotbar) return;
    hotbar.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div');
      slot.className = `hotbar-slot${i === this.selectedSlot ? ' selected' : ''}`;
      slot.onclick = () => { this.selectedSlot = i; this.render(); };
      const item = this.slots[i];
      if (item) {
        const preview = document.createElement('canvas');
        preview.width = 32;
        preview.height = 32;
        preview.style.imageRendering = 'pixelated';
        const tex = getBlockTexture(item.blockId);
        if (tex?.image) {
          const ctx = preview.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tex.image, 0, 0, 32, 32);
        }
        slot.appendChild(preview);
        if (item.count > 1) {
          const c = document.createElement('span');
          c.className = 'slot-count';
          c.textContent = item.count;
          slot.appendChild(c);
        }
      }
      hotbar.appendChild(slot);
    }

    const main = document.getElementById('inv-main');
    if (main) {
      main.innerHTML = '';
      for (let i = 9; i < 36; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot';
        const item = this.slots[i];
        if (item) {
          const preview = document.createElement('canvas');
          preview.width = 32;
          preview.height = 32;
          preview.style.imageRendering = 'pixelated';
          const tex = getBlockTexture(item.blockId);
          if (tex?.image) {
            const ctx = preview.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tex.image, 0, 0, 32, 32);
          }
          slot.appendChild(preview);
        }
        slot.onclick = () => this._clickSlot(i);
        main.appendChild(slot);
      }
    }
  }

  _clickSlot(i) {
    if (!this.dragItem) {
      this.dragItem = this.slots[i];
      this.slots[i] = null;
    } else {
      this.slots[i] = this.dragItem;
      this.dragItem = null;
    }
    this.render();
  }
}
