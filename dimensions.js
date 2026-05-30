/**
 * Nether + End Dimensionen, Portale
 */
import { getBlockByName } from './blocks.js';

export const DIMENSIONS = {
  overworld: { id: 'overworld', sky: 0x78a7ff, fog: 0x78a7ff },
  nether: { id: 'nether', sky: 0x4a1010, fog: 0x2a0808, scale: 8 },
  end: { id: 'end', sky: 0x1a1028, fog: 0x0a0810 },
};

export class DimensionManager {
  constructor(game) {
    this.game = game;
    this.current = 'overworld';
  }

  buildNetherPortal(x, y, z, setBlock) {
    const obs = getBlockByName('obsidian')?.id ?? 0;
    for (let dy = 0; dy < 4; dy++) {
      setBlock(x, y + dy, z, obs);
      setBlock(x + 3, y + dy, z, obs);
    }
    for (let dx = 0; dx <= 3; dx++) {
      setBlock(x + dx, y, z, obs);
      setBlock(x + dx, y + 3, z, obs);
    }
  }

  travelTo(dimension) {
    this.current = dimension;
    const dim = DIMENSIONS[dimension];
    if (this.game.scene) {
      this.game.renderer.setClearColor(dim.sky);
      this.game.scene.fog.color.setHex(dim.fog);
    }
    if (dimension === 'nether') {
      this.game.player.body.position.multiplyScalar(1 / 8);
    }
  }

  isInNether() { return this.current === 'nether'; }
  isInEnd() { return this.current === 'end'; }
}
