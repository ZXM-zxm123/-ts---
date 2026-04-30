import { 
  GameState, 
  LevelConfig, 
  MineralCollection, 
  MineralGoal, 
  ItemType,
  ThemeType,
  Position
} from '../types';
import { LEVELS, ITEM_COUNT, THEMES } from '../constants';
import { Board } from './Board';
import { Grid } from './Grid';

export type GameCallback = (type: 'state_change' | 'level_complete' | 'level_failed' | 'combo', data?: unknown) => void;

export class Game {
  private board: Board;
  private state: GameState;
  private currentLevelConfig: LevelConfig;
  private callbacks: GameCallback[] = [];
  private currentTheme: ThemeType = 'mine';

  constructor(level: number = 1) {
    this.board = new Board();
    this.currentLevelConfig = LEVELS[level - 1] || LEVELS[0];
    this.state = this.createInitialState();
    this.setupBoard();
  }

  private createInitialState(): GameState {
    const levelItems = this.currentLevelConfig.items;
    return {
      currentLevel: this.currentLevelConfig.level,
      score: 0,
      moves: 0,
      maxMoves: this.currentLevelConfig.maxMoves,
      collectedMinerals: { gold: 0, silver: 0, copper: 0 },
      mineralGoal: { ...this.currentLevelConfig.mineralGoal },
      targetScore: this.currentLevelConfig.targetScore,
      combo: 0,
      items: {
        refresh: levelItems.refresh,
        bomb: levelItems.bomb,
        pickaxe: levelItems.pickaxe
      },
      isAnimating: false,
      gameStatus: 'playing',
      selectedCell: null
    };
  }

  isItemDisabled(itemType: ItemType): boolean {
    if (!this.currentLevelConfig.disabledItems) return false;
    return this.currentLevelConfig.disabledItems[itemType] === true;
  }

  getDisabledItems(): ItemType[] {
    const disabled: ItemType[] = [];
    if (!this.currentLevelConfig.disabledItems) return disabled;
    
    const types: ItemType[] = ['refresh', 'bomb', 'pickaxe'];
    for (const type of types) {
      if (this.currentLevelConfig.disabledItems[type]) {
        disabled.push(type);
      }
    }
    return disabled;
  }

  private setupBoard(): void {
    const grid = new Grid();
    grid.initializeRandomGems();
    grid.addDirtLayers(
      this.currentLevelConfig.dirtLayerRows,
      this.currentLevelConfig.mineralDensity
    );
    grid.addRocks(this.currentLevelConfig.rockCount);
    this.board.setGrid(grid);
  }

  getState(): GameState {
    return { ...this.state };
  }

  getBoard(): Board {
    return this.board;
  }

  getCurrentLevelConfig(): LevelConfig {
    return { ...this.currentLevelConfig };
  }

  getTheme(): ThemeType {
    return this.currentTheme;
  }

  setTheme(theme: ThemeType): void {
    this.currentTheme = theme;
    this.emit('state_change');
  }

  on(callback: GameCallback): void {
    this.callbacks.push(callback);
  }

