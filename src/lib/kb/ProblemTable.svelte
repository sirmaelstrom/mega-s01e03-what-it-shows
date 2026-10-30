<script lang="ts">
  import { ticketProblems } from '#lib/kb/ticket-problems';
  import type { Problem } from '#lib/kb/problems';

  // One row per problem in the ticket, each linked to the ticket it now has.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const t = $derived(ticketProblems(ticket));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{t.merged.length}</strong> reports merged into #{ticket}
  ({t.rows} rows in the export, {t.rows - t.merged.length} repeated) ·
  <strong>{t.groups.length}</strong>
  {t.groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>ways in</th><th>tagged as</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each t.groups as g (g.problem)}
      <tr class:unplaced={g.problem === 'unplaced'}>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td>{g.tenants.length}</td>
        <td class="small">{list(g.channels)}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if tickets[g.problem]}<a href={tickets[g.problem]}>{tickets[g.problem]?.replace(/^https:\/\/github\.com\//, '')}</a>{:else}none yet{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each t.groups.filter((g) => g.filedAs) as g (g.problem)}
  <p class="note">
    The {g.reports.length} <code>{g.problem}</code> reports are also counted where the desk files them by tenant:
    {list(g.filedAs ?? {})}.
  </p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .note { color: var(--muted); font-size: 0.85em; }
  .unplaced td { background: var(--warn-bg); }
</style>
