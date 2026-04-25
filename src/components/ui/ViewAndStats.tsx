import React from 'react';
import type { ViewMode } from '../../types';
import { useCube, actions } from '../../store/CubeContext';
import { computeStats } from '../../engine';
import styles from './ViewAndStats.module.css';

// ── ViewSelector ─────────────────────────────────────────────────
const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'front', label: 'מלפנים' },
  { id: 'left',  label: 'משמאל' },
  { id: 'right', label: 'מימין' },
  { id: 'back',  label: 'מאחור' },
  { id: 'top',   label: 'מלמעלה' },
  { id: 'iso',   label: 'איזומטרי' },
];

export function ViewSelector({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useCube();
  return (
    <div className={compact ? styles.viewBarCompact : styles.viewBar}>
      {VIEWS.map(({ id, label }) => (
        <button
          key={id}
          className={`${compact ? styles.vBtnCompact : styles.vBtn} ${state.viewMode === id ? styles.vActive : ''}`}
          onClick={() => dispatch(actions.setView(id))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── StatsPanel ───────────────────────────────────────────────────
export function StatsPanel() {
  const { state } = useCube();
  const stats = computeStats(state.grid);

  return (
    <div className={styles.stats}>
      <Row label="סה״כ קוביות" value={stats.total} />
      <Row label="גובה מקסימלי" value={stats.maxHeight} />
      <Row label="עמודות מאוכלסות" value={`${stats.filledCells} / ${stats.totalCells}`} />
      <div className={styles.silhouettes}>
        <Silhouette title="חזית" values={stats.frontSilhouette} />
        <Silhouette title="צד" values={stats.leftSilhouette} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowKey}>{label}</span>
      <span className={styles.rowVal}>{value}</span>
    </div>
  );
}

function Silhouette({ title, values }: { title: string; values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className={styles.sil}>
      <p className={styles.silTitle}>{title}</p>
      <div className={styles.bars}>
        {values.map((v, i) => (
          <div key={i} className={styles.barWrap}>
            <div
              className={styles.bar}
              style={{ height: `${Math.round((v / max) * 36)}px` }}
              title={`${v}`}
            />
            <span className={styles.barLabel}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
