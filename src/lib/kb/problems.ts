// The problems inside one merged ticket. causes.ts says why a flipped date flipped; the desk's own
// reading (desk-notes.json) says which reports are no flip at all but a one-day move. A one-day move
// is its own problem, so it is counted there and nowhere else.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

const tally = (xs: string[]) =>
  Object.fromEntries(
    Object.entries(xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]),
  );

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  subjects: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export type TicketProblems = { rows: number; merged: Report[]; groups: ProblemGroup[] };

export function problemsIn(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): TicketProblems {
  const merged = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const groups = [...byProblem.entries()]
    .map(([problem, rs]) => {
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
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: rows.filter((r) => r.mergedInto === ticket).length, merged, groups };
}
