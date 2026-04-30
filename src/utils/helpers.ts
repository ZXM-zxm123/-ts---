import { Position, Cell, GemColor, MineralType, CellType } from '../types';
import { GRID_SIZE, GEM_COLORS, MINERAL_TYPES } from '../constants';

export let idCounter = 0;

export function generateId(): string {
  return `cell_${++idCounter}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

export function areAdjacent(pos1: Position, pos2: Position): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export function getRandomGemColor(): GemColor {
  return GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
}

export function getRandomMineralType(): MineralType {
  const rand = Math.random();
  if (rand < 0.2) return 'gold';
  if (rand < 0.5) return 'silver';
  return 'copper';
}

export function createGemCell(color?: GemColor): Cell {
  return {
    type: 'gem',
    id: generateId(),
    gemColor: color || getRandomGemColor(),
    isSelected: false,
    isMatched: false,
    isFalling: false
  };
}

export function createDirtCell(hasMineral: boolean = false, mineralType?: MineralType): Cell {
  return {
    type: hasMineral ? 'mineral' : 'dirt',
    id: generateId(),
    mineralType: hasMineral ? (mineralType || getRandomMineralType()) : undefined,
    isHidden: true,
    isSelected: false,
    isMatched: false,
    isFalling: false
  };
}

export function createRockCell(): Cell {
  return {
    type: 'rock',
    id: generateId(),
    isSelected: false,
    isMatched: false,
    isFalling: false
  };
}

export function createEmptyCell(): Cell {
  return {
    type: 'empty',
    id: generateId(),
    isSelected: false,
    isMatched: false,
    isFalling: false
  };
}

export function cloneCell(cell: Cell): Cell {
  return {
    ...cell,
    id: generateId()
  };
}

export function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map(row => row.map(cell => cloneCell(cell)));
}
