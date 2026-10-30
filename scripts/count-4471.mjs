// Count the problems in #4471 with the same modules the kb page renders (loaded through Vite, so
// `#lib`, import.meta.glob and the JSON exports resolve exactly as in the build), then check each
// count against what the report bodies say.
// Usage: npm run counts
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
try {
  const { problemsIn } = await vite.ssrLoadModule('/src/lib/kb/problems.ts');
  const { tenantOf } = await vite.ssrLoadModule('/src/lib/kb/locales.ts');
  const { default: rows } = await vite.ssrLoadModule('/src/lib/data/reports-4471.json');
  const { default: notes } = await vite.ssrLoadModule('/src/lib/data/desk-notes.json');

  const { rows: n, merged, groups } = problemsIn(rows, 4471, tenantOf, notes.oneDayMove);
  console.log(`runtime node ${process.version} icu ${process.versions.icu}`);
  console.log(`export rows merged into #4471: ${n}; unique reports: ${merged.length}; repeated rows: ${n - merged.length}`);

  // What the body says, independent of tenant and channel: two dates with day and month swapped,
  // two dates one day apart, or no full date pair.
  const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const dateRe = new RegExp(`(\\d{1,2}) (${MONTHS.join('|')})`, 'gi');
  const bodySays = (body) => {
    const ds = [...body.matchAll(dateRe)].map((m) => ({ d: +m[1], m: MONTHS.indexOf(m[2].toLowerCase()) + 1 }));
    if (ds.length !== 2) return 'no date pair';
    const [a, b] = ds;
    if (a.d === b.m && a.m === b.d) return 'day/month swapped';
    const days = Math.round((Date.UTC(2026, b.m - 1, b.d) - Date.UTC(2026, a.m - 1, a.d)) / 86_400_000);
    return Math.abs(days) === 1 ? 'one day apart' : `${days} days apart`;
  };

  const filed = new Set();
  for (const g of groups) {
    if (!g.filedAs) for (const r of g.reports) filed.add(r.id);
    if (g.filedAs) console.log(`\n(${g.problem} reports stay counted where they're filed: ${JSON.stringify(g.filedAs)})`);
    const says = g.reports.reduce((t, r) => ((t[bodySays(r.body)] = (t[bodySays(r.body)] ?? 0) + 1), t), {});
    console.log(`\n${g.problem}: ${g.reports.length} reports · ${g.tenants.length} tenants · seen ${g.firstSeen} → ${g.lastSeen}`);
    console.log(`  tenants  ${g.tenants.join(', ')}`);
    console.log(`  ways in  ${JSON.stringify(g.channels)}`);
    console.log(`  intake   ${JSON.stringify(g.taggedAs)}`);
    console.log(`  subjects ${Object.keys(g.subjects).length}: ${JSON.stringify(g.subjects)}`);
    console.log(`  bodies   ${JSON.stringify(says)}`);
    for (const r of g.reports.filter((r) => bodySays(r.body) !== 'day/month swapped')) console.log(`    ${r.id} ${r.tenant} ${r.channel}: ${r.body}`);
  }
  console.log(`\nproblems: ${groups.length}; reports filed by tenant: ${filed.size} of ${merged.length}`);
} finally {
  await vite.close();
}
