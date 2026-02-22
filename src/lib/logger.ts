import { db } from "./db";
import { systemLogs } from "./db/schema";

export type LogLevel = "info" | "success" | "warning" | "error";

export interface LogEntry {
    level: LogLevel;
    message: string;
    details?: any;
    source?: string;
}

export class Logger {
    private static async persist(entry: LogEntry) {
        try {
            await db.insert(systemLogs).values({
                level: entry.level,
                message: entry.message,
                details: entry.details ? JSON.stringify(entry.details) : null,
                source: entry.source || "SYSTEM",
            });
        } catch (error) {
            console.error("[Logger] Failed to persist log to database:", error);
        }
    }

    static async info(message: string, details?: any, source?: string) {
        console.log(`[INFO] [${source || "SYSTEM"}] ${message}`);
        await this.persist({ level: "info", message, details, source });
    }

    static async success(message: string, details?: any, source?: string) {
        console.log(`\x1b[32m[SUCCESS] [${source || "SYSTEM"}] ${message}\x1b[0m`);
        await this.persist({ level: "success", message, details, source });
    }

    static async warn(message: string, details?: any, source?: string) {
        console.warn(`\x1b[33m[WARNING] [${source || "SYSTEM"}] ${message}\x1b[0m`);
        await this.persist({ level: "warning", message, details, source });
    }

    static async error(message: string, details?: any, source?: string) {
        console.error(`\x1b[31m[ERROR] [${source || "SYSTEM"}] ${message}\x1b[0m`);
        await this.persist({ level: "error", message, details, source });
    }
}
