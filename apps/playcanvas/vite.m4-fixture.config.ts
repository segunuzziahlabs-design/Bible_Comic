// Test-only build: replaces identity with an explicitly labelled local fixture.
// This configuration is never used by npm run build or the review candidate.
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';
export default mergeConfig(base,defineConfig({
  resolve:{alias:[{find:/^(?:\.\.\/product\/|\.\/)account-runtime$/,replacement:new URL('./tests/fixtures/account-runtime.ts',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')}]},
  define:{'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY':JSON.stringify('fixture-only')},
  build:{outDir:'../../build/playcanvas-m4-fixture'},
}));
