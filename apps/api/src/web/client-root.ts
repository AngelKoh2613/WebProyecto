import path from "node:path";
import { fileURLToPath } from "node:url";

export function productionWebDist(moduleUrl = import.meta.url): string {
  return path.resolve(
    path.dirname(fileURLToPath(moduleUrl)),
    "../../../../apps/web/dist",
  );
}
