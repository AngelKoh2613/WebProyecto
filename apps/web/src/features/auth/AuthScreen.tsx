import { useState } from "react";
import { loginAccount, registerAccount } from "./session";
import type { AccountProfile } from "@field-service/contracts";

export function AuthScreen({
  onReady,
}: {
  onReady: (account: AccountProfile) => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const account =
        mode === "register"
          ? await registerAccount({ name, email, password })
          : await loginAccount({ email, password });
      await onReady(account);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo entrar.");
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7fb] px-4 py-10 text-slate-900">
      <form
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h1 className="text-2xl font-semibold tracking-tight">Field Service</h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === "register"
            ? "Crea la cuenta con la que se guardan tus reportes."
            : "Entra para ver y enviar tus reportes."}
        </p>
        {mode === "register" ? (
          <label
            className="mt-5 block text-sm font-medium"
            htmlFor="account-name"
          >
            Nombre
            <input
              id="account-name"
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={name}
              maxLength={80}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        ) : null}
        <label
          className="mt-4 block text-sm font-medium"
          htmlFor="account-email"
        >
          Correo
          <input
            id="account-email"
            type="email"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={email}
            maxLength={254}
            autoComplete="username"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label
          className="mt-4 block text-sm font-medium"
          htmlFor="account-password"
        >
          Contraseña
          <input
            id="account-password"
            type="password"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={password}
            maxLength={72}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={pending}
        >
          {mode === "register" ? "Crear cuenta" : "Entrar"}
        </button>
        <button
          type="button"
          className="mt-3 w-full text-sm text-blue-700"
          onClick={() => {
            setMode(mode === "register" ? "login" : "register");
            setError(null);
          }}
        >
          {mode === "register" ? "Ya tengo cuenta" : "Crear una cuenta"}
        </button>
      </form>
    </main>
  );
}
