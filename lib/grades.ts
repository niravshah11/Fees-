// Fixed grade list offered by Master Data's grade-band picker (/master/[code]) — selecting
// several at once creates one grade band per grade, rather than free-typing a combined-range
// label like "Grade 1 to 6". Existing bands seeded before this (e.g. FSM's "Grade 1 to 3") keep
// their combined labels; only new bands created through the picker follow this one-grade-each
// convention.
export const STANDARD_GRADES = [
  'Playgroup',
  'Nursery',
  'Jr. KG',
  'Sr. KG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];
