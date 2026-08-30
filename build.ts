// This is a Deno script

// https://docs.deno.com/runtime/reference/migration_guide/
import process from "node:process";
import * as esbuild from "npm:esbuild";
import pkg from "./package.json" with { type: "json" };
// watch me regret this in 2 years
import { debounce } from "jsr:@std/async/debounce";

const cmd = new Deno.Command("git", {
  args: ["rev-parse", "--short", "HEAD"],
});

const { stdout } = await cmd.output();

const git_hash = new TextDecoder().decode(stdout).trim();

const { NODE_ENV = "development" } = process.env;

const build = async () => {
  await esbuild.build({
    entryPoints: ["./src/index.ts", "./src/sw.js"],
    outdir: "./dist",
    bundle: true,
    format: "cjs",
    define: {
      "process.env.NODE_ENV": `"${NODE_ENV}"`,
      "process.env.npm_package_version": `"${pkg.version}"`,
      "process.env.git_hash": `"${git_hash}"`,
    },
    treeShaking: NODE_ENV === "production",
    minify: NODE_ENV === "production",
  });

  esbuild.stop();
};

if (Deno.args.includes("--watch")) {
  const watcher = Deno.watchFs("./src", { recursive: false });

  await build();

  console.log("waiting for changes...");

  const debounced = debounce(async (event: Deno.FsEvent) => {
    console.log(event.kind, event.paths);
    await build();
  }, 150);

  for await (const event of watcher) {
    debounced(event);
  }
} else {
  await build();
}
