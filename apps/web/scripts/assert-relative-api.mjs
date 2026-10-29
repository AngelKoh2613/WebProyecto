import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const localUrl = /https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i;

function filesIn(directory) {
  const found = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      found.push(...filesIn(fullPath));
      continue;
    }
    if (/\.(?:html|js|css)$/.test(entry)) {
      found.push(fullPath);
    }
  }
  return found;
}

const offenders = filesIn(dist).filter((file) =>
  localUrl.test(readFileSync(file, "utf8")),
);

if (offenders.length > 0) {
  console.error(
    "The production bundle contains a local API URL. Leave VITE_API_URL empty.",
  );
  process.exit(1);
}
