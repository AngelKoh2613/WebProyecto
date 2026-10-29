import type { AccountProfile } from "@field-service/contracts";
import {
  accountProfileSchema,
  loginAccountSchema,
  registerAccountSchema,
} from "@field-service/validation";
import { apiBaseUrl } from "../../app/api-status";

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AccountProfile> {
  const parsed = registerAccountSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      "El nombre, el correo y una contraseña de al menos 8 caracteres son obligatorios.",
    );
  }
  return sendAccount("/api/v1/auth/register", parsed.data);
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AccountProfile> {
  const parsed = loginAccountSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Escribe el correo y la contraseña.");
  }
  return sendAccount("/api/v1/auth/login", parsed.data);
}

export async function logoutAccount(): Promise<void> {
  await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });
}

async function sendAccount(
  path: string,
  body: unknown,
): Promise<AccountProfile> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No hay conexión con el servidor.");
  }

  if (response.status === 409) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }
  if (response.status === 401) {
    throw new Error("Correo o contraseña incorrectos.");
  }
  if (!response.ok) {
    throw new Error("No se pudo completar el acceso.");
  }

  const parsed = accountProfileSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("No se pudo completar el acceso.");
  }
  return parsed.data;
}
