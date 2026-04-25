import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { AppState, Action } from '../types';
import { cubeReducer, makeInitialState } from './cubeReducer';

interface HistoryState {
  past: AppState[];
  present: AppState;
  future: AppState[];
}

const EPHEMERAL = new Set<Action['type']>(['SET_VIEW', 'SELECT_CELL', 'SET_MODE']);

function historyReducer(history: HistoryState, action: Action): HistoryState {
  const { past, present, future } = history;
  if (action.type === 'UNDO') {
    if (!past.length) return history;
    return { past: past.slice(0, -1), present: past[past.length - 1], future: [present, ...future] };
  }
  if (action.type === 'REDO') {
    if (!future.length) return history;
    return { past: [...past, present], present: future[0], future: future.slice(1) };
  }
  const next = cubeReducer(present, action);
  if (next === present) return history;
  if (EPHEMERAL.has(action.type)) return { past, present: next, future };
  return { past: [...past, present].slice(-50), present: next, future: [] };
}

interface CubeCtx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  canUndo: boolean;
  canRedo: boolean;
}

const CubeContext = createContext<CubeCtx | null>(null);

export function CubeProvider({ children }: { children: React.ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [], present: makeInitialState(), future: [],
  }));
  const value = useMemo<CubeCtx>(
    () => ({ state: history.present, dispatch, canUndo: history.past.length > 0, canRedo: history.future.length > 0 }),
    [history, dispatch]
  );
  return <CubeContext.Provider value={value}>{children}</CubeContext.Provider>;
}

export function useCube() {
  const ctx = useContext(CubeContext);
  if (!ctx) throw new Error('useCube must be inside CubeProvider');
  return ctx;
}

export const actions = {
  setHeight:    (row: number, col: number, value: number): Action => ({ type: 'SET_HEIGHT', row, col, value }),
  adjustHeight: (row: number, col: number, delta: number): Action => ({ type: 'ADJUST_HEIGHT', row, col, delta }),
  setMode:      (mode: AppState['mode']): Action              => ({ type: 'SET_MODE', mode }),
  setView:      (viewMode: AppState['viewMode']): Action      => ({ type: 'SET_VIEW', viewMode }),
  selectCell:   (cell: AppState['selectedCell']): Action      => ({ type: 'SELECT_CELL', cell }),
  setGridRows:  (rows: number): Action                        => ({ type: 'SET_GRID_ROWS', rows }),
  setGridCols:  (cols: number): Action                        => ({ type: 'SET_GRID_COLS', cols }),
  setMaxHeight: (value: number): Action                       => ({ type: 'SET_MAX_HEIGHT', value }),
  reset:        (): Action                                    => ({ type: 'RESET' }),
  undo:         (): Action                                    => ({ type: 'UNDO' }),
  redo:         (): Action                                    => ({ type: 'REDO' }),
};
