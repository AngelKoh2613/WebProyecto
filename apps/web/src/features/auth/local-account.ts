import type { FieldServiceDatabase, LocalAccount } from "../reports/db";

export async function readLocalAccount(
  db: FieldServiceDatabase,
): Promise<LocalAccount | null> {
  return (await db.account.get("current")) ?? null;
}

export async function saveLocalAccount(
  db: FieldServiceDatabase,
  account: Omit<LocalAccount, "id">,
): Promise<LocalAccount> {
  const stored: LocalAccount = { id: "current", ...account };
  await db.account.put(stored);
  return stored;
}

export async function clearLocalAccount(
  db: FieldServiceDatabase,
): Promise<void> {
  await db.account.delete("current");
}
