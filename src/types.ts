export type GemColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export type MineralType = 'gold' | 'silver' | 'copper';

export type CellType = 'gem' | 'dirt' | 'rock' | 'mineral' | 'empty';

export type ItemType = 'refresh' | 'bomb' | 'pickaxe';

export type ThemeType = 'mine' | 'desert' | 'dungeon';

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  type: CellType;
  id: string;
  gemColor?: GemColor;
  mineralType?: MineralType;
  isHidden?: boolean;
  isSelected?: boolean;
  isMatched?: boolean;
  isFalling?: boolean;
}

export interface Match {
  cells: Position[];
  gemColor: GemColor;
  direction: 'horizontal' | 'vertical';
  length: number;
}

export interface MineralCollection {
  gold: number;
  silver: number;
  copper: number;
}

export interface MineralGoal {
  gold: number;
  silver: number;
  copper: number;
}

export interface LevelConfig {
  level: number;
  targetScore: number;
  maxMoves: number;
  mineralGoal: MineralGoal;
  rockCount: number;
  dirtLayerRows: number;
  mineralDensity: number;
}

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  stars: number;
}

export interface GameState {
  currentLevel: number;
  score: number;
  moves: number;
  maxMoves: number;
  collectedMinerals: MineralCollection;
  mineralGoal: MineralGoal;
  targetScore: number;
  combo: number;
  items: Record<ItemType, number>;
  isAnimating: boolean;
  gameStatus: 'playing' | 'won' | 'lost';
  selectedCell: Position | null;
}

export interface ThemeConfig {
  name: string;
  backgroundColor: string;
  boardBackgroundColor: string;
  gemColors: Record<GemColor, string>;
  dirtColor: string;
  rockColor: string;
  mineralColors: Record<MineralType, string>;
  textColor: string;
}

export interface AnimationOptions {
  duration: number;
  easing: string;
  delay: number;
}

export interface CellAnimation {
  cellId: string;
  type: 'fall' | 'swap' | 'disappear' | 'appear' | 'explode';
  options: AnimationOptions;
}
