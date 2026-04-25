import React, { useState, useEffect } from 'react';
import { useCube, actions } from '../../store/CubeContext';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const { state, dispatch, canUndo, canRedo } = useCube();
  const [rows, setRows] = useState(String(state.rows));
  const [cols, setCols] = useState(String(state.cols));
  const [maxH, setMaxH] = useState(String(state.maxStackHeight));

  useEffect(() => { setRows(String(state.rows)); }, [state.rows]);
  useEffect(() => { setCols(String(state.cols)); }, [state.cols]);

  function applyRows() {
    const n = parseInt(rows, 10);
    if (n >= 2 && n <= 8) dispatch(actions.setGridRows(n));
    else setRows(String(state.rows));
  }
  function applyCols() {
    const n = parseInt(cols, 10);
    if (n >= 2 && n <= 8) dispatch(actions.setGridCols(n));
    else setCols(String(state.cols));
  }
  function applyMax() {
    const m = parseInt(maxH, 10);
    if (m >= 1 && m <= 20) dispatch(actions.setMaxHeight(m));
    else setMaxH(String(state.maxStackHeight));
  }

  return (
    <div className={styles.bar}>
      <div className={styles.group}>
        <button className={`${styles.modeBtn} ${state.mode === 'setup' ? styles.active : ''}`}
          onClick={() => dispatch(actions.setMode('setup'))}>הגדרה</button>
        <button className={`${styles.modeBtn} ${state.mode === 'work' ? styles.active : ''}`}
          onClick={() => dispatch(actions.setMode('work'))}>עבודה</button>
      </div>

      <div className={styles.sep} />

      <div className={styles.group}>
        <label className={styles.label}>שורות</label>
        <input className={styles.numInput} type="number" min={2} max={8} value={rows}
          onChange={e => setRows(e.target.value)}
          onBlur={applyRows}
          onKeyDown={e => e.key === 'Enter' && applyRows()} />
        <label className={styles.label}>עמודות</label>
        <input className={styles.numInput} type="number" min={2} max={8} value={cols}
          onChange={e => setCols(e.target.value)}
          onBlur={applyCols}
          onKeyDown={e => e.key === 'Enter' && applyCols()} />
      </div>

      <div className={styles.sep} />

      <div className={styles.group}>
        <label className={styles.label}>גובה מקס׳</label>
        <input className={styles.numInput} type="number" min={1} max={20} value={maxH}
          onChange={e => setMaxH(e.target.value)}
          onBlur={applyMax}
          onKeyDown={e => e.key === 'Enter' && applyMax()} />
      </div>

      <div className={styles.sep} />

      <div className={styles.group}>
        <button className={styles.iconBtn} onClick={() => dispatch(actions.undo())}
          disabled={!canUndo} title="בטל (Ctrl+Z)">↩</button>
        <button className={styles.iconBtn} onClick={() => dispatch(actions.redo())}
          disabled={!canRedo} title="בצע שוב">↪</button>
        <button className={styles.iconBtn} title="איפוס"
          onClick={() => { if (window.confirm('לאפס את כל הקוביות?')) dispatch(actions.reset()); }}>✕</button>
      </div>
    </div>
  );
}
