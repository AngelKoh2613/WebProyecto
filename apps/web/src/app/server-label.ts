import type { ApiStatus } from "./api-status";

export function serverLabel(status: ApiStatus): string {
  if (status.api === "checking") return "Comprobando el servidor";
  if (status.api === "unreachable") return "El servidor no responde";
  if (status.database === "up") return "Base de datos disponible";
  return "Base de datos no disponible";
}
