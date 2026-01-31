import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../apps/web/.env.local" });

export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "../../data/dev.db",
  },
} satisfies Config;
