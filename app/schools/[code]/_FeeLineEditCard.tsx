'use client';

import { useState } from 'react';
import { computeIncrementedFee } from '@/engine/fee';
import { updateFeeLine } from './actions';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

interface Line {
  id: string;
  gradeBand: { label: string };
  baseFee: number;
  incrementPct: unknown;
}

/** Client component so the computed tuition fee (and the increment amount it represents) updates
 *  live as the Finance Officer types a base fee / increment %, before they commit with Save —
 *  reviewing the number is the point, not just entering inputs blind. */
export function FeeLineEditCard({ schoolCode, line }: { schoolCode: string; line: Line }) {
  const [baseFee, setBaseFee] = useState(String(line.baseFee));
  const [incrementPctInput, setIncrementPctInput] = useState((Number(line.incrementPct) * 100).toFixed(2));

  const baseFeeNum = Number(baseFee);
  const pct = Number(incrementPctInput);
  const valid = !Number.isNaN(baseFeeNum) && !Number.isNaN(pct);
  const tuitionFee = valid ? computeIncrementedFee(baseFeeNum, pct / 100) : null;
  const incrementAmount = valid ? tuitionFee! - baseFeeNum : null;

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="font-heading font-bold text-foreground">{line.gradeBand.label}</div>
      <form action={updateFeeLine.bind(null, schoolCode, line.id)} className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="fh-label text-xs">Base fee</label>
            <input
              name="baseFee"
              type="number"
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
              className="fh-input w-full"
              required
            />
          </div>
          <div>
            <label className="fh-label text-xs">Increment %</label>
            <input
              name="incrementPct"
              type="number"
              step="0.01"
              value={incrementPctInput}
              onChange={(e) => setIncrementPctInput(e.target.value)}
              className="fh-input w-full"
              required
            />
          </div>
        </div>
        <div className="rounded-md bg-surface-sunken px-3 py-2 text-sm">
          <div className="flex items-center justify-between text-muted">
            <span>Increment amount</span>
            <span>{incrementAmount === null ? '—' : `${incrementAmount < 0 ? '-' : '+'}${inr.format(Math.abs(incrementAmount))}`}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-medium text-foreground">New tuition fee (Total)</span>
            <span className="font-heading font-bold text-foreground">{tuitionFee === null ? '—' : inr.format(tuitionFee)}</span>
          </div>
        </div>
        <button type="submit" className="fh-btn fh-btn--secondary w-full">Save</button>
      </form>
    </div>
  );
}
