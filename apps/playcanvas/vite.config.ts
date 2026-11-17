import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../../build/playcanvas',
    emptyOutDir: true,
    rolldownOptions: { input: ['index.html', 'david-preview.html', 'movement.html', 'elah.html', 'saul.html', 'episode.html', 'valley.html', 'camp.html', 'challenge.html', 'preparation.html', 'duel.html', 'victory.html'] },
  },
});
