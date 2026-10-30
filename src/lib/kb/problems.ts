// The problems inside one merged ticket, counted the way the desk counts (causes.ts): every report is
// filed by its tenant under `parser` or `hint`. Reports the desk read as a one-day move
// (desk-notes.json) are a problem of their own, so they get a ticket too, and they stay counted where
// they're filed.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

const tally = (xs: string[]) =>
  Object.fromEntries(
    Object.entries(xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]),
  );

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // For `one-day`: where each of its reports is filed (and counted) by tenant.
  filedAs?: Record<string, number>;
  tenants: string[];
  channels: Record<string, number>;
  subjects: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export type TicketProblems = { rows: number; merged: Report[]; groups: ProblemGroup[] };

function group(problem: Problem, rs: Report[]): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: tally(rs.map((r) => r.channel)),
    subjects: tally(rs.map((r) => r.subject)),
    taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function problemsIn(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): TicketProblems {
  const merged = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const filed = (r: Report): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const byCause = new Map<Problem, Report[]>();
  for (const r of merged) byCause.set(filed(r), [...(byCause.get(filed(r)) ?? []), r]);
  const groups = [...byCause.entries()].map(([p, rs]) => group(p, rs)).sort((a, b) => b.reports.length - a.reports.length);

  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) groups.push({ ...group('one-day', moved), filedAs: tally(moved.map(filed)) });

  return { rows: rows.filter((r) => r.mergedInto === ticket).length, merged, groups };
}
