// Write one GitHub issue body per problem in #4471, from the same modules the kb page renders.
// Usage: node scripts/issue-bodies.mjs <repo url> <out dir>
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const [repo, out] = process.argv.slice(2);
const page = `${repo}/blob/main/src/routes/kb/incidents/4471-problems/%2Bpage.svx`;
const rendered = `${repo}/blob/main/rendered/kb/incidents/4471-problems/index.html`;

const TEXT = {
  parser: {
    title: 'Day-first dates are read month first by the shared parser',
    what: "The shared parser reads every date month first. Every tenant in #4471 writes the day first, so 7 April comes out as 4 July. This is the bug #4471's queued fix is for.",
    evidence: 'Every report here that gives two dates shows the same day and month swapped. The rest give no dates but come from the same tenants and ways in, and one asks for a "my country writes the day first" setting.',
    fix: "Parse dates in the tenant's order (its locale), not month first.",
  },
  hint: {
    title: 'booking-v3 form hint asks day-first tenants for MM/DD/YYYY',
    what: "booking-v3's form prints MM/DD/YYYY under its date field. At day-first tenants, people type the month first as the hint tells them, and the form reads the date the tenant's way (day first), so day and month swap. The parser fix does not touch the form.",
    evidence: "Every report here came through booking-v3's form at a day-first tenant, and every one shows day and month swapped. #4471's own kb table already marks these \"not this ticket — no ticket of its own\".",
    fix: "Print the hint in the tenant's order (DD/MM/YYYY for these tenants), matching how the form reads the date.",
  },
  'one-day': {
    title: 'Dates move by one day (time zone), not a day/month swap',
    what: 'Booked dates move by one day, depending on the time zone they are shown in. No day and month are swapped, so the parser fix does not touch this.',
    evidence: 'These are the reports the desk itself read as a one-day move (desk-notes.json). Their bodies: one shows 12 May as 11 May, one a Tuesday shown as Monday; a client in Toronto and one in Lisbon got different days for the same meeting; an invite arrived before its booking; June bookings one day off. #4471\'s kb table files them under parser with a footnote.',
    fix: 'Store and send booked dates as calendar dates (or with the tenant\'s time zone), and render them in that zone, not the viewer\'s or UTC.',
  },
};

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { ticketProblems } = await vite.ssrLoadModule('/src/lib/kb/ticket-problems.ts');
  const t = ticketProblems(4471);
  fs.mkdirSync(out, { recursive: true });
  const index = [];
  for (const g of t.groups) {
    const x = TEXT[g.problem];
    if (!x) throw new Error(`no text for problem ${g.problem}`);
    const n = g.reports.length;
    const title = `${x.title} · ${n} reports from #4471`;
    const kv = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ');
    const body = [
      `**${n} reports** from support ticket #4471 belong to this problem (of ${t.merged.length} unique reports merged into #4471).`,
      '',
      `## Problem`,
      x.what,
      '',
      `## Evidence`,
      x.evidence,
      '',
      `- tenants (${g.tenants.length}): ${g.tenants.join(', ')}`,
      `- ways in: ${kv(g.channels)}`,
      `- intake tags: ${kv(g.taggedAs)} (intake guesses from the browser; not used to place reports)`,
      `- seen: ${g.firstSeen} → ${g.lastSeen}`,
      `- subject lines: ${Object.keys(g.subjects).length} different ones, shared with the other problems`,
      '',
      `## Fix`,
      x.fix,
      '',
      `## How the ${n} was counted`,
      `Over \`src/lib/data/reports-4471.json\` (${t.rows} rows merged into #4471): one id, one report (${t.rows - t.merged.length} rows repeat where the export's pages overlap), leaving ${t.merged.length}. A report the desk read as a one-day move (\`desk-notes.json\`) is \`one-day\`; every other report is placed by its tenant (\`causes.ts\`: a day-first tenant's report through booking-v3's form is \`hint\`, any other way in is \`parser\`). Reproduce with \`npm install && npm run counts\`; the kb page [${'.svx'}](${page}) / [rendered](${rendered}) computes the same numbers at render time.`,
      '',
      `<details><summary>The ${n} report ids</summary>`,
      '',
      g.reports.map((r) => r.id).join(' '),
      '',
      '</details>',
      '',
    ].join('\n');
    const file = path.join(out, `${g.problem}.md`);
    fs.writeFileSync(file, body);
    index.push({ problem: g.problem, count: n, title, file });
  }
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 2));
  console.log(JSON.stringify(index, null, 2));
} finally {
  await vite.close();
}
