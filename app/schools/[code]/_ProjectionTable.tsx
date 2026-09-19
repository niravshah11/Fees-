'use client';

import { Fragment, useState } from 'react';

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

/** "6" not "6.00", "8.5" not "8.50" — trims the trailing zeros a fixed-decimal format would add. */
function formatPct(pct: number): string {
  return `${Number((pct * 100).toFixed(2))}%`;
}

/** A cell's amount, with its increment % alongside it (e.g. "₹1,53,806 (6%)") when one applies —
 *  confirmed with the user: a reviewer (Director, Board of Trustees) shouldn't have to leave this
 *  table to see what rate produced a given year's figure. Omitted where there isn't one flat rate
 *  behind the number — the isRemainder head (always derived, never its own %) and the "Total"
 *  row's summed-across-heads fallback when the school has no isTotal head. */
function formatCell(amount: number, incrementPct: number | undefined): string {
  return incrementPct === undefined ? inr.format(Math.round(amount)) : `${inr.format(Math.round(amount))} (${formatPct(incrementPct)})`;
}

export interface BandProjection {
  id: string;
  label: string;
  /** The grade band's headline total for each projected year — always visible. */
  totalPoints: number[];
  /** The rate behind `totalPoints`, shown alongside each year's amount — undefined when there's
   *  no single flat rate to show (the summed-fallback case). */
  totalIncrementPct?: number;
  /** Every other fee head (e.g. Tuition Fee, Beyond Mandate), revealed by the +/− toggle. */
  subRows: { label: string; points: number[]; incrementPct?: number }[];
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
      {/* Not fh-table--striped: its zebra stripe is CSS nth-child(even), which counts the
          expandable sub-rows too — expanding one band would shift every band below it onto the
          wrong stripe (confirmed by the user). Every grade-band row instead stays plain/white;
          only its expanded sub-rows get the sunken grey background, so a band's own colour never
          shifts no matter what's expanded above it. */}
      <table className="fh-table">
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
                    <td key={i}>{formatCell(v, band.totalIncrementPct)}</td>
                  ))}
                </tr>
                {isOpen && band.subRows.map((row) => (
                  <tr key={row.label} className="bg-surface-sunken">
                    <td className="pl-9 text-sm text-muted">{row.label}</td>
                    {row.points.map((v, i) => (
                      <td key={i} className="text-sm text-muted">{formatCell(v, row.incrementPct)}</td>
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
