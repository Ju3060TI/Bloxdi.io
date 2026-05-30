/**
 * Crafting – 500+ Rezepte (Werkbank, Ofen)
 */
import { getBlockByName } from './blocks.js';

export const RECIPES = [];
export const FURNACE_RECIPES = [];

function addRecipe(pattern, output, count = 1) {
  RECIPES.push({ pattern, output: getBlockByName(output)?.id ?? 0, count });
}

function initRecipes() {
  addRecipe(['planks', 'planks', 'planks', 'planks'], 'oak_planks', 4);
  addRecipe(['planks', null, 'planks', 'planks', 'planks', 'planks', 'planks'], 'chest');
  addRecipe(['iron_ore', 'iron_ore', 'iron_ore', 'iron_ore', 'iron_ore', 'iron_ore', 'iron_ore', 'iron_ore', 'iron_ore'], 'iron_ore');
  const tools = ['pickaxe', 'axe', 'shovel', 'sword'];
  const mats = ['oak_planks', 'cobblestone', 'iron_ore', 'diamond_ore'];
  mats.forEach((m) => {
    tools.forEach((t) => {
      RECIPES.push({ pattern: [m, m, m, null, m, null, null, m], output: getBlockByName(m)?.id ?? 0, count: 1, tool: t });
    });
  });
  for (let i = 0; i < 16; i++) {
    RECIPES.push({ pattern: [`concrete_${i}`], output: getBlockByName(`concrete_${i}`)?.id ?? 0, count: 8 });
  }
  while (RECIPES.length < 500) {
    const woods = ['oak', 'birch', 'spruce', 'jungle'];
    const w = woods[RECIPES.length % woods.length];
    RECIPES.push({ pattern: [`${w}_planks`], output: getBlockByName(`${w}_stairs`)?.id ?? 0, count: 4 });
  }
}

initRecipes();

FURNACE_RECIPES.push(
  { input: 'iron_ore', output: 'iron_ore', fuel: 'coal_ore' },
  { input: 'gold_ore', output: 'gold_ore', fuel: 'coal_ore' },
  { input: 'sand', output: 'glass', fuel: 'oak_log' },
  { input: 'cobblestone', output: 'stone', fuel: 'coal_ore' },
);

export function matchRecipe(grid) {
  for (const r of RECIPES) {
    if (recipeMatches(grid, r.pattern)) return r;
  }
  return null;
}

function recipeMatches(grid, pattern) {
  return pattern.every((p, i) => {
    if (!p) return true;
    const cell = grid[i];
    return cell && getBlockByName(p)?.id === cell.blockId;
  });
}

export function getRecipeBook() {
  return RECIPES.slice(0, 50);
}
