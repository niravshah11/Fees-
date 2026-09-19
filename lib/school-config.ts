// The six Fountainhead schools this app covers, in display order. Each school's `domain` is the
// email domain its own staff sign in with (lib/auth-domains.ts already allowlists all of these)
// — informational only, not used for auth itself.

export interface SchoolConfigEntry {
  code: string;
  name: string;
  board: string;
  domain: string;
}

export const SCHOOL_CONFIG: SchoolConfigEntry[] = [
  { code: 'FSK', name: 'Fountainhead School, Kunkni', board: 'IB', domain: 'fsksurat.in' },
  { code: 'FSM', name: 'Fountainhead School, Malgama', board: 'IB', domain: 'fsmsurat.in' },
  { code: 'FWGS', name: 'Fountainhead Workhardt Global School', board: 'IB', domain: 'fwgs.in' },
  { code: 'FPV', name: 'Fountainhead Pre-School, Vesu', board: 'IB', domain: 'fpvesu.in' },
  { code: 'FPA', name: 'Fountainhead Pre-School, Adajan', board: 'IB', domain: 'fpadajan.in' },
  { code: 'FALH', name: 'Fountainhead Avadh Learning Hub', board: 'IB', domain: 'falh.in' },
];

export const SCHOOL_CODES = SCHOOL_CONFIG.map((s) => s.code);
