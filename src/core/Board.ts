import { Cell, Position, Match, MineralType, ItemType } from '../types';
import { GRID_SIZE, BASE_SCORE_PER_GEM, COMBO_MULTIPLIER } from '../constants';
import { Grid } from './Grid';
import { 
  createGemCell, 
  createEmptyCell, 
  isValidPosition,
  areAdjacent
} from '../utils/helpers';

export type BoardCallback = (type: 'match' | 'fall' | 'mineral' | 'combo' | 'item', data?: unknown) => void;

export class Board {
  private grid: Grid;
  private callbacks: BoardCallback[] = [];
  private combo: number = 0;

  constructor() {
    this.grid = new Grid();
  }

  getGrid(): Grid {
    return this.grid;
  }

  getCell(row: number, col: number): Cell | null {
    return this.grid.getCell(row, col);
  }

  setGrid(grid: Grid): void {
    this.grid = grid;
  }

  on(callback: BoardCallback): void {
    this.callbacks.push(callback);
  }

  off(callback: BoardCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private emit(type: 'match' | 'fall' | 'mineral' | 'combo' | 'item', data?: unknown): void {
    this.callbacks.forEach(cb => cb(type, data));
  }

  resetCombo(): void {
    this.combo = 0;
  }

  getCombo(): number {
    return this.combo;
  }

  canSwap(pos1: Position, pos2: Position): boolean {
    if (!areAdjacent(pos1, pos2)) return false;
    
    const cell1 = this.grid.getCell(pos1.row, pos1.col);
    const cell2 = this.grid.getCell(pos2.row, pos2.col);
    
    if (!cell1 || !cell2) return false;
    if (cell1.type === 'rock' || cell2.type === 'rock') return false;
    if (cell1.type === 'empty' || cell2.type === 'empty') return false;
    
    return true;
  }

  swapAndCheck(pos1: Position, pos2: Position): boolean {
    if (!this.canSwap(pos1, pos2)) return false;
    
    this.grid.swapCells(pos1, pos2);
    
    if (!this.grid.hasMatches()) {
      this.grid.swapCells(pos1, pos2);
      return false;
    }
    
    return true;
  }

  async processMatches(): Promise<{ score: number; minerals: MineralType[] }> {
    let totalScore = 0;
    let collectedMinerals: MineralType[] = [];
    this.combo = 0;

    while (true) {
      const matches = this.grid.findMatches();
      if (matches.length === 0) break;

      this.combo++;
      
      let matchScore = 0;
      for (const match of matches) {
        matchScore += match.length * BASE_SCORE_PER_GEM;
        
        for (const pos of match.cells) {
          this.markCellForRemoval(pos.row, pos.col);
        }
      }
      
      if (this.combo > 1) {
        matchScore = Math.floor(matchScore * (1 + COMBO_MULTIPLIER * (this.combo - 1)));
        this.emit('combo', { combo: this.combo, score: matchScore });
      }
      
      totalScore += matchScore;
      this.emit('match', { matches, score: matchScore });

      await this.removeMatchedCells();

      const minerals = this.processDirtAroundMatches(matches);
      collectedMinerals = [...collectedMinerals, ...minerals];
      
      if (minerals.length > 0) {
        this.emit('mineral', { minerals });
      }

      await this.dropCells();
      await this.fillEmptyCells();
    }

    return { score: totalScore, minerals: collectedMinerals };
  }

  private markCellForRemoval(row: number, col: number): void {
    const cell = this.grid.getCell(row, col);
    if (cell) {
      cell.isMatched = true;
    }
  }

  private async removeMatchedCells(): Promise<void> {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = this.grid.getCell(row, col);
        if (cell && cell.isMatched) {
          this.grid.setCell(row, col, createEmptyCell());
        }
      }
    }
  }

  private processDirtAroundMatches(matches: Match[]): MineralType[] {
    const minerals: MineralType[] = [];
    const affectedPositions = new Set<string>();

    for (const match of matches) {
      for (const pos of match.cells) {
        const neighbors = [
          { row: pos.row - 1, col: pos.col },
          { row: pos.row + 1, col: pos.col },
          { row: pos.row, col: pos.col - 1 },
          { row: pos.row, col: pos.col + 1 }
        ];

        for (const neighbor of neighbors) {
          const key = `${neighbor.row},${neighbor.col}`;
          if (!affectedPositions.has(key)) {
            affectedPositions.add(key);
            const cell = this.grid.getCell(neighbor.row, neighbor.col);
            
            if (cell && (cell.type === 'dirt' || cell.type === 'mineral')) {
              if (cell.type === 'mineral' && cell.mineralType) {
                minerals.push(cell.mineralType);
              }
              this.grid.setCell(neighbor.row, neighbor.col, createEmptyCell());
            }
          }
        }
      }
    }

    return minerals;
  }

  async dropCells(): Promise<void> {
    for (let col = 0; col < GRID_SIZE; col++) {
      let emptyRows: number[] = [];
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const cell = this.grid.getCell(row, col);
        
        if (cell && cell.type === 'empty') {
          emptyRows.push(row);
        } else if (emptyRows.length > 0 && cell) {
          const targetRow = emptyRows.shift()!;
          
          if (cell.type !== 'rock') {
            cell.isFalling = true;
            this.grid.setCell(targetRow, col, cell);
            this.grid.setCell(row, col, createEmptyCell());
            emptyRows.push(row);
          }
        }
      }
    }
    
    this.emit('fall');
  }

  async fillEmptyCells(): Promise<void> {
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        const cell = this.grid.getCell(row, col);
        if (cell && cell.type === 'empty') {
          this.grid.setCell(row, col, createGemCell());
        }
      }
    }
  }

  clickDirtCell(row: number, col: number): boolean {
    const cell = this.grid.getCell(row, col);
    if (!cell) return false;
    
    if (cell.type === 'dirt') {
      this.grid.setCell(row, col, createEmptyCell());
      return true;
    }
    
    if (cell.type === 'mineral') {
      const mineralType = cell.mineralType;
      this.grid.setCell(row, col, createEmptyCell());
      if (mineralType) {
        this.emit('mineral', { minerals: [mineralType] });
        return true;
      }
    }
    
    return false;
  }

  useBomb(row: number, col: number): { score: number; minerals: MineralType[]; affectedPositions: Position[] } {
    const affectedPositions: Position[] = [];
    let minerals: MineralType[] = [];
    let score = 0;

    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (isValidPosition(r, c)) {
          affectedPositions.push({ row: r, col: c });
        }
      }
    }

    for (const pos of affectedPositions) {
      const cell = this.grid.getCell(pos.row, pos.col);
      if (cell) {
        if (cell.type === 'gem') {
          score += BASE_SCORE_PER_GEM;
          this.grid.setCell(pos.row, pos.col, createEmptyCell());
        } else if (cell.type === 'dirt') {
          this.grid.setCell(pos.row, pos.col, createEmptyCell());
        } else if (cell.type === 'mineral' && cell.mineralType) {
          if (!cell.isHidden) {
            minerals.push(cell.mineralType);
          }
          this.grid.setCell(pos.row, pos.col, createEmptyCell());
        } else if (cell.type === 'rock') {
          this.grid.setCell(pos.row, pos.col, createEmptyCell());
        }
      }
    }

    this.emit('item', { type: 'bomb', cells: affectedPositions });
    return { score, minerals, affectedPositions };
  }

  usePickaxe(row: number, col: number): boolean {
    const cell = this.grid.getCell(row, col);
    if (!cell || cell.type !== 'rock') return false;

    this.grid.setCell(row, col, createEmptyCell());
    this.emit('item', { type: 'pickaxe', position: { row, col } });
    return true;
  }

  useRefresh(): void {
    const newGrid = new Grid();
    newGrid.initializeRandomGems();
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const currentCell = this.grid.getCell(row, col);
        const newCell = newGrid.getCell(row, col);
        
        if (currentCell && (currentCell.type === 'rock' || currentCell.type === 'dirt' || currentCell.type === 'mineral')) {
          newGrid.setCell(row, col, currentCell);
        }
      }
    }
    
    this.grid = newGrid;
    this.emit('item', { type: 'refresh' });
  }
}
