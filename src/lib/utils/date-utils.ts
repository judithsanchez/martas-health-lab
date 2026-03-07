/**
 * Formats a date string or object consistently using es-ES locale
 * to avoid hydration mismatches between server (Pi) and client.
 */
export function formatDate(date: string | Date | number): string {
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
}

/**
 * Formats a date with long month name
 */
export function formatDateLong(date: string | Date | number): string {
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(date));
}

/**
 * Formats a date with day and long month (no year)
 */
export function formatDateDayMonth(date: string | Date | number): string {
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long'
    }).format(new Date(date));
}

/**
 * Formats a date with day and short month
 */
export function formatDateShort(date: string | Date | number): string {
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short'
    }).format(new Date(date));
}
