import React from 'react';
import styles from './ComparisonTable.module.css';

const rows = [
  ['Approach', 'UIA elements + DOM query + vision', 'Screenshot only'],
  ['Reliability', 'Deterministic — same selector works across runs', 'May vary across runs'],
  ['Speed', 'Sub-second per step', 'Round-trip to inference API per step'],
  ['Cost', 'Low — runs locally, no per-step inference', 'High — every step consumes token'],
  ['Vision', 'On-device, used as fallback', 'Cloud inference, primary approach'],
  ['Platform', 'Windows (all frameworks)', 'macOS-first, limited Windows'],
  ['Model dependency', 'Any agent, any model', 'Locked to Claude'],
  ['Browser automation', 'CDP (structured page access)', 'Screenshot of browser'],
  ['Trace', 'Structured log with detailed action per step', 'Sequence of screenshots'],
];

export default function ComparisonTable() {
  return (
    <div className={styles.wrapper}>
      <div className="container">
        <h2 className={styles.heading}>UI Automata vs Computer Use</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>UI Automata</th>
              <th>Computer Use (Cowork)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([dimension, ours, theirs]) => (
              <tr key={dimension}>
                <td><strong>{dimension}</strong></td>
                <td>{ours}</td>
                <td>{theirs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
