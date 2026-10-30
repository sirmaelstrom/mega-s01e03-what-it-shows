<script lang="ts">
  import { tagDisagrees, ticketProblems } from '#lib/kb/ticket-problems';
  import type { Problem } from '#lib/kb/problems';

  // One number from a ticket, for use inside a sentence: <ProblemCount ticket={4471} of="hint" />
  type Of = Problem | 'reports' | 'rows' | 'repeated' | 'problems' | 'tag-disagrees';
  let { ticket, of }: { ticket: number; of: Of } = $props();

  const t = $derived(ticketProblems(ticket));
  const n = $derived.by(() => {
    switch (of) {
      case 'reports': return t.merged.length;
      case 'rows': return t.rows;
      case 'repeated': return t.rows - t.merged.length;
      case 'problems': return t.groups.length;
      case 'tag-disagrees': return tagDisagrees(t);
      default: return t.groups.find((g) => g.problem === of)?.reports.length ?? 0;
    }
  });
</script>

<strong>{n}</strong>
