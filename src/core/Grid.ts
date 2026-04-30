import { Cell, Position, Match, GemColor } from '../types';
import { GRID_SIZE, GEM_COLORS } from '../constants';
import { 
  createGemCell, 
  createDirtCell, 
  createRockCell, 
  createEmptyCell,
  cloneCell,
  isValidPosition
} from '../utils/helpers';

export class Grid {
  private cells: Cell[][];
  private size: number;

  constructor() {
    this.size = GRID_SIZE;
    this.cells = this.createEmptyGrid();
  }

  private createEmptyGrid(): Cell[][] {
    const grid: Cell[][] = [];
    for (let row = 0; row < this.size; row++) {
      grid[row] = [];
      for (let col = 0; col < this.size; col++) {
        grid[row][col] = createEmptyCell();
      }
    }
    return grid;
  }

  getSize(): number {
    return this.size;
  }

  getCell(row: number, col: number): Cell | null {
    if (!isValidPosition(row, col)) return null;
    return this.cells[row][col];
  }

  setCell(row: number, col: number, cell: Cell): void {
    if (!isValidPosition(row, col)) return;
    this.cells[row][col] = cell;
  }

  getGrid(): Cell[][] {
    return this.cells.map(row => row.map(cell => cloneCell(cell)));
  }

  initializeRandomGems(): void {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.cells[row][col].type === 'empty') {
          const gem = this.createGemWithoutMatch(row, col);
          this.cells[row][col] = gem;
        }
      }
    }
  }

  private createGemWithoutMatch(row: number, col: number): Cell {
    const availableColors = [...GEM_COLORS];
    
    if (col >= 2) {
      const left1 = this.cells[row][col - 1];
      const left2 = this.cells[row][col - 2];
      if (left1.gemColor && left2.gemColor && left1.gemColor === left2.gemColor) {
        const index = availableColors.indexOf(left1.gemColor);
        if (index > -1) availableColors.splice(index, 1);
      }
    }
    
    if (row >= 2) {
      const above1 = this.cells[row - 1][col];
      const above2 = this.cells[row - 2][col];
      if (above1.gemColor && above2.gemColor && above1.gemColor === above2.gemColor) {
        const index = availableColors.indexOf(above1.gemColor);
        if (index > -1) availableColors.splice(index, 1);
      }
    }
    
    const color = availableColors[Math.floor(Math.random() * availableColors.length)];
    return createGemCell(color);
  }

  addDirtLayers(numLayers: number, mineralDensity: number): void {
    const startRow = this.size - numLayers;
    for (let row = startRow; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.cells[row][col].type === 'empty') {
          const hasMineral = Math.random() < mineralDensity;
          this.cells[row][col] = createDirtCell(hasMineral);
        }
      }
    }
  }

  addRocks(count: number): void {
    let placed = 0;
    const attempts = 100;
    let attempt = 0;
    
    while (placed < count && attempt < attempts) {
      const row = Math.floor(Math.random() * this.size);
      const col = Math.floor(Math.random() * this.size);
      
      if (this.cells[row][col].type === 'gem' || this.cells[row][col].type === 'empty') {
        this.cells[row][col] = createRockCell();
        placed++;
      }
      attempt++;
    }
  }

  findMatches(): Match[] {
    const matches: Match[] = [];
    const matchedCells = new Set<string>();

    for (let row = 0; row < this.size; row++) {
      let matchStart = 0;
      let currentColor = this.cells[row][0].gemColor;
      
      for (let col = 1; col <= this.size; col++) {
        const cellColor = col < this.size ? this.cells[row][col].gemColor : null;
        
        if (col === this.size || cellColor !== currentColor || !currentColor) {
          const matchLength = col - matchStart;
          if (matchLength >= 3 && currentColor) {
            const matchCells: Position[] = [];
            for (let c = matchStart; c < col; c++) {
              const cellKey = `${row},${c}`;
              if (!matchedCells.has(cellKey)) {
                matchCells.push({ row, col: c });
                matchedCells.add(cellKey);
              }
            }
            if (matchCells.length >= 3) {
              matches.push({
                cells: matchCells,
                gemColor: currentColor,
                direction: 'horizontal',
                length: matchCells.length
              });
            }
          }
          if (col < this.size) {
            matchStart = col;
            currentColor = this.cells[row][col].gemColor;
          }
        }
      }
    }

    for (let col = 0; col < this.size; col++) {
      let matchStart = 0;
      let currentColor = this.cells[0][col].gemColor;
      
      for (let row = 1; row <= this.size; row++) {
        const cellColor = row < this.size ? this.cells[row][col].gemColor : null;
        
        if (row === this.size || cellColor !== currentColor || !currentColor) {
          const matchLength = row - matchStart;
          if (matchLength >= 3 && currentColor) {
            const matchCells: Position[] = [];
            for (let r = matchStart; r < row; r++) {
              const cellKey = `${r},${col}`;
              if (!matchedCells.has(cellKey)) {
                matchCells.push({ row: r, col });
                matchedCells.add(cellKey);
              }
            }
            if (matchCells.length >= 3) {
              matches.push({
                cells: matchCells,
                gemColor: currentColor,
                direction: 'vertical',
                length: matchCells.length
              });
            }
          }
          if (row < this.size) {
            matchStart = row;
            currentColor = this.cells[row][col].gemColor;
          }
        }
      }
    }

    return matches;
  }

  hasMatches(): boolean {
    return this.findMatches().length > 0;
  }

  swapCells(pos1: Position, pos2: Position): boolean {
    const cell1 = this.getCell(pos1.row, pos1.col);
    const cell2 = this.getCell(pos2.row, pos2.col);
    
    if (!cell1 || !cell2) return false;
    if (cell1.type === 'rock' || cell2.type === 'rock') return false;
    
    this.cells[pos1.row][pos1.col] = cell2;
    this.cells[pos2.row][pos2.col] = cell1;
    
    return true;
  }

  clone(): Grid {
    const newGrid = new Grid();
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        newGrid.setCell(row, col, cloneCell(this.cells[row][col]));
      }
    }
    return newGrid;
  }
}
