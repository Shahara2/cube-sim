import type { AppState, Action } from '../types';

export const DEFAULT_ROWS = 4;
export const DEFAULT_COLS = 4;
export const DEFAULT_MAX_HEIGHT = 9;

export function makeEmptyGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function makeInitialState(rows = DEFAULT_ROWS, cols = DEFAULT_COLS): AppState {
  return {
    grid: makeEmptyGrid(rows, cols),
    rows,
    cols,
    mode: 'setup',
    viewMode: 'iso',
    selectedCell: null,
    maxStackHeight: DEFAULT_MAX_HEIGHT,
  };
}

function clampGrid(grid: number[][], rows: number, cols: number, maxH: number): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      Math.min(grid[r]?.[c] ?? 0, maxH)
    )
  );
}

export function cubeReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_HEIGHT': {
      const clamped = Math.max(0, Math.min(state.maxStackHeight, action.value));
      const grid = state.grid.map((r, ri) =>
        r.map((c, ci) => ri === action.row && ci === action.col ? clamped : c)
      );
      return { ...state, grid };
    }
    case 'ADJUST_HEIGHT': {
      const cur = state.grid[action.row]?.[action.col] ?? 0;
      const next = Math.max(0, Math.min(state.maxStackHeight, cur + action.delta));
      const grid = state.grid.map((r, ri) =>
        r.map((c, ci) => ri === action.row && ci === action.col ? next : c)
      );
      return { ...state, grid };
    }
    case 'SET_MODE':
      return { ...state, mode: action.mode, selectedCell: null };
    case 'SET_VIEW':
      return { ...state, viewMode: action.viewMode };
    case 'SELECT_CELL':
      return { ...state, selectedCell: action.cell };
    case 'SET_GRID_ROWS': {
      const rows = Math.max(2, Math.min(8, action.rows));
      return { ...state, rows, grid: clampGrid(state.grid, rows, state.cols, state.maxStackHeight), selectedCell: null };
    }
    case 'SET_GRID_COLS': {
      const cols = Math.max(2, Math.min(8, action.cols));
      return { ...state, cols, grid: clampGrid(state.grid, state.rows, cols, state.maxStackHeight), selectedCell: null };
    }
    case 'SET_MAX_HEIGHT': {
      const v = Math.max(1, Math.min(20, action.value));
      return { ...state, maxStackHeight: v, grid: state.grid.map(r => r.map(h => Math.min(h, v))) };
    }
    case 'RESET':
      return { ...state, grid: makeEmptyGrid(state.rows, state.cols), selectedCell: null };
    default:
      return state;
  }
}
