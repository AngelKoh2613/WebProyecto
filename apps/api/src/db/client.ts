import { sql } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

export interface DatabaseProbe {
  ping(): Promise<void>;
  close(): Promise<void>;
}

export interface DatabaseHandle extends DatabaseProbe {
  db: NodePgDatabase<typeof schema>;
}

export function createDatabase(connectionString: string): DatabaseHandle {
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10_000,
  });
  const db = drizzle({ client: pool, schema });

  pool.on("error", () => undefined);

  return {
    db,
    async ping() {
      await db.execute(sql`select 1`);
    },
    async close() {
      await pool.end();
    },
  };
}
