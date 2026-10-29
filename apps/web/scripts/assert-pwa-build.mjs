import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);

function read(relativePath) {
  return readFileSync(path.join(dist, relativePath), "utf8");
}

const missing = [];

for (const file of [
  "sw.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
]) {
  try {
    readFileSync(path.join(dist, file));
  } catch {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error(`The production build is missing: ${missing.join(", ")}`);
  process.exit(1);
}

const worker = read("sw.js");
const manifest = JSON.parse(read("manifest.webmanifest"));
const clientBundle = readdirSync(path.join(dist, "assets"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => read(path.join("assets", file)))
  .join("\n");
const problems = [];

if (!clientBundle.includes("serviceWorker")) {
  problems.push("the client bundle does not register a service worker");
}

if (!worker.includes("index.html")) {
  problems.push("the service worker does not precache the app shell");
}

if (!/\/api/.test(worker) || !/\/health/.test(worker)) {
  problems.push(
    "the service worker does not exclude the API from navigation fallback",
  );
}

if (/runtimeCaching"\s*:\s*\[\s*\{/.test(worker)) {
  problems.push("the service worker defines runtime caching");
}

if (manifest.display !== "standalone" || manifest.start_url !== "/") {
  problems.push("the production manifest is not the install manifest");
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
