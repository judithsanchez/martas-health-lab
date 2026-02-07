import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

export * from "./schema";

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const sqlite = isBuildPhase
    ? {} as any
    : new Database(process.env.DATABASE_URL?.replace("file:", "") || "data/dev.db");

export const db = isBuildPhase
    ? {} as any
    : drizzle(sqlite, { schema });
