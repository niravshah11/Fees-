import Link from 'next/link';

// Per the group-wide convention (see the event-management app's CLAUDE.md): this page is the
// styling reference and carries the running "what's new" list. Keep WHATS_NEW in sync with any
// isNew markers in app/_Nav.tsx.
const WHATS_NEW: { title: string; detail: string }[] = [
  {
    title: 'Schools dashboard',
    detail: 'One tile per school showing its current approved fee year and the status of any proposal in flight.',
  },
  {
    title: 'Fee Builder',
    detail: 'Per-school draft editor: base fee, per-grade-band YoY increment %, term/admission fee, with a "bulk apply" for a whole programme stage at once.',
  },
  {
    title: 'Approval chain',
    detail: 'Draft → Fees Group Coordinator → Head of Operations → Director → Board of Trustees, with a permanent decision trail on every step.',
  },
  {
    title: 'Rights',
    detail: 'Drafting/editing a proposal and Master data is open to every signed-in colleague; grant Fees Group Coordinator, Head of Operations, Head of Finance, Director, or Board of Trustees for the approval chain at /settings/rights.',
  },
  {
    title: 'Master data',
    detail: 'Add, edit, or remove a school’s programme stages and grade bands at /master — each stage carries its own YoY increment %, since every campus’s programme mix and rates differ.',
  },
];

export default function Help() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-primary hover:underline">← Schools</Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-foreground">Help</h1>
        <p className="mt-1 text-muted">How the fee proposal &amp; approval workflow fits together.</p>
      </div>

      <section className="fh-card space-y-3">
        <h2 className="font-heading text-lg font-bold text-foreground">The workflow, in short</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
          <li>A campus's grade bands and programme stages — each with its own YoY increment % — are set up once at /master, then kept up to date there as the school's structure changes.</li>
          <li>Any signed-in colleague opens their school and starts a draft for the next academic year.</li>
          <li>Each grade band pre-fills from last year's approved fee and its programme stage's default increment — both fully editable.</li>
          <li>The draft is submitted for review, entering the approval chain in order: Fees Group Coordinator, Head of Operations, Director, then Board of Trustees.</li>
          <li>Once the Board approves, that version becomes the school's official fee for the year, and any prior approved version for the same year is superseded.</li>
        </ol>
      </section>

      <section className="fh-card space-y-3">
        <h2 className="font-heading text-lg font-bold text-foreground">What's new</h2>
        <ul className="space-y-2">
          {WHATS_NEW.map((item) => (
            <li key={item.title} className="text-sm">
              <span className="font-medium text-foreground">{item.title}</span>
              <span className="text-muted"> — {item.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
