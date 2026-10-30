<script lang="ts">
  import { ticketProblems } from '#lib/kb/ticket-problems';

  // Subject line against problem: does the subject tell the problems apart?
  let { ticket }: { ticket: number } = $props();

  const t = $derived(ticketProblems(ticket));
  const subjects = $derived(
    [...new Set(t.merged.map((r) => r.subject))].sort((a, b) => a.localeCompare(b)).map((subject) => {
      const per = t.groups.map((g) => g.subjects[subject] ?? 0);
      return { subject, per, spread: per.filter((n) => n > 0).length };
    }),
  );
  const shared = $derived(subjects.filter((s) => s.spread > 1).length);
</script>

<p class="sum"><strong>{shared}</strong> of <strong>{subjects.length}</strong> subject lines appear under more than one problem.</p>

<table>
  <thead>
    <tr><th>subject</th>{#each t.groups as g (g.problem)}<th><code>{g.problem}</code></th>{/each}</tr>
  </thead>
  <tbody>
    {#each subjects as s (s.subject)}
      <tr><td>{s.subject}</td>{#each s.per as n, i (i)}<td class:zero={n === 0}>{n}</td>{/each}</tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1rem; }
  .zero { color: var(--muted); }
</style>
