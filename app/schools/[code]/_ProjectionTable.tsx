'use client';

import { Fragment, useState } from 'react';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export interface BandProjection {
  id: string;
  label: string;
  /** The grade band's headline total for each projected year — always visible. */
  totalPoints: number[];
  /** Every other fee head (e.g. Tuition Fee, Beyond Mandate), revealed by the +/− toggle. */
  subRows: { label: string; points: number[] }[];
}

/** One table, one row per grade band showing its total across the projected years — click the
 *  +/− to expand that grade band in place and see every other fee head's own row underneath it,
 *  instead of a separate table per head (confirmed with the user: a single table that expands
 *  per grade band, not three side-by-side tables). */
export function ProjectionTable({ years, bands }: { years: string[]; bands: BandProjection[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="fh-table fh-table--striped">
        <thead>
          <tr>
            <th>Grade band</th>
            {years.map((year) => (
              <th key={year}>{year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bands.map((band) => {
            const isOpen = expanded.has(band.id);
            return (
              <Fragment key={band.id}>
                <tr>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggle(band.id)}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? `Hide breakdown for ${band.label}` : `Show breakdown for ${band.label}`}
                      className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded border border-border text-xs font-bold leading-none text-muted hover:bg-surface-sunken"
                    >
                      {isOpen ? '−' : '+'}
                    </button>
                    <span className="font-medium text-foreground">{band.label}</span>
                  </td>
                  {band.totalPoints.map((v, i) => (
                    <td key={i} className={i === 0 ? 'font-medium' : undefined}>{inr.format(Math.round(v))}</td>
                  ))}
                </tr>
                {isOpen && band.subRows.map((row) => (
                  <tr key={row.label} className="bg-surface-sunken">
                    <td className="pl-9 text-sm text-muted">{row.label}</td>
                    {row.points.map((v, i) => (
                      <td key={i} className="text-sm text-muted">{inr.format(Math.round(v))}</td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
