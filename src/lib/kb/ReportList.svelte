<script lang="ts">
  import { ticketProblems } from '#lib/kb/ticket-problems';
  import type { Problem } from '#lib/kb/problems';

  // The reports filed under one problem, in the reporters' own words.
  let { ticket, problem }: { ticket: number; problem: Problem } = $props();

  const reports = $derived(ticketProblems(ticket).groups.find((g) => g.problem === problem)?.reports ?? []);
</script>

<table>
  <thead><tr><th>report</th><th>tenant</th><th>way in</th><th>what they wrote</th></tr></thead>
  <tbody>
    {#each reports as r (r.id)}
      <tr><td><code>{r.id}</code></td><td>{r.tenant}</td><td>{r.channel}</td><td>{r.body}</td></tr>
    {/each}
  </tbody>
</table>