  off(callback: GameCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private emit(type: 'state_change' | 'level_complete' | 'level_failed' | 'combo', data?: unknown): void {
    this.callbacks.forEach(cb => cb(type, data));
  }

  selectCell(row: number, col: number): boolean {
    if (this.state.gameStatus !== 'playing') return false;
    if (this.state.isAnimating) return false;

    const cell = this.board.getCell(row, col);
    if (!cell) return false;
    if (cell.type === 'empty' || cell.type === 'rock') return false;

    if (cell.type === 'dirt' || cell.type === 'mineral') {
      return this.clickDirtCell(row, col);
    }

    if (this.state.selectedCell) {
      const selected = this.state.selectedCell;
      
      if (selected.row === row && selected.col === col) {
        this.state.selectedCell = null;
        this.emit('state_change');
        return true;
      }

      if (this.board.canSwap(selected, { row, col })) {
        return this.attemptSwap(selected, { row, col });
      }

      this.state.selectedCell = { row, col };
      this.emit('state_change');
      return true;
    }

    this.state.selectedCell = { row, col };
    this.emit('state_change');
    return true;
  }

  private async clickDirtCell(row: number, col: number): Promise<boolean> {
    const success = this.board.clickDirtCell(row, col);
    if (success) {
      await this.board.dropCells();
      await this.board.fillEmptyCells();
      this.emit('state_change');
    }
    return success;
  }

  private async attemptSwap(pos1: Position, pos2: Position): Promise<boolean> {
    this.state.isAnimating = true;
    this.state.selectedCell = null;
    this.emit('state_change');

    const swapped = this.board.swapAndCheck(pos1, pos2);
    
    if (!swapped) {
      this.state.isAnimating = false;
      this.emit('state_change');
      return false;
    }

    this.state.moves++;
    this.board.resetCombo();

    const result = await this.board.processMatches();
    
    this.state.score += result.score;
    this.state.combo = this.board.getCombo();

    for (const mineral of result.minerals) {
      this.state.collectedMinerals[mineral]++;
    }

    this.state.isAnimating = false;
    this.checkGameStatus();
    this.emit('state_change');

    return true;
  }

  private checkGameStatus(): void {
    if (this.hasWon()) {
      this.state.gameStatus = 'won';
      this.emit('level_complete', {
        score: this.state.score,
        moves: this.state.moves,
        minerals: this.state.collectedMinerals
      });
    } else if (this.hasLost()) {
      this.state.gameStatus = 'lost';
      this.emit('level_failed', {
        score: this.state.score,
        moves: this.state.moves,
        minerals: this.state.collectedMinerals
      });
    }
  }

  hasWon(): boolean {
    if (this.state.score < this.state.targetScore) return false;
    
    const goal = this.state.mineralGoal;
    const collected = this.state.collectedMinerals;
    
    return collected.gold >= goal.gold && 
           collected.silver >= goal.silver && 
           collected.copper >= goal.copper;
  }

  hasLost(): boolean {
    if (this.state.gameStatus !== 'playing') return false;
    
    const remainingMoves = this.state.maxMoves - this.state.moves;
    
    if (remainingMoves <= 0) {
      return !this.hasWon();
    }
    
    return false;
  }

  useItem(itemType: ItemType, row?: number, col?: number): { 
    success: boolean; 
    affectedPositions?: Position[];
  } {
    if (this.state.gameStatus !== 'playing') return { success: false };
    if (this.state.isAnimating) return { success: false };
    if (this.isItemDisabled(itemType)) return { success: false };
    if (this.state.items[itemType] <= 0) return { success: false };

    switch (itemType) {
      case 'refresh':
        this.board.useRefresh();
        this.state.items[itemType]--;
        this.emit('state_change');
        return { success: true };

      case 'bomb':
        if (row === undefined || col === undefined) return { success: false };
        const bombResult = this.board.useBomb(row, col);
        this.state.score += bombResult.score;
        for (const mineral of bombResult.minerals) {
          this.state.collectedMinerals[mineral]++;
        }
        this.state.items[itemType]--;
        this.checkGameStatus();
        this.emit('state_change');
        return { success: true, affectedPositions: bombResult.affectedPositions };

      case 'pickaxe':
        if (row === undefined || col === undefined) return { success: false };
        const pickaxeResult = this.board.usePickaxe(row, col);
        if (pickaxeResult) {
          this.state.items[itemType]--;
          this.emit('state_change');
        }
        return { success: pickaxeResult, affectedPositions: pickaxeResult ? [{ row, col } : undefined };

      default:
        return { success: false };
    }
  }

  getStars(): number {
    if (!this.hasWon()) return 0;
    
    const scoreRatio = this.state.score / this.state.targetScore;
    const movesRatio = this.state.moves / this.state.maxMoves;
    
    if (scoreRatio >= 2 && movesRatio <= 0.5) return 3;
    if (scoreRatio >= 1.5 && movesRatio <= 0.7) return 2;
    return 1;
  }

  resetLevel(): void {
    this.board = new Board();
    this.state = this.createInitialState();
    this.setupBoard();
    this.emit('state_change');
  }

  loadLevel(level: number): void {
    if (level < 1 || level > LEVELS.length) return;
    
    this.currentLevelConfig = LEVELS[level - 1];
    this.board = new Board();
    this.state = this.createInitialState();
    this.setupBoard();
    this.emit('state_change');
  }
}
