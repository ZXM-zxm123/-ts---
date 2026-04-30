import { LevelConfig, ThemeConfig, GemColor, MineralType, ThemeType } from './types';

export const GRID_SIZE = 7;

export const GEM_COLORS: GemColor[] = ['red', 'blue', 'green', 'yellow', 'purple'];

export const MINERAL_TYPES: MineralType[] = ['gold', 'silver', 'copper'];

export const BASE_SCORE_PER_GEM = 10;

export const COMBO_MULTIPLIER = 0.5;

export const ITEM_COUNT = 3;

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    targetScore: 2000,
    maxMoves: 45,
    mineralGoal: { gold: 1, silver: 3, copper: 5 },
    rockCount: 0,
    dirtLayerRows: 2,
    mineralDensity: 0.4
  },
  {
    level: 2,
    targetScore: 3000,
    maxMoves: 40,
    mineralGoal: { gold: 2, silver: 5, copper: 8 },
    rockCount: 2,
    dirtLayerRows: 3,
    mineralDensity: 0.5
  },
  {
    level: 3,
    targetScore: 5000,
    maxMoves: 35,
    mineralGoal: { gold: 3, silver: 8, copper: 12 },
    rockCount: 4,
    dirtLayerRows: 4,
    mineralDensity: 0.6
  },
  {
    level: 4,
    targetScore: 8000,
    maxMoves: 32,
    mineralGoal: { gold: 5, silver: 12, copper: 15 },
    rockCount: 6,
    dirtLayerRows: 5,
    mineralDensity: 0.7
  },
  {
    level: 5,
    targetScore: 12000,
    maxMoves: 28,
    mineralGoal: { gold: 8, silver: 15, copper: 20 },
    rockCount: 8,
    dirtLayerRows: 5,
    mineralDensity: 0.8
  }
];

export const THEMES: Record<ThemeType, ThemeConfig> = {
  mine: {
    name: '矿洞',
    backgroundColor: '#1a1a2e',
    boardBackgroundColor: '#2d2d44',
    gemColors: {
      red: '#e74c3c',
      blue: '#3498db',
      green: '#27ae60',
      yellow: '#f1c40f',
      purple: '#9b59b6'
    },
    dirtColor: '#8B4513',
    rockColor: '#696969',
    mineralColors: {
      gold: '#FFD700',
      silver: '#C0C0C0',
      copper: '#B87333'
    },
    textColor: '#ecf0f1'
  },
  desert: {
    name: '沙漠',
    backgroundColor: '#f4a460',
    boardBackgroundColor: '#deb887',
    gemColors: {
      red: '#dc143c',
      blue: '#4169e1',
      green: '#32cd32',
      yellow: '#ffd700',
      purple: '#8b008b'
    },
    dirtColor: '#d2691e',
    rockColor: '#808080',
    mineralColors: {
      gold: '#ffd700',
      silver: '#a9a9a9',
      copper: '#cd7f32'
    },
    textColor: '#2c2c2c'
  },
  dungeon: {
    name: '地下城',
    backgroundColor: '#0d0d0d',
    boardBackgroundColor: '#1a1a1a',
    gemColors: {
      red: '#ff0000',
      blue: '#00bfff',
      green: '#00ff00',
      yellow: '#ffff00',
      purple: '#ff00ff'
    },
    dirtColor: '#3a3a3a',
    rockColor: '#4a4a4a',
    mineralColors: {
      gold: '#ffd700',
      silver: '#c0c0c0',
      copper: '#b87333'
    },
    textColor: '#ffffff'
  }
};

export const ANIMATION_DURATION = {
  swap: 200,
  fall: 300,
  disappear: 150,
  appear: 150,
  explode: 300
};

export const STORAGE_KEYS = {
  LEVEL_PROGRESS: 'diamond_miner_level_progress',
  HIGH_SCORE: 'diamond_miner_high_score',
  CURRENT_THEME: 'diamond_miner_theme',
  ITEMS: 'diamond_miner_items'
};
