import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

const {
  NODE_ENV,
  NOW_GITHUB_COMMIT_SHA = Math.random().toString(16).substr(2),
  npm_package_version,
} = process.env;
const isProduction = NODE_ENV === 'production';
const gitHash = NOW_GITHUB_COMMIT_SHA.substr(0, 7);

console.log({ gitHash });

const commonPlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV || 'development'),
    'process.env.npm_package_version': JSON.stringify(npm_package_version),
    'process.env.git_hash': JSON.stringify(gitHash),
  }),
  commonjs(),
  typescript({
    // want to send sourcemaps to sentry
    sourceMap: true,
  }),
  nodeResolve(),
];

const plugins = isProduction
  ? [...commonPlugins, require('rollup-plugin-terser').terser()]
  : commonPlugins;

export default () => {
  const main = {
    plugins,
    input: `src/index.ts`,
    output: {
      // vercel builds to dist then copies dist to root, so
      // we need to build to dist/dist... madness
      file: isProduction ? `dist/dist/main.js` : `dist/main.js`,
      sourcemap: true,
      format: 'cjs',
    },
  };

  if (!isProduction) {
    return main;
  }

  return [
    main,
    {
      plugins,
      input: `src/sw.js`,
      output: {
        // vercel builds to dist then copies dist to root
        file: isProduction ? `dist/sw.js` : 'sw.js',
        sourcemap: true,
        format: 'cjs',
        strict: false,
      },
    },
  ];
};
