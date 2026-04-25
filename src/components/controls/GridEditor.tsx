import React, { useCallback } from 'react';
import { useCube, actions } from '../../store/CubeContext';
import { rowLabel, colLabel } from '../../engine';
import styles from './GridEditor.module.css';

export function GridEditor() {
  const { state, dispatch } = useCube();
  const { grid, rows, cols, mode, selectedCell, maxStackHeight } = state;

  const selectCell = useCallback((row: number, col: number) => {
    dispatch(actions.selectCell({ row, col }));
  }, [dispatch]);

  const selectedHeight = selectedCell != null
    ? grid[selectedCell.row]?.[selectedCell.col] ?? 0
    : null;

  return (
    <div className={styles.root}>
      <p className={styles.sectionLabel}>
        {mode === 'setup' ? 'תרשים מספרים' : 'בחר מיקום'}
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.corner} />
              {Array.from({ length: cols }, (_, c) => (
                <th key={c} className={styles.colHead}>{colLabel(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                <td className={styles.rowHead}>{rowLabel(r)}</td>
                {row.map((val, c) => {
                  const isSel = selectedCell?.row === r && selectedCell?.col === c;
                  return (
                    <td
                      key={c}
                      className={`${styles.cell} ${isSel ? styles.selected : ''} ${val === 0 ? styles.zero : ''}`}
                      onClick={() => selectCell(r, c)}
                    >
                      {val === 0 ? '—' : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <div className={styles.controls}>
          <p className={styles.cellLabel}>
            {rowLabel(selectedCell.row)}{colLabel(selectedCell.col)}
          </p>
          <div className={styles.adjRow}>
            <button className={styles.adjBtn}
              onClick={() => dispatch(actions.adjustHeight(selectedCell.row, selectedCell.col, -1))}
              disabled={selectedHeight === 0}>−</button>
            <span className={styles.adjVal}>{selectedHeight ?? 0}</span>
            <button className={styles.adjBtn}
              onClick={() => dispatch(actions.adjustHeight(selectedCell.row, selectedCell.col, 1))}
              disabled={selectedHeight === maxStackHeight}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}
