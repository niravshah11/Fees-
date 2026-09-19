'use client';

import { useState } from 'react';
import { computeIncrementedFee } from '@/engine/fee';
import { updateFeeLine } from './actions';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

interface Line {
  id: string;
  baseFee: number;
  incrementPct: unknown;
}

/** One (grade band x fee head) row. Client component so the computed amount (and the increment
 *  amount it represents) updates live as whoever is drafting types a base fee / increment %,
 *  before they commit with Save — reviewing the number is the point, not just entering inputs
 *  blind. `title` is the fee head's label (e.g. "Tuition Fee") — the parent groups these under
 *  a grade-band heading and shows the summed total across every head there. */
export function FeeLineEditCard({ schoolCode, title, line }: { schoolCode: string; title: string; line: Line }) {
  const [baseFee, setBaseFee] = useState(String(line.baseFee));
  const [incrementPctInput, setIncrementPctInput] = useState((Number(line.incrementPct) * 100).toFixed(2));

  const baseFeeNum = Number(baseFee);
  const pct = Number(incrementPctInput);
  const valid = !Number.isNaN(baseFeeNum) && !Number.isNaN(pct);
  const amount = valid ? computeIncrementedFee(baseFeeNum, pct / 100) : null;
  const incrementAmount = valid ? amount! - baseFeeNum : null;

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <form action={updateFeeLine.bind(null, schoolCode, line.id)} className="mt-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
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
        <div className="rounded-md bg-surface-sunken px-2 py-1.5 text-xs">
          <div className="flex items-center justify-between text-muted">
            <span>Increment amount</span>
            <span>{incrementAmount === null ? '—' : `${incrementAmount < 0 ? '-' : '+'}${inr.format(Math.abs(incrementAmount))}`}</span>
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="font-medium text-foreground">New amount</span>
            <span className="font-heading font-bold text-foreground">{amount === null ? '—' : inr.format(amount)}</span>
          </div>
        </div>
        <button type="submit" className="fh-btn fh-btn--outline fh-btn--sm w-full">Save</button>
      </form>
    </div>
  );
}
