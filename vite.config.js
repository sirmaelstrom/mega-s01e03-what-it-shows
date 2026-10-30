// Build setup for the kb export: mdsvex pages, the runbook layout, `#lib` imports (package.json "imports"),
// every page prerendered to self-contained HTML in build/.
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

export default defineConfig({
  plugins: [
    sveltekit({
      extensions: ['.svelte', '.svx'],
      preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook } })],
      adapter: adapter({ pages: 'build', assets: 'build', strict: true }),
      output: { bundleStrategy: 'inline' },
      inlineStyleThreshold: Infinity,
      prerender: { entries: ['/kb'] },
    }),
  ],
});
