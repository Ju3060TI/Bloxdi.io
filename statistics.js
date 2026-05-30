/**
 * Spieler-Statistiken
 */
export class Statistics {
  constructor() {
    this.blocksMined = {};
    this.blocksPlaced = {};
    this.mobsKilled = {};
    this.deaths = 0;
    this.playTime = 0;
    this.distanceWalked = 0;
    this.highestJump = 0;
    this.deepestPoint = 0;
    this.itemsCrafted = 0;
    this._lastPos = null;
  }

  addBlockMined(name) {
    if (!name) return;
    this.blocksMined[name] = (this.blocksMined[name] ?? 0) + 1;
  }

  addBlockPlaced(name) {
    if (!name) return;
    this.blocksPlaced[name] = (this.blocksPlaced[name] ?? 0) + 1;
  }

  addMobKill(type) {
    this.mobsKilled[type] = (this.mobsKilled[type] ?? 0) + 1;
  }

  updatePosition(pos, dt) {
    this.playTime += dt;
    if (this._lastPos) {
      const dx = pos.x - this._lastPos.x;
      const dz = pos.z - this._lastPos.z;
      this.distanceWalked += Math.hypot(dx, dz);
    }
    this._lastPos = { x: pos.x, z: pos.z };
    this.deepestPoint = Math.min(this.deepestPoint, pos.y);
  }

  serialize() {
    return {
      blocksMined: this.blocksMined,
      blocksPlaced: this.blocksPlaced,
      mobsKilled: this.mobsKilled,
      deaths: this.deaths,
      playTime: this.playTime,
      distanceWalked: this.distanceWalked,
      deepestPoint: this.deepestPoint,
      itemsCrafted: this.itemsCrafted,
    };
  }

  load(data) {
    if (!data) return;
    Object.assign(this, data);
  }
}
