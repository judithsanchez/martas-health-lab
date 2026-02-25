import { db } from "@/lib/db";
import { systemLogs } from "@/lib/db/schema";

export type LogLevel = "info" | "success" | "warning" | "error";

export interface LogEntry {
    level: LogLevel;
    message: string;
    details?: any;
    source?: string;
}

export class Logger {
    static async log(level: LogLevel, message: string, details?: any, source?: string) {
        // Console logging (with colors for development)
        const timestamp = new Date().toISOString();
        const color = level === 'error' ? '\x1b[31m' : level === 'warning' ? '\x1b[33m' : level === 'success' ? '\x1b[32m' : '\x1b[36m';
        const reset = '\x1b[0m';

        console.log(`${color}[${level.toUpperCase()}]${reset} [${timestamp}] ${message}`);
        if (details) console.log(details);

        try {
            // DB persistence
            await db.insert(systemLogs).values({
                level,
                message,
                details: details ? JSON.stringify(details) : null,
                source: source || "SYSTEM",
            });
        } catch (error) {
            console.error("[Logger] Failed to persist log to database:", error);
        }
    }

    static async info(message: string, details?: any, source?: string) {
        return this.log('info', message, details, source);
    }

    static async success(message: string, details?: any, source?: string) {
        return this.log('success', message, details, source);
    }

    static async warn(message: string, details?: any, source?: string) {
        return this.log('warning', message, details, source);
    }

    static async error(message: string, details?: any, source?: string) {
        return this.log('error', message, details, source);
    }
}

// Exported instance for backward compatibility with my own new code
export const logger = {
    info: (m: string, d?: any, s?: string) => Logger.info(m, d, s),
    success: (m: string, d?: any, s?: string) => Logger.success(m, d, s),
    warn: (m: string, d?: any, s?: string) => Logger.warn(m, d, s),
    error: (m: string, d?: any, s?: string) => Logger.error(m, d, s),
};
