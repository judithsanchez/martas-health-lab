/**
 * Formats a date string or object consistently using es-ES locale
 * to avoid hydration mismatches between server (Pi) and client.
 */
export function formatDate(date: string | Date | number): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date); // Fallback
    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(d);
}

/**
 * Formats a date with long month name
 */
export function formatDateLong(date: string | Date | number): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(d);
}

/**
 * Formats a date with day and long month (no year)
 */
export function formatDateDayMonth(date: string | Date | number): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long'
    }).format(d);
}

/**
 * Formats a date with day and short month
 */
export function formatDateShort(date: string | Date | number): string {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short'
    }).format(d);
}
/**
 * Calculates age based on a birth date string or object
 */
export function calculateAge(birthday: string | Date | null | undefined): number | null {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}
