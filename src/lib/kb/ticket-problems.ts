// The problems in a merged ticket, from the ticket export, the tenant directory and the desk's notes.
import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import type { Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';
import { problemsIn, type Problem, type TicketProblems } from '#lib/kb/problems';

export const ticketProblems = (ticket: number): TicketProblems => problemsIn(reports as Report[], ticket, tenantOf, notes.oneDayMove);

// Reports whose intake tag names a different cause than their tenant and way in do.
export const tagDisagrees = (t: TicketProblems): number =>
  t.groups.filter((g) => g.problem === 'parser' || g.problem === 'hint').reduce((n, g) => n + g.reports.filter((r) => r.meta.intakeTag !== g.problem).length, 0);

export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];
