<<<<<<< HEAD
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
=======
import { db } from "@/lib/db";
import { systemLogs } from "@/lib/db/schema";

type LogLevel = 'info' | 'success' | 'warning' | 'error';

class Logger {
    async log(level: LogLevel, message: string, details?: any, source?: string) {
        // Console logging (with colors for development)
        const timestamp = new Date().toISOString();
        const color = level === 'error' ? '\x1b[31m' : level === 'warning' ? '\x1b[33m' : level === 'success' ? '\x1b[32m' : '\x1b[36m';
        const reset = '\x1b[0m';

        console.log(`${color}[${level.toUpperCase()}]${reset} [${timestamp}] ${message}`);
        if (details) console.log(details);

        try {
            // DB persistence
            // Using a background-safe approach if needed, but here simple insert
            await db.insert(systemLogs).values({
                level,
                message,
                details: details ? JSON.stringify(details) : null,
                source,
            });
        } catch (dbError) {
            console.error("CRITICAL: Failed to write to system_logs table. Is the migration applied?", dbError);
        }
    }

    info(message: string, details?: any, source?: string) {
        return this.log('info', message, details, source);
    }

    success(message: string, details?: any, source?: string) {
        return this.log('success', message, details, source);
    }

    warn(message: string, details?: any, source?: string) {
        return this.log('warning', message, details, source);
    }

    error(message: string, details?: any, source?: string) {
        return this.log('error', message, details, source);
    }
}

export const logger = new Logger();
>>>>>>> 11dfda8 (fix: resolve upload delimiter mismatch, 2-digit year parsing, and missing logs table)
