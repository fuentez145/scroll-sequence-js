import { execFileSync } from "node:child_process";

const allowed = new Set([
  "package.json",
  "README.md",
  ...["dist/index.js", "dist/index.cjs", "dist/index.d.ts", "dist/index.d.cts", "dist/core.js", "dist/core.cjs", "dist/core.d.ts", "dist/core.d.cts"],
]);

const output = execFileSync("npm", ["pack", "--json", "--dry-run"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
const [pack] = JSON.parse(output);
const files = pack?.files ?? [];
const paths = files.map(({ path }) => path);
const unexpected = paths.filter((path) => !allowed.has(path) && !path.startsWith("dist/"));

if (unexpected.length > 0) {
  console.error(`Unexpected files in npm package:\n${unexpected.join("\n")}`);
  process.exit(1);
}

if (!paths.includes("package.json") || !paths.includes("README.md") || !paths.some((path) => path === "dist/index.js")) {
  console.error("The npm package is missing required runtime or documentation files.");
  process.exit(1);
}

console.log(`Package boundary OK: ${paths.length} files; no files outside package.json, README.md, and dist/.`);
