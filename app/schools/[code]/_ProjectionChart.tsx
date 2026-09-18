import { projectFeeSchedule } from '@/engine/projection';

// Brand categorical palette (vendor/fountainhead-design-system/tokens/tokens.ts's
// fhChartCategorical) — hardcoded here rather than imported since that file is TS meant for a
// bundler-aware consumer; this is a small server component with no interactivity, so a plain SVG
// (no charting library) keeps the dependency list at zero.
const PALETTE = ['#005BAA', '#B8292F', '#F2C418', '#1F8A4C', '#5793C7', '#D07276', '#F4CF42', '#6BB289'];

const compactINR = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

export interface ProjectionSeriesInput {
  label: string;
  tuitionFee: number;
  incrementPct: number;
}

/** A small multi-series line chart — the current academic year plus `years` projected points per
 *  grade band, each compounding at its own current increment %. Static SVG: no client JS needed.
 *  `yearLabels` supplies the x-axis text (length years+1, current year first); falls back to
 *  "Now"/"+Nyr" if omitted. */
export function ProjectionChart({ lines, years = 5, yearLabels }: { lines: ProjectionSeriesInput[]; years?: number; yearLabels?: string[] }) {
  const series = lines.map((line, i) => {
    const schedule = projectFeeSchedule(line.tuitionFee, line.incrementPct, years);
    return { label: line.label, color: PALETTE[i % PALETTE.length], points: [line.tuitionFee, ...schedule.map((y) => y.fee)] };
  });

  const allValues = series.flatMap((s) => s.points);
  const max = Math.max(...allValues, 1);
  const min = Math.min(0, ...allValues);
  const width = 640;
  const height = 220;
  const padLeft = 60;
  const padRight = 16;
  const padTop = 12;
  const padBottom = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = years + 1;

  const xFor = (i: number) => padLeft + (n === 1 ? 0 : (plotW * i) / (n - 1));
  const yFor = (v: number) => padTop + plotH - ((v - min) / (max - min || 1)) * plotH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Fee projection chart">
      <g className="text-border" stroke="currentColor" strokeWidth={1}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={padLeft} x2={width - padRight} y1={padTop + plotH * t} y2={padTop + plotH * t} />
        ))}
      </g>
      <g className="text-muted" fill="currentColor">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={padLeft - 8} y={padTop + plotH * t + 4} fontSize={10} textAnchor="end">
            {compactINR.format(max - (max - min) * t)}
          </text>
        ))}
        {Array.from({ length: n }).map((_, i) => (
          <text key={i} x={xFor(i)} y={height - 4} fontSize={10} textAnchor="middle">
            {yearLabels?.[i] ?? (i === 0 ? 'Now' : `+${i}yr`)}
          </text>
        ))}
      </g>
      {series.map((s) => (
        <g key={s.label}>
          <polyline fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" points={s.points.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')} />
          {s.points.map((v, i) => (
            <circle key={i} cx={xFor(i)} cy={yFor(v)} r={3} fill={s.color} />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function ProjectionLegend({ lines }: { lines: ProjectionSeriesInput[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {lines.map((line, i) => (
        <span key={line.label} className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
          {line.label}
        </span>
      ))}
    </div>
  );
}
