/opt/homebrew/Library/Homebrew/cmd/shellenv.sh: line 27: /bin/ps: Operation not permitted
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pairs = [
  ["index.html", "../backend/src/main/resources/static/index.html"],
  ["app.js", "../backend/src/main/resources/static/app.js"],
  ["styles.css", "../backend/src/main/resources/static/styles.css"]
];

for (const [source, packaged] of pairs) {
  const sourceText = readFileSync(resolve(source), "utf8");
  const packagedText = readFileSync(resolve(packaged), "utf8");
  if (sourceText !== packagedText) {
    console.error(`Frontend build failed: ${source} differs from ${packaged}`);
    process.exitCode = 1;
  }
}

if (process.exitCode !== 1) console.log("Frontend build check passed; deployable assets are in sync.");
