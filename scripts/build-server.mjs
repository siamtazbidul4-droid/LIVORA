// esbuild config for the production server bundle.
// Kept in a file (instead of inline npm-script flags) so the banner's
// semicolons don't need shell escaping in package.json — which breaks on
// shells like PowerShell that treat ';' as a statement separator.
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/server.js',
  // vite is imported dynamically only in dev (middlewareMode) and stays
  // external in production, where NODE_ENV !== 'production' never triggers it.
  external: ['vite'],
  banner: {
    // Bundle is ESM but bundled CJS deps (dotenv, express, cors, ...) still
    // call require(); provide it via createRequire.
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
});
