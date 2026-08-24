const {
  NODE_ENV,
  NOW_GITHUB_COMMIT_SHA = Math.random().toString(16).substr(2),
  npm_package_version: packageVersion,
} = process.env;
const gitHash = NOW_GITHUB_COMMIT_SHA.substr(0, 7);

export const build = () =>
  Bun.build({
    entrypoints: ['./src/index.ts', './src/sw.js'],
    outdir: './dist',
    minify: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV || 'development'),
      'process.env.npm_package_version': JSON.stringify(packageVersion),
      'process.env.git_hash': JSON.stringify(gitHash),
    },
  });

build();
